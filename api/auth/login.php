<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/bootstrap.php';

api_bootstrap(['POST']);

$payload = api_read_json_body();
$correo = trim((string)($payload['correo'] ?? ''));
$password = (string)($payload['password'] ?? '');

if ($correo === '' || $password === '') {
    api_json_response(['error' => 'Correo y contraseña son obligatorios'], 400);
}

try {
    $conn = api_require_database();

    $query = $conn->prepare(
        'SELECT u.id_usuario, u.nombre, u.correo, u.password, u.id_rol, r.nombre_rol
            FROM usuario u
            INNER JOIN rol r ON r.id_rol = u.id_rol
            WHERE u.correo = :correo
            LIMIT 1'
    );
    $query->execute([':correo' => $correo]);
    $user = $query->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        api_json_response(['error' => 'Usuario o contraseña incorrectos'], 401);
    }

    $storedPassword = (string)$user['password'];
    $isValidPassword = password_verify($password, $storedPassword) || hash_equals($storedPassword, $password);

    if (!$isValidPassword) {
        api_json_response(['error' => 'Usuario o contraseña incorrectos'], 401);
    }

    api_start_session();
    session_regenerate_id(true);

    $_SESSION['auth_user'] = [
        'id_usuario' => (int)$user['id_usuario'],
        'id_rol' => (int)$user['id_rol'],
        'nombre_rol' => (string)$user['nombre_rol'],
        'nombre' => (string)$user['nombre'],
        'correo' => (string)$user['correo'],
    ];

    api_json_response([
        'message' => 'Login exitoso',
        'user' => $_SESSION['auth_user'],
    ]);
} catch (Throwable $e) {
    api_json_response(['error' => 'Error interno en autenticación'], 500);
}
