<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/bootstrap.php';

api_bootstrap(['POST']);

api_require_admin();

$payload = api_read_json_body();
$nombre = trim((string)($payload['nombre_categoria'] ?? $payload['nombre'] ?? ''));

if ($nombre === '') {
    api_json_response(['error' => 'nombre_categoria es obligatorio'], 400);
}

try {
    $conn = api_require_database();

    $existsStmt = $conn->prepare(
        'SELECT id_categoria FROM categoria WHERE LOWER(nombre_categoria) = LOWER(:nombre) LIMIT 1'
    );
    $existsStmt->execute([':nombre' => $nombre]);

    if ($existsStmt->fetch(PDO::FETCH_ASSOC)) {
        api_json_response(['error' => 'La categoria ya existe'], 409);
    }

    $insertStmt = $conn->prepare(
        'INSERT INTO categoria (nombre_categoria) VALUES (:nombre_categoria)'
    );
    $insertStmt->execute([':nombre_categoria' => $nombre]);

    api_json_response([
        'message' => 'Categoria registrada correctamente',
        'categoria' => [
            'id_categoria' => (int)$conn->lastInsertId(),
            'nombre_categoria' => $nombre,
        ],
    ], 201);
} catch (Throwable $e) {
    api_json_response(['error' => 'Error interno al registrar categoria'], 500);
}
