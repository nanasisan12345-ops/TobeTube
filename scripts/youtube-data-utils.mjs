import { genreName } from "../js/i18n.js";

export function findMissingPairs(countries, genres, videos) {
  const covered = new Set();
  for (const video of videos) {
    for (const countryId of video.countries ?? []) {
      covered.add(`${countryId}:${video.genre}`);
    }
  }
  return countries.flatMap((country) => genres
    .filter((genre) => !covered.has(`${country.id}:${genre.id}`))
    .map((genre) => ({ country, genre })));
}

export function buildSearchQuery(pair, searchConfig) {
  const country = searchConfig.countries[pair.country.id];
  if (!country) throw new Error(`検索設定がない国です: ${pair.country.id}`);
  const localizedGenre = genreName(pair.genre.id, country.language, pair.genre.name);
  const suffix = searchConfig.querySuffixes[pair.genre.id] ?? "";
  return [country.queryName, localizedGenre, suffix].filter(Boolean).join(" ");
}

export function decodeHtml(value = "") {
  const named = { amp: "&", quot: '"', apos: "'", "#39": "'", lt: "<", gt: ">" };
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|#39|lt|gt);/gi, (match, entity) => {
    if (entity.toLowerCase().startsWith("#x")) return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    if (entity.startsWith("#") && entity !== "#39") return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    return named[entity.toLowerCase()] ?? match;
  });
}

export function parseIsoDuration(value = "") {
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(value);
  if (!match) return null;
  return (Number(match[1] ?? 0) * 86400)
    + (Number(match[2] ?? 0) * 3600)
    + (Number(match[3] ?? 0) * 60)
    + Number(match[4] ?? 0);
}

export function durationBucket(isoDuration) {
  const seconds = parseIsoDuration(isoDuration);
  if (seconds === null) return "medium";
  if (seconds < 240) return "short";
  if (seconds <= 1200) return "medium";
  return "long";
}

export function selectCandidate(searchItems, detailsById, usedIds) {
  for (const item of searchItems) {
    const videoId = item?.id?.videoId;
    const details = detailsById.get(videoId);
    if (!videoId || usedIds.has(videoId) || !details) continue;
    if (details.status?.privacyStatus !== "public" || details.status?.embeddable !== true) continue;
    if (details.contentDetails?.duration === "P0D") continue;
    return details;
  }
  return null;
}

export function toCatalogVideo(details, pair, searchConfig) {
  const locale = searchConfig.countries[pair.country.id].language;
  const video = {
    id: details.id,
    title: decodeHtml(details.snippet?.title ?? "YouTube video"),
    channel: decodeHtml(details.snippet?.channelTitle ?? "YouTube"),
    genre: pair.genre.id,
    duration: durationBucket(details.contentDetails?.duration),
    tags: [genreName(pair.genre.id, locale, pair.genre.name)],
    countries: [pair.country.id],
    source: "youtube-data-api"
  };
  const viewCount = Number(details.statistics?.viewCount);
  if (Number.isSafeInteger(viewCount) && viewCount >= 0) video.viewCount = viewCount;
  return video;
}
