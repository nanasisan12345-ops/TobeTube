import { readFile } from "node:fs/promises";

import { validateCatalog } from "../js/data-store.js";
import { publicGenres } from "../js/genre-taxonomy.js";

const genres = JSON.parse(await readFile(new URL("../data/genres.json", import.meta.url), "utf8"));
const countries = JSON.parse(await readFile(new URL("../data/countries.json", import.meta.url), "utf8"));
const videos = JSON.parse(await readFile(new URL("../data/videos.json", import.meta.url), "utf8"));
const errors = validateCatalog(genres, countries, videos);
const genreCounts = Object.fromEntries(genres.map((genre) => [
  genre.id,
  videos.filter((video) => video.genre === genre.id).length,
]));
const countryCounts = Object.fromEntries(countries.map((country) => [
  country.id,
  videos.filter((video) => video.countries?.includes(country.id)).length,
]));

const visibleGenres = publicGenres(genres);
for (const genre of visibleGenres) {
  if (genreCounts[genre.id] < 4) {
    errors.push(`ジャンル ${genre.name} の動画は4本以上必要です: ${genreCounts[genre.id]}本`);
  }
}

for (const country of countries) {
  if (countryCounts[country.id] < 4) {
    errors.push(`国 ${country.name} の動画は4本以上必要です: ${countryCounts[country.id]}本`);
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  const coverage = countries.map((country) => `${country.name}${countryCounts[country.id]}本`).join("、");
  console.log(`${countries.length} か国、公開${visibleGenres.length}ジャンル、収集中${genres.length - visibleGenres.length}ジャンル、${videos.length} 動画のデータ形式を確認しました。`);
  console.log(`国別候補: ${coverage}`);
}
