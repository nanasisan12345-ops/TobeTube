import { readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildSearchQuery,
  findMissingPairs,
  selectCandidate,
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

const [countries, genres, videos, searchConfig] = await Promise.all([
  readJson("countries.json"),
  readJson("genres.json"),
  readJson("videos.json"),
  readJson("youtube-search.json"),
]);
const missingPairs = findMissingPairs(countries, genres, videos);
const targetPairs = missingPairs.slice(0, requestedLimit);

console.log(`全 ${countries.length * genres.length} 組のうち ${missingPairs.length} 組が未登録です。今回の対象は ${targetPairs.length} 組です。`);
if (isDryRun) {
  for (const pair of targetPairs.slice(0, 10)) {
    console.log(`- ${pair.country.id}/${pair.genre.id}: ${buildSearchQuery(pair, searchConfig)}`);
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
  searches.push({ pair, items: await searchVideos(pair) });
}

const candidateIds = searches.flatMap(({ items }) => items.map((item) => item?.id?.videoId)).filter(Boolean);
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
for (const search of searches) {
  const candidate = selectCandidate(search.items, detailsById, usedIds);
  if (!candidate) {
    console.warn(`${search.pair.country.id}/${search.pair.genre.id}: 条件に合う埋め込み可能な公開動画が見つかりませんでした。`);
    continue;
  }
  usedIds.add(candidate.id);
  additions.push(toCatalogVideo(candidate, search.pair, searchConfig));
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
await writeFile(temporaryPath, `${JSON.stringify([...refreshedVideos, ...additions], null, 2)}\n`, "utf8");
await rename(temporaryPath, videosPath);
console.log(`${additions.length} 本を追加し、${refreshedCount} 本の再生数を更新しました。残りは ${missingPairs.length - additions.length} 組です。`);

async function readJson(name) {
  return JSON.parse(await readFile(join(dataPath, name), "utf8"));
}

async function searchVideos(pair) {
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
    order: "relevance",
    maxResults: "5",
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
