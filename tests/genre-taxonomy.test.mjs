import test from "node:test";
import assert from "node:assert/strict";

import {
  genreSelectionIds,
  groupPublicGenres,
  promotionResult,
  publicGenres,
} from "../js/genre-taxonomy.js";

const genres = [
  { id: "game", name: "ゲーム" },
  { id: "rpg", name: "RPG", parentId: "game", status: "active" },
  { id: "fps", name: "FPS", parentId: "game", status: "candidate" },
  { id: "unknown", name: "その他" },
];

test("候補ジャンルは公開一覧に出さない", () => {
  assert.deepEqual(publicGenres(genres).map(({ id }) => id), ["game", "rpg", "unknown"]);
});

test("大分類を選ぶと公開前を含む子ジャンルも抽選対象にする", () => {
  assert.deepEqual(genreSelectionIds("game", genres), ["game", "rpg", "fps"]);
  assert.equal(genreSelectionIds("all", genres), null);
});

test("公開ジャンルを大分類グループへまとめる", () => {
  const groups = groupPublicGenres(genres);
  assert.deepEqual(groups.find(({ id }) => id === "entertainment").genres.map(({ id }) => id), ["game", "rpg"]);
  assert.deepEqual(groups.find(({ id }) => id === "other").genres.map(({ id }) => id), ["unknown"]);
});

test("動画数と国数の両方を満たした候補だけ昇格できる", () => {
  const genre = { id: "rpg", activation: { minimumVideos: 3, minimumCountries: 2 } };
  const videos = [
    { genre: "rpg", countries: ["jp"] },
    { genre: "rpg", countries: ["jp"] },
    { genre: "rpg", countries: ["us"] },
  ];
  assert.equal(promotionResult(genre, videos).ready, true);
  assert.equal(promotionResult(genre, videos.slice(0, 2)).ready, false);
});
