<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/bootstrap.php';

api_bootstrap(['POST']);

$user = api_require_auth();
$payload = api_read_json_body();

$items = $payload['items'] ?? $payload['detalle'] ?? null;
$clientRaw = $payload['id_cliente'] ?? null;
$statusRaw = trim((string)($payload['estado_venta'] ?? 'completada'));

if (!is_array($items) || $items === []) {
    api_json_response(['error' => 'Debes enviar al menos un item de venta'], 400);
}

$allowedStatuses = ['completada', 'pendiente', 'anulada'];
if (!in_array($statusRaw, $allowedStatuses, true)) {
    api_json_response(['error' => 'estado_venta no es valido'], 400);
}

$idCliente = null;
if ($clientRaw !== null && $clientRaw !== '') {
    $idCliente = filter_var($clientRaw, FILTER_VALIDATE_INT);
    if ($idCliente === false || $idCliente <= 0) {
        api_json_response(['error' => 'id_cliente debe ser entero positivo'], 400);
    }
}

$normalizedItems = [];
foreach ($items as $item) {
    if (!is_array($item)) {
        api_json_response(['error' => 'Cada item debe ser un objeto valido'], 400);
    }

    $productRaw = $item['id_producto'] ?? null;
    $quantityRaw = $item['cantidad'] ?? null;

    $idProducto = filter_var($productRaw, FILTER_VALIDATE_INT);
    $cantidad = filter_var($quantityRaw, FILTER_VALIDATE_INT);

    if ($idProducto === false || $idProducto <= 0) {
        api_json_response(['error' => 'Cada item debe incluir id_producto entero positivo'], 400);
    }

    if ($cantidad === false || $cantidad <= 0) {
        api_json_response(['error' => 'Cada item debe incluir cantidad entera positiva'], 400);
    }

    if (!isset($normalizedItems[$idProducto])) {
        $normalizedItems[$idProducto] = [
            'id_producto' => $idProducto,
            'cantidad' => 0,
        ];
    }

    $normalizedItems[$idProducto]['cantidad'] += $cantidad;
}

try {
    $conn = api_require_database();
    $clientName = null;
    $clientEmail = null;

    if ($idCliente !== null) {
        $clientStmt = $conn->prepare('SELECT cc_cliente, nombre, correo FROM cliente WHERE cc_cliente = :id LIMIT 1');
        $clientStmt->execute([':id' => $idCliente]);
        $client = $clientStmt->fetch(PDO::FETCH_ASSOC);
        if (!$client) {
            api_json_response(['error' => 'El cliente indicado no existe'], 400);
        }
        $clientName = (string)$client['nombre'];
        $clientEmail = isset($client['correo']) ? trim((string)$client['correo']) : null;
    }

    $conn->beginTransaction();

    $productStmt = $conn->prepare(
        'SELECT id_producto, nombre_producto, precio_venta, stock_actual
         FROM producto
         WHERE id_producto = :id
         LIMIT 1'
    );
    $saleStmt = $conn->prepare(
        'INSERT INTO ventas (id_cliente, id_vendedor, valor_total, estado_venta)
         VALUES (:id_cliente, :id_vendedor, :valor_total, :estado_venta)'
    );
    $detailStmt = $conn->prepare(
        'INSERT INTO detalle_venta (
            id_venta,
            id_producto,
            cantidad,
            precio_unitario_momento,
            subtotal
        ) VALUES (
            :id_venta,
            :id_producto,
            :cantidad,
            :precio_unitario_momento,
            :subtotal
        )'
    );
    $stockStmt = $conn->prepare(
        'UPDATE producto
         SET stock_actual = stock_actual - :cantidad
         WHERE id_producto = :id_producto'
    );

    $lineItems = [];
    $total = 0.0;

    foreach ($normalizedItems as $item) {
        $productStmt->execute([':id' => $item['id_producto']]);
        $product = $productStmt->fetch(PDO::FETCH_ASSOC);

        if (!$product) {
            $conn->rollBack();
            api_json_response([
                'error' => 'Producto no encontrado en la venta',
                'id_producto' => $item['id_producto'],
            ], 404);
        }

        $stockActual = (int)$product['stock_actual'];
        if ($stockActual < $item['cantidad']) {
            $conn->rollBack();
            api_json_response([
                'error' => 'Stock insuficiente para uno de los productos',
                'id_producto' => (int)$product['id_producto'],
                'nombre_producto' => (string)$product['nombre_producto'],
                'stock_actual' => $stockActual,
                'cantidad_solicitada' => $item['cantidad'],
            ], 409);
        }

        $precioUnitario = (float)$product['precio_venta'];
        $subtotal = $precioUnitario * $item['cantidad'];
        $total += $subtotal;

        $lineItems[] = [
            'id_producto' => (int)$product['id_producto'],
            'nombre_producto' => (string)$product['nombre_producto'],
            'cantidad' => $item['cantidad'],
            'precio_unitario_momento' => $precioUnitario,
            'subtotal' => $subtotal,
        ];
    }

    $saleStmt->execute([
        ':id_cliente' => $idCliente,
        ':id_vendedor' => (int)$user['id_usuario'],
        ':valor_total' => $total,
        ':estado_venta' => $statusRaw,
    ]);

    $idVenta = (int)$conn->lastInsertId();

    foreach ($lineItems as $lineItem) {
        $detailStmt->execute([
            ':id_venta' => $idVenta,
            ':id_producto' => $lineItem['id_producto'],
            ':cantidad' => $lineItem['cantidad'],
            ':precio_unitario_momento' => $lineItem['precio_unitario_momento'],
            ':subtotal' => $lineItem['subtotal'],
        ]);

        $stockStmt->execute([
            ':cantidad' => $lineItem['cantidad'],
            ':id_producto' => $lineItem['id_producto'],
        ]);
    }

    $conn->commit();

    $emailDelivery = [
        'attempted' => false,
        'sent' => false,
        'error' => null,
    ];
    if ($idCliente !== null && api_is_valid_email($clientEmail)) {
        $emailDelivery['attempted'] = true;

        $businessName = 'M&H Super Market';
        $customerName = $clientName !== null && $clientName !== '' ? $clientName : 'Cliente';
        $saleDate = date('Y-m-d H:i:s');
        $itemsHtml = '';
        $itemsText = [];

        foreach ($lineItems as $lineItem) {
            $productName = api_escape_html((string)$lineItem['nombre_producto']);
            $quantity = (int)$lineItem['cantidad'];
            $unitPrice = number_format((float)$lineItem['precio_unitario_momento'], 2, '.', ',');
            $subtotalFormatted = number_format((float)$lineItem['subtotal'], 2, '.', ',');

            $itemsHtml .= '<tr>'
                . '<td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">' . $productName . '</td>'
                . '<td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">' . $quantity . '</td>'
                . '<td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">$' . $unitPrice . '</td>'
                . '<td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">$' . $subtotalFormatted . '</td>'
                . '</tr>';

            $itemsText[] = sprintf(
                '- %s | Cantidad: %d | Unitario: $%s | Subtotal: $%s',
                (string)$lineItem['nombre_producto'],
                $quantity,
                $unitPrice,
                $subtotalFormatted
            );
        }

        $formattedTotal = number_format($total, 2, '.', ',');
        $subject = sprintf('Confirmacion de compra #%d', $idVenta);
        $htmlBody = '<!doctype html><html lang="es"><body style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827;">'
            . '<div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">'
            . '<div style="background:#0f766e;color:#ffffff;padding:24px 28px;">'
            . '<h1 style="margin:0;font-size:24px;">' . api_escape_html($businessName) . '</h1>'
            . '<p style="margin:8px 0 0;font-size:14px;opacity:.9;">Confirmacion automatica de venta</p>'
            . '</div>'
            . '<div style="padding:28px;">'
            . '<p style="margin:0 0 16px;font-size:16px;">Hola <strong>' . api_escape_html($customerName) . '</strong>,</p>'
            . '<p style="margin:0 0 20px;line-height:1.6;">Tu compra fue registrada correctamente. Te compartimos el resumen de la transaccion para tu respaldo.</p>'
            . '<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-bottom:20px;">'
            . '<p style="margin:0 0 8px;"><strong>ID de venta:</strong> #' . $idVenta . '</p>'
            . '<p style="margin:0 0 8px;"><strong>Fecha:</strong> ' . api_escape_html($saleDate) . '</p>'
            . '<p style="margin:0;"><strong>Estado:</strong> ' . api_escape_html(ucfirst($statusRaw)) . '</p>'
            . '</div>'
            . '<table style="width:100%;border-collapse:collapse;font-size:14px;">'
            . '<thead><tr style="background:#f3f4f6;text-align:left;">'
            . '<th style="padding:10px 12px;">Producto</th>'
            . '<th style="padding:10px 12px;text-align:center;">Cant.</th>'
            . '<th style="padding:10px 12px;text-align:right;">Unitario</th>'
            . '<th style="padding:10px 12px;text-align:right;">Subtotal</th>'
            . '</tr></thead>'
            . '<tbody>' . $itemsHtml . '</tbody>'
            . '</table>'
            . '<div style="margin-top:20px;padding-top:16px;border-top:2px solid #e5e7eb;text-align:right;">'
            . '<p style="margin:0;font-size:18px;"><strong>Total: $' . $formattedTotal . '</strong></p>'
            . '</div>'
            . '<p style="margin:24px 0 0;color:#4b5563;font-size:13px;line-height:1.6;">Este correo fue generado automaticamente por el sistema POS.</p>'
            . '</div></div></body></html>';

        $textBody = implode("\n", [
            $businessName,
            'Confirmacion automatica de venta',
            '',
            'Hola ' . $customerName . ',',
            'Tu compra fue registrada correctamente.',
            '',
            'ID de venta: #' . $idVenta,
            'Fecha: ' . $saleDate,
            'Estado: ' . ucfirst($statusRaw),
            '',
            'Detalle:',
            implode("\n", $itemsText),
            '',
            'Total: $' . $formattedTotal,
        ]);

        $emailDelivery = api_send_email($clientEmail, $subject, $htmlBody, $textBody);
        $emailDelivery['attempted'] = true;
    } elseif ($idCliente !== null && $clientEmail !== null && trim($clientEmail) !== '') {
        $emailDelivery = [
            'attempted' => true,
            'sent' => false,
            'error' => 'El cliente tiene un correo invalido',
        ];
    }

    api_json_response([
        'message' => 'Venta registrada correctamente',
        'venta' => [
            'id_venta' => $idVenta,
            'fecha' => date('Y-m-d H:i:s'),
            'id_cliente' => $idCliente,
            'nombre_cliente' => $clientName,
            'id_vendedor' => (int)$user['id_usuario'],
            'valor_total' => $total,
            'estado_venta' => $statusRaw,
            'items' => $lineItems,
        ],
        'email' => $emailDelivery,
    ], 201);
} catch (Throwable $e) {
    if (isset($conn) && $conn instanceof PDO && $conn->inTransaction()) {
        $conn->rollBack();
    }

    api_json_response([
        'error' => 'Error interno al registrar la venta',
        'detail' => $e->getMessage(),
    ], 500);
}
