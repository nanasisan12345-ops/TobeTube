const GENRES_URL = new URL("../data/genres.json", import.meta.url);
const COUNTRIES_URL = new URL("../data/countries.json", import.meta.url);
const VIDEOS_URL = new URL("../data/videos.json", import.meta.url);
const REQUIRED_GENRE_LOCALES = ["ja", "en", "ko", "fr", "it", "hi", "pt-BR", "de", "es", "th", "id", "vi"];

export async function loadCatalog(fetcher = fetch) {
  const [genresResponse, countriesResponse, videosResponse] = await Promise.all([
    fetcher(GENRES_URL),
    fetcher(COUNTRIES_URL),
    fetcher(VIDEOS_URL, { cache: "no-cache" }),
  ]);

  if (!genresResponse.ok || !countriesResponse.ok || !videosResponse.ok) {
    throw new Error("動画データを読み込めませんでした。");
  }

  const [genres, countries, videos] = await Promise.all([
    genresResponse.json(),
    countriesResponse.json(),
    videosResponse.json(),
  ]);
  const errors = validateCatalog(genres, countries, videos);

  if (errors.length > 0) {
    throw new Error(`動画データの形式が正しくありません: ${errors[0]}`);
  }

  return { genres, countries, videos };
}

export function validateCatalog(genres, countries, videos) {
  const errors = [];
  if (!Array.isArray(genres) || genres.length === 0) {
    errors.push("genres.json が空です");
  }
  if (!Array.isArray(countries) || countries.length === 0) {
    errors.push("countries.json が空です");
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
    if (genre.status !== undefined && !["active", "candidate"].includes(genre.status)) {
      errors.push(`ジャンル ${genre.id} の status が正しくありません`);
    }
    if (genre.status === "candidate") {
      if (!genre.parentId) errors.push(`候補ジャンル ${genre.id} に parentId がありません`);
      if (REQUIRED_GENRE_LOCALES.some((locale) => !genre.names?.[locale])) {
        errors.push(`候補ジャンル ${genre.id} に多言語名がありません`);
      }
      if (!Number.isInteger(genre.activation?.minimumVideos) || genre.activation.minimumVideos < 1) {
        errors.push(`候補ジャンル ${genre.id} の minimumVideos が正しくありません`);
      }
      if (!Number.isInteger(genre.activation?.minimumCountries) || genre.activation.minimumCountries < 1) {
        errors.push(`候補ジャンル ${genre.id} の minimumCountries が正しくありません`);
      }
    }
    genreIds.add(genre.id);
  }
  for (const genre of genres) {
    if (genre.parentId && !genreIds.has(genre.parentId)) {
      errors.push(`ジャンル ${genre.id} の親ジャンルが存在しません: ${genre.parentId}`);
    }
    if (genre.parentId === genre.id) {
      errors.push(`ジャンル ${genre.id} が自分自身を親にしています`);
    }
  }

  const countryIds = new Set();
  for (const country of countries) {
    if (!country?.id || !country?.code || !country?.name) {
      errors.push("国には id、code、name が必要です");
      continue;
    }
    if (countryIds.has(country.id)) {
      errors.push(`国IDが重複しています: ${country.id}`);
    }
    countryIds.add(country.id);
  }

  const videoIds = new Set();
  for (const video of videos) {
    if (!/^[A-Za-z0-9_-]{11}$/.test(video?.id ?? "")) {
      errors.push(`YouTube動画IDが正しくありません: ${video?.id ?? "(なし)"}`);
    }
    if (!video?.title || !video?.channel) {
      errors.push(`動画 ${video?.id ?? "(なし)"} に title または channel がありません`);
    }
    if (video?.viewCount !== undefined && (!Number.isSafeInteger(video.viewCount) || video.viewCount < 0)) {
      errors.push(`動画 ${video?.id ?? "(なし)"} の viewCount が正しくありません`);
    }
    if (video?.discovery !== undefined && typeof video.discovery !== "boolean") {
      errors.push(`動画 ${video?.id ?? "(なし)"} の discovery が正しくありません`);
    }
    if (video?.channelId !== undefined && !/^UC[A-Za-z0-9_-]{22}$/.test(video.channelId)) {
      errors.push(`動画 ${video?.id ?? "(なし)"} の channelId が正しくありません`);
    }
    if (!genreIds.has(video?.genre)) {
      errors.push(`動画 ${video?.id ?? "(なし)"} のジャンルが存在しません: ${video?.genre}`);
    }
    if (video?.countries !== undefined) {
      if (!Array.isArray(video.countries) || video.countries.length === 0) {
        errors.push(`動画 ${video?.id ?? "(なし)"} の countries は1件以上必要です`);
      } else {
        for (const countryId of video.countries) {
          if (!countryIds.has(countryId)) {
            errors.push(`動画 ${video?.id ?? "(なし)"} の国が存在しません: ${countryId}`);
          }
        }
      }
    }
    if (videoIds.has(video?.id)) {
      errors.push(`動画IDが重複しています: ${video.id}`);
    }
    videoIds.add(video?.id);
  }

  return errors;
}
