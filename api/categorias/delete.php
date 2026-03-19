<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/bootstrap.php';

api_bootstrap(['DELETE', 'POST']);

api_require_admin();

$payload = api_read_json_body();
$idRaw = $payload['id_categoria'] ?? ($_GET['id_categoria'] ?? null);
$idCategoria = filter_var($idRaw, FILTER_VALIDATE_INT);

if ($idCategoria === false || $idCategoria <= 0) {
    api_json_response(['error' => 'id_categoria es obligatorio'], 400);
}

try {
    $conn = api_require_database();

    $existsStmt = $conn->prepare('SELECT id_categoria FROM categoria WHERE id_categoria = :id LIMIT 1');
    $existsStmt->execute([':id' => $idCategoria]);
    if (!$existsStmt->fetch(PDO::FETCH_ASSOC)) {
        api_json_response(['error' => 'Categoria no encontrada'], 404);
    }

    $productsStmt = $conn->prepare('SELECT COUNT(*) FROM producto WHERE id_categoria = :id');
    $productsStmt->execute([':id' => $idCategoria]);
    $totalProductos = (int)$productsStmt->fetchColumn();

    if ($totalProductos > 0) {
        api_json_response([
            'error' => 'No se puede eliminar la categoria porque tiene productos asociados',
            'total_productos' => $totalProductos,
        ], 409);
    }

    $deleteStmt = $conn->prepare('DELETE FROM categoria WHERE id_categoria = :id');
    $deleteStmt->execute([':id' => $idCategoria]);

    api_json_response([
        'message' => 'Categoria eliminada correctamente',
        'id_categoria' => $idCategoria,
    ]);
} catch (Throwable $e) {
    api_json_response(['error' => 'Error interno al eliminar categoria'], 500);
}
