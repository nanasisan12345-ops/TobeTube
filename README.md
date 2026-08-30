# TobeTube

「ジャンルを選んで、まだ知らない動画へ。」をコンセプトにした、YouTube動画のランダム発掘サイトです。

14ジャンルから選ぶ通常モードと、全ジャンルを横断して未視聴動画を優先する「発掘モード」を利用できます。お気に入り、最近見た動画、共有リンク、ライト／ダークテーマにも対応しています。

## 最初に知っておくこと

- サイトの公開にYouTube APIキーは不要です。
- 再生にはYouTube公式の **IFrame Player API** を使っています。
- 動画情報は `data/videos.json`、ジャンルは `data/genres.json` で管理します。
- 発掘モードは、まだ見ていない動画と直前とは違うジャンルを優先します。
- GitHub PagesのプロジェクトURL（`https://ユーザー名.github.io/リポジトリ名/`）で動くよう、相対パスで作られています。
- お気に入り・履歴・テーマは閲覧者のブラウザー内に保存され、外部サーバーには送信しません。

## フォルダー構成

```text
tobetube/
├─ index.html              サイト本体
├─ styles/main.css         デザイン
├─ js/                     抽選・再生・保存処理
├─ data/
│  ├─ genres.json          ジャンル一覧
│  └─ videos.json          動画一覧
├─ assets/                 ファビコン・OGP画像
├─ scripts/                データ・公開状態の検査
├─ tests/                  自動テスト
├─ run.bat                 Windows用の起動ファイル
└─ .nojekyll               GitHub Pages用設定
```

## ローカルで起動する

Windowsでは `run.bat` をダブルクリックしてください。ブラウザーで `http://localhost:8080/` が開きます。

終了するときは、同時に開いた黒い画面を閉じます。

`Python が見つかりません` と表示された場合は、[Python公式サイト](https://www.python.org/downloads/)からPython 3をインストールし、もう一度 `run.bat` を実行してください。

> `index.html` を直接ダブルクリックすると、ブラウザーの制限でJSONを読み込めません。必ず `run.bat` から起動してください。

## 動画を追加する

1. 追加したいYouTube動画を開きます。
2. URLの動画IDを確認します。例: `https://www.youtube.com/watch?v=dQw4w9WgXcQ` の動画IDは `dQw4w9WgXcQ` です。
3. `data/videos.json` をUTF-8対応のエディターで開きます。
4. 配列の末尾に、カンマを忘れず次の形式で追加します。

```json
{
  "id": "dQw4w9WgXcQ",
  "title": "動画タイトル",
  "channel": "チャンネル名",
  "genre": "music",
  "duration": "short",
  "tags": ["洋楽", "80年代"]
}
```

各項目の意味:

- `id`: YouTube動画ID（11文字）
- `title`: サイトに表示する動画タイトル
- `channel`: チャンネル名
- `genre`: `data/genres.json` にあるジャンルID
- `duration`: `short`、`medium`、`long` のいずれか
- `tags`: 表示したい短い特徴。0～4個を推奨

編集後は `npm run validate:data` を実行すると、ID重複や存在しないジャンルを検出できます。埋め込み可否も確認する場合は `npm run validate:youtube` を実行します。

## ジャンルを追加する

1. `data/genres.json` にジャンルを追加します。
2. `data/videos.json` に、そのジャンルIDを使う動画を1本以上追加します。

```json
{
  "id": "sports",
  "name": "スポーツ",
  "description": "試合・技術・名場面",
  "color": "#2F80ED",
  "icon": "compass"
}
```

利用できるアイコン名は `gamepad`、`music`、`paw`、`cooking`、`compass`、`planet`、`bulb`、`waves`、`trophy`、`chip`、`history`、`hammer`、`palette`、`vehicle` です。未登録の名前は `compass` で表示されます。

## GitHub Pagesで公開する

### 1. GitHubへアップロード

1. GitHubで新しいリポジトリを作成します。
2. このフォルダー内のファイルを、リポジトリの一番上へアップロードします。
3. `Commit changes` を押して保存します。

Gitを使う場合は、このフォルダーで次を実行します。`YOUR-NAME` と `YOUR-REPOSITORY` は自分の値へ置き換えてください。

```bash
git init
git add .
git commit -m "Create TobeTube"
git branch -M main
git remote add origin https://github.com/YOUR-NAME/YOUR-REPOSITORY.git
git push -u origin main
```

### 2. Pagesを有効にする

1. GitHubのリポジトリで `Settings` を開きます。
2. 左側の `Pages` を開きます。
3. `Build and deployment` の `Source` を `Deploy from a branch` にします。
4. Branchを `main`、フォルダーを `/(root)` にして `Save` を押します。
5. 数分後に表示される公開URLを開きます。

更新時はファイルを編集し、再度コミット／プッシュします。反映には数分かかることがあります。

## 開発者向け検証

Node.js 20以上がある環境で実行します。追加パッケージのインストールは不要です。

```bash
npm test
npm run validate:data
npm run validate:site
npm run validate:youtube
```

OGP画像を作り直す場合は、PythonとPillowがあるWindows環境で次を実行します。

```bash
python scripts/generate-assets.py
```

## YouTube Data APIについて

現在はYouTube Data API v3を使わず、公式IFrame Player APIと編集可能なJSONを組み合わせています。静的なGitHub PagesへData APIキーを直接入れると、キーが閲覧者に見えるためです。

動画タイトルやチャンネル情報を自動更新したい場合は、将来、GitHub ActionsのSecretsにAPIキーを保存し、定期処理で `data/videos.json` を更新する構成へ拡張できます。公開ページ側にはキーを置かないでください。

## 注意事項

- 埋め込み禁止、削除、年齢制限、地域制限などにより再生できない動画は、YouTube側の状態に応じて発生します。その場合は自動的に別の動画を試します。
- 動画の権利と公開条件は各動画・チャンネルの管理者に帰属します。
- TobeTubeはYouTubeの公式サービスではありません。
