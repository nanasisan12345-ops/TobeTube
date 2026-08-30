const GENRES_URL = new URL("../data/genres.json", import.meta.url);
const VIDEOS_URL = new URL("../data/videos.json", import.meta.url);

export async function loadCatalog(fetcher = fetch) {
  const [genresResponse, videosResponse] = await Promise.all([
    fetcher(GENRES_URL),
    fetcher(VIDEOS_URL),
  ]);

  if (!genresResponse.ok || !videosResponse.ok) {
    throw new Error("動画データを読み込めませんでした。");
  }

  const [genres, videos] = await Promise.all([
    genresResponse.json(),
    videosResponse.json(),
  ]);
  const errors = validateCatalog(genres, videos);

  if (errors.length > 0) {
    throw new Error(`動画データの形式が正しくありません: ${errors[0]}`);
  }

  return { genres, videos };
}

export function validateCatalog(genres, videos) {
  const errors = [];
  if (!Array.isArray(genres) || genres.length === 0) {
    errors.push("genres.json が空です");
  }
  if (!Array.isArray(videos) || videos.length === 0) {
    errors.push("videos.json が空です");
  }
  if (errors.length > 0) {
    return errors;
  }

  const genreIds = new Set();
  for (const genre of genres) {
    if (!genre?.id || !genre?.name) {
      errors.push("ジャンルには id と name が必要です");
      continue;
    }
    if (genreIds.has(genre.id)) {
      errors.push(`ジャンルIDが重複しています: ${genre.id}`);
    }
    genreIds.add(genre.id);
  }

  const videoIds = new Set();
  for (const video of videos) {
    if (!/^[A-Za-z0-9_-]{11}$/.test(video?.id ?? "")) {
      errors.push(`YouTube動画IDが正しくありません: ${video?.id ?? "(なし)"}`);
    }
    if (!video?.title || !video?.channel) {
      errors.push(`動画 ${video?.id ?? "(なし)"} に title または channel がありません`);
    }
    if (!genreIds.has(video?.genre)) {
      errors.push(`動画 ${video?.id ?? "(なし)"} のジャンルが存在しません: ${video?.genre}`);
    }
    if (videoIds.has(video?.id)) {
      errors.push(`動画IDが重複しています: ${video.id}`);
    }
    videoIds.add(video?.id);
  }

  return errors;
}
