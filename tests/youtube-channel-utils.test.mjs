import test from "node:test";
import assert from "node:assert/strict";

import {
  buildChannelJobs,
  channelJobKey,
  languageBase,
  matchesCountryOrLanguage,
} from "../scripts/youtube-channel-utils.mjs";

const countries = [{ id: "jp", code: "JP", name: "日本" }];
const genres = [{ id: "game", name: "ゲーム" }, { id: "horror", name: "ホラー" }];

test("不足している公式カテゴリ対応組から未処理チャンネルを作る", () => {
  const videos = [
    { id: "aaaaaaaaaaa", genre: "game", countries: ["jp"], channelId: "UC1234567890123456789012" },
    { id: "bbbbbbbbbbb", genre: "game", countries: ["jp"], channelId: "UC1234567890123456789012" },
    { id: "ccccccccccc", genre: "game", countries: ["jp"], channelId: "UCabcdefghijklmnopqrstuv" },
  ];
  const processed = [channelJobKey("jp", "game", "UCabcdefghijklmnopqrstuv")];
  const jobs = buildChannelJobs(countries, genres, videos, processed, { game: "20" }, 5);
  assert.deepEqual(jobs.map(({ key }) => key), ["jp:game:UC1234567890123456789012"]);
});

test("発掘専用動画と公式カテゴリ非対応ジャンルは種にしない", () => {
  const videos = [
    { id: "aaaaaaaaaaa", genre: "game", countries: ["jp"], channelId: "UC1234567890123456789012", discovery: true },
    { id: "bbbbbbbbbbb", genre: "horror", countries: ["jp"], channelId: "UCabcdefghijklmnopqrstuv" },
  ];
  assert.deepEqual(buildChannelJobs(countries, genres, videos, [], { game: "20" }, 5), []);
});

test("国または動画言語の一致を判定する", () => {
  const japanese = { snippet: { defaultAudioLanguage: "ja-JP" } };
  const english = { snippet: { defaultLanguage: "en" } };
  assert.equal(matchesCountryOrLanguage(english, "ja", "JP", "JP"), true);
  assert.equal(matchesCountryOrLanguage(japanese, "ja", undefined, "JP"), true);
  assert.equal(matchesCountryOrLanguage(english, "ja", undefined, "JP"), false);
  assert.equal(matchesCountryOrLanguage({ snippet: {} }, "ja", undefined, "JP"), false);
  assert.equal(languageBase("pt-BR"), "pt");
});
