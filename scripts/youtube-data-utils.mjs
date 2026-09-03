import { genreName } from "../js/i18n.js";

export function findMissingPairs(countries, genres, videos) {
  return findPairsBelowTarget(countries, genres, videos, 1)
    .map(({ country, genre }) => ({ country, genre }));
}

export function findPairsBelowTarget(countries, genres, videos, targetCount) {
  if (!Number.isInteger(targetCount) || targetCount < 1) {
    throw new Error("targetCount は1以上の整数で指定してください。");
  }
  const counts = new Map();
  for (const video of videos) {
    for (const countryId of video.countries ?? []) {
      const key = `${countryId}:${video.genre}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return countries.flatMap((country) => genres
    .map((genre) => ({
      country,
      genre,
      count: counts.get(`${country.id}:${genre.id}`) ?? 0,
    })))
    .filter(({ count }) => count < targetCount)
    .sort((left, right) => left.count - right.count);
}

export function findDiscoveryPairsBelowTarget(countries, genres, videos, targetCount) {
  return findPairsBelowTarget(
    countries,
    genres,
    videos.filter((video) => video.discovery === true),
    targetCount,
  );
}

export function buildSearchQuery(pair, searchConfig) {
  const country = searchConfig.countries[pair.country.id];
  if (!country) throw new Error(`検索設定がない国です: ${pair.country.id}`);
  const localizedGenre = genreName(pair.genre.id, country.language, pair.genre.name);
  const suffix = searchConfig.querySuffixes[pair.genre.id] ?? "";
  return [country.queryName, localizedGenre, suffix].filter(Boolean).join(" ");
}

export function isSearchLimitError(error) {
  return error?.reason === "rateLimitExceeded" || error?.reason === "quotaExceeded";
}

export function isUnavailableVideoChartError(error) {
  return error?.reason === "notFound" || error?.reason === "videoChartNotFound";
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
  return selectCandidates(searchItems, detailsById, usedIds, 1)[0] ?? null;
}

export function isPlayableVideo(details) {
  return Boolean(
    details
    && details.status?.privacyStatus === "public"
    && details.status?.embeddable === true
    && details.contentDetails?.duration !== "P0D"
  );
}

export function selectCandidates(searchItems, detailsById, usedIds, limit = Number.POSITIVE_INFINITY) {
  const selected = [];
  const seenIds = new Set(usedIds);
  for (const item of searchItems) {
    const videoId = item?.id?.videoId;
    const details = detailsById.get(videoId);
    if (!videoId || seenIds.has(videoId) || !isPlayableVideo(details)) continue;
    selected.push(details);
    seenIds.add(videoId);
    if (selected.length >= limit) break;
  }
  return selected;
}

export function selectDiscoveryCandidates(searchItems, detailsById, usedIds, limit = Number.POSITIVE_INFINITY) {
  return selectCandidates(searchItems, detailsById, usedIds)
    .filter((details) => {
      const viewCount = Number(details.statistics?.viewCount);
      return Number.isSafeInteger(viewCount) && viewCount >= 0;
    })
    .sort((left, right) => Number(left.statistics.viewCount) - Number(right.statistics.viewCount))
    .slice(0, limit);
}

export function toCatalogVideo(details, pair, searchConfig, { discovery = false } = {}) {
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
  if (discovery) video.discovery = true;
  const viewCount = Number(details.statistics?.viewCount);
  if (Number.isSafeInteger(viewCount) && viewCount >= 0) video.viewCount = viewCount;
  return video;
}
