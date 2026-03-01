<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/bootstrap.php';

api_bootstrap(['DELETE', 'POST']);

api_require_admin();

$payload = api_read_json_body();
$idRaw = $payload['id_producto'] ?? ($_GET['id_producto'] ?? null);

$idProducto = filter_var($idRaw, FILTER_VALIDATE_INT);
if ($idProducto === false || $idProducto <= 0) {
    api_json_response(['error' => 'id_producto es obligatorio y debe ser entero positivo'], 400);
}

try {
    $conn = api_require_database();

    $columnRows = $conn->query('SHOW COLUMNS FROM producto')->fetchAll(PDO::FETCH_ASSOC);
    $productColumns = array_map(
        static fn(array $row): string => (string)$row['Field'],
        $columnRows
    );

    if (!in_array('estado', $productColumns, true)) {
        api_json_response([
            'error' => 'La tabla producto no tiene columna estado para eliminacion logica',
            'hint' => "ALTER TABLE producto ADD COLUMN estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo'",
        ], 422);
    }

    $stmt = $conn->prepare(
        "UPDATE producto
         SET estado = 'inactivo'
         WHERE id_producto = :id_producto
           AND (estado IS NULL OR estado <> 'inactivo')"
    );
    $stmt->execute([':id_producto' => $idProducto]);

    if ($stmt->rowCount() > 0) {
        api_json_response([
            'message' => 'Producto marcado como inactivo',
            'id_producto' => $idProducto,
        ]);
    }

    $check = $conn->prepare('SELECT id_producto, estado FROM producto WHERE id_producto = :id_producto LIMIT 1');
    $check->execute([':id_producto' => $idProducto]);
    $producto = $check->fetch(PDO::FETCH_ASSOC);

    if (!$producto) {
        api_json_response(['error' => 'Producto no encontrado'], 404);
    }

    api_json_response([
        'message' => 'El producto ya estaba inactivo',
        'id_producto' => $idProducto,
    ]);
} catch (Throwable $e) {
    api_json_response(['error' => 'Error interno al eliminar producto'], 500);
}
