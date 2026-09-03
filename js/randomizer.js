export const DEFAULT_RECENT_LIMIT = 8;

export function getEligibleVideos(videos, genreId = "all", countryId = null, genreIds = null) {
  if (!Array.isArray(videos)) {
    return [];
  }

  const selectedGenres = Array.isArray(genreIds) ? new Set(genreIds) : null;
  return videos.filter((video) => {
    const matchesGenre = genreId === "all"
      || (selectedGenres ? selectedGenres.has(video.genre) : video.genre === genreId);
    const matchesCountry = !countryId || video.countries?.includes(countryId);
    return matchesGenre && matchesCountry;
  });
}

export function pickRandomVideo(
  videos,
  { genreId = "all", genreIds = null, countryId = null, recentIds = [], random = Math.random } = {},
) {
  const eligible = getEligibleVideos(videos, genreId, countryId, genreIds);
  if (eligible.length === 0) {
    return null;
  }

  const regular = eligible.filter((video) => video.discovery !== true);
  const regularPool = regular.length > 0 ? regular : eligible;
  return pickAvoidingRecent(preferHighViewCount(regularPool), recentIds, random);
}

function pickAvoidingRecent(videos, recentIds, random) {
  const recentSet = new Set(recentIds);
  const fresh = videos.filter((video) => !recentSet.has(video.id));
  const oldestRecentIndex = Math.max(...videos.map((video) => recentIds.indexOf(video.id)));
  const leastRecent = videos.filter((video) => recentIds.indexOf(video.id) === oldestRecentIndex);
  const finalPool = fresh.length > 0 ? fresh : leastRecent;
  const index = Math.min(Math.floor(random() * finalPool.length), finalPool.length - 1);

  return finalPool[Math.max(0, index)];
}

export function pickDiscoveryVideo(
  videos,
  {
    genreId = "all",
    genreIds = null,
    countryId = null,
    historyIds = [],
    recentIds = [],
    currentGenre = null,
    random = Math.random,
  } = {},
) {
  const eligible = getEligibleVideos(videos, genreId, countryId, genreIds);
  if (eligible.length === 0) {
    return null;
  }

  const dedicated = eligible.filter((video) => video.discovery === true);
  const sourcePool = dedicated.length > 0 ? dedicated : eligible;
  const lowViewPool = preferLowViewCount(sourcePool);
  const differentGenre = currentGenre
    ? lowViewPool.filter((video) => video.genre !== currentGenre)
    : lowViewPool;
  const discoveryPool = differentGenre.length > 0 ? differentGenre : lowViewPool;
  const historySet = new Set(historyIds);
  const unseen = discoveryPool.filter((video) => !historySet.has(video.id));
  if (unseen.length > 0) {
    return pickFromPool(unseen, random);
  }

  return pickAvoidingRecent(discoveryPool, recentIds, random);
}

export function preferLowViewCount(videos, ratio = 0.25) {
  const known = videos.filter((video) => Number.isFinite(video.viewCount) && video.viewCount >= 0);
  if (known.length === 0) return videos;
  const sorted = [...known].sort((left, right) => left.viewCount - right.viewCount);
  const poolSize = Math.max(1, Math.ceil(sorted.length * ratio));
  const threshold = sorted[poolSize - 1].viewCount;
  return known.filter((video) => video.viewCount <= threshold);
}

export function preferHighViewCount(videos, ratio = 0.25) {
  const known = videos.filter((video) => Number.isFinite(video.viewCount) && video.viewCount >= 0);
  if (known.length === 0) return videos;
  const sorted = [...known].sort((left, right) => right.viewCount - left.viewCount);
  const poolSize = Math.max(1, Math.ceil(sorted.length * ratio));
  const threshold = sorted[poolSize - 1].viewCount;
  return known.filter((video) => video.viewCount >= threshold);
}

function pickFromPool(pool, random) {
  const index = Math.min(Math.floor(random() * pool.length), pool.length - 1);
  return pool[Math.max(0, index)] ?? null;
}

export function pushRecentId(recentIds, videoId, limit = DEFAULT_RECENT_LIMIT) {
  if (!videoId) {
    return [...recentIds].slice(0, limit);
  }

  return [videoId, ...recentIds.filter((id) => id !== videoId)].slice(0, limit);
}
