import { readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildSearchQuery,
  findDiscoveryPairsBelowTarget,
  findPairsBelowTarget,
  selectCandidates,
  selectDiscoveryCandidates,
  toCatalogVideo,
} from "./youtube-data-utils.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = join(root, "data");
const isDryRun = process.argv.includes("--dry-run");
const limitArgument = process.argv.find((argument) => argument.startsWith("--limit="));
const requestedLimit = Number.parseInt(limitArgument?.split("=")[1] ?? "90", 10);
if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > 95) {
  throw new Error("--limit は1から95の整数で指定してください。");
}
const targetCountArgument = process.argv.find((argument) => argument.startsWith("--target-count="));
const targetCount = Number.parseInt(targetCountArgument?.split("=")[1] ?? "50", 10);
if (!Number.isInteger(targetCount) || targetCount < 1 || targetCount > 50) {
  throw new Error("--target-count は1から50の整数で指定してください。");
}
const discoveryLimitArgument = process.argv.find((argument) => argument.startsWith("--discovery-limit="));
const discoveryLimit = Number.parseInt(discoveryLimitArgument?.split("=")[1] ?? "5", 10);
if (!Number.isInteger(discoveryLimit) || discoveryLimit < 0 || discoveryLimit > 95) {
  throw new Error("--discovery-limit は0から95の整数で指定してください。");
}
if (requestedLimit + discoveryLimit > 95) {
  throw new Error("通常検索と発掘検索の合計は95以下にしてください。");
}
const discoveryTargetArgument = process.argv.find((argument) => argument.startsWith("--discovery-target-count="));
const discoveryTargetCount = Number.parseInt(discoveryTargetArgument?.split("=")[1] ?? "12", 10);
if (!Number.isInteger(discoveryTargetCount) || discoveryTargetCount < 1 || discoveryTargetCount > 50) {
  throw new Error("--discovery-target-count は1から50の整数で指定してください。");
}
const countryFilter = process.argv.find((argument) => argument.startsWith("--country="))?.split("=")[1];
const genreFilter = process.argv.find((argument) => argument.startsWith("--genre="))?.split("=")[1];

const [countries, genres, videos, searchConfig] = await Promise.all([
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

const underfilledPairs = findPairsBelowTarget(countries, genres, videos, targetCount);
const eligiblePairs = underfilledPairs.filter(({ country, genre }) => (
  (!countryFilter || country.id === countryFilter)
  && (!genreFilter || genre.id === genreFilter)
));
const targetPairs = eligiblePairs.slice(0, requestedLimit);
const underfilledDiscoveryPairs = findDiscoveryPairsBelowTarget(countries, genres, videos, discoveryTargetCount);
const eligibleDiscoveryPairs = underfilledDiscoveryPairs.filter(({ country, genre }) => (
  (!countryFilter || country.id === countryFilter)
  && (!genreFilter || genre.id === genreFilter)
));
const discoveryTargetPairs = eligibleDiscoveryPairs.slice(0, discoveryLimit);

console.log(`通常: 全 ${countries.length * genres.length} 組のうち ${underfilledPairs.length} 組が目標の${targetCount}本未満です。今回の対象は ${targetPairs.length} 組です。`);
console.log(`発掘: ${underfilledDiscoveryPairs.length} 組が専用候補${discoveryTargetCount}本未満です。今回の対象は ${discoveryTargetPairs.length} 組です。`);
if (isDryRun) {
  for (const pair of targetPairs.slice(0, 10)) {
    console.log(`- 通常 ${pair.country.id}/${pair.genre.id} (${pair.count}→最大${targetCount}本): ${buildSearchQuery(pair, searchConfig)}`);
  }
  for (const pair of discoveryTargetPairs.slice(0, 10)) {
    console.log(`- 発掘 ${pair.country.id}/${pair.genre.id} (${pair.count}→最大${discoveryTargetCount}本): ${buildSearchQuery(pair, searchConfig)}`);
  }
  console.log("dry-runのためYouTube APIとvideos.jsonは変更していません。");
  process.exit(0);
}

const apiKey = process.env.YOUTUBE_API_KEY?.trim();
if (!apiKey) {
  throw new Error("YOUTUBE_API_KEY が設定されていません。キーはコードに書かず、環境変数またはGitHub ActionsのSecretへ設定してください。");
}

const searches = [];
for (let index = 0; index < targetPairs.length; index += 1) {
  const pair = targetPairs[index];
  console.log(`[${index + 1}/${targetPairs.length}] ${pair.country.id}/${pair.genre.id} を検索`);
  searches.push({ pair, items: await searchVideos(pair, "relevance") });
}

const discoverySearches = [];
for (let index = 0; index < discoveryTargetPairs.length; index += 1) {
  const pair = discoveryTargetPairs[index];
  console.log(`[発掘 ${index + 1}/${discoveryTargetPairs.length}] ${pair.country.id}/${pair.genre.id} の低再生候補を検索`);
  discoverySearches.push({ pair, items: await searchVideos(pair, "date") });
}

const candidateIds = [...searches, ...discoverySearches]
  .flatMap(({ items }) => items.map((item) => item?.id?.videoId))
  .filter(Boolean);
const detailIds = [...new Set([...videos.map((video) => video.id), ...candidateIds])];
const detailsById = new Map();
for (let index = 0; index < detailIds.length; index += 50) {
  const batch = detailIds.slice(index, index + 50);
  const details = await fetchJson("videos", {
    part: "snippet,status,contentDetails,statistics",
    id: batch.join(","),
    maxResults: "50",
  });
  for (const item of details.items ?? []) detailsById.set(item.id, item);
}

const usedIds = new Set(videos.map((video) => video.id));
const additions = [];
let discoveryAdditionCount = 0;
for (const search of discoverySearches) {
  const candidates = selectDiscoveryCandidates(
    search.items,
    detailsById,
    usedIds,
    discoveryTargetCount - search.pair.count,
  );
  if (candidates.length === 0) {
    console.warn(`${search.pair.country.id}/${search.pair.genre.id}: 低再生数の発掘候補が見つかりませんでした。`);
    continue;
  }
  for (const candidate of candidates) {
    usedIds.add(candidate.id);
    additions.push(toCatalogVideo(candidate, search.pair, searchConfig, { discovery: true }));
    discoveryAdditionCount += 1;
  }
}

for (const search of searches) {
  const candidates = selectCandidates(
    search.items,
    detailsById,
    usedIds,
    targetCount - search.pair.count,
  );
  if (candidates.length === 0) {
    console.warn(`${search.pair.country.id}/${search.pair.genre.id}: 条件に合う埋め込み可能な公開動画が見つかりませんでした。`);
    continue;
  }
  for (const candidate of candidates) {
    usedIds.add(candidate.id);
    additions.push(toCatalogVideo(candidate, search.pair, searchConfig));
  }
}

let refreshedCount = 0;
const refreshedVideos = videos.map((video) => {
  const value = Number(detailsById.get(video.id)?.statistics?.viewCount);
  if (!Number.isSafeInteger(value) || value < 0 || value === video.viewCount) return video;
  refreshedCount += 1;
  return { ...video, viewCount: value };
});

if (additions.length === 0 && refreshedCount === 0) {
  console.log("追加・更新できる動画はありませんでした。videos.jsonは変更していません。");
  process.exit(0);
}

const videosPath = join(dataPath, "videos.json");
const temporaryPath = `${videosPath}.tmp`;
const updatedVideos = [...refreshedVideos, ...additions];
await writeFile(temporaryPath, `${JSON.stringify(updatedVideos, null, 2)}\n`, "utf8");
await rename(temporaryPath, videosPath);
const remainingPairs = findPairsBelowTarget(countries, genres, updatedVideos, targetCount).length;
const remainingDiscoveryPairs = findDiscoveryPairsBelowTarget(countries, genres, updatedVideos, discoveryTargetCount).length;
console.log(`通常${additions.length - discoveryAdditionCount}本、発掘専用${discoveryAdditionCount}本を追加し、${refreshedCount}本の再生数を更新しました。`);
console.log(`目標未満は通常${remainingPairs}組、発掘${remainingDiscoveryPairs}組です。`);

async function readJson(name) {
  return JSON.parse(await readFile(join(dataPath, name), "utf8"));
}

async function searchVideos(pair, order) {
  const countryConfig = searchConfig.countries[pair.country.id];
  const result = await fetchJson("search", {
    part: "snippet",
    q: buildSearchQuery(pair, searchConfig),
    type: "video",
    regionCode: countryConfig.regionCode,
    relevanceLanguage: countryConfig.language.split("-")[0],
    safeSearch: "strict",
    videoEmbeddable: "true",
    videoSyndicated: "true",
    order,
    maxResults: "50",
  });
  return result.items ?? [];
}

async function fetchJson(resource, parameters) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${resource}`);
  for (const [name, value] of Object.entries(parameters)) url.searchParams.set(name, value);
  url.searchParams.set("key", apiKey);
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const reason = body?.error?.errors?.[0]?.reason ?? `HTTP ${response.status}`;
    throw new Error(`YouTube Data APIの呼び出しに失敗しました (${resource}: ${reason})`);
  }
  return response.json();
}
