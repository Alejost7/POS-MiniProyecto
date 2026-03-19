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

    $productStmt = $conn->prepare('SELECT id_producto FROM producto WHERE id_producto = :id LIMIT 1');
    $productStmt->execute([':id' => $idProducto]);
    if (!$productStmt->fetch(PDO::FETCH_ASSOC)) {
        api_json_response(['error' => 'Producto no encontrado'], 404);
    }

    $detailStmt = $conn->prepare('SELECT COUNT(*) FROM detalle_venta WHERE id_producto = :id');
    $detailStmt->execute([':id' => $idProducto]);
    $saleReferences = (int)$detailStmt->fetchColumn();

    $purchaseStmt = $conn->prepare('SELECT COUNT(*) FROM registro_adquisiciones WHERE id_producto = :id');
    $purchaseStmt->execute([':id' => $idProducto]);
    $purchaseReferences = (int)$purchaseStmt->fetchColumn();

    if ($saleReferences > 0 || $purchaseReferences > 0) {
        api_json_response([
            'error' => 'No se puede eliminar el producto porque tiene movimientos asociados',
            'detalle_venta' => $saleReferences,
            'registro_adquisiciones' => $purchaseReferences,
        ], 409);
    }

    $deleteStmt = $conn->prepare('DELETE FROM producto WHERE id_producto = :id');
    $deleteStmt->execute([':id' => $idProducto]);

    api_json_response([
        'message' => 'Producto eliminado correctamente',
        'id_producto' => $idProducto,
    ]);
} catch (Throwable $e) {
    api_json_response(['error' => 'Error interno al eliminar producto'], 500);
}
