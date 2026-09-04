import { findPairsBelowTarget, isYouTubeChannelId } from "./youtube-data-utils.mjs";

export function channelJobKey(countryId, genreId, channelId) {
  return `${countryId}:${genreId}:${channelId}`;
}

export function buildChannelJobs(countries, genres, videos, processedKeys, categoryIds, targetCount) {
  const processed = new Set(processedKeys);
  const jobs = [];
  for (const pair of findPairsBelowTarget(countries, genres, videos, targetCount)) {
    if (!categoryIds[pair.genre.id]) continue;
    const seedCounts = new Map();
    for (const video of videos) {
      if (video.discovery === true || video.genre !== pair.genre.id) continue;
      if (!video.countries?.includes(pair.country.id) || !isYouTubeChannelId(video.channelId)) continue;
      seedCounts.set(video.channelId, (seedCounts.get(video.channelId) ?? 0) + 1);
    }
    const channels = [...seedCounts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
    for (const [channelId] of channels) {
      const key = channelJobKey(pair.country.id, pair.genre.id, channelId);
      if (!processed.has(key)) jobs.push({ ...pair, channelId, key });
    }
  }
  return jobs;
}

export function matchesCountryOrLanguage(details, targetLanguage, channelCountry, targetCountryCode) {
  if (channelCountry?.toUpperCase() === targetCountryCode.toUpperCase()) return true;
  const target = languageBase(targetLanguage);
  return [details.snippet?.defaultAudioLanguage, details.snippet?.defaultLanguage]
    .filter(Boolean)
    .some((language) => languageBase(language) === target);
}

export function languageBase(value = "") {
  return value.toLowerCase().split("-")[0];
}

export function canAcceptDuration(
  { total = 0, short = 0 },
  candidateDuration,
  maximumShortRatio = 0.2,
) {
  if (candidateDuration !== "short") return true;
  return (short + 1) / (total + 1) <= maximumShortRatio;
}
