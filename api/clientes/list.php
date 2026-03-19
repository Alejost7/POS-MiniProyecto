<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/bootstrap.php';

api_bootstrap(['GET']);

api_require_auth();

$q = trim((string)($_GET['q'] ?? ''));

try {
    $conn = api_require_database();

    $sql = 'SELECT
                c.cc_cliente,
                c.nombre,
                c.telefono,
                c.correo,
                COUNT(v.id_venta) AS total_ventas,
                COALESCE(SUM(v.valor_total), 0) AS total_compras
            FROM cliente c
            LEFT JOIN ventas v
                ON v.id_cliente = c.cc_cliente
               AND v.estado_venta <> \'anulada\'
            WHERE 1=1';

    $params = [];

    if ($q !== '') {
        $sql .= ' AND (
            CAST(c.cc_cliente AS CHAR) LIKE :q_id
            OR LOWER(c.nombre) LIKE :q
            OR LOWER(COALESCE(c.telefono, \'\')) LIKE :q
            OR LOWER(COALESCE(c.correo, \'\')) LIKE :q
        )';
        $params[':q'] = '%' . mb_strtolower($q) . '%';
        $params[':q_id'] = '%' . $q . '%';
    }

    $sql .= '
        GROUP BY c.cc_cliente, c.nombre, c.telefono, c.correo
        ORDER BY c.nombre ASC';

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    api_json_response([
        'meta' => ['search' => $q],
        'clientes' => $stmt->fetchAll(PDO::FETCH_ASSOC),
    ]);
} catch (Throwable $e) {
    api_json_response(['error' => 'Error interno al consultar clientes'], 500);
}
