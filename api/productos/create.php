<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/bootstrap.php';

api_bootstrap(['POST']);

api_require_admin();

$payload = api_read_json_body();

$nombre = trim((string)($payload['nombre_producto'] ?? $payload['nombre'] ?? ''));
$precioRaw = $payload['precio_venta'] ?? $payload['precio'] ?? null;
$stockRaw = $payload['stock_inicial'] ?? $payload['stock_actual'] ?? $payload['stock'] ?? null;
$marca = trim((string)($payload['marca'] ?? ''));
$descripcion = trim((string)($payload['descripcion'] ?? ''));
$codigoBarras = trim((string)($payload['codigo_barras'] ?? $payload['codigo'] ?? ''));
$idProveedorRaw = $payload['id_proveedor'] ?? null;
$idCategoriaRaw = $payload['id_categoria'] ?? null;

if ($nombre === '' || $precioRaw === null || $stockRaw === null) {
    api_json_response([
        'error' => 'Campos obligatorios: nombre, precio_venta y stock_inicial',
    ], 400);
}

if (!is_numeric((string)$precioRaw)) {
    api_json_response(['error' => 'El precio de venta debe ser numerico'], 400);
}

$precio = (float)$precioRaw;
if ($precio < 0) {
    api_json_response(['error' => 'El precio de venta no puede ser negativo'], 400);
}

$stock = filter_var($stockRaw, FILTER_VALIDATE_INT);
if ($stock === false) {
    api_json_response(['error' => 'El stock inicial debe ser un numero entero'], 400);
}

if ($stock < 0) {
    api_json_response(['error' => 'El stock inicial no puede ser negativo'], 400);
}

$idProveedor = null;
if ($idProveedorRaw !== null && $idProveedorRaw !== '') {
    $validatedProvider = filter_var($idProveedorRaw, FILTER_VALIDATE_INT);
    if ($validatedProvider === false || $validatedProvider <= 0) {
        api_json_response(['error' => 'id_proveedor debe ser entero positivo'], 400);
    }

    $idProveedor = $validatedProvider;
}

$idCategoria = null;
if ($idCategoriaRaw !== null && $idCategoriaRaw !== '') {
    $validatedCategory = filter_var($idCategoriaRaw, FILTER_VALIDATE_INT);
    if ($validatedCategory === false || $validatedCategory <= 0) {
        api_json_response(['error' => 'id_categoria debe ser entero positivo'], 400);
    }

    $idCategoria = $validatedCategory;
}

if ($idCategoria === null) {
    api_json_response(['error' => 'id_categoria es obligatorio'], 400);
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

    if ($idProveedor !== null) {
        $providerStmt = $conn->prepare('SELECT rut_proveedor FROM proveedor WHERE rut_proveedor = :id LIMIT 1');
        $providerStmt->execute([':id' => $idProveedor]);
        if (!$providerStmt->fetch(PDO::FETCH_ASSOC)) {
            api_json_response(['error' => 'El proveedor indicado no existe'], 400);
        }
    }

    if ($idCategoria !== null) {
        $categoryStmt = $conn->prepare('SELECT id_categoria FROM categoria WHERE id_categoria = :id LIMIT 1');
        $categoryStmt->execute([':id' => $idCategoria]);
        if (!$categoryStmt->fetch(PDO::FETCH_ASSOC)) {
            api_json_response(['error' => 'La categoria indicada no existe'], 400);
        }
    }

    if ($hasBarcodeColumn && $codigoBarras === '' && !$barcodeAllowsNull) {
        api_json_response(['error' => 'codigo_barras es obligatorio en esta base de datos'], 400);
    }

    $columns = [
        'nombre_producto',
        'marca',
        'precio_venta',
        'stock_actual',
        'descripcion',
        'id_proveedor',
        'id_categoria',
    ];
    $placeholders = [
        ':nombre_producto',
        ':marca',
        ':precio_venta',
        ':stock_actual',
        ':descripcion',
        ':id_proveedor',
        ':id_categoria',
    ];
    $insertParams = [
        ':nombre_producto' => $nombre,
        ':marca' => $marca !== '' ? $marca : null,
        ':precio_venta' => $precio,
        ':stock_actual' => $stock,
        ':descripcion' => $descripcion !== '' ? $descripcion : null,
        ':id_proveedor' => $idProveedor,
        ':id_categoria' => $idCategoria,
    ];

    if ($hasBarcodeColumn) {
        $columns[] = 'codigo_barras';
        $placeholders[] = ':codigo_barras';
        $insertParams[':codigo_barras'] = $codigoBarras !== '' ? $codigoBarras : null;
    }

    $insertStmt = $conn->prepare(
        sprintf(
            'INSERT INTO producto (%s) VALUES (%s)',
            implode(', ', $columns),
            implode(', ', $placeholders)
        )
    );
    $insertStmt->execute($insertParams);

    api_json_response([
        'message' => 'Producto registrado correctamente',
        'producto' => [
            'id_producto' => (int)$conn->lastInsertId(),
            'nombre_producto' => $nombre,
            'marca' => $marca !== '' ? $marca : null,
            'precio_venta' => $precio,
            'stock_actual' => $stock,
            'descripcion' => $descripcion !== '' ? $descripcion : null,
            'id_proveedor' => $idProveedor,
            'id_categoria' => $idCategoria,
            'codigo_barras' => $codigoBarras !== '' ? $codigoBarras : null,
        ],
    ], 201);
} catch (Throwable $e) {
    error_log('api/productos/create.php: ' . $e->getMessage());
    api_json_response([
        'error' => 'Error interno al registrar producto',
        'detail' => $e->getMessage(),
    ], 500);
}
