import test from "node:test";
import assert from "node:assert/strict";

import {
  buildSearchQuery,
  decodeHtml,
  durationBucket,
  findDiscoveryPairsBelowTarget,
  findMissingPairs,
  findPairsBelowTarget,
  isPlayableVideo,
  isSearchLimitError,
  isUnavailableVideoChartError,
  isYouTubeChannelId,
  selectCandidate,
  selectCandidates,
  selectDiscoveryCandidates,
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

test("発掘専用動画だけを数えて不足している組合せを返す", () => {
  const videos = [
    { id: "aaaaaaaaaaa", genre: "game", countries: ["jp"] },
    { id: "bbbbbbbbbbb", genre: "game", countries: ["jp"], discovery: true },
  ];
  const pairs = findDiscoveryPairsBelowTarget(countries, genres, videos, 2);
  assert.deepEqual(pairs.map(({ country, genre, count }) => `${country.id}:${genre.id}:${count}`), ["jp:horror:0", "jp:game:1"]);
});

test("国の検索名とローカライズ済みジャンルで検索語を作る", () => {
  assert.equal(buildSearchQuery({ country: countries[0], genre: genres[1] }, config), "日本 ホラー");
});

test("検索上限エラーだけを途中保存の対象にする", () => {
  assert.equal(isSearchLimitError({ reason: "rateLimitExceeded" }), true);
  assert.equal(isSearchLimitError({ reason: "quotaExceeded" }), true);
  assert.equal(isSearchLimitError({ reason: "backendError" }), false);
});

test("提供されていない国別人気チャートのエラーを判定する", () => {
  assert.equal(isUnavailableVideoChartError({ reason: "notFound" }), true);
  assert.equal(isUnavailableVideoChartError({ reason: "videoChartNotFound" }), true);
  assert.equal(isUnavailableVideoChartError({ reason: "backendError" }), false);
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

test("公開かつ埋め込み可能で通常の長さを持つ動画を判定する", () => {
  const playable = { status: { privacyStatus: "public", embeddable: true }, contentDetails: { duration: "PT5M" } };
  assert.equal(isPlayableVideo(playable), true);
  assert.equal(isPlayableVideo({ ...playable, status: { privacyStatus: "private", embeddable: true } }), false);
  assert.equal(isPlayableVideo({ ...playable, status: { privacyStatus: "public", embeddable: false } }), false);
  assert.equal(isPlayableVideo({ ...playable, contentDetails: { duration: "P0D" } }), false);
});

test("YouTubeチャンネルIDを判定する", () => {
  assert.equal(isYouTubeChannelId("UC1234567890123456789012"), true);
  assert.equal(isYouTubeChannelId("not-a-channel"), false);
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

test("発掘候補を再生数の少ない順で選ぶ", () => {
  const items = [
    { id: { videoId: "aaaaaaaaaaa" } },
    { id: { videoId: "bbbbbbbbbbb" } },
    { id: { videoId: "ccccccccccc" } },
  ];
  const details = new Map([
    ["aaaaaaaaaaa", { id: "aaaaaaaaaaa", status: { privacyStatus: "public", embeddable: true }, contentDetails: { duration: "PT3M" }, statistics: { viewCount: "500" } }],
    ["bbbbbbbbbbb", { id: "bbbbbbbbbbb", status: { privacyStatus: "public", embeddable: true }, contentDetails: { duration: "PT5M" }, statistics: { viewCount: "7" } }],
    ["ccccccccccc", { id: "ccccccccccc", status: { privacyStatus: "public", embeddable: true }, contentDetails: { duration: "PT6M" }, statistics: {} }],
  ]);
  const selected = selectDiscoveryCandidates(items, details, new Set(), 1);
  assert.deepEqual(selected.map(({ id }) => id), ["bbbbbbbbbbb"]);
});

test("API詳細を既存カタログ形式へ変換する", () => {
  const details = { id: "bbbbbbbbbbb", snippet: { title: "A &amp; B", channelTitle: "Channel", channelId: "UC1234567890123456789012" }, status: { privacyStatus: "public", embeddable: true }, contentDetails: { duration: "PT5M" }, statistics: { viewCount: "123" } };
  const video = toCatalogVideo(details, { country: countries[0], genre: genres[1] }, config);
  assert.deepEqual(video, { id: "bbbbbbbbbbb", title: "A & B", channel: "Channel", genre: "horror", duration: "medium", tags: ["ホラー"], countries: ["jp"], source: "youtube-data-api", channelId: "UC1234567890123456789012", viewCount: 123 });
});

test("発掘専用候補をカタログ上で識別できる", () => {
  const details = { id: "bbbbbbbbbbb", snippet: { title: "Discovery", channelTitle: "Channel" }, contentDetails: { duration: "PT5M" }, statistics: { viewCount: "7" } };
  const video = toCatalogVideo(details, { country: countries[0], genre: genres[0] }, config, { discovery: true });
  assert.equal(video.discovery, true);
  assert.equal(video.viewCount, 7);
});
