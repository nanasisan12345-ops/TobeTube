export const GENRE_GROUPS = [
  { id: "entertainment", genreIds: ["game", "music", "movie", "horror", "comedy", "animation", "dance"] },
  { id: "knowledge", genreIds: ["science", "learning", "history", "documentary", "technology"] },
  { id: "life", genreIds: ["cooking", "travel", "relax", "asmr"] },
  { id: "nature", genreIds: ["animals", "livecam"] },
  { id: "activity", genreIds: ["sports"] },
  { id: "creative", genreIds: ["making", "art"] },
  { id: "transport", genreIds: ["vehicles"] },
];

export function isPublicGenre(genre) {
  return genre?.status !== "candidate";
}

export function publicGenres(genres) {
  return genres.filter(isPublicGenre);
}

export function rootGenreId(genre, genres) {
  const byId = new Map(genres.map((item) => [item.id, item]));
  let current = genre;
  const visited = new Set();
  while (current?.parentId && !visited.has(current.id)) {
    visited.add(current.id);
    current = byId.get(current.parentId);
  }
  return current?.id ?? genre?.id;
}

export function groupIdForGenre(genre, genres) {
  const rootId = rootGenreId(genre, genres);
  return GENRE_GROUPS.find(({ genreIds }) => genreIds.includes(rootId))?.id ?? "other";
}

export function groupPublicGenres(genres) {
  const grouped = new Map(GENRE_GROUPS.map(({ id }) => [id, []]));
  grouped.set("other", []);
  for (const genre of publicGenres(genres)) {
    grouped.get(groupIdForGenre(genre, genres)).push(genre);
  }
  return [...GENRE_GROUPS.map(({ id }) => ({ id, genres: grouped.get(id) }))]
    .concat(grouped.get("other").length > 0 ? [{ id: "other", genres: grouped.get("other") }] : [])
    .filter(({ genres: items }) => items.length > 0);
}

export function genreSelectionIds(selectedGenreId, genres) {
  if (!selectedGenreId || selectedGenreId === "all") return null;
  const selected = new Set([selectedGenreId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const genre of genres) {
      if (genre.parentId && selected.has(genre.parentId) && !selected.has(genre.id)) {
        selected.add(genre.id);
        changed = true;
      }
    }
  }
  return [...selected];
}

export function promotionResult(genre, videos) {
  const activation = genre?.activation ?? {};
  const minimumVideos = activation.minimumVideos ?? 12;
  const minimumCountries = activation.minimumCountries ?? 3;
  const matching = videos.filter((video) => video.genre === genre.id);
  const countries = new Set(matching.flatMap((video) => video.countries ?? []));
  return {
    ready: matching.length >= minimumVideos && countries.size >= minimumCountries,
    videoCount: matching.length,
    countryCount: countries.size,
    minimumVideos,
    minimumCountries,
  };
}
