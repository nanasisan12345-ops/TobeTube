import test from "node:test";
import assert from "node:assert/strict";

import { createStorage, sanitizeState } from "../js/storage.js";

test("壊れた保存値は初期状態へ戻す", () => {
  const storage = { getItem: () => "{broken", setItem: () => {} };
  assert.deepEqual(createStorage(storage).read(), {
    favorites: [], history: [], recentIds: [], selectedGenre: null, mode: "genre", theme: "system",
  });
});

test("配列の重複と不正値を除去する", () => {
  assert.deepEqual(sanitizeState({
    favorites: ["a", "a", 1],
    history: ["b", null],
    recentIds: ["c", "c"],
    selectedGenre: 7,
    mode: "discovery",
    theme: "unknown",
  }), {
    favorites: ["a"], history: ["b"], recentIds: ["c"], selectedGenre: null, mode: "discovery", theme: "system",
  });
});
