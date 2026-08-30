import test from "node:test";
import assert from "node:assert/strict";

import {
  getEligibleVideos,
  pickDiscoveryVideo,
  pickRandomVideo,
  pushRecentId,
} from "../js/randomizer.js";

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

test("発掘モードは履歴にない動画を優先する", () => {
  const picked = pickDiscoveryVideo(videos, {
    historyIds: ["aaaaaaaaaaa", "bbbbbbbbbbb"],
    random: () => 0,
  });
  assert.equal(picked.id, "ccccccccccc");
});

test("発掘モードは可能なら直前と違うジャンルを選ぶ", () => {
  const picked = pickDiscoveryVideo(videos, {
    historyIds: [],
    currentGenre: "game",
    random: () => 0,
  });
  assert.equal(picked.genre, "music");
});

test("全動画を視聴済みでも直近と違う動画を返す", () => {
  const picked = pickDiscoveryVideo(videos, {
    historyIds: videos.map((video) => video.id),
    recentIds: ["ccccccccccc"],
    currentGenre: "game",
    random: () => 0,
  });
  assert.equal(picked.id, "ccccccccccc");
});
