<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/bootstrap.php';

api_bootstrap(['GET']);

$user = api_require_auth();

$q = trim((string)($_GET['q'] ?? ''));
$includeInactive = (string)($_GET['include_inactive'] ?? '0') === '1';

try {
    $conn = api_require_database();

    $columnRows = $conn->query('SHOW COLUMNS FROM producto')->fetchAll(PDO::FETCH_ASSOC);
    $productColumns = array_map(
        static fn(array $row): string => (string)$row['Field'],
        $columnRows
    );

    $codeColumn = null;
    foreach (['codigo_barras', 'sku', 'codigo', 'codigo_barra', 'barcode'] as $candidate) {
        if (in_array($candidate, $productColumns, true)) {
            $codeColumn = $candidate;
            break;
        }
    }

    $hasEstado = in_array('estado', $productColumns, true);

    $selectCode = $codeColumn !== null
        ? "p.{$codeColumn} AS codigo_barras"
        : 'CAST(NULL AS CHAR) AS codigo_barras';

    $sql = "SELECT
                p.id_producto,
                {$selectCode},
                p.nombre_producto,
                p.marca,
                p.precio_venta,
                p.stock_actual,
                p.descripcion";

    if ($hasEstado) {
        $sql .= ', p.estado';
    }

    $sql .= ' FROM producto p WHERE 1=1';

    $params = [];

    if ($hasEstado && !$includeInactive) {
        $sql .= " AND (p.estado IS NULL OR p.estado <> 'inactivo')";
    }

    if ($q !== '') {
        $sql .= ' AND (LOWER(p.nombre_producto) LIKE :q_nombre';
        $params[':q_nombre'] = '%' . mb_strtolower($q) . '%';

        if ($codeColumn !== null) {
            $sql .= " OR LOWER(COALESCE(p.{$codeColumn}, '')) LIKE :q_codigo";
            $params[':q_codigo'] = '%' . mb_strtolower($q) . '%';
        }

        $sql .= ')';
    }

    $sql .= ' ORDER BY p.nombre_producto ASC';

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $productos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    api_json_response([
        'user' => [
            'id_usuario' => (int)$user['id_usuario'],
            'id_rol' => (int)$user['id_rol'],
            'nombre_rol' => (string)$user['nombre_rol'],
        ],
        'meta' => [
            'search' => $q,
            'include_inactive' => $includeInactive,
            'has_estado' => $hasEstado,
            'has_codigo_barras' => $codeColumn !== null,
            'code_column' => $codeColumn,
        ],
        'productos' => $productos,
    ]);
} catch (Throwable $e) {
    api_json_response(['error' => 'Error interno al consultar inventario'], 500);
}
