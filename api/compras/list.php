<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/bootstrap.php';

api_bootstrap(['GET']);

api_require_auth();

$q = trim((string)($_GET['q'] ?? ''));

try {
    $conn = api_require_database();

    $sql = 'SELECT
                ra.id_compra,
                ra.fecha,
                ra.id_producto,
                p.nombre_producto,
                ra.id_proveedor,
                pr.nombre AS nombre_proveedor,
                ra.cantidad,
                ra.precio_unitario_compra,
                (ra.cantidad * ra.precio_unitario_compra) AS total_compra
            FROM registro_adquisiciones ra
            INNER JOIN producto p ON p.id_producto = ra.id_producto
            INNER JOIN proveedor pr ON pr.rut_proveedor = ra.id_proveedor
            WHERE 1=1';

    $params = [];

    if ($q !== '') {
        $sql .= ' AND (
            CAST(ra.id_compra AS CHAR) LIKE :q_id
            OR LOWER(p.nombre_producto) LIKE :q
            OR LOWER(pr.nombre) LIKE :q
        )';
        $params[':q'] = '%' . mb_strtolower($q) . '%';
        $params[':q_id'] = '%' . $q . '%';
    }

    $sql .= ' ORDER BY ra.fecha DESC, ra.id_compra DESC';

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    api_json_response([
        'meta' => ['search' => $q],
        'compras' => $stmt->fetchAll(PDO::FETCH_ASSOC),
    ]);
} catch (Throwable $e) {
    api_json_response(['error' => 'Error interno al consultar compras'], 500);
}
