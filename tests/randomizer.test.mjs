import test from "node:test";
import assert from "node:assert/strict";

import { getEligibleVideos, pickRandomVideo, pushRecentId } from "../js/randomizer.js";

const videos = [
  { id: "aaaaaaaaaaa", genre: "game" },
  { id: "bbbbbbbbbbb", genre: "game" },
  { id: "ccccccccccc", genre: "music" },
];

test("指定ジャンルだけを抽選対象にする", () => {
  assert.deepEqual(getEligibleVideos(videos, "game"), videos.slice(0, 2));
});

test("直近の動画を候補から外す", () => {
  const picked = pickRandomVideo(videos, {
    genreId: "game",
    recentIds: ["aaaaaaaaaaa"],
    random: () => 0,
  });
  assert.equal(picked.id, "bbbbbbbbbbb");
});

test("候補を使い切った場合も直前の動画を避ける", () => {
  const picked = pickRandomVideo(videos, {
    genreId: "game",
    recentIds: ["aaaaaaaaaaa", "bbbbbbbbbbb"],
    random: () => 0,
  });
  assert.equal(picked.id, "bbbbbbbbbbb");
});

test("対象ジャンルに動画がなければ null を返す", () => {
  assert.equal(pickRandomVideo(videos, { genreId: "travel" }), null);
});

test("直近IDは重複を除き上限で切る", () => {
  assert.deepEqual(pushRecentId(["b", "a", "c"], "a", 3), ["a", "b", "c"]);
});
