<?php
/**
 * Örnek yapılandırma — sunucuda contact-config.php olarak kopyalayın.
 * password alanını cPanel mail şifresiyle güncelleyin.
 */
declare(strict_types=1);

return [
    'smtp' => [
        'host'       => 'mail.mayamak.com',
        'port'       => 587,
        'encryption' => 'tls',
        'username'   => 'offer@mayamak.com',
        'password'   => 'Mayamak_321.*',
        'timeout'    => 15,
    ],
    'mail' => [
        'fromEmail'   => 'offer@mayamak.com',
        'fromName'    => 'MAYAMAK TEKLİF FORMU',
        'recipients'  => [
            'alperen@mayamak.com',
        ],
        'securityAlertRecipients' => [
            'alperen@mayamak.com',
        ],
    ],
    'allowed_origins' => [
        'https://mayamak.com',
        'https://www.mayamak.com',
    ],
    'rate_limits' => [
        'success_per_ip_per_day'     => 2,
        'success_per_email_per_day'  => 2,
        'success_per_phone_per_day'  => 2,
        'failed_per_ip_per_hour'     => 10,
    ],
    'security_alert' => [
        'attempts_per_hour'  => 10,
        'attempts_per_day'   => 20,
        'alert_cooldown_sec' => 3600,
    ],
    'debug' => [
        'skip_smtp' => false,
    ],
];
