<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/bootstrap.php';

api_bootstrap(['POST']);

$user = api_require_auth();
$roleName = strtolower(trim((string)($user['nombre_rol'] ?? '')));
$isAdmin = str_contains($roleName, 'admin') || (int)($user['id_rol'] ?? 0) === 1;

if (!$isAdmin) {
    api_json_response(['error' => 'No autorizado para registrar productos'], 403);
}

$payload = api_read_json_body();

$codigo = trim((string)($payload['codigo'] ?? $payload['sku'] ?? $payload['codigo_barras'] ?? ''));
$nombre = trim((string)($payload['nombre_producto'] ?? $payload['nombre'] ?? ''));
$precioRaw = $payload['precio_venta'] ?? $payload['precio'] ?? null;
$stockRaw = $payload['stock_inicial'] ?? $payload['stock_actual'] ?? $payload['stock'] ?? null;
$marca = trim((string)($payload['marca'] ?? ''));
$descripcion = trim((string)($payload['descripcion'] ?? ''));
$idProveedorRaw = $payload['id_proveedor'] ?? null;

if ($codigo === '' || $nombre === '' || $precioRaw === null || $stockRaw === null) {
    api_json_response([
        'error' => 'Campos obligatorios: codigo, nombre, precio_venta y stock_inicial',
    ], 400);
}

if (!is_numeric((string)$precioRaw)) {
    api_json_response(['error' => 'El precio de venta debe ser numérico'], 400);
}

$precio = (float)$precioRaw;
if ($precio < 0) {
    api_json_response(['error' => 'El precio de venta no puede ser negativo'], 400);
}

$stock = filter_var($stockRaw, FILTER_VALIDATE_INT);
if ($stock === false) {
    api_json_response(['error' => 'El stock inicial debe ser un número entero'], 400);
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

try {
    $conn = api_require_database();

    $columnRows = $conn->query('SHOW COLUMNS FROM producto')->fetchAll(PDO::FETCH_ASSOC);
    $productColumns = array_map(
        static fn(array $row): string => (string)$row['Field'],
        $columnRows
    );

    $codeColumn = null;
    foreach (['sku', 'codigo', 'codigo_barra', 'codigo_barras', 'barcode'] as $candidate) {
        if (in_array($candidate, $productColumns, true)) {
            $codeColumn = $candidate;
            break;
        }
    }

    if ($codeColumn === null) {
        api_json_response([
            'error' => 'La tabla producto no tiene columna para código único (ej: sku o codigo).',
        ], 422);
    }

    $existsStmt = $conn->prepare("SELECT id_producto FROM producto WHERE {$codeColumn} = :codigo LIMIT 1");
    $existsStmt->execute([':codigo' => $codigo]);

    if ($existsStmt->fetch(PDO::FETCH_ASSOC)) {
        api_json_response(['error' => 'El código del producto ya existe'], 409);
    }

    $insertColumns = [$codeColumn, 'nombre_producto', 'precio_venta', 'stock_actual'];
    $insertPlaceholders = [':codigo', ':nombre_producto', ':precio_venta', ':stock_actual'];
    $insertParams = [
        ':codigo' => $codigo,
        ':nombre_producto' => $nombre,
        ':precio_venta' => $precio,
        ':stock_actual' => $stock,
    ];

    if (in_array('marca', $productColumns, true)) {
        $insertColumns[] = 'marca';
        $insertPlaceholders[] = ':marca';
        $insertParams[':marca'] = ($marca === '') ? null : $marca;
    }

    if (in_array('descripcion', $productColumns, true)) {
        $insertColumns[] = 'descripcion';
        $insertPlaceholders[] = ':descripcion';
        $insertParams[':descripcion'] = ($descripcion === '') ? null : $descripcion;
    }

    if (in_array('id_proveedor', $productColumns, true)) {
        $insertColumns[] = 'id_proveedor';
        $insertPlaceholders[] = ':id_proveedor';
        $insertParams[':id_proveedor'] = $idProveedor;
    }

    $sql = sprintf(
        'INSERT INTO producto (%s) VALUES (%s)',
        implode(', ', $insertColumns),
        implode(', ', $insertPlaceholders)
    );

    $insertStmt = $conn->prepare($sql);
    $insertStmt->execute($insertParams);

    api_json_response([
        'message' => 'Producto registrado correctamente',
        'producto' => [
            'id_producto' => (int)$conn->lastInsertId(),
            'codigo' => $codigo,
            'nombre_producto' => $nombre,
            'precio_venta' => $precio,
            'stock_actual' => $stock,
        ],
    ], 201);
} catch (Throwable $e) {
    api_json_response(['error' => 'Error interno al registrar producto'], 500);
}
