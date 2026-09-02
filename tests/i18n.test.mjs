import test from "node:test";
import assert from "node:assert/strict";

import {
  COUNTRY_LOCALES,
  countryName,
  createTranslator,
  genreName,
  localeForCountry,
  validateTranslations,
} from "../js/i18n.js";

test("16か国に主要言語が割り当てられている", () => {
  assert.equal(Object.keys(COUNTRY_LOCALES).length, 16);
  assert.equal(localeForCountry("jp"), "ja");
  assert.equal(localeForCountry("mx"), "es");
  assert.equal(localeForCountry("unknown"), "ja");
});

test("全言語のUI文言と22ジャンル名が揃っている", () => {
  assert.deepEqual(validateTranslations(), []);
});

test("置換を含む翻訳と地域名を返す", () => {
  assert.equal(createTranslator("en")("videoCount", { count: 3 }), "3 videos");
  assert.equal(genreName("horror", "ko"), "공포");
  assert.match(countryName("DE", "de"), /Deutschland/);
});
