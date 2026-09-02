# TobeTube

公開サイト: [https://nanasisan12345-ops.github.io/TobeTube/](https://nanasisan12345-ops.github.io/TobeTube/)

国とジャンルからYouTube動画をランダムに選べる動画発掘サイトです。

最初に16か国から国を選び、その国の中で22ジャンルから選ぶ通常モード、または未視聴動画を優先する「発掘モード」を利用できます。発掘モードでも「すべてのジャンル」または個別ジャンルを選べます。お気に入り、最近見た動画、共有リンク、ライト／ダークテーマにも対応しています。

国を選ぶと、ページ全体がその国の主要言語へ切り替わります。日本語、韓国語、英語、フランス語、イタリア語、ヒンディー語、ポルトガル語、ドイツ語、スペイン語、タイ語、インドネシア語、ベトナム語に対応しています。

## 最初に知っておくこと

- サイトの閲覧・再生にYouTube APIキーは不要です。
- 再生にはYouTube公式の **IFrame Player API** を使っています。
- 動画カタログの自動補充には **YouTube Data API v3** を使います。キーは公開ページへ置かず、GitHub ActionsのSecretだけから読み込みます。
- 国は `data/countries.json`、動画情報は `data/videos.json`、ジャンルは `data/genres.json` で管理します。
- 操作順は「国を選ぶ → ジャンル指定または発掘モード → 動画を見る」です。
- 発掘モードは、選んだ国と選択ジャンルの中で、まだ見ていない動画かつ再生数が少ない上位25%の候補を優先します。「すべてのジャンル」では直前とは違うジャンルも優先します。再生数が未取得のカタログでは、取得済みになるまで未視聴優先で動作します。
- 無料映画は、公式チャンネルの公開作品またはパブリックドメイン作品を登録しています。
- GitHub PagesのプロジェクトURL（`https://ユーザー名.github.io/リポジトリ名/`）で動くよう、相対パスで作られています。
- お気に入り・履歴・テーマは閲覧者のブラウザー内に保存され、外部サーバーには送信しません。

## フォルダー構成

```text
tobetube/
├─ index.html              サイト本体
├─ styles/main.css         デザイン
├─ js/                     抽選・再生・保存処理
├─ data/
│  ├─ countries.json       国一覧
│  ├─ genres.json          ジャンル一覧
│  ├─ videos.json          動画一覧
│  └─ youtube-search.json  Data API検索設定
├─ assets/                 ファビコン・OGP画像
├─ scripts/                Data API同期・データ・公開状態の検査
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
  "tags": ["洋楽", "80年代"],
  "countries": ["gb"]
}
```

各項目の意味:

- `id`: YouTube動画ID（11文字）
- `title`: サイトに表示する動画タイトル
- `channel`: チャンネル名
- `genre`: `data/genres.json` にあるジャンルID
- `duration`: `short`、`medium`、`long` のいずれか
- `tags`: 表示したい短い特徴。0～4個を推奨
- `countries`: 内容・場所・文化・作品に関係する国ID。複数の国に関係する場合は複数指定可能

`countries` を省略した動画は国別抽選の対象になりません。国IDは `data/countries.json` にある `jp`、`kr`、`us`、`gb`、`fr`、`it`、`in`、`br`、`ca`、`au`、`de`、`es`、`mx`、`th`、`id`、`vn` を使用します。

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

利用できるアイコン名は `gamepad`、`music`、`paw`、`cooking`、`compass`、`planet`、`bulb`、`waves`、`trophy`、`chip`、`history`、`hammer`、`palette`、`vehicle`、`film`、`horror`、`comedy`、`documentary`、`animation`、`dance`、`sound`、`camera` です。未登録の名前は `compass` で表示されます。

## 国を追加する

1. `data/countries.json` に国を追加します。
2. `data/videos.json` の対象動画の `countries` に、その国IDを追加します。

```json
{
  "id": "jp",
  "code": "JP",
  "name": "日本",
  "description": "日本の文化・街・食・作品"
}
```

国旗絵文字ではなく2文字の国コードを表示するため、Windowsを含む環境でも同じ見た目になります。

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

YouTube Data API v3は、各国で不足しているジャンルの動画を `data/videos.json` へ補充するために使います。公開ページは静的JSONだけを読むため、閲覧者へAPIキーが送られることはありません。

### 初回設定

1. [Google Cloud Console](https://console.cloud.google.com/)でプロジェクトを作成します。
2. [YouTube Data API v3](https://console.cloud.google.com/apis/library/youtube.googleapis.com)を有効にします。
3. APIキーを作成し、API制限を **YouTube Data API v3** に限定します。
4. GitHubリポジトリの `Settings` → `Secrets and variables` → `Actions` を開きます。
5. `New repository secret` で名前を `YOUTUBE_API_KEY` にし、値へAPIキーを登録します。
6. `Actions` → `Update YouTube catalog` → `Run workflow` を実行します。

APIキーはチャット、HTML、JavaScript、JSON、READMEへ貼り付けないでください。ローカルで同期する場合も、環境変数 `YOUTUBE_API_KEY` から読み込ませます。

```bash
npm run sync:youtube -- --limit=90
```

同期処理は次の条件をすべて満たす動画だけを追加します。

- YouTube上で公開中
- 埋め込み再生が許可されている
- セーフサーチを厳格に指定した検索結果
- 既存カタログと動画IDが重複しない

同期時には既存動画を含めて再生数も更新します。発掘モードはこの値を使い、選択範囲内で再生数が少ない上位25%からランダムに選びます。同じ一本だけに偏らず、埋もれた動画を優先するための方式です。

1回の実行では検索を最大90組に抑えます。現在の不足状況は `npm run coverage` で確認できます。全16か国×22ジャンルが揃ったかを厳密に確認する場合は `npm run validate:coverage` を実行します。GitHub Actionsは毎日1回実行され、不足分だけを追加してコミットします。

APIキーが未設定の間、定期処理は安全にスキップされ、現在の手選定カタログでサイトが動作します。

## 注意事項

- 埋め込み禁止、削除、年齢制限、地域制限などにより再生できない動画は、YouTube側の状態に応じて発生します。その場合は自動的に別の動画を試します。
- 動画の権利と公開条件は各動画・チャンネルの管理者に帰属します。
- TobeTubeはYouTubeの公式サービスではありません。
