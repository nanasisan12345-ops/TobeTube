import { readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  findPairsBelowTarget,
  isPlayableVideo,
  isSearchLimitError,
  isUnavailableVideoChartError,
  toCatalogVideo,
} from "./youtube-data-utils.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = join(root, "data");
const isDryRun = process.argv.includes("--dry-run");
const limitArgument = process.argv.find((argument) => argument.startsWith("--limit="));
const requestedLimit = Number.parseInt(limitArgument?.split("=")[1] ?? "1000", 10);
if (!Number.isInteger(requestedLimit) || requestedLimit < 0 || requestedLimit > 1000) {
  throw new Error("--limit は0から1000の整数で指定してください。");
}
const targetCountArgument = process.argv.find((argument) => argument.startsWith("--target-count="));
const targetCount = Number.parseInt(targetCountArgument?.split("=")[1] ?? "50", 10);
if (!Number.isInteger(targetCount) || targetCount < 1 || targetCount > 50) {
  throw new Error("--target-count は1から50の整数で指定してください。");
}
const countryFilter = process.argv.find((argument) => argument.startsWith("--country="))?.split("=")[1];
const genreFilter = process.argv.find((argument) => argument.startsWith("--genre="))?.split("=")[1];

const [countries, genres, originalVideos, searchConfig] = await Promise.all([
  readJson("countries.json"),
  readJson("genres.json"),
  readJson("videos.json"),
  readJson("youtube-search.json"),
]);
if (countryFilter && !countries.some(({ id }) => id === countryFilter)) {
  throw new Error(`登録されていない国です: ${countryFilter}`);
}
if (genreFilter && !genres.some(({ id }) => id === genreFilter)) {
  throw new Error(`登録されていないジャンルです: ${genreFilter}`);
}

const categoryIds = searchConfig.popularCategoryIds ?? {};
const targetPairs = findPairsBelowTarget(countries, genres, originalVideos, targetCount)
  .filter(({ country, genre }) => (
    categoryIds[genre.id]
    && (!countryFilter || country.id === countryFilter)
    && (!genreFilter || genre.id === genreFilter)
  ))
  .slice(0, requestedLimit);

console.log(`人気チャート: 公式カテゴリ対応の不足組から ${targetPairs.length} 組を収集します。`);
if (isDryRun) {
  for (const pair of targetPairs.slice(0, 20)) {
    console.log(`- ${pair.country.id}/${pair.genre.id} (カテゴリ${categoryIds[pair.genre.id]}, ${pair.count}→最大${targetCount}本)`);
  }
  console.log("dry-runのためYouTube APIとvideos.jsonは変更していません。");
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
const supportedCategoriesByCountry = new Map();
let addedVideos = 0;
let addedCountryLinks = 0;

for (let index = 0; index < targetPairs.length; index += 1) {
  const pair = targetPairs[index];
  const categoryId = categoryIds[pair.genre.id];
  console.log(`[人気 ${index + 1}/${targetPairs.length}] ${pair.country.id}/${pair.genre.id} を取得`);
  try {
    const supportedCategories = await getSupportedCategories(pair.country.id);
    if (!supportedCategories.has(categoryId)) {
      console.warn(`${pair.country.id}: 公式カテゴリ${categoryId}はこの国で利用できないためスキップしました。`);
      continue;
    }
    const response = await fetchJson("videos", {
      part: "snippet,status,contentDetails,statistics",
      chart: "mostPopular",
      regionCode: searchConfig.countries[pair.country.id].regionCode,
      videoCategoryId: categoryId,
      maxResults: "50",
    });
    let remaining = targetCount - pair.count;
    for (const details of response.items ?? []) {
      if (remaining <= 0) break;
      if (!isPlayableVideo(details)) continue;
      const existingIndex = videoIndex.get(details.id);
      if (existingIndex !== undefined) {
        const existing = videos[existingIndex];
        const existingCountries = Array.isArray(existing.countries) ? existing.countries : [];
        if (existing.discovery === true || existing.genre !== pair.genre.id || existingCountries.includes(pair.country.id)) continue;
        videos[existingIndex] = { ...existing, countries: [...existingCountries, pair.country.id] };
        addedCountryLinks += 1;
        remaining -= 1;
        continue;
      }
      videos.push(toCatalogVideo(details, pair, searchConfig));
      videoIndex.set(details.id, videos.length - 1);
      addedVideos += 1;
      remaining -= 1;
    }
  } catch (error) {
    if (isUnavailableVideoChartError(error)) {
      console.warn(`${pair.country.id}/${pair.genre.id}: この国では該当する人気チャートが提供されていないためスキップしました。`);
      continue;
    }
    if (!isSearchLimitError(error)) throw error;
    console.warn("YouTube APIの上限に達したため、ここまでの人気チャート取得結果を保存します。");
    break;
  }
}

if (addedVideos === 0 && addedCountryLinks === 0) {
  console.log("追加できる人気動画はありませんでした。videos.jsonは変更していません。");
  process.exit(0);
}

const videosPath = join(dataPath, "videos.json");
const temporaryPath = `${videosPath}.tmp`;
await writeFile(temporaryPath, `${JSON.stringify(videos, null, 2)}\n`, "utf8");
await rename(temporaryPath, videosPath);
console.log(`人気動画${addedVideos}本を追加し、既存動画に国情報を${addedCountryLinks}件追加しました。`);

async function getSupportedCategories(countryId) {
  if (supportedCategoriesByCountry.has(countryId)) return supportedCategoriesByCountry.get(countryId);
  const response = await fetchJson("videoCategories", {
    part: "snippet",
    regionCode: searchConfig.countries[countryId].regionCode,
  });
  const supported = new Set((response.items ?? [])
    .filter((item) => item.snippet?.assignable === true)
    .map((item) => item.id));
  supportedCategoriesByCountry.set(countryId, supported);
  return supported;
}

async function readJson(name) {
  return JSON.parse(await readFile(join(dataPath, name), "utf8"));
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
