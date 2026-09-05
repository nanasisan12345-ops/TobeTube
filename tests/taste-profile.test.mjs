import test from "node:test";
import assert from "node:assert/strict";
import { analyzeTaste, TASTE_AXES } from "../js/taste-profile.js";
import { profileCopy } from "../js/taste-profile-view.js";

const genres = [{ id: "game" }, { id: "rpg", parentId: "game" }, { id: "art" }, { id: "future" }];
const videos = [{ id: "a", genre: "rpg" }, { id: "b", genre: "art" }, { id: "c", genre: "future" }];
test("プロフィールの全文言が全12言語で揃う", () => {
  assert.equal(Object.keys(profileCopy).length, 12);
  for (const copy of Object.values(profileCopy)) {
    assert.equal(copy.length, profileCopy.ja.length);
    assert.ok(copy.every(value => typeof value === "string" && value.length > 0));
    for (const index of [8, 15]) {
      assert.deepEqual(copy[index].match(/\{\w+\}/g)?.sort(), profileCopy.ja[index].match(/\{\w+\}/g)?.sort());
    }
  }
});
test("100件でも範囲内で入力を変更しない", () => {
  const catalog = Array.from({ length: 100 }, (_, i) => ({ id: String(i), genre: i % 2 ? "game" : "art" }));
  const ids = catalog.map(video => video.id);
  const original = JSON.stringify([ids, catalog, genres]);
  const result = analyzeTaste(ids, catalog, genres);
  assert.equal(result.analyzed, 100);
  assert.ok(result.axes.every(axis => axis.percent >= 0 && axis.percent <= 100));
  assert.equal(JSON.stringify([ids, catalog, genres]), original);
});
test("空コレクションは診断結果を捏造しない", () => {
  const profile = analyzeTaste([], videos, genres);
  assert.equal(profile.analyzed, 0);
  assert.equal(profile.leader, null);
  assert.ok(profile.axes.every(axis => axis.percent === 0));
});
test("子ジャンルを継承し重複を除き、少数サンプルを明示する", () => {
  const profile = analyzeTaste(["a", "a"], videos, genres);
  assert.equal(profile.total, 1);
  assert.equal(profile.leader, "energy");
  assert.equal(profile.axes[2].percent, 100);
  assert.equal(profile.provisional, true);
});
test("欠損・未分類を分析母数から除き同率は混合にする", () => {
  const profile = analyzeTaste(["missing", "c", "b", "a"], videos, genres);
  assert.equal(profile.excluded, 2);
  assert.equal(profile.analyzed, 2);
  assert.equal(profile.leader, null);
  assert.deepEqual(profile.axes.map(axis => axis.percent), [0, 50, 50, 0, 0, 0]);
  assert.deepEqual(profile, analyzeTaste(["a", "b", "c", "missing"], videos, genres));
});
test("追加と削除で再計算され5件以上で暫定表示を外す", () => {
  const catalog = Array.from({ length: 5 }, (_, i) => ({ id: String(i), genre: "game" }));
  assert.equal(analyzeTaste(catalog.map(v => v.id), catalog, genres).provisional, false);
  assert.equal(analyzeTaste([], catalog, genres).leader, null);
});
test("基本ジャンルを重複なくすべて分類する", async () => {
  const { readFile } = await import("node:fs/promises");
  const catalog = JSON.parse(await readFile(new URL("../data/genres.json", import.meta.url)));
  const roots = TASTE_AXES.flatMap(([, ids]) => ids);
  assert.equal(new Set(roots).size, roots.length);
  for (const genre of catalog.filter(g => !g.parentId)) assert.ok(roots.includes(genre.id), genre.id);
});
