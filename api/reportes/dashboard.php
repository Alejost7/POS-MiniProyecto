<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/bootstrap.php';

api_bootstrap(['GET']);

api_require_admin();

$periodo = trim((string)($_GET['periodo'] ?? '30'));
$dias = filter_var($periodo, FILTER_VALIDATE_INT);
if ($dias === false || $dias <= 0) {
    $dias = 30;
}

try {
    $conn = api_require_database();

    $totalesStmt = $conn->prepare(
        'SELECT
            COUNT(*) AS total_ventas,
            COALESCE(SUM(v.valor_total), 0) AS ingresos_totales
         FROM ventas v
         WHERE v.estado_venta <> \'anulada\'
           AND v.fecha >= DATE_SUB(NOW(), INTERVAL :dias DAY)'
    );
    $totalesStmt->bindValue(':dias', $dias, PDO::PARAM_INT);
    $totalesStmt->execute();
    $totales = $totalesStmt->fetch(PDO::FETCH_ASSOC) ?: [
        'total_ventas' => 0,
        'ingresos_totales' => 0,
    ];

    $serieStmt = $conn->prepare(
        'SELECT
            DATE(v.fecha) AS fecha,
            COUNT(*) AS ventas,
            COALESCE(SUM(v.valor_total), 0) AS ingresos
         FROM ventas v
         WHERE v.estado_venta <> \'anulada\'
           AND v.fecha >= DATE_SUB(NOW(), INTERVAL :dias DAY)
         GROUP BY DATE(v.fecha)
         ORDER BY DATE(v.fecha) ASC'
    );
    $serieStmt->bindValue(':dias', $dias, PDO::PARAM_INT);
    $serieStmt->execute();

    $topProductoStmt = $conn->prepare(
        'SELECT
            p.id_producto,
            p.nombre_producto,
            SUM(d.cantidad) AS cantidad_vendida,
            COALESCE(SUM(d.subtotal), 0) AS ingresos_generados
         FROM detalle_venta d
         INNER JOIN ventas v ON v.id_venta = d.id_venta
         INNER JOIN producto p ON p.id_producto = d.id_producto
         WHERE v.estado_venta <> \'anulada\'
           AND v.fecha >= DATE_SUB(NOW(), INTERVAL :dias DAY)
         GROUP BY p.id_producto, p.nombre_producto
         ORDER BY cantidad_vendida DESC, ingresos_generados DESC
         LIMIT 1'
    );
    $topProductoStmt->bindValue(':dias', $dias, PDO::PARAM_INT);
    $topProductoStmt->execute();

    $gananciaStmt = $conn->prepare(
        'SELECT
            COALESCE(SUM(d.subtotal), 0) AS ingresos,
            COALESCE(SUM(d.cantidad * costos.costo_promedio), 0) AS costo_estimado
         FROM detalle_venta d
         INNER JOIN ventas v ON v.id_venta = d.id_venta
         LEFT JOIN (
            SELECT
                ra.id_producto,
                SUM(ra.cantidad * ra.precio_unitario_compra) / NULLIF(SUM(ra.cantidad), 0) AS costo_promedio
            FROM registro_adquisiciones ra
            GROUP BY ra.id_producto
         ) costos ON costos.id_producto = d.id_producto
         WHERE v.estado_venta <> \'anulada\'
           AND v.fecha >= DATE_SUB(NOW(), INTERVAL :dias DAY)'
    );
    $gananciaStmt->bindValue(':dias', $dias, PDO::PARAM_INT);
    $gananciaStmt->execute();
    $ganancia = $gananciaStmt->fetch(PDO::FETCH_ASSOC) ?: [
        'ingresos' => 0,
        'costo_estimado' => 0,
    ];

    api_json_response([
        'meta' => ['periodo_dias' => $dias],
        'resumen' => [
            'total_ventas' => (int)$totales['total_ventas'],
            'ingresos_totales' => (float)$totales['ingresos_totales'],
            'ganancia_bruta_estimada' => (float)$ganancia['ingresos'] - (float)$ganancia['costo_estimado'],
        ],
        'serie_ingresos' => $serieStmt->fetchAll(PDO::FETCH_ASSOC),
        'producto_mas_vendido' => $topProductoStmt->fetch(PDO::FETCH_ASSOC) ?: null,
    ]);
} catch (Throwable $e) {
    api_json_response(['error' => 'Error interno al consultar metricas'], 500);
}
