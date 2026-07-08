<?php
/**
 * Mayamak iletişim / teklif formu endpoint'i.
 * POST /contact.php — JSON yanıt döner.
 */
declare(strict_types=1);

ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

use PHPMailer\PHPMailer\PHPMailer;

// ─── Yol sabitleri ───────────────────────────────────────────────────────────
define('CONTACT_ROOT', __DIR__);
define('CONTACT_CONFIG', CONTACT_ROOT . '/config/contact-config.php');
define('PATH_RATE_LIMIT', CONTACT_ROOT . '/data/rate-limit.json');
define('PATH_BOT_ATTEMPTS', CONTACT_ROOT . '/data/bot-attempts.json');
define('PATH_LOG_REQUESTS', CONTACT_ROOT . '/logs/contact-requests.json');
define('PATH_LOG_ERRORS', CONTACT_ROOT . '/logs/contact-errors.json');
define('PATH_LOG_ALERTS', CONTACT_ROOT . '/logs/security-alerts.json');

// ─── PHPMailer yükleme (Composer veya manuel) ────────────────────────────────
$composerAutoload = CONTACT_ROOT . '/vendor/autoload.php';
if (is_file($composerAutoload)) {
    require $composerAutoload;
} else {
    require CONTACT_ROOT . '/vendor/PHPMailer/src/Exception.php';
    require CONTACT_ROOT . '/vendor/PHPMailer/src/PHPMailer.php';
    require CONTACT_ROOT . '/vendor/PHPMailer/src/SMTP.php';
}

// ─── Yapılandırma ─────────────────────────────────────────────────────────────
if (!is_file(CONTACT_CONFIG)) {
    respondJson(500, false, 'Şu anda talebiniz alınamadı. Lütfen daha sonra tekrar deneyin.');
}

/** @var array<string, mixed> $config */
$config = require CONTACT_CONFIG;

// ─── CORS (sadece izin verilen origin'ler) ───────────────────────────────────
$allowedOrigins = $config['allowed_origins'] ?? [];
$requestOrigin  = $_SERVER['HTTP_ORIGIN'] ?? '';

if ($requestOrigin !== '' && in_array($requestOrigin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $requestOrigin);
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respondJson(405, false, 'Geçersiz istek yöntemi.');
}

header('Content-Type: application/json; charset=utf-8');

// ─── İstek bağlamı ───────────────────────────────────────────────────────────
$ip        = getClientIp();
$userAgent = trim($_SERVER['HTTP_USER_AGENT'] ?? '');
$now       = time();
$today     = date('Y-m-d', $now);
$riskScore = 0;

if ($ip === null) {
    logError(['type' => 'invalid_ip', 'ip_raw' => $_SERVER['REMOTE_ADDR'] ?? '']);
    respondJson(400, false, 'Geçersiz istek.');
}

// Origin / Referer kontrolü (CSRF benzeri)
$originCheck = validateOriginOrReferer($allowedOrigins);
if (!$originCheck['valid']) {
    $riskScore += 2;
}
if (!$originCheck['present']) {
    $riskScore += 1;
}

if ($userAgent === '') {
    $riskScore += 2;
}

// ─── Gövde ayrıştırma (JSON veya form-urlencoded) ────────────────────────────
$input = parseRequestBody();

$name      = cleanInput($input['name'] ?? '');
$firstName = cleanInput($input['first_name'] ?? '');
$lastName  = cleanInput($input['last_name'] ?? '');
$email   = strtolower(cleanInput($input['email'] ?? ''));

if ($firstName === '' && $lastName === '' && $name !== '') {
    $parts = preg_split('/\s+/u', $name, 2) ?: [];
    $firstName = $parts[0] ?? '';
    $lastName  = $parts[1] ?? '';
}

$lastNameUpper = $lastName !== '' ? mb_strtoupper($lastName, 'UTF-8') : '';
if ($firstName !== '' || $lastNameUpper !== '') {
    $name = trim($firstName . ($lastNameUpper !== '' ? ' ' . $lastNameUpper : ''));
}
$phone   = cleanInput($input['phone'] ?? '');
$company = cleanInput($input['company'] ?? '');
$subject = cleanInput($input['subject'] ?? '');
$message = cleanInput($input['message'] ?? '');
$website = cleanInput($input['website'] ?? ''); // honeypot

$phoneDial         = preg_replace('/\D+/', '', cleanInput($input['phone_dial'] ?? '')) ?? '';
$phoneCountryIso   = strtoupper(cleanInput($input['phone_country_iso'] ?? ''));
$phoneCountryName  = cleanInput($input['phone_country'] ?? '');
$phoneE164         = cleanInput($input['phone_e164'] ?? '');
$companyCountryIso = strtoupper(cleanInput($input['company_country_iso'] ?? ''));
$companyCountryName = cleanInput($input['company_country'] ?? '');

$phoneNational = stripLeadingZero(normalizePhone($phone));
$phoneDigits   = $phoneDial !== '' ? ($phoneDial . $phoneNational) : $phoneNational;

// Ülke adlarını ISO'dan tamamla (istemci manipülasyonuna karşı)
$phoneMeta = resolveCountryMeta($phoneCountryIso, $phoneDial, $phoneCountryName);
$phoneCountryIso  = $phoneMeta['iso'];
$phoneDial        = $phoneMeta['dial'] !== '' ? $phoneMeta['dial'] : $phoneDial;
$phoneCountryName = $phoneMeta['name'];
$phoneE164        = $phoneDial !== '' && $phoneNational !== ''
    ? ('+' . $phoneDial . $phoneNational)
    : $phoneE164;

$companyMeta = resolveCountryMeta($companyCountryIso, '', $companyCountryName);
$companyCountryIso  = $companyMeta['iso'];
$companyCountryName = $companyMeta['name'];

// ─── Honeypot: bot — sahte başarı döndür, mail gönderme ─────────────────────
if ($website !== '') {
    $attempt = [
        'ts'         => $now,
        'type'       => 'honeypot_blocked',
        'ip'         => $ip,
        'user_agent' => $userAgent,
        'email'      => $email,
        'phone'      => $phoneDigits,
        'risk_score' => $riskScore,
    ];

    logError($attempt);
    recordFailedAttempt($ip, $now);
    recordBotAttempt($ip, $attempt);
    checkSecurityAlert($ip, $userAgent, $email, $phoneDigits, 'honeypot_blocked', $config);

    respondJson(200, true, 'Teklif talebiniz alınmıştır.');
}

// ─── Başarısız deneme limiti (IP / saat) ─────────────────────────────────────
if (isFailedRateLimited($ip, $config, $now)) {
    $attempt = [
        'ts'         => $now,
        'type'       => 'rate_limited_failed',
        'ip'         => $ip,
        'user_agent' => $userAgent,
        'email'      => $email,
        'phone'      => $phoneDigits,
        'risk_score' => $riskScore,
    ];
    logError($attempt);
    recordBotAttempt($ip, $attempt);
    checkSecurityAlert($ip, $userAgent, $email, $phoneDigits, 'rate_limited_failed', $config);

    respondJson(429, false, 'Bugün için gönderim limitine ulaştınız.');
}

// ─── Doğrulama ───────────────────────────────────────────────────────────────
$validationError = validateFields(
    $firstName,
    $lastName,
    $email,
    $phoneNational,
    $phoneDial,
    $phoneCountryIso,
    $company,
    $companyCountryIso,
    $subject,
    $message
);

if ($validationError !== null) {
    $isSpam = str_contains($validationError, 'spam');

    $attempt = [
        'ts'         => $now,
        'type'       => $isSpam ? 'spam' : 'validation_failed',
        'reason'     => $validationError,
        'ip'         => $ip,
        'user_agent' => $userAgent,
        'email'      => $email,
        'phone'      => $phoneDigits,
        'risk_score' => $riskScore,
    ];

    logError($attempt);
    recordFailedAttempt($ip, $now);
    recordBotAttempt($ip, $attempt);

    if ($isSpam) {
        checkSecurityAlert($ip, $userAgent, $email, $phoneDigits, 'spam', $config);
    }

    respondJson(400, false, $isSpam ? 'Mesajınız gönderilemedi.' : $validationError);
}

if ($subject === '') {
    $subject = 'TEKLİF TALEBİ';
}

// ─── Başarılı gönderim rate limit ────────────────────────────────────────────
if (isSuccessRateLimited($ip, $email, $phoneDigits, $today, $config)) {
    $attempt = [
        'ts'         => $now,
        'type'       => 'rate_limited_success',
        'ip'         => $ip,
        'user_agent' => $userAgent,
        'email'      => $email,
        'phone'      => $phoneDigits,
        'risk_score' => $riskScore,
    ];
    logError($attempt);
    recordFailedAttempt($ip, $now);
    recordBotAttempt($ip, $attempt);
    checkSecurityAlert($ip, $userAgent, $email, $phoneDigits, 'rate_limited_success', $config);

    respondJson(429, false, 'Bugün için gönderim limitine ulaştınız.');
}

// ─── E-posta gönderimi ───────────────────────────────────────────────────────
$skipSmtp = (bool) ($config['debug']['skip_smtp'] ?? false);

try {
    if ($skipSmtp) {
        // Local test: SMTP beklemeden başarı simülasyonu
        logError([
            'type'       => 'debug_skip_smtp',
            'ip'         => $ip,
            'email'      => $email,
            'phone'      => $phoneE164 !== '' ? $phoneE164 : $phoneDigits,
            'user_agent' => $userAgent,
        ]);
    } else {
        sendContactMail(
            $config,
            $firstName,
            $lastNameUpper,
            $name,
            $email,
            $phoneE164 !== '' ? $phoneE164 : $phoneDigits,
            $phoneCountryName,
            $company,
            $companyCountryName,
            $subject,
            $message,
            $ip,
            $userAgent,
            $now
        );
    }
} catch (Throwable $e) {
        logError([
            'type'         => 'smtp_error',
            'ip'           => $ip,
            'user_agent'   => $userAgent,
            'email'        => $email,
            'phone'        => $phoneDigits,
            'error'        => $e->getMessage(),
            'risk_score'   => $riskScore,
        ]);

    respondJson(200, false, 'Şu anda talebiniz alınamadı. Lütfen daha sonra tekrar deneyin.');
}

// ─── Başarı kaydı ────────────────────────────────────────────────────────────
recordSuccessSubmission($ip, $email, $phoneDigits, $today);

logRequest([
    'ts'                   => $now,
    'ip'                   => $ip,
    'first_name'           => $firstName,
    'last_name'            => $lastNameUpper,
    'name'                 => $name,
    'email'                => $email,
    'phone'                => $phoneE164 !== '' ? $phoneE164 : $phoneDigits,
    'phone_country'        => $phoneCountryName,
    'phone_country_iso'    => $phoneCountryIso,
    'company'              => $company,
    'company_country'      => $companyCountryName,
    'company_country_iso'  => $companyCountryIso,
    'subject'              => $subject,
    'user_agent'           => $userAgent,
    'risk_score'           => $riskScore,
]);

respondJson(200, true, 'Teklif talebiniz alınmıştır.');

// ═══════════════════════════════════════════════════════════════════════════════
// Yardımcı fonksiyonlar
// ═══════════════════════════════════════════════════════════════════════════════

function respondJson(int $status, bool $success, string $message): void
{
    http_response_code($status);
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
    }
    echo json_encode(
        ['success' => $success, 'message' => $message],
        JSON_UNESCAPED_UNICODE
    );
    exit;
}

/** @return array<string, mixed> */
function parseRequestBody(): array
{
    $contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';

    if (stripos($contentType, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        $decoded = json_decode($raw ?: '[]', true);
        return is_array($decoded) ? $decoded : [];
    }

    return $_POST;
}

function cleanInput(mixed $value): string
{
    if (!is_string($value) && !is_numeric($value)) {
        return '';
    }
    return strip_tags(trim((string) $value));
}

function normalizePhone(string $phone): string
{
    return preg_replace('/\D+/', '', $phone) ?? '';
}

function stripLeadingZero(string $phone): string
{
    $digits = normalizePhone($phone);
    return ltrim($digits, '0');
}

/**
 * Desteklenen ülkeler (ISO => [dial, name, min, max]).
 *
 * @return array<string, array{dial:string,name:string,min:int,max:int}>
 */
function supportedCountries(): array
{
    return [
        'TR' => ['dial' => '90',  'name' => 'Türkiye', 'min' => 10, 'max' => 10],
        'DE' => ['dial' => '49',  'name' => 'Almanya', 'min' => 10, 'max' => 11],
        'US' => ['dial' => '1',   'name' => 'Amerika Birleşik Devletleri', 'min' => 10, 'max' => 10],
        'GB' => ['dial' => '44',  'name' => 'Birleşik Krallık', 'min' => 10, 'max' => 10],
        'FR' => ['dial' => '33',  'name' => 'Fransa', 'min' => 9, 'max' => 9],
        'IT' => ['dial' => '39',  'name' => 'İtalya', 'min' => 9, 'max' => 10],
        'ES' => ['dial' => '34',  'name' => 'İspanya', 'min' => 9, 'max' => 9],
        'NL' => ['dial' => '31',  'name' => 'Hollanda', 'min' => 9, 'max' => 9],
        'BE' => ['dial' => '32',  'name' => 'Belçika', 'min' => 8, 'max' => 9],
        'CH' => ['dial' => '41',  'name' => 'İsviçre', 'min' => 9, 'max' => 9],
        'AT' => ['dial' => '43',  'name' => 'Avusturya', 'min' => 10, 'max' => 13],
        'SE' => ['dial' => '46',  'name' => 'İsveç', 'min' => 9, 'max' => 10],
        'NO' => ['dial' => '47',  'name' => 'Norveç', 'min' => 8, 'max' => 8],
        'DK' => ['dial' => '45',  'name' => 'Danimarka', 'min' => 8, 'max' => 8],
        'FI' => ['dial' => '358', 'name' => 'Finlandiya', 'min' => 9, 'max' => 10],
        'PL' => ['dial' => '48',  'name' => 'Polonya', 'min' => 9, 'max' => 9],
        'CZ' => ['dial' => '420', 'name' => 'Çekya', 'min' => 9, 'max' => 9],
        'RO' => ['dial' => '40',  'name' => 'Romanya', 'min' => 9, 'max' => 9],
        'BG' => ['dial' => '359', 'name' => 'Bulgaristan', 'min' => 8, 'max' => 9],
        'GR' => ['dial' => '30',  'name' => 'Yunanistan', 'min' => 10, 'max' => 10],
        'RU' => ['dial' => '7',   'name' => 'Rusya', 'min' => 10, 'max' => 10],
        'UA' => ['dial' => '380', 'name' => 'Ukrayna', 'min' => 9, 'max' => 9],
        'AZ' => ['dial' => '994', 'name' => 'Azerbaycan', 'min' => 9, 'max' => 9],
        'GE' => ['dial' => '995', 'name' => 'Gürcistan', 'min' => 9, 'max' => 9],
        'KZ' => ['dial' => '7',   'name' => 'Kazakistan', 'min' => 10, 'max' => 10],
        'IQ' => ['dial' => '964', 'name' => 'Irak', 'min' => 10, 'max' => 10],
        'IR' => ['dial' => '98',  'name' => 'İran', 'min' => 10, 'max' => 10],
        'SA' => ['dial' => '966', 'name' => 'Suudi Arabistan', 'min' => 9, 'max' => 9],
        'AE' => ['dial' => '971', 'name' => 'Birleşik Arap Emirlikleri', 'min' => 9, 'max' => 9],
        'QA' => ['dial' => '974', 'name' => 'Katar', 'min' => 8, 'max' => 8],
        'KW' => ['dial' => '965', 'name' => 'Kuveyt', 'min' => 8, 'max' => 8],
        'BH' => ['dial' => '973', 'name' => 'Bahreyn', 'min' => 8, 'max' => 8],
        'OM' => ['dial' => '968', 'name' => 'Umman', 'min' => 8, 'max' => 8],
        'EG' => ['dial' => '20',  'name' => 'Mısır', 'min' => 10, 'max' => 10],
        'CN' => ['dial' => '86',  'name' => 'Çin', 'min' => 11, 'max' => 11],
        'JP' => ['dial' => '81',  'name' => 'Japonya', 'min' => 10, 'max' => 11],
        'KR' => ['dial' => '82',  'name' => 'Güney Kore', 'min' => 9, 'max' => 10],
        'IN' => ['dial' => '91',  'name' => 'Hindistan', 'min' => 10, 'max' => 10],
        'PK' => ['dial' => '92',  'name' => 'Pakistan', 'min' => 10, 'max' => 10],
        'BD' => ['dial' => '880', 'name' => 'Bangladeş', 'min' => 10, 'max' => 10],
        'SG' => ['dial' => '65',  'name' => 'Singapur', 'min' => 8, 'max' => 8],
        'MY' => ['dial' => '60',  'name' => 'Malezya', 'min' => 9, 'max' => 10],
        'TH' => ['dial' => '66',  'name' => 'Tayland', 'min' => 9, 'max' => 9],
        'ID' => ['dial' => '62',  'name' => 'Endonezya', 'min' => 9, 'max' => 12],
        'VN' => ['dial' => '84',  'name' => 'Vietnam', 'min' => 9, 'max' => 10],
        'AU' => ['dial' => '61',  'name' => 'Avustralya', 'min' => 9, 'max' => 9],
        'NZ' => ['dial' => '64',  'name' => 'Yeni Zelanda', 'min' => 8, 'max' => 10],
        'CA' => ['dial' => '1',   'name' => 'Kanada', 'min' => 10, 'max' => 10],
        'MX' => ['dial' => '52',  'name' => 'Meksika', 'min' => 10, 'max' => 10],
        'BR' => ['dial' => '55',  'name' => 'Brezilya', 'min' => 10, 'max' => 11],
        'AR' => ['dial' => '54',  'name' => 'Arjantin', 'min' => 10, 'max' => 10],
        'ZA' => ['dial' => '27',  'name' => 'Güney Afrika', 'min' => 9, 'max' => 9],
        'NG' => ['dial' => '234', 'name' => 'Nijerya', 'min' => 10, 'max' => 10],
        'IL' => ['dial' => '972', 'name' => 'İsrail', 'min' => 9, 'max' => 9],
        'PT' => ['dial' => '351', 'name' => 'Portekiz', 'min' => 9, 'max' => 9],
        'IE' => ['dial' => '353', 'name' => 'İrlanda', 'min' => 9, 'max' => 9],
        'HU' => ['dial' => '36',  'name' => 'Macaristan', 'min' => 8, 'max' => 9],
        'RS' => ['dial' => '381', 'name' => 'Sırbistan', 'min' => 8, 'max' => 9],
        'HR' => ['dial' => '385', 'name' => 'Hırvatistan', 'min' => 8, 'max' => 9],
        'SI' => ['dial' => '386', 'name' => 'Slovenya', 'min' => 8, 'max' => 8],
        'SK' => ['dial' => '421', 'name' => 'Slovakya', 'min' => 9, 'max' => 9],
        'LT' => ['dial' => '370', 'name' => 'Litvanya', 'min' => 8, 'max' => 8],
        'LV' => ['dial' => '371', 'name' => 'Letonya', 'min' => 8, 'max' => 8],
        'EE' => ['dial' => '372', 'name' => 'Estonya', 'min' => 7, 'max' => 8],
    ];
}

/**
 * @return array{iso:string,dial:string,name:string}
 */
function resolveCountryMeta(string $iso, string $dial = '', string $fallbackName = ''): array
{
    $countries = supportedCountries();
    $iso = strtoupper(trim($iso));

    if ($iso !== '' && isset($countries[$iso])) {
        return [
            'iso'  => $iso,
            'dial' => $countries[$iso]['dial'],
            'name' => $countries[$iso]['name'],
        ];
    }

    $dial = preg_replace('/\D+/', '', $dial) ?? '';
    if ($dial !== '') {
        foreach ($countries as $code => $meta) {
            if ($meta['dial'] === $dial) {
                return [
                    'iso'  => $code,
                    'dial' => $meta['dial'],
                    'name' => $meta['name'],
                ];
            }
        }
    }

    return [
        'iso'  => $iso,
        'dial' => $dial,
        'name' => $fallbackName !== '' ? $fallbackName : ($iso !== '' ? $iso : '—'),
    ];
}

function hasHeaderInjection(string $value): bool
{
    return (bool) preg_match('/[\r\n]/', $value);
}

function getClientIp(): ?string
{
    $candidate = $_SERVER['REMOTE_ADDR'] ?? '';

    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $parts = explode(',', (string) $_SERVER['HTTP_X_FORWARDED_FOR']);
        $candidate = trim($parts[0]);
    }

    if (filter_var($candidate, FILTER_VALIDATE_IP)) {
        return $candidate;
    }

    return null;
}

/**
 * @param list<string> $allowedOrigins
 * @return array{valid: bool, present: bool}
 */
function validateOriginOrReferer(array $allowedOrigins): array
{
    $origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
    $referer = $_SERVER['HTTP_REFERER'] ?? '';

    if ($origin === '' && $referer === '') {
        return ['valid' => false, 'present' => false];
    }

    foreach ([$origin, $referer] as $value) {
        if ($value === '') {
            continue;
        }
        foreach ($allowedOrigins as $allowed) {
            if (str_starts_with($value, $allowed)) {
                return ['valid' => true, 'present' => true];
            }
        }
    }

    return ['valid' => false, 'present' => true];
}

function countLinks(string $text): int
{
    return preg_match_all('/https?:\/\//i', $text) ?: 0;
}

function validateFields(
    string $firstName,
    string $lastName,
    string $email,
    string $phoneNational,
    string $phoneDial,
    string $phoneCountryIso,
    string $company,
    string $companyCountryIso,
    string $subject,
    string $message
): ?string {
    $countries = supportedCountries();

    if ($firstName === '' || $lastName === '' || $email === '' || $phoneNational === '' || $message === '') {
        return 'Lütfen zorunlu alanları doldurun.';
    }

    if (mb_strlen($firstName) < 2) {
        return 'Ad en az 2 karakter olmalıdır.';
    }
    if (mb_strlen($firstName) > 50) {
        return 'Ad çok uzun.';
    }
    if (mb_strlen($lastName) < 2) {
        return 'Soyad en az 2 karakter olmalıdır.';
    }
    if (mb_strlen($lastName) > 50) {
        return 'Soyad çok uzun.';
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return 'Geçerli bir e-posta adresi girin.';
    }
    if (mb_strlen($email) > 150) {
        return 'E-posta adresi çok uzun.';
    }
    // Domain kısmında en az bir nokta olmalı (a@b kabul edilmesin)
    if (!preg_match('/^[^@\s]+@[^@\s]+\.[^@\s]+$/', $email)) {
        return 'Geçerli bir e-posta adresi girin.';
    }

    if ($phoneCountryIso === '' || !isset($countries[$phoneCountryIso])) {
        return 'Telefon ülke kodunu seçin.';
    }
    if ($companyCountryIso === '' || !isset($countries[$companyCountryIso])) {
        return 'Lütfen firmanın bulunduğu ülkeyi seçin.';
    }

    $phoneMeta = $countries[$phoneCountryIso];
    $expectedDial = $phoneMeta['dial'];
    if ($phoneDial !== '' && $phoneDial !== $expectedDial) {
        // ISO ile dial uyumsuzsa ISO'ya güven
        $phoneDial = $expectedDial;
    }

    if (!preg_match('/^\d+$/', $phoneNational)) {
        return 'Geçerli bir telefon numarası girin (başında 0 olmadan).';
    }
    if (str_starts_with($phoneNational, '0')) {
        return 'Telefon numarasını başındaki 0 olmadan girin.';
    }

    $len = mb_strlen($phoneNational);
    if ($len < $phoneMeta['min'] || $len > $phoneMeta['max']) {
        return 'Geçerli bir telefon numarası girin (başında 0 olmadan).';
    }
    if ($phoneCountryIso === 'TR' && !preg_match('/^[2-5]\d{9}$/', $phoneNational)) {
        return 'Geçerli bir Türkiye telefon numarası girin.';
    }

    if (mb_strlen($company) > 150) {
        return 'Firma adı çok uzun.';
    }
    if (mb_strlen($subject) > 150) {
        return 'Konu çok uzun.';
    }

    if (mb_strlen($message) < 10) {
        return 'Mesaj en az 10 karakter olmalıdır.';
    }
    if (mb_strlen($message) > 2000) {
        return 'Mesaj çok uzun.';
    }

    if (countLinks($message) > 3) {
        return 'spam';
    }

    foreach ([$firstName, $lastName, $email, $subject] as $field) {
        if (hasHeaderInjection($field)) {
            return 'Geçersiz karakter tespit edildi.';
        }
    }

    return null;
}

// ─── JSON dosya işlemleri (flock ile) ────────────────────────────────────────

/**
 * @template T
 * @param callable(T): T $mutator
 * @return T|null
 */
function withJsonFile(string $path, mixed $default, callable $mutator): mixed
{
    $dir = dirname($path);
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        return null;
    }

    $fp = fopen($path, 'c+');
    if ($fp === false) {
        return null;
    }

    try {
        if (!flock($fp, LOCK_EX)) {
            return null;
        }

        $contents = stream_get_contents($fp);
        $data = ($contents === false || $contents === '')
            ? $default
            : (json_decode($contents, true) ?? $default);

        $data = $mutator($data);

        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        fflush($fp);
        flock($fp, LOCK_UN);
    } finally {
        fclose($fp);
    }

    return $data;
}

/** @param array<string, mixed> $entry */
function logError(array $entry): void
{
    $entry['logged_at'] = date('c');
    withJsonFile(PATH_LOG_ERRORS, [], static function (array $log) use ($entry): array {
        $log[] = $entry;
        // Son 5000 kayıt
        if (count($log) > 5000) {
            $log = array_slice($log, -5000);
        }
        return $log;
    });
}

/** @param array<string, mixed> $entry */
function logRequest(array $entry): void
{
    $entry['logged_at'] = date('c');
    withJsonFile(PATH_LOG_REQUESTS, [], static function (array $log) use ($entry): array {
        $log[] = $entry;
        if (count($log) > 5000) {
            $log = array_slice($log, -5000);
        }
        return $log;
    });
}

function recordFailedAttempt(string $ip, int $ts): void
{
    withJsonFile(PATH_RATE_LIMIT, [], static function (array $data) use ($ip, $ts): array {
        $data['failed'][$ip][] = $ts;
        // Eski kayıtları temizle (48 saat)
        $cutoff = $ts - 172800;
        $data['failed'][$ip] = array_values(array_filter(
            $data['failed'][$ip] ?? [],
            static fn (int $t): bool => $t >= $cutoff
        ));
        return $data;
    });
}

/** @param array<string, mixed> $attempt */
function recordBotAttempt(string $ip, array $attempt): void
{
    withJsonFile(PATH_BOT_ATTEMPTS, [], static function (array $data) use ($ip, $attempt): array {
        if (!isset($data[$ip]) || !is_array($data[$ip])) {
            $data[$ip] = [];
        }
        $data[$ip][] = $attempt;
        // IP başına son 100 deneme
        if (count($data[$ip]) > 100) {
            $data[$ip] = array_slice($data[$ip], -100);
        }
        return $data;
    });
}

function recordSuccessSubmission(string $ip, string $email, string $phone, string $day): void
{
    $emailKey = strtolower($email);

    withJsonFile(PATH_RATE_LIMIT, [], static function (array $data) use ($ip, $emailKey, $phone, $day): array {
        $data['success']['ip'][$ip][$day] = ($data['success']['ip'][$ip][$day] ?? 0) + 1;
        $data['success']['email'][$emailKey][$day] = ($data['success']['email'][$emailKey][$day] ?? 0) + 1;
        $data['success']['phone'][$phone][$day] = ($data['success']['phone'][$phone][$day] ?? 0) + 1;
        return $data;
    });
}

/** @param array<string, mixed> $config */
function isFailedRateLimited(string $ip, array $config, int $now): bool
{
    $limit = (int) ($config['rate_limits']['failed_per_ip_per_hour'] ?? 10);
    $hourAgo = $now - 3600;

    $data = jsonRead(PATH_RATE_LIMIT, []);
    $attempts = $data['failed'][$ip] ?? [];

    $recent = array_filter($attempts, static fn (int $ts): bool => $ts >= $hourAgo);

    return count($recent) >= $limit;
}

/** @param array<string, mixed> $config */
function isSuccessRateLimited(string $ip, string $email, string $phone, string $day, array $config): bool
{
    $limits = $config['rate_limits'] ?? [];
    $data = jsonRead(PATH_RATE_LIMIT, []);

    $ipCount = (int) ($data['success']['ip'][$ip][$day] ?? 0);
    if ($ipCount >= (int) ($limits['success_per_ip_per_day'] ?? 2)) {
        return true;
    }

    $emailKey = strtolower($email);
    $emailCount = (int) ($data['success']['email'][$emailKey][$day] ?? 0);
    if ($emailCount >= (int) ($limits['success_per_email_per_day'] ?? 2)) {
        return true;
    }

    $phoneCount = (int) ($data['success']['phone'][$phone][$day] ?? 0);
    if ($phoneCount >= (int) ($limits['success_per_phone_per_day'] ?? 2)) {
        return true;
    }

    return false;
}

function jsonRead(string $path, mixed $default): mixed
{
    if (!is_file($path)) {
        return $default;
    }

    $fp = fopen($path, 'r');
    if ($fp === false) {
        return $default;
    }

    try {
        if (!flock($fp, LOCK_SH)) {
            return $default;
        }
        $contents = stream_get_contents($fp);
        flock($fp, LOCK_UN);
    } finally {
        fclose($fp);
    }

    if ($contents === false || $contents === '') {
        return $default;
    }

    return json_decode($contents, true) ?? $default;
}

/**
 * Şüpheli deneme sayısını hesapla ve gerekirse güvenlik maili gönder.
 *
 * @param array<string, mixed> $config
 */
function checkSecurityAlert(
    string $ip,
    string $userAgent,
    string $email,
    string $phone,
    string $reason,
    array $config
): void {
    $now = time();
    $hourAgo = $now - 3600;
    $dayAgo  = $now - 86400;

    $botData = jsonRead(PATH_BOT_ATTEMPTS, []);
    $attempts = $botData[$ip] ?? [];

    $hourlyCount = 0;
    $dailyCount  = 0;
    $lastAttempt = $now;

    foreach ($attempts as $attempt) {
        $ts = (int) ($attempt['ts'] ?? 0);
        if ($ts >= $hourAgo) {
            $hourlyCount++;
        }
        if ($ts >= $dayAgo) {
            $dailyCount++;
        }
        if ($ts > $lastAttempt) {
            $lastAttempt = $ts;
        }
    }

    $alertCfg = $config['security_alert'] ?? [];
    $hourThreshold = (int) ($alertCfg['attempts_per_hour'] ?? 10);
    $dayThreshold  = (int) ($alertCfg['attempts_per_day'] ?? 20);
    $cooldown      = (int) ($alertCfg['alert_cooldown_sec'] ?? 3600);

    if ($hourlyCount < $hourThreshold && $dailyCount < $dayThreshold) {
        return;
    }

    // Cooldown kontrolü
    $alerts = jsonRead(PATH_LOG_ALERTS, []);
    $lastAlertTs = (int) ($alerts[$ip]['last_alert_ts'] ?? 0);

    if (($now - $lastAlertTs) < $cooldown) {
        return;
    }

    try {
        sendSecurityAlertMail(
            $config,
            $ip,
            $lastAttempt,
            $hourlyCount,
            $dailyCount,
            $userAgent,
            $email,
            $phone,
            $reason
        );

        withJsonFile(PATH_LOG_ALERTS, [], static function (array $data) use ($ip, $now, $hourlyCount, $dailyCount, $reason): array {
            $data[$ip] = [
                'last_alert_ts'  => $now,
                'hourly_count'   => $hourlyCount,
                'daily_count'    => $dailyCount,
                'reason'         => $reason,
            ];
            return $data;
        });
    } catch (Throwable $e) {
        logError([
            'type'  => 'security_alert_failed',
            'ip'    => $ip,
            'error' => $e->getMessage(),
        ]);
    }
}

/**
 * @param array<string, mixed> $config
 */
function createMailer(array $config): PHPMailer
{
    $smtp = $config['smtp'] ?? [];
    $mail = $config['mail'] ?? [];

    $phpmailer = new PHPMailer(true);
    $phpmailer->CharSet = 'UTF-8';
    $phpmailer->isSMTP();
    $phpmailer->Host       = (string) ($smtp['host'] ?? '');
    $phpmailer->Port       = (int) ($smtp['port'] ?? 587);
    $phpmailer->SMTPAuth   = true;
    $phpmailer->Username   = (string) ($smtp['username'] ?? '');
    $phpmailer->Password   = (string) ($smtp['password'] ?? '');
    $phpmailer->SMTPSecure = (string) ($smtp['encryption'] ?? 'tls');
    $phpmailer->Timeout    = (int) ($smtp['timeout'] ?? 15);
    // cPanel / self-signed sertifika uyumluluğu
    $phpmailer->SMTPOptions = [
        'ssl' => [
            'verify_peer'       => false,
            'verify_peer_name'  => false,
            'allow_self_signed' => true,
        ],
    ];
    $phpmailer->setFrom(
        (string) ($mail['fromEmail'] ?? ''),
        (string) ($mail['fromName'] ?? 'Mayamak')
    );

    return $phpmailer;
}

/**
 * @param array<string, mixed> $config
 */
function sendContactMail(
    array $config,
    string $firstName,
    string $lastNameUpper,
    string $fullName,
    string $email,
    string $phone,
    string $phoneCountry,
    string $company,
    string $companyCountry,
    string $subject,
    string $message,
    string $ip,
    string $userAgent,
    int $timestamp
): void {
    $mailCfg = $config['mail'] ?? [];
    $recipients = $mailCfg['recipients'] ?? [];

    if ($recipients === []) {
        throw new RuntimeException('Alıcı listesi boş.');
    }

    $phpmailer = createMailer($config);
    $phpmailer->addReplyTo($email, $fullName);

    foreach ($recipients as $recipient) {
        $phpmailer->addAddress((string) $recipient);
    }

    $safeFirst          = htmlspecialchars($firstName, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeLast           = htmlspecialchars($lastNameUpper, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeEmail          = htmlspecialchars($email, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safePhone          = htmlspecialchars($phone, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safePhoneCountry   = htmlspecialchars($phoneCountry !== '' ? $phoneCountry : '—', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeCompany        = htmlspecialchars($company !== '' ? $company : '—', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeCompanyCountry = htmlspecialchars($companyCountry !== '' ? $companyCountry : '—', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeSubject        = htmlspecialchars($subject, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeMessage        = nl2br(htmlspecialchars($message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'));
    $safeIp             = htmlspecialchars($ip, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeUa             = htmlspecialchars($userAgent !== '' ? $userAgent : '—', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $dateStr            = date('d.m.Y H:i:s', $timestamp);

    $phpmailer->Subject = 'YENİ TEKLİF TALEBİ - ' . $fullName;
    $phpmailer->isHTML(true);

    $phpmailer->Body = <<<HTML
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;color:#222;line-height:1.5;">
  <h2 style="color:#1a2b4a;text-transform:uppercase;">YENİ TEKLİF TALEBİ</h2>
  <p style="font-size:12px;color:#666;margin-bottom:16px;text-transform:uppercase;letter-spacing:0.06em;">MAYAMAK TEKLİF FORMU</p>
  <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;">
    <tr><td><strong>Ad</strong></td><td>{$safeFirst}</td></tr>
    <tr><td><strong>Soyad</strong></td><td>{$safeLast}</td></tr>
    <tr><td><strong>E-posta</strong></td><td>{$safeEmail}</td></tr>
    <tr><td><strong>Telefon</strong></td><td>{$safePhone}</td></tr>
    <tr><td><strong>Telefon Ülkesi</strong></td><td>{$safePhoneCountry}</td></tr>
    <tr><td><strong>Firma</strong></td><td>{$safeCompany}</td></tr>
    <tr><td><strong>Firma Ülkesi</strong></td><td>{$safeCompanyCountry}</td></tr>
    <tr><td><strong>Konu</strong></td><td>{$safeSubject}</td></tr>
  </table>
  <h3>Mesaj</h3>
  <p>{$safeMessage}</p>
  <hr>
  <p style="font-size:12px;color:#666;">
    <strong>IP:</strong> {$safeIp}<br>
    <strong>User-Agent:</strong> {$safeUa}<br>
    <strong>Tarih:</strong> {$dateStr}
  </p>
</body>
</html>
HTML;

    $phpmailer->AltBody = implode("\n", [
        'YENİ TEKLİF TALEBİ',
        'MAYAMAK TEKLİF FORMU',
        '',
        'Ad: ' . $firstName,
        'Soyad: ' . $lastNameUpper,
        'E-posta: ' . $email,
        'Telefon: ' . $phone,
        'Telefon Ülkesi: ' . ($phoneCountry !== '' ? $phoneCountry : '—'),
        'Firma: ' . ($company !== '' ? $company : '—'),
        'Firma Ülkesi: ' . ($companyCountry !== '' ? $companyCountry : '—'),
        'Konu: ' . $subject,
        '',
        'Mesaj:',
        $message,
        '',
        'IP: ' . $ip,
        'User-Agent: ' . ($userAgent !== '' ? $userAgent : '—'),
        'Tarih: ' . $dateStr,
    ]);

    $phpmailer->send();
}

/**
 * @param array<string, mixed> $config
 */
function sendSecurityAlertMail(
    array $config,
    string $ip,
    int $lastAttemptTs,
    int $hourlyCount,
    int $dailyCount,
    string $userAgent,
    string $email,
    string $phone,
    string $reason
): void {
    $mailCfg = $config['mail'] ?? [];
    $alertRecipients = $mailCfg['securityAlertRecipients'] ?? [];
    if ($alertRecipients === [] && !empty($mailCfg['securityAlertRecipient'])) {
        $alertRecipients = [(string) $mailCfg['securityAlertRecipient']];
    }
    if ($alertRecipients === []) {
        $alertRecipients = ['info@mayamak.com'];
    }

    $phpmailer = createMailer($config);
    foreach ($alertRecipients as $recipient) {
        $phpmailer->addAddress((string) $recipient);
    }
    $phpmailer->Subject = 'ACİL GÜVENLİK UYARISI - MAYAMAK FORM BOT SALDIRISI';

    $safeIp      = htmlspecialchars($ip, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeUa      = htmlspecialchars($userAgent !== '' ? $userAgent : '—', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeEmail   = htmlspecialchars($email !== '' ? $email : '—', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safePhone   = htmlspecialchars($phone !== '' ? $phone : '—', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeReason  = htmlspecialchars($reason, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $lastDate    = date('d.m.Y H:i:s', $lastAttemptTs);

    $body = <<<HTML
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;color:#222;line-height:1.6;">
  <h2 style="color:#b00020;">ACİL GÜVENLİK UYARISI</h2>
  <p>Mayamak iletişim formunda şüpheli aktivite tespit edildi.</p>
  <ul>
    <li><strong>IP Adresi:</strong> {$safeIp}</li>
    <li><strong>Son Deneme:</strong> {$lastDate}</li>
    <li><strong>1 Saatlik Deneme:</strong> {$hourlyCount}</li>
    <li><strong>24 Saatlik Deneme:</strong> {$dailyCount}</li>
    <li><strong>User-Agent:</strong> {$safeUa}</li>
    <li><strong>Son E-posta:</strong> {$safeEmail}</li>
    <li><strong>Son Telefon:</strong> {$safePhone}</li>
    <li><strong>Engelleme Nedeni:</strong> {$safeReason}</li>
  </ul>
  <h3>Öneriler</h3>
  <ul>
    <li>Şüpheli IP adresini sunucu veya Cloudflare üzerinden engelleyin.</li>
    <li>Forma Cloudflare Turnstile veya benzeri CAPTCHA ekleyin.</li>
    <li>Rate limit eşiklerini gözden geçirin.</li>
  </ul>
</body>
</html>
HTML;

    $phpmailer->isHTML(true);
    $phpmailer->Body = $body;
    $phpmailer->AltBody = strip_tags(str_replace(['<br>', '<br/>', '<br />', '</li>'], ["\n", "\n", "\n", "\n"], $body));
    $phpmailer->send();
}
