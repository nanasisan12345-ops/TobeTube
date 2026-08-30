import { readFile } from "node:fs/promises";

const videosUrl = new URL("../data/videos.json", import.meta.url);
const videos = JSON.parse(await readFile(videosUrl, "utf8"));
let failures = 0;

for (const video of videos) {
  const watchUrl = `https://www.youtube.com/watch?v=${video.id}`;
  const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`;
  try {
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const metadata = await response.json();
    console.log(`OK  ${video.id}  ${metadata.title}  (${metadata.author_name})`);
  } catch (error) {
    failures += 1;
    const detail = error.cause?.message ? `${error.message}: ${error.cause.message}` : error.message;
    console.error(`NG  ${video.id}  ${detail}`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} 件の動画を確認できませんでした。`);
  process.exitCode = 1;
} else {
  console.log(`\n${videos.length} 件の YouTube ページを確認しました。`);
}
