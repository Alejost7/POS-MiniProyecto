<?php
declare(strict_types=1);

if (defined('API_BOOTSTRAPPED')) {
    return;
}

define('API_BOOTSTRAPPED', true);

define('API_ROOT', __DIR__);
define('API_CONFIG_PATH', API_ROOT . DIRECTORY_SEPARATOR . 'config');
define('API_AUTH_PATH', API_ROOT . DIRECTORY_SEPARATOR . 'auth');
define('API_PRODUCTOS_PATH', API_ROOT . DIRECTORY_SEPARATOR . 'productos');
define('API_VENTAS_PATH', API_ROOT . DIRECTORY_SEPARATOR . 'ventas');

/**
 * Configuracion comun para endpoints API.
 */
function api_bootstrap(array $allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowedOrigins = api_allowed_origins();

    if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
    } elseif (in_array('*', $allowedOrigins, true)) {
        header('Access-Control-Allow-Origin: *');
    }

    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Allow-Methods: ' . implode(', ', $allowedMethods));
    header('Content-Type: application/json; charset=UTF-8');

    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

    if ($method === 'OPTIONS') {
        http_response_code(204);
        exit;
    }

    if (!in_array($method, $allowedMethods, true)) {
        http_response_code(405);
        echo json_encode([
            'error' => 'Metodo no permitido',
            'allowed_methods' => $allowedMethods,
        ]);
        exit;
    }
}

/**
 * Lista de origenes permitidos para CORS.
 */
function api_allowed_origins(): array
{
    $envOrigins = getenv('API_ALLOWED_ORIGINS');

    if ($envOrigins !== false && trim($envOrigins) !== '') {
        $origins = array_map('trim', explode(',', $envOrigins));
        return array_values(array_filter($origins, static fn(string $origin): bool => $origin !== ''));
    }

    return [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'https://myhsoftwarehouse.com',
        'https://www.myhsoftwarehouse.com',
        'https://pos.myhsoftwarehouse.com',
    ];
}

/**
 * Inicia sesion PHP con parametros seguros.
 */
function api_start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');

    session_set_cookie_params([
        'lifetime' => 60 * 60 * 8,
        'path' => '/',
        'secure' => $isHttps,
        'httponly' => true,
        'samesite' => $isHttps ? 'None' : 'Lax',
    ]);

    session_start();
}

/**
 * Carga conexion de base de datos desde config/database.php.
 */
function api_require_database(): PDO
{
    require API_CONFIG_PATH . DIRECTORY_SEPARATOR . 'database.php';

    if (!isset($conn) || !($conn instanceof PDO)) {
        throw new RuntimeException('No se pudo inicializar la conexion a la base de datos.');
    }

    return $conn;
}

/**
 * Carga configuracion de correo.
 */
function api_mail_config(): array
{
    require API_CONFIG_PATH . DIRECTORY_SEPARATOR . 'mail.php';

    return [
        'enabled' => isset($mailEnabled) ? (bool)$mailEnabled : false,
        'mode' => isset($mailMode) ? strtolower(trim((string)$mailMode)) : 'smtp',
        'from_address' => isset($mailFromAddress) ? (string)$mailFromAddress : '',
        'from_name' => isset($mailFromName) ? (string)$mailFromName : 'Sistema POS',
        'smtp_host' => isset($mailSmtpHost) ? (string)$mailSmtpHost : '',
        'smtp_port' => isset($mailSmtpPort) ? (int)$mailSmtpPort : 465,
        'smtp_encryption' => isset($mailSmtpEncryption) ? strtolower(trim((string)$mailSmtpEncryption)) : 'ssl',
        'smtp_username' => isset($mailSmtpUsername) ? (string)$mailSmtpUsername : '',
        'smtp_password' => isset($mailSmtpPassword) ? (string)$mailSmtpPassword : '',
        'smtp_timeout' => isset($mailSmtpTimeout) ? (int)$mailSmtpTimeout : 20,
    ];
}

/**
 * Valida correos con formato RFC basico.
 */
function api_is_valid_email(?string $email): bool
{
    if ($email === null) {
        return false;
    }

    $normalizedEmail = trim($email);
    return $normalizedEmail !== '' && filter_var($normalizedEmail, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Escapa texto para HTML.
 */
function api_escape_html(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * Lee una respuesta SMTP multilinea.
 */
function api_smtp_read($socket): array
{
    $response = '';

    while (($line = fgets($socket, 515)) !== false) {
        $response .= $line;
        if (strlen($line) >= 4 && $line[3] === ' ') {
            break;
        }
    }

    if ($response === '') {
        return ['code' => 0, 'message' => 'Sin respuesta del servidor SMTP'];
    }

    return [
        'code' => (int)substr($response, 0, 3),
        'message' => trim($response),
    ];
}

/**
 * Escribe un comando SMTP y valida la respuesta.
 */
function api_smtp_command($socket, string $command, array $expectedCodes): array
{
    if (fwrite($socket, $command . "\r\n") === false) {
        return ['ok' => false, 'code' => 0, 'message' => 'No se pudo escribir en el socket SMTP'];
    }

    $response = api_smtp_read($socket);
    return [
        'ok' => in_array($response['code'], $expectedCodes, true),
        'code' => $response['code'],
        'message' => $response['message'],
    ];
}

/**
 * Escapa lineas para cuerpo SMTP.
 */
function api_smtp_escape_body(string $body): string
{
    $normalized = str_replace(["\r\n", "\r"], "\n", $body);
    $normalized = preg_replace('/^\./m', '..', $normalized ?? '');
    return str_replace("\n", "\r\n", (string)$normalized);
}

/**
 * Envia correo HTML simple usando SMTP autenticado o mail().
 */
function api_send_email(string $to, string $subject, string $htmlBody, string $textBody): array
{
    if (!api_is_valid_email($to)) {
        return ['sent' => false, 'error' => 'Correo de destino invalido'];
    }

    $config = api_mail_config();
    if (!$config['enabled']) {
        return ['sent' => false, 'error' => 'Envio de correo deshabilitado'];
    }

    $fromAddress = trim((string)$config['from_address']);
    if (!api_is_valid_email($fromAddress)) {
        return ['sent' => false, 'error' => 'Configuracion MAIL_FROM_ADDRESS invalida'];
    }

    $fromName = trim((string)$config['from_name']);
    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $encodedFromName = '=?UTF-8?B?' . base64_encode($fromName) . '?=';
    $boundary = 'pos-mail-' . bin2hex(random_bytes(12));

    $messageHeaders = [
        'Date: ' . date(DATE_RFC2822),
        'From: ' . $encodedFromName . ' <' . $fromAddress . '>',
        'To: <' . $to . '>',
        'Subject: ' . $encodedSubject,
        'MIME-Version: 1.0',
        'Reply-To: ' . $fromAddress,
        'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
    ];

    $messageBody = "--{$boundary}\r\n";
    $messageBody .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $messageBody .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $messageBody .= api_smtp_escape_body($textBody) . "\r\n\r\n";
    $messageBody .= "--{$boundary}\r\n";
    $messageBody .= "Content-Type: text/html; charset=UTF-8\r\n";
    $messageBody .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $messageBody .= api_smtp_escape_body($htmlBody) . "\r\n\r\n";
    $messageBody .= "--{$boundary}--";

    if (($config['mode'] ?? 'smtp') !== 'smtp') {
        $sent = mail($to, $encodedSubject, $messageBody, implode("\r\n", $messageHeaders));
        return $sent
            ? ['sent' => true, 'error' => null]
            : ['sent' => false, 'error' => 'mail() devolvio false'];
    }

    $smtpHost = trim((string)$config['smtp_host']);
    $smtpPort = (int)$config['smtp_port'];
    $smtpEncryption = strtolower(trim((string)$config['smtp_encryption']));
    $smtpUsername = trim((string)$config['smtp_username']);
    $smtpPassword = (string)$config['smtp_password'];
    $smtpTimeout = max(5, (int)$config['smtp_timeout']);

    if ($smtpHost === '' || $smtpPort <= 0 || $smtpUsername === '' || $smtpPassword === '') {
        return ['sent' => false, 'error' => 'Configuracion SMTP incompleta'];
    }

    $transportHost = $smtpEncryption === 'ssl' ? 'ssl://' . $smtpHost : $smtpHost;
    $socket = @stream_socket_client(
        $transportHost . ':' . $smtpPort,
        $errorNumber,
        $errorMessage,
        $smtpTimeout,
        STREAM_CLIENT_CONNECT
    );

    if (!is_resource($socket)) {
        return ['sent' => false, 'error' => 'No se pudo conectar al servidor SMTP: ' . $errorMessage];
    }

    stream_set_timeout($socket, $smtpTimeout);

    try {
        $greeting = api_smtp_read($socket);
        if ($greeting['code'] !== 220) {
            return ['sent' => false, 'error' => 'SMTP saludo invalido: ' . $greeting['message']];
        }

        $hostname = $_SERVER['HTTP_HOST'] ?? gethostname() ?: 'localhost';
        $helo = api_smtp_command($socket, 'EHLO ' . $hostname, [250]);
        if (!$helo['ok']) {
            $helo = api_smtp_command($socket, 'HELO ' . $hostname, [250]);
            if (!$helo['ok']) {
                return ['sent' => false, 'error' => 'SMTP EHLO/HELO fallo: ' . $helo['message']];
            }
        }

        if ($smtpEncryption === 'tls') {
            $tls = api_smtp_command($socket, 'STARTTLS', [220]);
            if (!$tls['ok']) {
                return ['sent' => false, 'error' => 'SMTP STARTTLS fallo: ' . $tls['message']];
            }

            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                return ['sent' => false, 'error' => 'No se pudo habilitar TLS en SMTP'];
            }

            $heloTls = api_smtp_command($socket, 'EHLO ' . $hostname, [250]);
            if (!$heloTls['ok']) {
                return ['sent' => false, 'error' => 'SMTP EHLO tras STARTTLS fallo: ' . $heloTls['message']];
            }
        }

        $authLogin = api_smtp_command($socket, 'AUTH LOGIN', [334]);
        if (!$authLogin['ok']) {
            return ['sent' => false, 'error' => 'SMTP AUTH LOGIN fallo: ' . $authLogin['message']];
        }

        $authUser = api_smtp_command($socket, base64_encode($smtpUsername), [334]);
        if (!$authUser['ok']) {
            return ['sent' => false, 'error' => 'SMTP usuario invalido: ' . $authUser['message']];
        }

        $authPass = api_smtp_command($socket, base64_encode($smtpPassword), [235]);
        if (!$authPass['ok']) {
            return ['sent' => false, 'error' => 'SMTP contrasena invalida: ' . $authPass['message']];
        }

        $mailFrom = api_smtp_command($socket, 'MAIL FROM:<' . $fromAddress . '>', [250]);
        if (!$mailFrom['ok']) {
            return ['sent' => false, 'error' => 'SMTP MAIL FROM fallo: ' . $mailFrom['message']];
        }

        $rcptTo = api_smtp_command($socket, 'RCPT TO:<' . $to . '>', [250, 251]);
        if (!$rcptTo['ok']) {
            return ['sent' => false, 'error' => 'SMTP RCPT TO fallo: ' . $rcptTo['message']];
        }

        $data = api_smtp_command($socket, 'DATA', [354]);
        if (!$data['ok']) {
            return ['sent' => false, 'error' => 'SMTP DATA fallo: ' . $data['message']];
        }

        $payload = implode("\r\n", $messageHeaders) . "\r\n\r\n" . $messageBody . "\r\n.";
        if (fwrite($socket, $payload . "\r\n") === false) {
            return ['sent' => false, 'error' => 'No se pudo escribir el cuerpo del correo SMTP'];
        }

        $queued = api_smtp_read($socket);
        if ($queued['code'] !== 250) {
            return ['sent' => false, 'error' => 'SMTP no acepto el mensaje: ' . $queued['message']];
        }

        api_smtp_command($socket, 'QUIT', [221]);
        fclose($socket);

        return ['sent' => true, 'error' => null];
    } catch (Throwable $e) {
        if (is_resource($socket)) {
            fclose($socket);
        }

        return ['sent' => false, 'error' => 'SMTP exception: ' . $e->getMessage()];
    }
}

/**
 * Lee body JSON y retorna array asociativo.
 */
function api_read_json_body(): array
{
    $rawBody = file_get_contents('php://input');

    if ($rawBody === false || trim($rawBody) === '') {
        return [];
    }

    $decoded = json_decode($rawBody, true);

    if (!is_array($decoded)) {
        http_response_code(400);
        echo json_encode(['error' => 'JSON invalido']);
        exit;
    }

    return $decoded;
}

/**
 * Respuesta JSON uniforme.
 */
function api_json_response(array $data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data);
    exit;
}

/**
 * Retorna usuario autenticado actual o null.
 */
function api_current_user(): ?array
{
    api_start_session();

    if (!isset($_SESSION['auth_user']) || !is_array($_SESSION['auth_user'])) {
        return null;
    }

    return $_SESSION['auth_user'];
}

/**
 * Requiere usuario autenticado y retorna sus datos.
 */
function api_require_auth(): array
{
    $user = api_current_user();

    if ($user === null) {
        api_json_response(['error' => 'No autenticado'], 401);
    }

    return $user;
}

/**
 * Determina si el usuario actual es administrador.
 */
function api_user_is_admin(array $user): bool
{
    $roleName = strtolower(trim((string)($user['nombre_rol'] ?? '')));
    return str_contains($roleName, 'admin') || (int)($user['id_rol'] ?? 0) === 1;
}

/**
 * Requiere usuario administrador.
 */
function api_require_admin(): array
{
    $user = api_require_auth();

    if (!api_user_is_admin($user)) {
        api_json_response(['error' => 'No autorizado'], 403);
    }

    return $user;
}

