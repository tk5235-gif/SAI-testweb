/**
 * エックスサーバー アップロード用フォルダ（dist）を作るスクリプト
 *
 *   実行:  node build-dist.js      （または build.bat をダブルクリック）
 *
 * dist/ の中身をそのまま公開ドメインのドキュメントルートに置けば公開完了。
 * ・社内資料（HANDOVER.md / SHOOT-LIST.md など）は含めない
 * ・HTML/CSS/JS/PHP から参照されていない画像は含めない（原本はローカルに残る）
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

/* 公開しないファイル・フォルダ */
const EXCLUDE_DIRS = ['dist', 'deck', 'salesphoto', '.git', '.claude', 'node_modules', 'images'];
const EXCLUDE_FILES = [
    'HANDOVER.md', 'SHOOT-LIST.md',   // 社内資料
    'build-dist.js', 'build.bat',     // このスクリプト自身
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

/* ---------- 4. .htaccess（HTTPS強制・社内ファイル遮断） ---------- */
fs.writeFileSync(path.join(DIST, '.htaccess'), [
    '# 常時SSL（http → https）',
    '<IfModule mod_rewrite.c>',
    'RewriteEngine On',
    'RewriteCond %{HTTPS} !=on',
    'RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]',
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
].join('\n'));

const mb = n => (n / 1024 / 1024).toFixed(1) + 'MB';
console.log('dist/ を作成しました。');
console.log('  コピー   : ' + copied + ' ファイル (' + mb(copiedBytes) + ')');
console.log('  除外画像 : ' + skipped + ' ファイル (' + mb(skippedBytes) + ') ※参照なし');
console.log('');
console.log('この dist フォルダの「中身」を、エックスサーバーの');
console.log('  /home/<サーバーID>/<ドメイン>/public_html/');
console.log('にアップロードしてください。');
