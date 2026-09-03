import { readFile, rename, writeFile } from "node:fs/promises";

import { promotionResult } from "../js/genre-taxonomy.js";

const isDryRun = process.argv.includes("--dry-run");
const genresUrl = new URL("../data/genres.json", import.meta.url);
const videosUrl = new URL("../data/videos.json", import.meta.url);
const [genres, videos] = await Promise.all([
  readJson(genresUrl),
  readJson(videosUrl),
]);

const candidates = genres.filter((genre) => genre.status === "candidate");
const results = candidates.map((genre) => ({ genre, ...promotionResult(genre, videos) }));
const ready = results.filter((result) => result.ready);

for (const result of results) {
  const state = result.ready ? "公開基準達成" : "収集中";
  console.log(`${state}: ${result.genre.id} 動画${result.videoCount}/${result.minimumVideos}本、国${result.countryCount}/${result.minimumCountries}`);
}

if (ready.length === 0) {
  console.log(`候補${candidates.length}ジャンルのうち、今回新たに公開するジャンルはありません。`);
  process.exit(0);
}
if (isDryRun) {
  console.log(`dry-run: ${ready.map(({ genre }) => genre.id).join(", ")} は公開可能です。`);
  process.exit(0);
}

const readyIds = new Set(ready.map(({ genre }) => genre.id));
const updated = genres.map((genre) => readyIds.has(genre.id) ? { ...genre, status: "active" } : genre);
const temporaryUrl = new URL("../data/genres.json.tmp", import.meta.url);
await writeFile(temporaryUrl, `${JSON.stringify(updated, null, 2)}\n`, "utf8");
await rename(temporaryUrl, genresUrl);
console.log(`${ready.length}ジャンルを自動公開しました: ${[...readyIds].join(", ")}`);

async function readJson(url) {
  return JSON.parse(await readFile(url, "utf8"));
}
