<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/bootstrap.php';

api_bootstrap(['POST']);

api_require_auth();

$payload = api_read_json_body();

$fecha = trim((string)($payload['fecha'] ?? ''));
$idProducto = filter_var($payload['id_producto'] ?? null, FILTER_VALIDATE_INT);
$idProveedor = filter_var($payload['id_proveedor'] ?? null, FILTER_VALIDATE_INT);
$cantidad = filter_var($payload['cantidad'] ?? null, FILTER_VALIDATE_INT);
$precioRaw = $payload['precio_unitario_compra'] ?? null;

if ($fecha === '' || $idProducto === false || $idProducto <= 0 || $idProveedor === false || $idProveedor <= 0 || $cantidad === false || $cantidad <= 0 || !is_numeric((string)$precioRaw)) {
    api_json_response(['error' => 'Datos de compra incompletos o invalidos'], 400);
}

$precio = (float)$precioRaw;
if ($precio < 0) {
    api_json_response(['error' => 'El precio unitario no puede ser negativo'], 400);
}

try {
    $conn = api_require_database();

    $productStmt = $conn->prepare('SELECT id_producto FROM producto WHERE id_producto = :id LIMIT 1');
    $productStmt->execute([':id' => $idProducto]);
    if (!$productStmt->fetch(PDO::FETCH_ASSOC)) {
        api_json_response(['error' => 'El producto indicado no existe'], 400);
    }

    $providerStmt = $conn->prepare('SELECT rut_proveedor FROM proveedor WHERE rut_proveedor = :id LIMIT 1');
    $providerStmt->execute([':id' => $idProveedor]);
    if (!$providerStmt->fetch(PDO::FETCH_ASSOC)) {
        api_json_response(['error' => 'El proveedor indicado no existe'], 400);
    }

    $conn->beginTransaction();

    $insertStmt = $conn->prepare(
        'INSERT INTO registro_adquisiciones (
            fecha,
            id_producto,
            id_proveedor,
            cantidad,
            precio_unitario_compra
         ) VALUES (
            :fecha,
            :id_producto,
            :id_proveedor,
            :cantidad,
            :precio_unitario_compra
         )'
    );
    $insertStmt->execute([
        ':fecha' => $fecha,
        ':id_producto' => $idProducto,
        ':id_proveedor' => $idProveedor,
        ':cantidad' => $cantidad,
        ':precio_unitario_compra' => $precio,
    ]);

    $stockStmt = $conn->prepare(
        'UPDATE producto
         SET stock_actual = stock_actual + :cantidad
         WHERE id_producto = :id_producto'
    );
    $stockStmt->execute([
        ':cantidad' => $cantidad,
        ':id_producto' => $idProducto,
    ]);

    $conn->commit();

    api_json_response([
        'message' => 'Compra registrada correctamente',
        'id_compra' => (int)$conn->lastInsertId(),
    ], 201);
} catch (Throwable $e) {
    if (isset($conn) && $conn instanceof PDO && $conn->inTransaction()) {
        $conn->rollBack();
    }

    api_json_response(['error' => 'Error interno al registrar compra'], 500);
}
