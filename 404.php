<?php
/**
 * Özel 404 — LiteSpeed/Apache ErrorDocument ve rewrite için.
 * HTTP 404 durum kodu korunur; özel Mayamak sayfası gösterilir.
 */
http_response_code(404);
header('Content-Type: text/html; charset=utf-8');
header('X-Robots-Tag: noindex, follow');

$file = __DIR__ . '/404.html';
if (is_file($file)) {
    readfile($file);
    exit;
}

echo '<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><title>404</title></head>';
echo '<body><h1>Sayfa Bulunamadı</h1><p><a href="/">Ana sayfa</a></p></body></html>';
exit;
