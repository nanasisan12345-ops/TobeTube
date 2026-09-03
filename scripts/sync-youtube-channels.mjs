import { readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  isPlayableVideo,
  isSearchLimitError,
  isYouTubeChannelId,
  toCatalogVideo,
} from "./youtube-data-utils.mjs";
import {
  buildChannelJobs,
  matchesCountryOrLanguage,
} from "./youtube-channel-utils.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = join(root, "data");
const isDryRun = process.argv.includes("--dry-run");
const requestedLimit = integerArgument("limit", 50, 0, 500);
const targetCount = integerArgument("target-count", 100, 1, 500);
const pagesPerChannel = integerArgument("pages", 2, 1, 5);
const countryFilter = stringArgument("country");
const genreFilter = stringArgument("genre");

const [countries, genres, originalVideos, searchConfig, originalState] = await Promise.all([
  readJson("countries.json"),
  readJson("genres.json"),
  readJson("videos.json"),
  readJson("youtube-search.json"),
  readJson("youtube-channel-sync.json"),
]);
if (countryFilter && !countries.some(({ id }) => id === countryFilter)) {
  throw new Error(`登録されていない国です: ${countryFilter}`);
}
if (genreFilter && !genres.some(({ id }) => id === genreFilter)) {
  throw new Error(`登録されていないジャンルです: ${genreFilter}`);
}
if (originalState?.version !== 1 || !Array.isArray(originalState.processed)) {
  throw new Error("youtube-channel-sync.json の形式が正しくありません。");
}

const missingChannelIds = originalVideos.filter((video) => !isYouTubeChannelId(video.channelId)).length;
const initialJobs = eligibleJobs(originalVideos, originalState.processed);
console.log(`チャンネルID未登録は${missingChannelIds}本、現在実行可能な未処理チャンネルは${initialJobs.length}件です。`);
if (isDryRun) {
  for (const job of initialJobs.slice(0, Math.min(requestedLimit, 20))) {
    console.log(`- ${job.country.id}/${job.genre.id}: ${job.channelId} (${job.count}→最大${targetCount}本)`);
  }
  console.log("dry-runのためYouTube API、videos.json、youtube-channel-sync.jsonは変更していません。");
  process.exit(0);
}

const apiKey = process.env.YOUTUBE_API_KEY?.trim();
if (!apiKey) {
  throw new Error("YOUTUBE_API_KEY が設定されていません。キーはコードに書かず、環境変数またはGitHub ActionsのSecretへ設定してください。");
}

let videos = originalVideos.map((video) => (
  Array.isArray(video.countries)
    ? { ...video, countries: [...video.countries] }
    : { ...video }
));
let videoIndex = new Map(videos.map((video, index) => [video.id, index]));
let backfilledChannelIds = 0;
let quotaReached = false;

const missingVideos = videos.filter((video) => !isYouTubeChannelId(video.channelId));
for (let index = 0; index < missingVideos.length; index += 50) {
  const batch = missingVideos.slice(index, index + 50);
  try {
    const response = await fetchJson("videos", {
      part: "snippet",
      id: batch.map((video) => video.id).join(","),
      maxResults: "50",
    });
    for (const details of response.items ?? []) {
      if (!isYouTubeChannelId(details.snippet?.channelId)) continue;
      const existingIndex = videoIndex.get(details.id);
      if (existingIndex === undefined || videos[existingIndex].channelId === details.snippet.channelId) continue;
      videos[existingIndex] = { ...videos[existingIndex], channelId: details.snippet.channelId };
      backfilledChannelIds += 1;
    }
  } catch (error) {
    if (!isSearchLimitError(error)) throw error;
    console.warn("YouTube APIの上限に達したため、ここまでのチャンネルID補完結果を保存します。");
    quotaReached = true;
    break;
  }
}

const processed = new Set(originalState.processed);
const pairCounts = countPairs(videos);
const channelCache = new Map();
let processedJobs = 0;
let addedVideos = 0;
let addedCountryLinks = 0;

jobLoop:
for (const job of eligibleJobs(videos, processed)) {
  if (quotaReached || processedJobs >= requestedLimit) break;
  const pairKey = `${job.country.id}:${job.genre.id}`;
  if ((pairCounts.get(pairKey) ?? 0) >= targetCount) continue;
  console.log(`[チャンネル ${processedJobs + 1}/${requestedLimit}] ${job.country.id}/${job.genre.id} ${job.channelId}`);
  let channelData;
  try {
    channelData = channelCache.get(job.channelId) ?? await fetchChannelVideos(job.channelId);
    channelCache.set(job.channelId, channelData);
  } catch (error) {
    if (isSearchLimitError(error)) {
      console.warn("YouTube APIの上限に達したため、ここまでのチャンネル収集結果を保存します。");
      quotaReached = true;
      break jobLoop;
    }
    if (["channelNotFound", "playlistNotFound", "notFound"].includes(error?.reason)) {
      console.warn(`${job.channelId}: チャンネルまたは投稿一覧が見つからないためスキップしました。`);
      processed.add(job.key);
      processedJobs += 1;
      continue;
    }
    throw error;
  }

  let remaining = targetCount - (pairCounts.get(pairKey) ?? 0);
  const categoryId = searchConfig.popularCategoryIds[job.genre.id];
  const countryConfig = searchConfig.countries[job.country.id];
  for (const details of channelData.videos) {
    if (remaining <= 0) break;
    if (!isPlayableVideo(details) || details.snippet?.categoryId !== categoryId) continue;
    if (!matchesCountryOrLanguage(details, countryConfig.language, channelData.country, job.country.code)) continue;
    const existingIndex = videoIndex.get(details.id);
    if (existingIndex !== undefined) {
      const existing = videos[existingIndex];
      const existingCountries = Array.isArray(existing.countries) ? existing.countries : [];
      if (existing.discovery === true || existing.genre !== job.genre.id || existingCountries.includes(job.country.id)) continue;
      videos[existingIndex] = { ...existing, countries: [...existingCountries, job.country.id] };
      addedCountryLinks += 1;
    } else {
      videos.push(toCatalogVideo(details, job, searchConfig));
      videoIndex.set(details.id, videos.length - 1);
      addedVideos += 1;
    }
    pairCounts.set(pairKey, (pairCounts.get(pairKey) ?? 0) + 1);
    remaining -= 1;
  }
  processed.add(job.key);
  processedJobs += 1;
}

const stateChanged = processed.size !== originalState.processed.length;
const videosChanged = backfilledChannelIds > 0 || addedVideos > 0 || addedCountryLinks > 0;
if (!stateChanged && !videosChanged) {
  console.log("追加・更新できるチャンネル動画はありませんでした。");
  process.exit(0);
}

if (videosChanged) await writeJsonAtomically("videos.json", videos);
if (stateChanged) await writeJsonAtomically("youtube-channel-sync.json", {
  version: 1,
  processed: [...processed].sort(),
});
console.log(`チャンネルIDを${backfilledChannelIds}本補完し、投稿動画${addedVideos}本と国情報${addedCountryLinks}件を追加しました。処理済みチャンネルは${processedJobs}件です。`);

function eligibleJobs(currentVideos, processedKeys) {
  return buildChannelJobs(
    countries,
    genres,
    currentVideos,
    processedKeys,
    searchConfig.popularCategoryIds ?? {},
    targetCount,
  ).filter(({ country, genre }) => (
    (!countryFilter || country.id === countryFilter)
    && (!genreFilter || genre.id === genreFilter)
  ));
}

function countPairs(currentVideos) {
  const counts = new Map();
  for (const video of currentVideos) {
    if (video.discovery === true) continue;
    for (const countryId of video.countries ?? []) {
      const key = `${countryId}:${video.genre}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
}

async function fetchChannelVideos(channelId) {
  const channelResponse = await fetchJson("channels", {
    part: "contentDetails,snippet",
    id: channelId,
    maxResults: "1",
  });
  const channel = channelResponse.items?.[0];
  if (!channel) {
    const error = new Error(`チャンネルが見つかりません: ${channelId}`);
    error.reason = "channelNotFound";
    throw error;
  }
  const playlistId = channel.contentDetails?.relatedPlaylists?.uploads;
  if (!playlistId) {
    const error = new Error(`投稿一覧が見つかりません: ${channelId}`);
    error.reason = "playlistNotFound";
    throw error;
  }
  const videoIds = [];
  let pageToken;
  for (let page = 0; page < pagesPerChannel; page += 1) {
    const response = await fetchJson("playlistItems", {
      part: "contentDetails",
      playlistId,
      maxResults: "50",
      ...(pageToken ? { pageToken } : {}),
    });
    for (const item of response.items ?? []) {
      const videoId = item.contentDetails?.videoId;
      if (videoId) videoIds.push(videoId);
    }
    pageToken = response.nextPageToken;
    if (!pageToken) break;
  }
  const details = [];
  for (let index = 0; index < videoIds.length; index += 50) {
    const response = await fetchJson("videos", {
      part: "snippet,status,contentDetails,statistics",
      id: videoIds.slice(index, index + 50).join(","),
      maxResults: "50",
    });
    details.push(...(response.items ?? []));
  }
  return { country: channel.snippet?.country, videos: details };
}

function integerArgument(name, defaultValue, minimum, maximum) {
  const argument = process.argv.find((value) => value.startsWith(`--${name}=`));
  const parsed = Number.parseInt(argument?.split("=")[1] ?? String(defaultValue), 10);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`--${name} は${minimum}から${maximum}の整数で指定してください。`);
  }
  return parsed;
}

function stringArgument(name) {
  return process.argv.find((value) => value.startsWith(`--${name}=`))?.split("=")[1];
}

async function readJson(name) {
  return JSON.parse(await readFile(join(dataPath, name), "utf8"));
}

async function writeJsonAtomically(name, value) {
  const filePath = join(dataPath, name);
  const temporaryPath = `${filePath}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporaryPath, filePath);
}

async function fetchJson(resource, parameters) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${resource}`);
  for (const [name, value] of Object.entries(parameters)) url.searchParams.set(name, value);
  url.searchParams.set("key", apiKey);
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const reason = body?.error?.errors?.[0]?.reason ?? `HTTP ${response.status}`;
    const error = new Error(`YouTube Data APIの呼び出しに失敗しました (${resource}: ${reason})`);
    error.reason = reason;
    throw error;
  }
  return response.json();
}
