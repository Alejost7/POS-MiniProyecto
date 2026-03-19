<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/bootstrap.php';

api_bootstrap(['PUT', 'PATCH']);

api_require_admin();

$payload = api_read_json_body();
$idRaw = $payload['id_producto'] ?? ($_GET['id_producto'] ?? null);
$idProducto = filter_var($idRaw, FILTER_VALIDATE_INT);

if ($idProducto === false || $idProducto <= 0) {
    api_json_response(['error' => 'id_producto es obligatorio y debe ser entero positivo'], 400);
}

$fields = [];
$params = [':id_producto' => $idProducto];

if (array_key_exists('nombre_producto', $payload) || array_key_exists('nombre', $payload)) {
    $nombre = trim((string)($payload['nombre_producto'] ?? $payload['nombre']));
    if ($nombre === '') {
        api_json_response(['error' => 'El nombre del producto no puede estar vacio'], 400);
    }

    $fields[] = 'nombre_producto = :nombre_producto';
    $params[':nombre_producto'] = $nombre;
}

if (array_key_exists('marca', $payload)) {
    $marca = trim((string)$payload['marca']);
    $fields[] = 'marca = :marca';
    $params[':marca'] = $marca !== '' ? $marca : null;
}

if (array_key_exists('precio_venta', $payload) || array_key_exists('precio', $payload)) {
    $precioRaw = $payload['precio_venta'] ?? $payload['precio'];
    if (!is_numeric((string)$precioRaw)) {
        api_json_response(['error' => 'El precio de venta debe ser numerico'], 400);
    }

    $precio = (float)$precioRaw;
    if ($precio < 0) {
        api_json_response(['error' => 'El precio de venta no puede ser negativo'], 400);
    }

    $fields[] = 'precio_venta = :precio_venta';
    $params[':precio_venta'] = $precio;
}

if (
    array_key_exists('stock_actual', $payload)
    || array_key_exists('stock', $payload)
    || array_key_exists('stock_inicial', $payload)
) {
    $stockRaw = $payload['stock_actual'] ?? $payload['stock'] ?? $payload['stock_inicial'];
    $stock = filter_var($stockRaw, FILTER_VALIDATE_INT);
    if ($stock === false) {
        api_json_response(['error' => 'El stock debe ser un numero entero'], 400);
    }

    if ($stock < 0) {
        api_json_response(['error' => 'El stock no puede ser negativo'], 400);
    }

    $fields[] = 'stock_actual = :stock_actual';
    $params[':stock_actual'] = $stock;
}

if (array_key_exists('descripcion', $payload)) {
    $descripcion = trim((string)$payload['descripcion']);
    $fields[] = 'descripcion = :descripcion';
    $params[':descripcion'] = $descripcion !== '' ? $descripcion : null;
}

$barcodeProvided = array_key_exists('codigo_barras', $payload) || array_key_exists('codigo', $payload);
$barcodeValue = '';
if ($barcodeProvided) {
    $barcodeValue = trim((string)($payload['codigo_barras'] ?? $payload['codigo']));
}

if (array_key_exists('id_proveedor', $payload)) {
    $providerRaw = $payload['id_proveedor'];

    if ($providerRaw === null || $providerRaw === '') {
        $fields[] = 'id_proveedor = :id_proveedor';
        $params[':id_proveedor'] = null;
    } else {
        $idProveedor = filter_var($providerRaw, FILTER_VALIDATE_INT);
        if ($idProveedor === false || $idProveedor <= 0) {
            api_json_response(['error' => 'id_proveedor debe ser entero positivo'], 400);
        }

        $fields[] = 'id_proveedor = :id_proveedor';
        $params[':id_proveedor'] = $idProveedor;
    }
}

if (array_key_exists('id_categoria', $payload)) {
    $categoryRaw = $payload['id_categoria'];

    if ($categoryRaw === null || $categoryRaw === '') {
        api_json_response(['error' => 'id_categoria es obligatorio'], 400);
    } else {
        $idCategoria = filter_var($categoryRaw, FILTER_VALIDATE_INT);
        if ($idCategoria === false || $idCategoria <= 0) {
            api_json_response(['error' => 'id_categoria debe ser entero positivo'], 400);
        }

        $fields[] = 'id_categoria = :id_categoria';
        $params[':id_categoria'] = $idCategoria;
    }
}

try {
    $conn = api_require_database();

    $barcodeColumnStmt = $conn->query(
        "SELECT IS_NULLABLE
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = 'producto'
           AND COLUMN_NAME = 'codigo_barras'
         LIMIT 1"
    );
    $barcodeColumn = $barcodeColumnStmt->fetch(PDO::FETCH_ASSOC);
    $hasBarcodeColumn = $barcodeColumn !== false;
    $barcodeAllowsNull = $hasBarcodeColumn && strtoupper((string)$barcodeColumn['IS_NULLABLE']) === 'YES';

    $productStmt = $conn->prepare('SELECT id_producto FROM producto WHERE id_producto = :id LIMIT 1');
    $productStmt->execute([':id' => $idProducto]);
    if (!$productStmt->fetch(PDO::FETCH_ASSOC)) {
        api_json_response(['error' => 'Producto no encontrado'], 404);
    }

    if (array_key_exists(':id_proveedor', $params) && $params[':id_proveedor'] !== null) {
        $providerStmt = $conn->prepare('SELECT rut_proveedor FROM proveedor WHERE rut_proveedor = :id LIMIT 1');
        $providerStmt->execute([':id' => $params[':id_proveedor']]);
        if (!$providerStmt->fetch(PDO::FETCH_ASSOC)) {
            api_json_response(['error' => 'El proveedor indicado no existe'], 400);
        }
    }

    if (array_key_exists(':id_categoria', $params) && $params[':id_categoria'] !== null) {
        $categoryStmt = $conn->prepare('SELECT id_categoria FROM categoria WHERE id_categoria = :id LIMIT 1');
        $categoryStmt->execute([':id' => $params[':id_categoria']]);
        if (!$categoryStmt->fetch(PDO::FETCH_ASSOC)) {
            api_json_response(['error' => 'La categoria indicada no existe'], 400);
        }
    }

    if ($barcodeProvided) {
        if (!$hasBarcodeColumn) {
            api_json_response(['error' => 'La base de datos actual no soporta codigo_barras'], 400);
        }

        if ($barcodeValue === '' && !$barcodeAllowsNull) {
            api_json_response(['error' => 'codigo_barras es obligatorio en esta base de datos'], 400);
        }

        $fields[] = 'codigo_barras = :codigo_barras';
        $params[':codigo_barras'] = $barcodeValue !== '' ? $barcodeValue : null;
    }

    if ($fields === []) {
        api_json_response(['error' => 'No se enviaron campos para actualizar'], 400);
    }

    $sql = 'UPDATE producto SET ' . implode(', ', $fields) . ' WHERE id_producto = :id_producto';
    $updateStmt = $conn->prepare($sql);
    $updateStmt->execute($params);

    $resultSelect = 'SELECT id_producto, nombre_producto, marca, precio_venta, stock_actual, descripcion, id_proveedor, id_categoria';
    $resultSelect .= $hasBarcodeColumn ? ', codigo_barras' : ', NULL AS codigo_barras';
    $resultSelect .= ' FROM producto WHERE id_producto = :id';
    $resultStmt = $conn->prepare($resultSelect);
    $resultStmt->execute([':id' => $idProducto]);

    api_json_response([
        'message' => 'Producto actualizado correctamente',
        'producto' => $resultStmt->fetch(PDO::FETCH_ASSOC),
    ]);
} catch (Throwable $e) {
    error_log('api/productos/update.php: ' . $e->getMessage());
    api_json_response([
        'error' => 'Error interno al actualizar producto',
        'detail' => $e->getMessage(),
    ], 500);
}
