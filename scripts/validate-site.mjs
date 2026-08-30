import { access, readFile, readdir } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = join(root, "index.html");
const html = await readFile(indexPath, "utf8");
const errors = [];

for (const requiredPath of ["assets/favicon.svg", "assets/og-image.png", "data/genres.json", "data/videos.json"]) {
  try {
    await access(join(root, requiredPath));
  } catch {
    errors.push(`公開に必要なファイルが見つかりません: ${requiredPath}`);
  }
}

const requiredSnippets = [
  '<html lang="ja"',
  '<meta name="description"',
  '<link rel="canonical"',
  '<meta property="og:image"',
  '<meta property="og:url"',
  '<meta name="twitter:card"',
  '<link rel="icon"',
  '<script type="module" src="./js/app.js"',
];

for (const snippet of requiredSnippets) {
  if (!html.includes(snippet)) errors.push(`index.html に必須記述がありません: ${snippet}`);
}

const localReferences = [...html.matchAll(/(?:href|src|content)="(\.\/[^"?#]+)(?:[?#][^"]*)?"/g)]
  .map((match) => match[1]);

for (const reference of new Set(localReferences)) {
  const target = resolve(root, reference.slice(2));
  try {
    await access(target);
  } catch {
    errors.push(`参照先が見つかりません: ${reference}`);
  }
}

const sourceFiles = [];
for (const folder of ["js", "styles", "data"]) {
  for (const name of await readdir(join(root, folder))) {
    sourceFiles.push(join(root, folder, name));
  }
}
sourceFiles.push(indexPath);

for (const path of sourceFiles) {
  const source = await readFile(path, "utf8");
  if (/AIza[0-9A-Za-z_-]{30,}/.test(source)) {
    errors.push(`Google APIキーらしき文字列があります: ${relative(root, path)}`);
  }
  if (/(?:href|src)="\/(?!\/)/.test(source)) {
    errors.push(`GitHub Pagesのサブパスで壊れる絶対パスがあります: ${relative(root, path)}`);
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`公開用の相対パス、メタ情報、ローカル参照 ${new Set(localReferences).size} 件を確認しました。`);
}
