<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/bootstrap.php';

api_bootstrap(['DELETE', 'POST']);

api_require_auth();

$payload = api_read_json_body();
$ccRaw = $payload['cc_cliente'] ?? ($_GET['cc_cliente'] ?? null);
$ccCliente = filter_var($ccRaw, FILTER_VALIDATE_INT);

if ($ccCliente === false || $ccCliente <= 0) {
    api_json_response(['error' => 'cc_cliente es obligatorio'], 400);
}

try {
    $conn = api_require_database();

    $existsStmt = $conn->prepare('SELECT cc_cliente FROM cliente WHERE cc_cliente = :id LIMIT 1');
    $existsStmt->execute([':id' => $ccCliente]);
    if (!$existsStmt->fetch(PDO::FETCH_ASSOC)) {
        api_json_response(['error' => 'Cliente no encontrado'], 404);
    }

    $salesStmt = $conn->prepare('SELECT COUNT(*) FROM ventas WHERE id_cliente = :id');
    $salesStmt->execute([':id' => $ccCliente]);
    if ((int)$salesStmt->fetchColumn() > 0) {
        api_json_response(['error' => 'No se puede eliminar el cliente porque tiene ventas asociadas'], 409);
    }

    $deleteStmt = $conn->prepare('DELETE FROM cliente WHERE cc_cliente = :id');
    $deleteStmt->execute([':id' => $ccCliente]);

    api_json_response([
        'message' => 'Cliente eliminado correctamente',
        'cc_cliente' => $ccCliente,
    ]);
} catch (Throwable $e) {
    api_json_response(['error' => 'Error interno al eliminar cliente'], 500);
}
