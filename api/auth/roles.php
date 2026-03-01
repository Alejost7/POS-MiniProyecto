<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/bootstrap.php';

api_bootstrap(['GET']);

api_require_admin();

try {
    $conn = api_require_database();

    $roles = $conn->query(
        'SELECT id_rol, nombre_rol FROM rol ORDER BY nombre_rol ASC'
    )->fetchAll(PDO::FETCH_ASSOC);

    api_json_response(['roles' => $roles]);
} catch (Throwable $e) {
    api_json_response(['error' => 'Error interno al consultar roles'], 500);
}
