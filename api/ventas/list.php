<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/bootstrap.php';

api_bootstrap(['GET']);

api_require_auth();

$q = trim((string)($_GET['q'] ?? ''));
$estado = trim((string)($_GET['estado'] ?? ''));
$limitRaw = $_GET['limit'] ?? 50;
$limit = filter_var($limitRaw, FILTER_VALIDATE_INT);

if ($limit === false || $limit <= 0) {
    $limit = 50;
}

$limit = min($limit, 200);

try {
    $conn = api_require_database();

    $sql = 'SELECT
                v.id_venta,
                v.fecha,
                v.id_cliente,
                c.nombre AS nombre_cliente,
                v.id_vendedor,
                u.nombre AS nombre_vendedor,
                v.valor_total,
                v.estado_venta,
                COALESCE(SUM(d.cantidad), 0) AS total_items
            FROM ventas v
            INNER JOIN usuario u ON u.id_usuario = v.id_vendedor
            LEFT JOIN cliente c ON c.cc_cliente = v.id_cliente
            LEFT JOIN detalle_venta d ON d.id_venta = v.id_venta
            WHERE 1=1';

    $params = [];

    if ($estado !== '') {
        $sql .= ' AND v.estado_venta = :estado';
        $params[':estado'] = $estado;
    }

    if ($q !== '') {
        $sql .= ' AND (
            CAST(v.id_venta AS CHAR) LIKE :q
            OR LOWER(COALESCE(c.nombre, \'\')) LIKE :q
            OR LOWER(COALESCE(u.nombre, \'\')) LIKE :q
        )';
        $params[':q'] = '%' . mb_strtolower($q) . '%';
    }

    $sql .= '
        GROUP BY
            v.id_venta,
            v.fecha,
            v.id_cliente,
            c.nombre,
            v.id_vendedor,
            u.nombre,
            v.valor_total,
            v.estado_venta
        ORDER BY v.fecha DESC, v.id_venta DESC
        LIMIT ' . $limit;

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    api_json_response([
        'meta' => [
            'search' => $q,
            'estado' => $estado !== '' ? $estado : null,
            'limit' => $limit,
        ],
        'ventas' => $stmt->fetchAll(PDO::FETCH_ASSOC),
    ]);
} catch (Throwable $e) {
    api_json_response(['error' => 'Error interno al consultar ventas'], 500);
}
