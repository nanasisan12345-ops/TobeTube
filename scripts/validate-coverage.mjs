import { readFile } from "node:fs/promises";

import { findMissingPairs } from "./youtube-data-utils.mjs";
import { publicGenres } from "../js/genre-taxonomy.js";

const [countries, genres, videos] = await Promise.all([
  readJson("countries.json"),
  readJson("genres.json"),
  readJson("videos.json"),
]);
const visibleGenres = publicGenres(genres);
const missing = findMissingPairs(countries, visibleGenres, videos);
const total = countries.length * visibleGenres.length;
console.log(`国×ジャンルの登録状況: ${total - missing.length}/${total} 組`);

if (missing.length > 0) {
  const byCountry = {};
  for (const pair of missing) {
    byCountry[pair.country.id] ??= [];
    byCountry[pair.country.id].push(pair);
  }
  for (const country of countries) {
    const countryMissing = byCountry[country.id] ?? [];
    if (countryMissing.length > 0) {
      console.log(`${country.name}: 未登録 ${countryMissing.map(({ genre }) => genre.name).join("、")}`);
    }
  }
  if (process.argv.includes("--require-full")) process.exitCode = 1;
} else {
  console.log("全ての国で全ジャンルを選択できます。");
}

async function readJson(name) {
  return JSON.parse(await readFile(new URL(`../data/${name}`, import.meta.url), "utf8"));
}
