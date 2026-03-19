<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/bootstrap.php';

api_bootstrap(['POST']);

api_require_auth();

$payload = api_read_json_body();

$ccRaw = $payload['cc_cliente'] ?? $payload['id'] ?? null;
$nombre = trim((string)($payload['nombre'] ?? ''));
$telefono = trim((string)($payload['telefono'] ?? ''));
$correo = trim((string)($payload['correo'] ?? ''));

$ccCliente = filter_var($ccRaw, FILTER_VALIDATE_INT);
if ($ccCliente === false || $ccCliente <= 0 || $nombre === '') {
    api_json_response(['error' => 'cc_cliente y nombre son obligatorios'], 400);
}

if ($correo !== '' && !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    api_json_response(['error' => 'El correo no es valido'], 400);
}

try {
    $conn = api_require_database();

    $existsStmt = $conn->prepare('SELECT cc_cliente FROM cliente WHERE cc_cliente = :id LIMIT 1');
    $existsStmt->execute([':id' => $ccCliente]);
    if ($existsStmt->fetch(PDO::FETCH_ASSOC)) {
        api_json_response(['error' => 'El cliente ya existe'], 409);
    }

    $insertStmt = $conn->prepare(
        'INSERT INTO cliente (cc_cliente, nombre, telefono, correo)
         VALUES (:cc_cliente, :nombre, :telefono, :correo)'
    );
    $insertStmt->execute([
        ':cc_cliente' => $ccCliente,
        ':nombre' => $nombre,
        ':telefono' => $telefono !== '' ? $telefono : null,
        ':correo' => $correo !== '' ? $correo : null,
    ]);

    api_json_response([
        'message' => 'Cliente registrado correctamente',
        'cliente' => [
            'cc_cliente' => $ccCliente,
            'nombre' => $nombre,
            'telefono' => $telefono !== '' ? $telefono : null,
            'correo' => $correo !== '' ? $correo : null,
        ],
    ], 201);
} catch (Throwable $e) {
    error_log('api/clientes/create.php: ' . $e->getMessage());
    api_json_response([
        'error' => 'Error interno al registrar cliente',
        'detail' => $e->getMessage(),
    ], 500);
}
