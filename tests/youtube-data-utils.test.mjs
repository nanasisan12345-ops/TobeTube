import test from "node:test";
import assert from "node:assert/strict";

import {
  buildSearchQuery,
  decodeHtml,
  durationBucket,
  findMissingPairs,
  findPairsBelowTarget,
  selectCandidate,
  selectCandidates,
  toCatalogVideo,
} from "../scripts/youtube-data-utils.mjs";

const countries = [{ id: "jp", code: "JP", name: "日本" }];
const genres = [{ id: "game", name: "ゲーム" }, { id: "horror", name: "ホラー" }];
const config = { countries: { jp: { regionCode: "JP", language: "ja", queryName: "日本" } }, querySuffixes: {} };

test("登録済み以外の国とジャンルの組合せを返す", () => {
  const missing = findMissingPairs(countries, genres, [{ id: "aaaaaaaaaaa", genre: "game", countries: ["jp"] }]);
  assert.deepEqual(missing.map(({ country, genre }) => `${country.id}:${genre.id}`), ["jp:horror"]);
});

test("目標本数より少ない組合せを動画数の少ない順で返す", () => {
  const videos = [
    { id: "aaaaaaaaaaa", genre: "game", countries: ["jp"] },
    { id: "bbbbbbbbbbb", genre: "game", countries: ["jp"] },
  ];
  const pairs = findPairsBelowTarget(countries, genres, videos, 3);
  assert.deepEqual(pairs.map(({ country, genre, count }) => `${country.id}:${genre.id}:${count}`), ["jp:horror:0", "jp:game:2"]);
  assert.throws(() => findPairsBelowTarget(countries, genres, videos, 0), /1以上の整数/);
});

test("国の検索名とローカライズ済みジャンルで検索語を作る", () => {
  assert.equal(buildSearchQuery({ country: countries[0], genre: genres[1] }, config), "日本 ホラー");
});

test("HTML文字参照とYouTube時間を正規化する", () => {
  assert.equal(decodeHtml("Tom &amp; Jerry &#39;Live&#39;"), "Tom & Jerry 'Live'");
  assert.equal(durationBucket("PT3M59S"), "short");
  assert.equal(durationBucket("PT4M"), "medium");
  assert.equal(durationBucket("PT20M1S"), "long");
});

test("公開中で埋め込み可能な未登録動画だけを選ぶ", () => {
  const items = [{ id: { videoId: "aaaaaaaaaaa" } }, { id: { videoId: "bbbbbbbbbbb" } }];
  const details = new Map([
    ["aaaaaaaaaaa", { id: "aaaaaaaaaaa", status: { privacyStatus: "public", embeddable: true }, contentDetails: { duration: "PT3M" } }],
    ["bbbbbbbbbbb", { id: "bbbbbbbbbbb", status: { privacyStatus: "public", embeddable: true }, contentDetails: { duration: "PT5M" } }],
  ]);
  assert.equal(selectCandidate(items, details, new Set(["aaaaaaaaaaa"])).id, "bbbbbbbbbbb");
});

test("公開中で埋め込み可能な未登録動画を複数選ぶ", () => {
  const items = [
    { id: { videoId: "aaaaaaaaaaa" } },
    { id: { videoId: "bbbbbbbbbbb" } },
    { id: { videoId: "ccccccccccc" } },
    { id: { videoId: "ddddddddddd" } },
  ];
  const details = new Map([
    ["aaaaaaaaaaa", { id: "aaaaaaaaaaa", status: { privacyStatus: "public", embeddable: true }, contentDetails: { duration: "PT3M" } }],
    ["bbbbbbbbbbb", { id: "bbbbbbbbbbb", status: { privacyStatus: "private", embeddable: true }, contentDetails: { duration: "PT5M" } }],
    ["ccccccccccc", { id: "ccccccccccc", status: { privacyStatus: "public", embeddable: true }, contentDetails: { duration: "PT6M" } }],
    ["ddddddddddd", { id: "ddddddddddd", status: { privacyStatus: "public", embeddable: true }, contentDetails: { duration: "PT7M" } }],
  ]);
  const selected = selectCandidates(items, details, new Set(["aaaaaaaaaaa"]), 2);
  assert.deepEqual(selected.map(({ id }) => id), ["ccccccccccc", "ddddddddddd"]);
});

test("API詳細を既存カタログ形式へ変換する", () => {
  const details = { id: "bbbbbbbbbbb", snippet: { title: "A &amp; B", channelTitle: "Channel" }, status: { privacyStatus: "public", embeddable: true }, contentDetails: { duration: "PT5M" }, statistics: { viewCount: "123" } };
  const video = toCatalogVideo(details, { country: countries[0], genre: genres[1] }, config);
  assert.deepEqual(video, { id: "bbbbbbbbbbb", title: "A & B", channel: "Channel", genre: "horror", duration: "medium", tags: ["ホラー"], countries: ["jp"], source: "youtube-data-api", viewCount: 123 });
});
