<?php
declare(strict_types=1);

$localConfigPath = __DIR__ . DIRECTORY_SEPARATOR . 'mail.local.php';
if (file_exists($localConfigPath)) {
    require $localConfigPath;
}

$mailEnabled = $mailEnabled ?? filter_var(getenv('MAIL_ENABLED') ?: '1', FILTER_VALIDATE_BOOL);
$mailMode = $mailMode ?? (getenv('MAIL_MODE') ?: 'smtp');
$mailFromAddress = $mailFromAddress ?? (getenv('MAIL_FROM_ADDRESS') ?: '');
$mailFromName = $mailFromName ?? (getenv('MAIL_FROM_NAME') ?: 'M&H Super Market');

$mailSmtpHost = $mailSmtpHost ?? (getenv('MAIL_SMTP_HOST') ?: 'smtp.hostinger.com');
$mailSmtpPort = $mailSmtpPort ?? (int)(getenv('MAIL_SMTP_PORT') ?: 465);
$mailSmtpEncryption = $mailSmtpEncryption ?? (getenv('MAIL_SMTP_ENCRYPTION') ?: 'ssl');
$mailSmtpUsername = $mailSmtpUsername ?? (getenv('MAIL_SMTP_USERNAME') ?: $mailFromAddress);
$mailSmtpPassword = $mailSmtpPassword ?? (getenv('MAIL_SMTP_PASSWORD') ?: '');
$mailSmtpTimeout = $mailSmtpTimeout ?? (int)(getenv('MAIL_SMTP_TIMEOUT') ?: 20);

if ($mailFromAddress === '') {
    $mailFromAddress = 'contact@myhsoftwarehouse.com';
}
