<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/bootstrap.php';

api_bootstrap(['GET']);

api_require_auth();

try {
    $conn = api_require_database();

    $productos = $conn->query(
        'SELECT id_producto, nombre_producto
         FROM producto
         ORDER BY nombre_producto ASC'
    )->fetchAll(PDO::FETCH_ASSOC);

    $proveedores = $conn->query(
        'SELECT rut_proveedor, nombre
         FROM proveedor
         ORDER BY nombre ASC'
    )->fetchAll(PDO::FETCH_ASSOC);

    $clientes = $conn->query(
        'SELECT cc_cliente, nombre
         FROM cliente
         ORDER BY nombre ASC'
    )->fetchAll(PDO::FETCH_ASSOC);

    $categorias = $conn->query(
        'SELECT id_categoria, nombre_categoria
         FROM categoria
         ORDER BY nombre_categoria ASC'
    )->fetchAll(PDO::FETCH_ASSOC);

    api_json_response([
        'productos' => $productos,
        'proveedores' => $proveedores,
        'clientes' => $clientes,
        'categorias' => $categorias,
    ]);
} catch (Throwable $e) {
    api_json_response(['error' => 'Error interno al consultar catalogos'], 500);
}
