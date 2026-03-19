<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/bootstrap.php';

api_bootstrap(['DELETE', 'POST']);

api_require_auth();

$payload = api_read_json_body();
$idCompra = filter_var($payload['id_compra'] ?? ($_GET['id_compra'] ?? null), FILTER_VALIDATE_INT);

if ($idCompra === false || $idCompra <= 0) {
    api_json_response(['error' => 'id_compra es obligatorio'], 400);
}

try {
    $conn = api_require_database();

    $purchaseStmt = $conn->prepare(
        'SELECT id_compra, id_producto, cantidad
         FROM registro_adquisiciones
         WHERE id_compra = :id
         LIMIT 1'
    );
    $purchaseStmt->execute([':id' => $idCompra]);
    $purchase = $purchaseStmt->fetch(PDO::FETCH_ASSOC);

    if (!$purchase) {
        api_json_response(['error' => 'Compra no encontrada'], 404);
    }

    $productStmt = $conn->prepare('SELECT stock_actual FROM producto WHERE id_producto = :id LIMIT 1');
    $productStmt->execute([':id' => (int)$purchase['id_producto']]);
    $product = $productStmt->fetch(PDO::FETCH_ASSOC);

    if (!$product) {
        api_json_response(['error' => 'El producto asociado no existe'], 409);
    }

    if ((int)$product['stock_actual'] < (int)$purchase['cantidad']) {
        api_json_response(['error' => 'No se puede eliminar la compra porque el stock actual es menor que la cantidad comprada'], 409);
    }

    $conn->beginTransaction();

    $stockStmt = $conn->prepare(
        'UPDATE producto
         SET stock_actual = stock_actual - :cantidad
         WHERE id_producto = :id_producto'
    );
    $stockStmt->execute([
        ':cantidad' => (int)$purchase['cantidad'],
        ':id_producto' => (int)$purchase['id_producto'],
    ]);

    $deleteStmt = $conn->prepare('DELETE FROM registro_adquisiciones WHERE id_compra = :id');
    $deleteStmt->execute([':id' => $idCompra]);

    $conn->commit();

    api_json_response([
        'message' => 'Compra eliminada correctamente',
        'id_compra' => $idCompra,
    ]);
} catch (Throwable $e) {
    if (isset($conn) && $conn instanceof PDO && $conn->inTransaction()) {
        $conn->rollBack();
    }

    api_json_response(['error' => 'Error interno al eliminar compra'], 500);
}
