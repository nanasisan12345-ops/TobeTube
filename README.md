# TobeTube

公開サイト: [https://nanasisan12345-ops.github.io/TobeTube/](https://nanasisan12345-ops.github.io/TobeTube/)

国とジャンルからYouTube動画をランダムに選べる動画発掘サイトです。

最初に16か国から国を選び、人気動画を優先する通常モード、または再生数の少ない動画を優先する「発掘モード」を利用できます。どちらも「すべてのジャンル」または22の個別ジャンルを選べます。お気に入り、最近見た動画、共有リンク、ライト／ダークテーマにも対応しています。

国を選ぶと、ページ全体がその国の主要言語へ切り替わります。日本語、韓国語、英語、フランス語、イタリア語、ヒンディー語、ポルトガル語、ドイツ語、スペイン語、タイ語、インドネシア語、ベトナム語に対応しています。

## 最初に知っておくこと

- サイトの閲覧・再生にYouTube APIキーは不要です。
- 再生にはYouTube公式の **IFrame Player API** を使っています。
- 動画カタログの自動補充には **YouTube Data API v3** を使います。キーは公開ページへ置かず、GitHub ActionsのSecretだけから読み込みます。
- 国は `data/countries.json`、動画情報は `data/videos.json`、ジャンルは `data/genres.json` で管理します。
- 操作順は「国を選ぶ → 通常または発掘モードを選ぶ → ジャンルカードを押してすぐ再生」です。別の再生開始ボタンはありません。
- 通常モードは、発掘専用候補を除いた国とジャンルの中で、再生数が多い上位25%の人気動画を優先します。
- 発掘モードは、YouTube Data APIで新着順に別収集した候補を再生数の少ない順に選別し、その専用候補を最優先します。専用候補がまだない国・ジャンルでは、既存候補の再生数下位25%へ切り替わります。視聴履歴と直前ジャンルは、低再生数候補内で重複を避けるためだけに使います。
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

YouTube Data API v3は、16か国×22ジャンルの大規模なランダム候補プールを自動収集するために使います。公開ページは自動収集済みの静的JSONだけを読むため、閲覧者へAPIキーが送られることはありません。

### 初回設定

1. [Google Cloud Console](https://console.cloud.google.com/)でプロジェクトを作成します。
2. [YouTube Data API v3](https://console.cloud.google.com/apis/library/youtube.googleapis.com)を有効にします。
3. APIキーを作成し、API制限を **YouTube Data API v3** に限定します。
4. GitHubリポジトリの `Settings` → `Secrets and variables` → `Actions` を開きます。
5. `New repository secret` で名前を `YOUTUBE_API_KEY` にし、値へAPIキーを登録します。
6. `Actions` → `Update YouTube catalog` → `Run workflow` を実行します。

APIキーはチャット、HTML、JavaScript、JSON、READMEへ貼り付けないでください。ローカルで同期する場合も、環境変数 `YOUTUBE_API_KEY` から読み込ませます。

```bash
npm run sync:youtube -- --limit=50 --target-count=50 --discovery-limit=45 --discovery-target-count=12
```

同期処理は次の条件をすべて満たす動画だけを追加します。

- YouTube上で公開中
- 埋め込み再生が許可されている
- セーフサーチを厳格に指定した検索結果
- 既存カタログと動画IDが重複しない

通常候補は、目標の50本より動画が少ない国×ジャンルを本数の少ない順で関連度検索し、1検索につき条件を満たす最大50本を追加します。

発掘候補は通常候補と別に新着順で最大50件を検索し、詳細APIで各動画の再生数を取得して、再生数の少ない順に最大12本を `discovery: true` として追加します。YouTube APIには再生数の少ない順の検索指定がないため、「新着候補を取得 → 再生数を照合 → 少ない順に保存」の順で処理します。既存動画の再生数も同期時に更新します。

検索途中でYouTube APIの日次上限へ達した場合も、エラー直前までに取得できた候補を保存してコミットします。

1回の実行では通常検索を最大50組、発掘検索を最大45組、合計95組に抑えます。GitHub ActionsはYouTube APIの日次上限がリセットされた後、毎日17時17分ごろ（日本時間）に実行され、候補が少ない組み合わせから自動的に追加してコミットします。`--limit=0` を指定すれば発掘検索だけを実行できます。手動実行では `country` と `genre` を指定して、たとえば日本だけを優先的に増やすこともできます。現在の0本の組み合わせは `npm run coverage` で確認できます。

APIキーが未設定の間、定期処理は安全にスキップされ、現在の手選定カタログでサイトが動作します。

## 注意事項

- 埋め込み禁止、削除、年齢制限、地域制限などにより再生できない動画は、YouTube側の状態に応じて発生します。その場合は自動的に別の動画を試します。
- 動画の権利と公開条件は各動画・チャンネルの管理者に帰属します。
- TobeTubeはYouTubeの公式サービスではありません。
