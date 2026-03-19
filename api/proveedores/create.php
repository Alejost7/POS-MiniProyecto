<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/bootstrap.php';

api_bootstrap(['POST']);

api_require_auth();

$payload = api_read_json_body();

$rutRaw = $payload['rut_proveedor'] ?? $payload['id'] ?? null;
$nombre = trim((string)($payload['nombre'] ?? ''));
$telefono = trim((string)($payload['telefono'] ?? ''));
$correo = trim((string)($payload['correo'] ?? ''));

$rutProveedor = filter_var($rutRaw, FILTER_VALIDATE_INT);
if ($rutProveedor === false || $rutProveedor <= 0 || $nombre === '') {
    api_json_response(['error' => 'rut_proveedor y nombre son obligatorios'], 400);
}

if ($correo !== '' && !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    api_json_response(['error' => 'El correo no es valido'], 400);
}

try {
    $conn = api_require_database();

    $existsStmt = $conn->prepare('SELECT rut_proveedor FROM proveedor WHERE rut_proveedor = :id LIMIT 1');
    $existsStmt->execute([':id' => $rutProveedor]);
    if ($existsStmt->fetch(PDO::FETCH_ASSOC)) {
        api_json_response(['error' => 'El proveedor ya existe'], 409);
    }

    $insertStmt = $conn->prepare(
        'INSERT INTO proveedor (rut_proveedor, nombre, telefono, correo)
         VALUES (:rut_proveedor, :nombre, :telefono, :correo)'
    );
    $insertStmt->execute([
        ':rut_proveedor' => $rutProveedor,
        ':nombre' => $nombre,
        ':telefono' => $telefono !== '' ? $telefono : null,
        ':correo' => $correo !== '' ? $correo : null,
    ]);

    api_json_response([
        'message' => 'Proveedor registrado correctamente',
        'proveedor' => [
            'rut_proveedor' => $rutProveedor,
            'nombre' => $nombre,
            'telefono' => $telefono !== '' ? $telefono : null,
            'correo' => $correo !== '' ? $correo : null,
        ],
    ], 201);
} catch (Throwable $e) {
    error_log('api/proveedores/create.php: ' . $e->getMessage());
    api_json_response([
        'error' => 'Error interno al registrar proveedor',
        'detail' => $e->getMessage(),
    ], 500);
}
