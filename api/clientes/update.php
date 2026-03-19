<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/bootstrap.php';

api_bootstrap(['PUT', 'PATCH']);

api_require_auth();

$payload = api_read_json_body();
$ccRaw = $payload['cc_cliente'] ?? ($_GET['cc_cliente'] ?? null);
$ccCliente = filter_var($ccRaw, FILTER_VALIDATE_INT);

if ($ccCliente === false || $ccCliente <= 0) {
    api_json_response(['error' => 'cc_cliente es obligatorio'], 400);
}

$fields = [];
$params = [':cc_cliente' => $ccCliente];

if (array_key_exists('nombre', $payload)) {
    $nombre = trim((string)$payload['nombre']);
    if ($nombre === '') {
        api_json_response(['error' => 'El nombre no puede estar vacio'], 400);
    }
    $fields[] = 'nombre = :nombre';
    $params[':nombre'] = $nombre;
}

if (array_key_exists('telefono', $payload)) {
    $telefono = trim((string)$payload['telefono']);
    $fields[] = 'telefono = :telefono';
    $params[':telefono'] = $telefono !== '' ? $telefono : null;
}

if (array_key_exists('correo', $payload)) {
    $correo = trim((string)$payload['correo']);
    if ($correo !== '' && !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
        api_json_response(['error' => 'El correo no es valido'], 400);
    }
    $fields[] = 'correo = :correo';
    $params[':correo'] = $correo !== '' ? $correo : null;
}

if ($fields === []) {
    api_json_response(['error' => 'No se enviaron campos para actualizar'], 400);
}

try {
    $conn = api_require_database();

    $existsStmt = $conn->prepare('SELECT cc_cliente FROM cliente WHERE cc_cliente = :id LIMIT 1');
    $existsStmt->execute([':id' => $ccCliente]);
    if (!$existsStmt->fetch(PDO::FETCH_ASSOC)) {
        api_json_response(['error' => 'Cliente no encontrado'], 404);
    }

    $updateStmt = $conn->prepare(
        'UPDATE cliente SET ' . implode(', ', $fields) . ' WHERE cc_cliente = :cc_cliente'
    );
    $updateStmt->execute($params);

    $resultStmt = $conn->prepare(
        'SELECT cc_cliente, nombre, telefono, correo
         FROM cliente
         WHERE cc_cliente = :id'
    );
    $resultStmt->execute([':id' => $ccCliente]);

    api_json_response([
        'message' => 'Cliente actualizado correctamente',
        'cliente' => $resultStmt->fetch(PDO::FETCH_ASSOC),
    ]);
} catch (Throwable $e) {
    error_log('api/clientes/update.php: ' . $e->getMessage());
    api_json_response([
        'error' => 'Error interno al actualizar cliente',
        'detail' => $e->getMessage(),
    ], 500);
}
