/**
 * エックスサーバー アップロード用フォルダ（dist）を作るスクリプト
 *
 *   本番用  :  node build-dist.js            （build.bat をダブルクリック）
 *   検証用  :  node build-dist.js --staging  （build-staging.bat をダブルクリック）
 *
 * dist/ の中身をそのまま公開先のドキュメントルートに置けば公開完了。
 * ・社内資料（HANDOVER.md / SHOOT-LIST.md など）は含めない
 * ・HTML/CSS/JS/PHP から参照されていない画像は含めない（原本はローカルに残る）
 *
 * --staging を付けると検索避けの robots.txt を同梱する。
 * n.saigroupe.com（検証用サブドメイン）へ上げるときは必ずこちらを使うこと。
 * 本番用ビルドには robots.txt は入らない。
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const STAGING = process.argv.includes('--staging');

/* 公開しないファイル・フォルダ */
const EXCLUDE_DIRS = ['dist', 'deck', 'salesphoto', '.git', '.claude', 'node_modules', 'images'];
const EXCLUDE_FILES = [
    'HANDOVER.md', 'SHOOT-LIST.md',   // 社内資料
    'build-dist.js', 'build.bat', 'build-staging.bat',   // このスクリプト自身
    '.nojekyll', '.gitignore',        // GitHub用
    'member1.jpg', 'member2.jpg', 'member3.jpg', 'logo-text.png', // 未使用
];

/* ---------- 1. 公開するテキストファイルを集める ---------- */
const assets = [];   // dist にコピーするファイル（ROOTからの相対パス）
const sources = [];  // 参照解析に使う中身

(function collect(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const abs = path.join(dir, e.name);
        const rel = path.relative(ROOT, abs);
        if (e.isDirectory()) {
            if (!EXCLUDE_DIRS.includes(e.name)) collect(abs);
            continue;
        }
        if (EXCLUDE_FILES.includes(e.name)) continue;
        if (/\.(html|css|js|php)$/i.test(e.name)) {
            sources.push(fs.readFileSync(abs, 'utf8'));
            assets.push(rel);
        } else if (/\.(png|jpe?g|gif|svg|webp|ico|woff2?)$/i.test(e.name)) {
            assets.push(rel);
        }
    }
})(ROOT);

/* ---------- 2. 実際に参照されている画像だけ拾う ---------- */
const allText = sources.join('\n');
const usedImages = [];
let skipped = 0, skippedBytes = 0;

(function collectImages(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const abs = path.join(dir, e.name);
        if (e.isDirectory()) { collectImages(abs); continue; }
        if (allText.includes(e.name)) {
            usedImages.push(path.relative(ROOT, abs));
        } else {
            skipped++;
            skippedBytes += fs.statSync(abs).size;
        }
    }
})(path.join(ROOT, 'images'));

/* ---------- 3. dist を作り直す ---------- */
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

let copied = 0, copiedBytes = 0;
for (const rel of [...assets, ...usedImages]) {
    const src = path.join(ROOT, rel);
    const dst = path.join(DIST, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
    copied++;
    copiedBytes += fs.statSync(src).size;
}

/* ---------- 4. .htaccess ---------- */
/*  ※ 旧WordPressサイト(saigroupe.com)の .htaccess を上書きします。
 *     入れ替え前に必ず既存の .htaccess をダウンロードして保管してください。 */
fs.writeFileSync(path.join(DIST, '.htaccess'), [
    '# ============================================================',
    '#  株式会社SAI 静的サイト用 .htaccess',
    '#  ※ 旧WordPressの .htaccess を置き換えるものです',
    '# ============================================================',
    '',
    '<IfModule mod_rewrite.c>',
    'RewriteEngine On',
    '',
    '# --- 常時SSL（http → https） ---',
    'RewriteCond %{HTTPS} !=on',
    'RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]',
    '',
    '# --- 旧WordPressサイトのURLを新URLへ転送（301） ---',
    '#     検索結果・名刺・求人媒体に残った旧URLを拾うため',
    'RewriteRule ^contact/?$          /contact.html [R=301,L]',
    'RewriteRule ^thanks/?$           /thanks.html [R=301,L]',
    'RewriteRule ^privacy-policy/?$   /privacy.html [R=301,L]',
    'RewriteRule ^service/?$          /#service [R=301,L]',
    'RewriteRule ^vision/?$           /#philosophy [R=301,L]',
    'RewriteRule ^member/?$           /#members [R=301,L]',
    'RewriteRule ^company/?$          /#company [R=301,L]',
    '#     /recruit/ は新サイトにも同じパスがあるため転送不要',
    '',
    '# --- 旧WordPressの残骸へのアクセスを遮断 ---',
    'RewriteRule ^(wp-admin|wp-includes|wp-content|wp-login\\.php|xmlrpc\\.php) - [R=404,L]',
    '</IfModule>',
    '',
    '# 資料系ファイルは公開しない',
    '<FilesMatch "\\.(md|json|bat|log)$">',
    '  Require all denied',
    '</FilesMatch>',
    '',
    '# 文字コード',
    'AddDefaultCharset UTF-8',
    '',
    '# index.php より index.html を優先（WordPress残置時の保険）',
    'DirectoryIndex index.html index.php',
    '',
].join('\n'));

/* ---------- 5. 検証用ビルドなら検索避けを入れる ---------- */
if (STAGING) {
    fs.writeFileSync(path.join(DIST, 'robots.txt'),
        '# 検証用サブドメイン（n.saigroupe.com）専用。本番には絶対に置かないこと。\n' +
        'User-agent: *\n' +
        'Disallow: /\n');
}

const mb = n => (n / 1024 / 1024).toFixed(1) + 'MB';
console.log('');
console.log('dist/ を作成しました。  [' + (STAGING ? '検証用ビルド' : '本番用ビルド') + ']');
console.log('  コピー   : ' + copied + ' ファイル (' + mb(copiedBytes) + ')');
console.log('  除外画像 : ' + skipped + ' ファイル (' + mb(skippedBytes) + ') ※参照なし');
console.log('');

if (STAGING) {
    console.log('  検索避けの robots.txt を同梱しました（Disallow: /）。');
    console.log('');
    console.log('この dist の「中身」を、検証用サブドメインの');
    console.log('  /home/<サーバーID>/saigroupe.com/public_html/n/');
    console.log('にアップロードしてください。  → https://n.saigroupe.com/');
    console.log('');
    console.log('  ※ 本番へ上げるときは build.bat（本番用）で作り直してください。');
    console.log('     このビルドをそのまま本番に置くと検索結果から消えます。');
} else {
    console.log('この dist の「中身」を、本番のドキュメントルート');
    console.log('  /home/<サーバーID>/saigroupe.com/public_html/');
    console.log('にアップロードしてください。  → https://saigroupe.com/');
    console.log('');
    console.log('  ※ 入れ替え前に、既存の .htaccess とWordPress一式の');
    console.log('     バックアップを取ってください（DEPLOY.md フェーズ2）。');
}
