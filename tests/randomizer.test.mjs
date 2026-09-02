import test from "node:test";
import assert from "node:assert/strict";

import {
  getEligibleVideos,
  preferHighViewCount,
  preferLowViewCount,
  pickDiscoveryVideo,
  pickRandomVideo,
  pushRecentId,
} from "../js/randomizer.js";

const videos = [
  { id: "aaaaaaaaaaa", genre: "game", countries: ["jp"] },
  { id: "bbbbbbbbbbb", genre: "game", countries: ["us"] },
  { id: "ccccccccccc", genre: "music", countries: ["jp"] },
];

test("指定ジャンルだけを抽選対象にする", () => {
  assert.deepEqual(getEligibleVideos(videos, "game"), videos.slice(0, 2));
});

test("指定国とジャンルの両方で抽選対象を絞る", () => {
  assert.deepEqual(getEligibleVideos(videos, "game", "jp"), [videos[0]]);
});

test("直近の動画を候補から外す", () => {
  const picked = pickRandomVideo(videos, {
    genreId: "game",
    recentIds: ["aaaaaaaaaaa"],
    random: () => 0,
  });
  assert.equal(picked.id, "bbbbbbbbbbb");
});

test("通常モードは履歴より高再生数を優先する", () => {
  const pool = [
    { id: "popular", viewCount: 10000 },
    { id: "middle", viewCount: 100 },
    { id: "low", viewCount: 10 },
    { id: "lowest", viewCount: 1 },
  ];
  const picked = pickRandomVideo(pool, {
    recentIds: ["popular"],
    random: () => 0,
  });
  assert.equal(picked.id, "popular");
  assert.deepEqual(preferHighViewCount(pool), [pool[0]]);
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

test("再生数情報がない場合は履歴にない動画を優先する", () => {
  const picked = pickDiscoveryVideo(videos, {
    historyIds: ["aaaaaaaaaaa", "bbbbbbbbbbb"],
    random: () => 0,
  });
  assert.equal(picked.id, "ccccccccccc");
});

test("発掘モードは未視聴や別ジャンルより低再生数を優先する", () => {
  const pool = [
    { id: "low", genre: "game", viewCount: 10 },
    { id: "high-unseen", genre: "music", viewCount: 10000 },
  ];
  const picked = pickDiscoveryVideo(pool, {
    historyIds: ["low"],
    currentGenre: "game",
    random: () => 0,
  });
  assert.equal(picked.id, "low");
});

test("発掘モードは可能なら直前と違うジャンルを選ぶ", () => {
  const picked = pickDiscoveryVideo(videos, {
    historyIds: [],
    currentGenre: "game",
    random: () => 0,
  });
  assert.equal(picked.genre, "music");
});

test("発掘モードも指定国の動画だけを返す", () => {
  const picked = pickDiscoveryVideo(videos, {
    countryId: "jp",
    historyIds: [],
    currentGenre: "game",
    random: () => 0,
  });
  assert.equal(picked.id, "ccccccccccc");
});

test("発掘モードも選択したジャンルだけを返す", () => {
  const picked = pickDiscoveryVideo(videos, {
    countryId: "jp",
    genreId: "game",
    historyIds: [],
    random: () => 0,
  });
  assert.equal(picked.id, "aaaaaaaaaaa");
});

test("発掘モードは再生数が少ない上位25パーセントを優先する", () => {
  const pool = [
    { id: "low", viewCount: 10 },
    { id: "middle", viewCount: 100 },
    { id: "high", viewCount: 1000 },
    { id: "highest", viewCount: 10000 },
  ];
  assert.deepEqual(preferLowViewCount(pool), [pool[0]]);
});

test("再生数がない既存動画だけの場合は全候補を維持する", () => {
  assert.deepEqual(preferLowViewCount(videos), videos);
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
