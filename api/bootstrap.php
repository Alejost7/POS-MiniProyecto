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

