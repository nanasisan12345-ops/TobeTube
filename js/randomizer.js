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

export function pushRecentId(recentIds, videoId, limit = DEFAULT_RECENT_LIMIT) {
  if (!videoId) {
    return [...recentIds].slice(0, limit);
  }

  return [videoId, ...recentIds.filter((id) => id !== videoId)].slice(0, limit);
}
