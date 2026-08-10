<?php
/* ============================================================
   株式会社SAI お問い合わせ／エントリー 送信処理（エックスサーバー用）
   contact.html と recruit/entry.html の両方からPOSTを受ける。
   ------------------------------------------------------------
   ▼設定はこの CONFIG ブロックだけ変更すればOK
   ============================================================ */

// 受信先アドレス（複数の場合はカンマ区切り）
$TO_ADDRESS   = 'info@saigroupe.com';
// 送信元アドレス。★必ず「独自ドメインのアドレス」にすること。
//   他社ドメイン(gmail等)を差出人にすると、なりすまし判定で迷惑メール行きになります。
$FROM_ADDRESS = 'info@saigroupe.com';
$FROM_NAME    = '株式会社SAI Webサイト';
// 応募者・問い合わせ者への自動返信を送るか
$AUTO_REPLY   = true;

/* ============================================================
   ここから下は通常変更不要
   ============================================================ */

mb_internal_encoding('UTF-8');
mb_language('uni');

// --- POST以外は入口へ戻す ---
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Location: index.html', true, 303);
    exit;
}

/** POST値を取り出して整形（制御文字・前後空白を除去） */
function field($key) {
    $v = $_POST[$key] ?? '';
    if (!is_string($v)) return '';
    if (!mb_check_encoding($v, 'UTF-8')) return '';   // 不正なバイト列は捨てる
    $v = str_replace(["\r\n", "\r"], "\n", $v);
    $stripped = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v);
    return trim($stripped === null ? $v : $stripped);
}

/** ヘッダインジェクション対策：1行項目に改行を含ませない */
function oneline($v) {
    $r = preg_replace('/\s+/u', ' ', $v);
    return trim($r === null ? $v : $r);
}

// --- スパム対策1：ハニーポット（人間には見えない項目・入っていたら破棄） ---
if (field('_hp') !== '') {
    header('Location: index.html', true, 303);
    exit;
}

// --- スパム対策2：極端に速い送信を弾く（bot対策） ---
$started = (int) field('_ts');
if ($started > 0 && (time() - $started) < 3) {
    error_page('送信が速すぎます。お手数ですが、もう一度お試しください。');
}

$type = field('formType') === 'entry' ? 'entry' : 'contact';

/* ---------- 入力チェック（クライアント側と同じ条件をサーバーでも検証） ---------- */
$errors = [];
$name    = oneline(field('name'));
$email   = oneline(field('email'));
$tel     = oneline(field('tel'));
$message = field('message');
$agree   = field('agree');

if ($name === '')    $errors[] = 'お名前が未入力です。';
if ($email === '')   $errors[] = 'メールアドレスが未入力です。';
elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'メールアドレスの形式が正しくありません。';
if ($message === '') $errors[] = ($type === 'entry' ? '志望動機・自己PR' : 'お問い合わせ内容') . 'が未入力です。';
if ($agree === '')   $errors[] = 'プライバシーポリシーへの同意が必要です。';

if ($type === 'entry') {
    $kana   = oneline(field('kana'));
    $job    = oneline(field('job'));
    $status = oneline(field('status'));
    if ($job === '') $errors[] = '希望職種が未選択です。';

    $subject   = "【エントリー／{$job}】{$name}";
    $body      = "お名前：{$name}\n"
               . "ふりがな：{$kana}\n"
               . "メール：{$email}\n"
               . "電話：{$tel}\n"
               . "希望職種：{$job}\n"
               . "現在の状況：{$status}\n\n"
               . "【志望動機・自己PR】\n{$message}\n";
    $thanks    = 'recruit/thanks.html';
    $backTo    = 'recruit/entry.html';
    $replySbj  = '【株式会社SAI】エントリーを受け付けました';
    $replyLead = "この度は株式会社SAIへご応募いただき、誠にありがとうございます。\n以下の内容でエントリーを受け付けました。\n担当より、3営業日以内にご連絡いたします。";
} else {
    $company = oneline(field('company'));
    $kind    = oneline(field('type'));
    if ($kind === '') $errors[] = 'お問い合わせ種別が未選択です。';

    $subject   = "【お問い合わせ／{$kind}】{$name}";
    $body      = "お名前：{$name}\n"
               . "会社名：{$company}\n"
               . "メール：{$email}\n"
               . "電話：{$tel}\n"
               . "種別：{$kind}\n\n"
               . "【お問い合わせ内容】\n{$message}\n";
    $thanks    = 'thanks.html';
    $backTo    = 'contact.html';
    $replySbj  = '【株式会社SAI】お問い合わせを受け付けました';
    $replyLead = "この度は株式会社SAIへお問い合わせいただき、誠にありがとうございます。\n以下の内容で受け付けました。\n担当より順次ご返信いたしますので、今しばらくお待ちください。";
}

if ($errors) {
    error_page(implode('<br>', array_map('htmlspecialchars', $errors)), $backTo);
}

/* ---------- 受信メールの送信 ---------- */
$body .= "\n----------------------------------------\n"
       . "送信日時：" . date('Y-m-d H:i:s') . "\n"
       . "送信元IP：" . ($_SERVER['REMOTE_ADDR'] ?? '-') . "\n"
       . "ページ　：" . oneline($_SERVER['HTTP_REFERER'] ?? '-') . "\n";

// Content-Type / Content-Transfer-Encoding は mb_send_mail が付与するため、ここでは指定しない
// （二重に付くとメールソフトによって本文が文字化けする）
$fromHeader = mb_encode_mimeheader($FROM_NAME, 'UTF-8') . " <{$FROM_ADDRESS}>";
$headers = implode("\r\n", [
    'From: ' . $fromHeader,
    'Reply-To: ' . $email,          // 返信すると送信者本人に届く
]);

$sent = mb_send_mail($TO_ADDRESS, $subject, $body, $headers, '-f' . $FROM_ADDRESS);

if (!$sent) {
    error_page(
        '送信処理でエラーが発生しました。<br>お手数ですが、時間をおいて再度お試しいただくか、'
        . htmlspecialchars($TO_ADDRESS) . ' まで直接ご連絡ください。',
        $backTo
    );
}

/* ---------- 自動返信 ---------- */
if ($AUTO_REPLY) {
    $replyBody = "{$name} 様\n\n{$replyLead}\n\n"
               . "----------------------------------------\n"
               . $body
               . "----------------------------------------\n\n"
               . "※本メールは送信専用の自動返信です。\n"
               . "　ご返信いただいてもお答えできない場合があります。\n\n"
               . "株式会社SAI\n"
               . "東京都渋谷区道玄坂\n"
               . "{$TO_ADDRESS}\n";
    $replyHeaders = implode("\r\n", [
        'From: ' . $fromHeader,
        'Reply-To: ' . $TO_ADDRESS,
    ]);
    @mb_send_mail($email, $replySbj, $replyBody, $replyHeaders, '-f' . $FROM_ADDRESS);
}

/* ---------- 完了ページへ（リロードでの二重送信を防ぐPRGパターン） ---------- */
header('Location: ' . $thanks, true, 303);
exit;


/* ---------- エラー表示 ---------- */
function error_page($msg, $backTo = 'index.html') {
    http_response_code(400);
    header('Content-Type: text/html; charset=UTF-8');
    echo '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">'
       . '<meta name="viewport" content="width=device-width,initial-scale=1">'
       . '<meta name="robots" content="noindex">'
       . '<title>送信できませんでした | 株式会社SAI</title>'
       . '<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;'
       . 'background:#141B2E;color:#F2F4F8;font-family:"Zen Kaku Gothic Antique","Hiragino Sans",sans-serif;padding:24px;}'
       . '.b{max-width:560px;text-align:center;line-height:2;}h1{font-size:20px;color:#E9B872;margin:0 0 20px;}'
       . 'a{display:inline-block;margin-top:28px;padding:14px 32px;border:1px solid #D30037;color:#F2F4F8;'
       . 'text-decoration:none;border-radius:2px;}a:hover{background:#D30037;}</style></head><body><div class="b">'
       . '<h1>送信できませんでした</h1><p>' . $msg . '</p>'
       . '<a href="' . htmlspecialchars($backTo) . '">入力画面に戻る</a>'
       . '</div></body></html>';
    exit;
}
