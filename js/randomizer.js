export const DEFAULT_RECENT_LIMIT = 8;

export function getEligibleVideos(videos, genreId = "all") {
  if (!Array.isArray(videos)) {
    return [];
  }

  return genreId === "all"
    ? [...videos]
    : videos.filter((video) => video.genre === genreId);
}

export function pickRandomVideo(
  videos,
  { genreId = "all", recentIds = [], random = Math.random } = {},
) {
  const eligible = getEligibleVideos(videos, genreId);
  if (eligible.length === 0) {
    return null;
  }

  const recentSet = new Set(recentIds);
  const fresh = eligible.filter((video) => !recentSet.has(video.id));
  const oldestRecentIndex = Math.max(...eligible.map((video) => recentIds.indexOf(video.id)));
  const leastRecent = eligible.filter((video) => recentIds.indexOf(video.id) === oldestRecentIndex);
  const finalPool = fresh.length > 0 ? fresh : leastRecent;
  const index = Math.min(Math.floor(random() * finalPool.length), finalPool.length - 1);

  return finalPool[Math.max(0, index)];
}

export function pickDiscoveryVideo(
  videos,
  { historyIds = [], recentIds = [], currentGenre = null, random = Math.random } = {},
) {
  if (!Array.isArray(videos) || videos.length === 0) {
    return null;
  }

  const historySet = new Set(historyIds);
  const unseen = videos.filter((video) => !historySet.has(video.id));
  if (unseen.length > 0) {
    const unseenDifferentGenre = currentGenre
      ? unseen.filter((video) => video.genre !== currentGenre)
      : unseen;
    return pickFromPool(unseenDifferentGenre.length > 0 ? unseenDifferentGenre : unseen, random);
  }

  const differentGenre = currentGenre
    ? videos.filter((video) => video.genre !== currentGenre)
    : videos;
  return pickRandomVideo(differentGenre.length > 0 ? differentGenre : videos, {
    recentIds,
    random,
  });
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
