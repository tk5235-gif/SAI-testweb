# SAI サイト制作 引き継ぎメモ

最終更新：2026年7月22日 ／ 最新コミット `68b5eaa`

---

## 1. これは何のプロジェクト？

株式会社SAIの **コーポレートサイト** と **採用サイト** を作っています。
静的サイト（HTML / CSS / Vanilla JS）で、ビルド不要。GitHub Pages で公開中。

| 項目 | 内容 |
|---|---|
| 作業フォルダ | `C:\Users\takoy\Projects\Claud\sai-redesign` |
| GitHubリポジトリ | `https://github.com/tk5235-gif/SAI-testweb`（ブランチ `main`） |
| 公開URL | `https://tk5235-gif.github.io/SAI-testweb/` |
| 採用サイト | `https://tk5235-gif.github.io/SAI-testweb/recruit/index.html` |
| お問い合わせ | `https://tk5235-gif.github.io/SAI-testweb/contact.html` |

> ⚠️ 以前は `OneDrive\デスクトップ\SAI-testweb` から公開していましたが、**今はこのフォルダが唯一の公開元**です。OneDrive側の旧フォルダはもう使いません（中身は古いまま放置）。

---

## 2. ファイル構成

```
sai-redesign/
├ index.html         コーポレートTOP
├ contact.html       お問い合わせ（フォーム）
├ privacy.html       プライバシーポリシー
├ style.css          コーポレート用（ダークテーマ・約2000行）
├ script.js          両サイト共通のJS
├ images/
│  ├ hero/           HERO写真（hero1〜4.jpg ※現在コーポレートでは未使用）
│  ├ members/        メンバー写真（itou / yoshinaga / fujihira / manabe）
│  ├ corp-hero.jpg   コーポレートHERO背景（モノトーン3D）
│  └ recruit-hero.jpg 採用HERO背景（アイソメトリックのイラスト）
├ member1〜3.jpg     採用サイトで使用中の人物写真
├ salesphoto/        高解像度の原本（.gitignore で除外・デプロイ対象外）
├ recruit/
│  ├ index.html      採用TOP
│  ├ about.html      SAIとは
│  ├ jobs.html       仕事について
│  ├ work-style.html 働き方（営業／CS／広告戦略の3タブ）
│  ├ interview.html  社員インタビュー
│  ├ entry.html      エントリー（フォーム）
│  ├ privacy.html    プライバシーポリシー
│  └ recruit.css     採用サイト用（ライトテーマ）
└ deck/              PowerPoint生成プロジェクト（サイトとは無関係・.gitignoreで除外）
```

---

## 3. デザインの決めごと

### コーポレート（ダーク）
- ベース `#141B2E` の濃紺。背景に **3層の動き**（オーロラのドリフト → 星のきらめき → 粒子アニメ）
- セクション背景は半透明（0.56〜0.62）にして背景の動きを透かす
- 和文＝Shippori Mincho（明朝）／英字＝Cormorant Garamond
- アクセント：赤 `#D30037`（CTA・ラベル）＋ ゴールド `#E9B872`（章番号・数値・キッカー）

### 採用（ライト）
- ベース `#F4F6FB`、ブランド赤 `#E5103C`
- 和文＝Zen Kaku Gothic Antique／英字＝Cormorant Garamond（**2書体のみ**。明朝は使わない）
- 部署ごとの差し色クラス：`.a-red` `.a-blue` `.a-green` `.a-gold` `.a-purple`

### 共通
- ハンバーガーメニューは**CSSのみのチェックボックス方式**（`#menu-toggle:checked ~ .menu`）。全10ページ同じ構造で、ヘッダー内に `menu-wrapper` が入っている
- ⚠️ ヘッダーに `backdrop-filter` を付けてはいけない（内部の固定要素の基準がずれてメニューが壊れる）

---

## 4. 掲載しているメンバー（実名）

| 氏名 | 所属 | 写真 |
|---|---|---|
| 伊藤 義将 | 営業部 マネージャー | `images/members/itou.jpg` |
| 吉永 友太郎 | 営業部 | `images/members/yoshinaga.jpg` |
| 藤平 勇太 | 広告運用部 マネージャー | `images/members/fujihira.jpg` |
| 真辺 匠 | 事業開発部 マネージャー | `images/members/manabe.jpg` |
| 五十嵐 愛良 / 城之内 健 / 藤倉 佑太 / 根岸 悠河 | 各部メンバー | 写真なし（PHOTOプレースホルダー） |

採用サイトのインタビュー3名は **藤平（在籍10年）／真辺（8年）／青木 友也（2年）**。
テーマは「なぜ、SAIだったのか」＝入社理由。

> 写真は `salesphoto/` の高解像度原本から `sharp`（`deck/node_modules` にある）で切り出し・圧縮しています。

---

## 5. 作業の進め方

### 変更を反映する
```bash
cd "C:/Users/takoy/Projects/Claud/sai-redesign"
git add -A
git commit -m "変更内容"
git push
```
push後、数分でGitHub Pagesに反映。確認は **Ctrl + Shift + R**（スーパーリロード）。

### ローカルプレビュー
`.claude/launch.json` に `static` という設定があり、`npx serve` でポート5180に立ち上がります。

> ⚠️ ローカルの `serve` はクリーンURL（`/recruit`）で配信するため、**採用サイトのCSSパスが外れる**ことがあります。その場合はブラウザ上で `link.href = '/recruit/recruit.css?v=' + Date.now()` に差し替えて確認してください。

### 画像を追加してもらうとき
チャットに画像を貼っても**ファイルとしては保存されません**。必ず `salesphoto/` などに保存してもらってから作業します。

---

## 6. 未完了・今後やれること

- [ ] メンバー4名（五十嵐・城之内・藤倉・根岸）の**写真が未撮影**（現在プレースホルダー）
- [ ] インタビュー本文は**サンプル内容**。実取材で差し替え予定（ページ内に注記あり）
- [ ] 採用サイト `jobs.html` の「バックオフィス／マーケティング／事業開発」は**働き方ページが未作成**（「準備中」表示）
- [ ] フォーム送信が **mailto方式**（メーラーが開く）。Formspree等に変えると直接受信できる
- [ ] `SHOOT-LIST.md` に撮影指示書あり。環境カット・オフィス写真が撮れたら差し込める
- [ ] `images/hero/hero1〜4.jpg` は現在どこからも参照されていない（コーポレートHEROを1枚背景にしたため）

---

## 7. 注意点（ハマりどころ）

1. **クラス名の衝突に注意** — 過去に `.r-people` を新規セクションで再利用してしまい、既存の「平均年齢／男女比」カードのレイアウトが崩れました。新しいクラスを足すときは既存を `grep` で確認する
2. **CSSの後方上書き** — `style.css` は修正を追記で重ねているため、同じセレクタが複数箇所にあります。`!important` 付きの後方ルールが勝つケースが多いので、変更前に全出現箇所を確認する
3. **プレビューが固まる** — スクリーンショットがタイムアウトすることが頻繁にあります。その場合は `javascript_tool` で `getBoundingClientRect()` などを使い数値で検証すれば確実です
4. **`salesphoto/` と `deck/` は `.gitignore` 済み** — デプロイ対象外なので消さないよう注意（原本の保管場所）
