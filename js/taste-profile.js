import { rootGenreId } from "./genre-taxonomy.js?v=20260904a";

// One category per video: the six percentages share the same denominator.
export const TASTE_AXES = [
  ["knowledge", ["science", "learning", "history", "documentary", "technology"]],
  ["creative", ["making", "art", "music", "dance"]],
  ["energy", ["game", "horror", "sports"]],
  ["stories", ["movie", "animation", "comedy"]],
  ["calm", ["animals", "livecam", "relax", "asmr"]],
  ["life", ["cooking", "travel", "vehicles"]],
];

export function analyzeTaste(favoriteIds, videos, genres) {
  const ids = [...new Set(favoriteIds)];
  const catalog = new Map(videos.map(video => [video.id, video]));
  const taxonomy = new Map(genres.map(genre => [genre.id, genre]));
  const counts = TASTE_AXES.map(() => 0);
  const genreCounts = new Map();
  let analyzed = 0;
  for (const id of ids) {
    const video = catalog.get(id);
    const genre = taxonomy.get(video?.genre);
    if (!genre) continue;
    const root = rootGenreId(genre, genres);
    const axis = TASTE_AXES.findIndex(([, roots]) => roots.includes(root));
    if (axis < 0) continue;
    analyzed++;
    counts[axis]++;
    genreCounts.set(genre.id, (genreCounts.get(genre.id) ?? 0) + 1);
  }
  const axes = TASTE_AXES.map(([id], index) => ({ id, count: counts[index], percent: analyzed ? Math.round(counts[index] / analyzed * 100) : 0 }));
  const max = Math.max(...counts);
  const leaders = axes.filter(axis => axis.count === max && max > 0);
  return {
    total: ids.length, analyzed, excluded: ids.length - analyzed,
    provisional: analyzed < 5,
    leader: leaders.length === 1 ? leaders[0].id : null,
    axes,
    genres: [...genreCounts].map(([id, count]) => ({ id, count, percent: Math.round(count / analyzed * 100) }))
      .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id, "en")),
  };
}
