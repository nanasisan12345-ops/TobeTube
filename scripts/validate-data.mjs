import { readFile } from "node:fs/promises";

import { validateCatalog } from "../js/data-store.js";

const genres = JSON.parse(await readFile(new URL("../data/genres.json", import.meta.url), "utf8"));
const videos = JSON.parse(await readFile(new URL("../data/videos.json", import.meta.url), "utf8"));
const errors = validateCatalog(genres, videos);

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`${genres.length} ジャンル、${videos.length} 動画のデータ形式を確認しました。`);
}
