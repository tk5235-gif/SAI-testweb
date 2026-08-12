# 株式会社SAI サイトリニューアル｜リリース引き継ぎ資料

> 公開作業を担当いただく方向けの技術資料です。
> **想定作業時間：0.5〜1人日**（調査・環境構築は完了済みのため）
> 最終更新：2026-08-12

---

## 1. これは何か

株式会社SAIの**コーポレートサイト＋採用サイト**（全12ページ）を新規制作したもの。
現在 `saigroupe.com` で稼働中の**WordPressサイトを、この静的サイトに入れ替える**のがゴールです。

| 項目 | 内容 |
|---|---|
| 技術構成 | 静的HTML / CSS / Vanilla JS。**ビルドツール・フレームワーク不使用** |
| サーバー側処理 | `send.php` 1本のみ（メールフォーム） |
| 依存関係 | **なし**（npm install 不要。CDN依存もGoogle Fontsのみ） |
| データベース | **不要** |
| リポジトリ | https://github.com/tk5235-gif/SAI-testweb （public / `main`） |
| 検証環境 | https://tk5235-gif.github.io/SAI-testweb/ （GitHub Pages） |

**要点：ビルドが要らないので、ファイルを置けば動きます。**

---

## 2. サーバー環境（調査済み・作業不要）

外部から確認済みの事実です。**以下はすべて設定済みのため、作業は発生しません。**

| 項目 | 状態 |
|---|---|
| ホスティング | エックスサーバー `sv16335.xserver.jp` |
| ドメイン | `saigroupe.com`（**サーバーパネルに登録済み**） |
| ネームサーバー | `ns1〜ns5.xserver.jp`（**変更不要・DNS待ち時間なし**） |
| SSL | **発行済み**（`https://` でアクセス可） |
| メール | MX・SPFともエックスサーバー（`v=spf1 +a:sv16335.xserver.jp ... include:spf.sender.xserver.jp ~all`） |
| 検証用サブドメイン | `stg.saigroupe.com` **作成済み・SSL発行済み・中身は空** |
| 現行サイト | WordPress 7.0.3（`public_html` 直下） |

> ⚠️ サーバーパネルの「**ドメイン削除**」は押さないこと。ファイルとメールが消えます。

### 現行WordPressの公開ページ（9件）

`/` `/thanks/` `/contact/` `/privacy-policy/` `/recruit/` `/service/` `/vision/` `/member/` `/company/`

---

## 3. 納品物

### 3-1. リポジトリ（ソース一式）

```
https://github.com/tk5235-gif/SAI-testweb
```

主要ファイルの構成です。

```
sai-redesign/
├─ index.html            コーポレート トップ
├─ contact.html          お問い合わせ（フォーム）
├─ privacy.html          プライバシーポリシー
├─ thanks.html           送信完了
├─ style.css             コーポレート用（ダークテーマ）
├─ script.js             共通JS（フォーム検証・アニメ）
├─ send.php              ★メールフォーム処理（唯一のサーバーサイド）
├─ favicon.png / logo-mark.png
├─ images/               公開画像 32点（og-image.jpg 含む）
├─ recruit/              採用サイト
│   ├─ index.html  about.html  jobs.html  work-style.html
│   ├─ interview.html  entry.html（フォーム）  thanks.html  privacy.html
│   └─ recruit.css       採用用（ライトテーマ）
│
├─ build-dist.js         ★公開用フォルダ生成スクリプト
├─ build.bat             本番用ビルド（ダブルクリック実行）
├─ build-staging.bat     検証用ビルド（検索避けrobots.txt入り）
├─ DEPLOY.md             公開手順書（詳細版）
└─ RELEASE-HANDOVER.md   本ファイル
```

### 3-2. 公開用パッケージ

`build.bat`（または `node build-dist.js`）を実行すると生成されます。

| 生成物 | 内容 |
|---|---|
| `dist/` | **公開対象ファイルのみ** 49ファイル / 2.1MB |
| `dist.zip` | 同内容のZIP 1.6MB。ファイルマネージャからのアップロード用 |

**このスクリプトが自動でやっていること**

- 社内資料（`DEPLOY.md` `HANDOVER.md` `SHOOT-LIST.md` `RELEASE-HANDOVER.md` 等）を除外
- HTML/CSS/JS/PHPから**参照されていない画像 29点 24.4MB を除外**（原本はリポジトリに残る）
- `.htaccess` を生成（常時SSL＋旧URL301リダイレクト＋WordPress残骸の遮断）
- `dist.zip` を生成（**フォルダ区切りを `/` で書き込むLinux互換ZIP**。`.htaccess` を含む）

> `dist/` `dist.zip` は `.gitignore` 済み。毎回まるごと作り直されます。
> PowerShellの `Compress-Archive` は区切り文字を `\` で書き込みLinux側で構造が壊れるため、
> `ZipArchive` で明示的に `/` を書いています（検証済み：50エントリ／バックスラッシュ0件）。

---

## 4. メールフォーム仕様（`send.php`）

`contact.html` と `recruit/entry.html` の両方が、`formType` を付けて `send.php` にPOSTします。

### 設定箇所（冒頭のCONFIGブロックのみ）

```php
$TO_ADDRESS   = 'info@saigroupe.com';   // 受信先（カンマ区切りで複数可）
$FROM_ADDRESS = 'info@saigroupe.com';   // 差出人。★必ず saigroupe.com のアドレス
$AUTO_REPLY   = true;                   // 送信者への自動返信
```

### 実装内容

| 項目 | 実装 |
|---|---|
| 送信 | `mb_send_mail()`。`mb_language('uni')` でUTF-8のまま送信 |
| 文字化け対策 | `Content-Type` / `Content-Transfer-Encoding` は**あえて自前で付けない**（`mb_send_mail` が付与するため、二重指定すると化ける） |
| 返信先 | `Reply-To` に送信者アドレス。受信メールに返信すると本人に届く |
| エンベロープ | 第5引数 `-f$FROM_ADDRESS` |
| サーバー側検証 | 必須項目・メール形式を再検証（クライアント検証と同条件） |
| ヘッダインジェクション | 1行項目から改行を除去、不正UTF-8バイト列は破棄 |
| スパム対策 | ハニーポット `_hp` ＋ 表示から送信までの経過秒 `_ts`（3秒未満を拒否） |
| 二重送信防止 | PRGパターン（303リダイレクト）＋ 送信ボタン disabled |
| 完了ページ | `thanks.html` / `recruit/thanks.html` |
| エラー時 | ブランドカラーのエラーページを表示し、入力画面に戻るリンクを出す |

### ⚠️ 未検証（最重要）

**`send.php` は一度も実行されていません。** 制作環境にPHPが無く、構文チェック・動作確認とも未実施です。
**リリース前に実送信テストが必須**です。確認項目は §7 を参照。

---

## 5. 公開手順

### 5-1. フェーズ1：検証（`stg.saigroupe.com`）

サブドメイン・SSLとも作成済み、**中身が空の状態**です。

1. `build-staging.bat` を実行 → `dist.zip` 生成（検索避け `robots.txt` 入り）
2. ファイルマネージャ（`https://secure.xserver.ne.jp/xapanel/login/xserver/ftp/`／FTPアカウントでログイン）
   または任意のFTPクライアントで `public_html/stg/` へ配置
3. `https://stg.saigroupe.com/` で §7 の確認

### 5-2. フェーズ2：本番切替

1. **バックアップ**：`public_html` 全ファイル（`.htaccess` `wp-config.php` `wp-content/` 必須）＋ phpMyAdminでDBエクスポート
2. WordPress一式を `public_html/_wp_old/` へ**移動**（削除しない。DBも残す）
3. `build.bat`（本番用）を実行 → `dist.zip` 生成（`robots.txt` は入らない）
4. `public_html/` 直下へ配置
5. §7 の確認 ＋ 旧URLリダイレクトの動作確認

**ロールバック：** `_wp_old/` の中身を戻すだけ。DBを消していなければ完全に復旧します。

### 5-3. 旧URL → 新URL 対応表（`.htaccess` に実装済み）

| 旧URL | 新URL | 方式 |
|---|---|---|
| `/contact/` | `/contact.html` | 301 |
| `/thanks/` | `/thanks.html` | 301 |
| `/privacy-policy/` | `/privacy.html` | 301 |
| `/service/` | `/#service` | 301 |
| `/vision/` | `/#philosophy` | 301 |
| `/member/` | `/#members` | 301 |
| `/company/` | `/#company` | 301 |
| `/recruit/` | `/recruit/` | **同一パス**のため転送不要 |

`wp-admin` `wp-includes` `wp-content` `wp-login.php` `xmlrpc.php` は404で遮断しています。

---

## 6. 確認・判断をお願いしたい事項

| # | 内容 | 判断者 |
|---|---|---|
| 1 | **`info@saigroupe.com` のメールアカウントが実在するか**未確認。無ければ作成が必要（SPF的に差出人は独自ドメイン必須） | サーバー管理者 |
| 2 | **PHPバージョン**の確認（`send.php` はPHP 8系想定） | サーバー管理者 |
| 3 | **インタビュー記事4本が実取材ではない**。実在の社員名にこちらで作成した発言が紐づいた状態。社外公開前に本人確認が必要 | 発注者 |
| 4 | 採用トップ「人を知る」が**3名のまま**で、インタビューページの4名と不一致 | 発注者 |
| 5 | 切替タイミング（アクセスの少ない早朝・深夜を推奨） | 発注者 |
| 6 | リポジトリが**個人アカウント配下**。中長期的には会社Orgへの移管を推奨 | 発注者 |

---

## 7. リリース前チェックリスト

### 表示

- [ ] 全12ページの表示崩れ・画像切れなし
- [ ] スマホ実機で全ページ確認
- [ ] 横スクロールが発生しない

### フォーム ★最重要（未検証のため必ず実施）

- [ ] お問い合わせ送信 → `thanks.html` へ遷移
- [ ] エントリー送信 → `recruit/thanks.html` へ遷移
- [ ] `info@saigroupe.com` に受信できる
- [ ] 送信者に自動返信が届く
- [ ] **メール本文・件名が文字化けしていない**
- [ ] 受信メールに返信すると宛先が送信者本人になる
- [ ] 迷惑メールフォルダに入っていない
- [ ] 未入力での送信がサーバー側でも弾かれる
- [ ] 完了ページでリロードしても二重送信されない

### 切替後

- [ ] 旧URL7本すべてが301で転送される
- [ ] `http://` → `https://` へ転送される
- [ ] `https://saigroupe.com/recruit/` が採用サイトになっている
- [ ] `dist.zip` をサーバー上に残していない
- [ ] `robots.txt` が本番に**存在しない**（検証用ビルドの混入チェック）
- [ ] SNSでOGP画像が表示される
- [ ] Google Search Console にサイトマップを登録

---

## 8. 補足：制作時に踏んだ落とし穴

同じ作業をする際の参考として記録します。

- **`git push` ＝ 公開ではない。** GitHub Pagesのデプロイが `cancelled` で失敗し、9時間気づかず本番が古いままだった事例あり。反映確認は Actions APIの `pages build and deployment` の conclusion か、ライブHTMLの `Last-Modified` で行う。
- **エックスサーバーへの反映は `git push` では起きない。** ビルド＋アップロードが必要。
- **日本語を含む `.bat` と `chcp 65001` は併用不可。** cmdが行をバイト単位で読み直すため解釈がずれ、`echo` 行がコマンドとして実行される。bat側の文言はASCIIのみにしてある。
- **`Compress-Archive` のZIPはLinuxで壊れる**（区切り文字が `\`）。§3-2 参照。
- **サブドメイン入力欄はドットの手前だけ。** `stg.` と入れるとエラーになる。
- `style.css` / `recruit.css` は追記積み重ねで同セレクタが複数箇所＋`!important` 多数。変更時は全出現箇所を確認のこと。

---

## 9. 連絡事項

- 本資料と `DEPLOY.md`（手順の詳細版）はリポジトリ内にあります。`dist` には含まれないため公開されません。
- `HANDOVER.md` と `SHOOT-LIST.md` は**制作初期の資料で内容が古い**ので参照しないでください。
