import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { validateCatalog } from "../js/data-store.js";

const root = new URL("../", import.meta.url);

test("同梱カタログの参照とIDが整合している", async () => {
  const genres = JSON.parse(await readFile(new URL("data/genres.json", root), "utf8"));
  const countries = JSON.parse(await readFile(new URL("data/countries.json", root), "utf8"));
  const videos = JSON.parse(await readFile(new URL("data/videos.json", root), "utf8"));
  assert.deepEqual(validateCatalog(genres, countries, videos), []);
});

test("存在しないジャンル参照を検出する", () => {
  const errors = validateCatalog(
    [{ id: "game", name: "ゲーム" }],
    [{ id: "jp", code: "JP", name: "日本" }],
    [{ id: "aaaaaaaaaaa", title: "動画", channel: "チャンネル", genre: "missing" }],
  );
  assert.match(errors.join("\n"), /ジャンルが存在しません/);
});

test("存在しない国参照を検出する", () => {
  const errors = validateCatalog(
    [{ id: "game", name: "ゲーム" }],
    [{ id: "jp", code: "JP", name: "日本" }],
    [{
      id: "aaaaaaaaaaa",
      title: "動画",
      channel: "チャンネル",
      genre: "game",
      countries: ["missing"],
    }],
  );
  assert.match(errors.join("\n"), /国が存在しません/);
});

test("不正な再生数を検出する", () => {
  const errors = validateCatalog(
    [{ id: "game", name: "ゲーム" }],
    [{ id: "jp", code: "JP", name: "日本" }],
    [{ id: "aaaaaaaaaaa", title: "動画", channel: "チャンネル", genre: "game", countries: ["jp"], viewCount: -1 }],
  );
  assert.match(errors.join("\n"), /viewCount/);
});
