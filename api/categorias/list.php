<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/bootstrap.php';

api_bootstrap(['GET']);

api_require_auth();

$q = trim((string)($_GET['q'] ?? ''));

try {
    $conn = api_require_database();

    $sql = 'SELECT
                c.id_categoria,
                c.nombre_categoria,
                COUNT(p.id_producto) AS total_productos
            FROM categoria c
            LEFT JOIN producto p ON p.id_categoria = c.id_categoria
            WHERE 1=1';

    $params = [];

    if ($q !== '') {
        $sql .= ' AND (
            CAST(c.id_categoria AS CHAR) LIKE :q_id
            OR LOWER(c.nombre_categoria) LIKE :q
        )';
        $params[':q'] = '%' . mb_strtolower($q) . '%';
        $params[':q_id'] = '%' . $q . '%';
    }

    $sql .= '
        GROUP BY c.id_categoria, c.nombre_categoria
        ORDER BY c.nombre_categoria ASC';

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    api_json_response([
        'meta' => ['search' => $q],
        'categorias' => $stmt->fetchAll(PDO::FETCH_ASSOC),
    ]);
} catch (Throwable $e) {
    api_json_response(['error' => 'Error interno al consultar categorias'], 500);
}
