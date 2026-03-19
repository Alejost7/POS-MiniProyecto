<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/bootstrap.php';

api_bootstrap(['GET']);

$user = api_require_auth();
$q = trim((string)($_GET['q'] ?? ''));

try {
    $conn = api_require_database();

    $barcodeColumnStmt = $conn->query(
        "SELECT 1
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'producto'
           AND COLUMN_NAME = 'codigo_barras'
         LIMIT 1"
    );
    $hasBarcodeColumn = $barcodeColumnStmt->fetch(PDO::FETCH_ASSOC) !== false;

    $selectFields = [
        'p.id_producto',
        'p.nombre_producto',
        'p.marca',
        'p.precio_venta',
        'p.stock_actual',
        'p.descripcion',
        'p.id_proveedor',
        'p.id_categoria',
        'c.nombre_categoria',
    ];
    if ($hasBarcodeColumn) {
        $selectFields[] = 'p.codigo_barras';
    } else {
        $selectFields[] = 'NULL AS codigo_barras';
    }

    $sql = 'SELECT
                ' . implode(",
                ", $selectFields) . '
            FROM producto p
            LEFT JOIN categoria c ON c.id_categoria = p.id_categoria
            WHERE 1=1';

    $params = [];

    if ($q !== '') {
        $sql .= ' AND (
            LOWER(p.nombre_producto) LIKE :q
            OR LOWER(COALESCE(p.marca, \'\')) LIKE :q
            OR LOWER(COALESCE(p.descripcion, \'\')) LIKE :q
            OR LOWER(COALESCE(c.nombre_categoria, \'\')) LIKE :q
            OR CAST(p.id_producto AS CHAR) LIKE :q_id
        )';
        $params[':q'] = '%' . mb_strtolower($q) . '%';
        $params[':q_id'] = '%' . $q . '%';
    }

    $sql .= ' ORDER BY p.nombre_producto ASC';

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    api_json_response([
        'user' => [
            'id_usuario' => (int)$user['id_usuario'],
            'id_rol' => (int)$user['id_rol'],
            'nombre_rol' => (string)$user['nombre_rol'],
        ],
        'meta' => [
            'search' => $q,
        ],
        'productos' => $stmt->fetchAll(PDO::FETCH_ASSOC),
    ]);
} catch (Throwable $e) {
    api_json_response(['error' => 'Error interno al consultar inventario'], 500);
}
