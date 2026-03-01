<?php
declare(strict_types=1);

$localConfigPath = __DIR__ . DIRECTORY_SEPARATOR . 'database.local.php';
if (file_exists($localConfigPath)) {
    require $localConfigPath;
}

$host = $host ?? (getenv('DB_HOST') ?: '');
$db_name = $db_name ?? (getenv('DB_NAME') ?: '');
$username = $username ?? (getenv('DB_USER') ?: '');
$password = $password ?? (getenv('DB_PASS') ?: '');
$port = $port ?? (getenv('DB_PORT') ?: '3306');

if ($host === '' || $db_name === '' || $username === '' || $password === '') {
    http_response_code(500);
    echo json_encode(['error' => 'Configuracion de base de datos incompleta']);
    exit;
}

try {
    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $db_name);

    $conn = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de conexion a la base de datos']);
    exit;
}
