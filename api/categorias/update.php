<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/bootstrap.php';

api_bootstrap(['PUT', 'PATCH']);

api_require_admin();

$payload = api_read_json_body();
$idRaw = $payload['id_categoria'] ?? ($_GET['id_categoria'] ?? null);
$idCategoria = filter_var($idRaw, FILTER_VALIDATE_INT);
$nombre = trim((string)($payload['nombre_categoria'] ?? $payload['nombre'] ?? ''));

if ($idCategoria === false || $idCategoria <= 0) {
    api_json_response(['error' => 'id_categoria es obligatorio'], 400);
}

if ($nombre === '') {
    api_json_response(['error' => 'nombre_categoria es obligatorio'], 400);
}

try {
    $conn = api_require_database();

    $existsStmt = $conn->prepare('SELECT id_categoria FROM categoria WHERE id_categoria = :id LIMIT 1');
    $existsStmt->execute([':id' => $idCategoria]);
    if (!$existsStmt->fetch(PDO::FETCH_ASSOC)) {
        api_json_response(['error' => 'Categoria no encontrada'], 404);
    }

    $duplicateStmt = $conn->prepare(
        'SELECT id_categoria
         FROM categoria
         WHERE LOWER(nombre_categoria) = LOWER(:nombre)
           AND id_categoria <> :id
         LIMIT 1'
    );
    $duplicateStmt->execute([
        ':nombre' => $nombre,
        ':id' => $idCategoria,
    ]);
    if ($duplicateStmt->fetch(PDO::FETCH_ASSOC)) {
        api_json_response(['error' => 'Ya existe otra categoria con ese nombre'], 409);
    }

    $updateStmt = $conn->prepare(
        'UPDATE categoria
         SET nombre_categoria = :nombre_categoria
         WHERE id_categoria = :id_categoria'
    );
    $updateStmt->execute([
        ':nombre_categoria' => $nombre,
        ':id_categoria' => $idCategoria,
    ]);

    api_json_response([
        'message' => 'Categoria actualizada correctamente',
        'categoria' => [
            'id_categoria' => $idCategoria,
            'nombre_categoria' => $nombre,
        ],
    ]);
} catch (Throwable $e) {
    api_json_response(['error' => 'Error interno al actualizar categoria'], 500);
}
