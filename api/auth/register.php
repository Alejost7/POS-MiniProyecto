<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/bootstrap.php';

api_bootstrap(['POST']);
api_require_admin();

$payload = api_read_json_body();

$nombre = trim((string)($payload['nombre'] ?? ''));
$correo = trim((string)($payload['correo'] ?? ''));
$password = (string)($payload['password'] ?? '');
$idRol = (int)($payload['id_rol'] ?? 0);

if ($nombre === '' || $correo === '' || $password === '' || $idRol <= 0) {
    api_json_response(['error' => 'Datos de registro incompletos'], 400);
}

try {
    $conn = api_require_database();

    $roleStmt = $conn->prepare('SELECT id_rol FROM rol WHERE id_rol = :id_rol LIMIT 1');
    $roleStmt->execute([':id_rol' => $idRol]);

    if (!$roleStmt->fetch()) {
        api_json_response(['error' => 'Rol no valido'], 400);
    }

    $existsCorreo = $conn->prepare('SELECT id_usuario FROM usuario WHERE correo = :correo LIMIT 1');
    $existsCorreo->execute([':correo' => $correo]);

    if ($existsCorreo->fetch()) {
        api_json_response(['error' => 'El correo ya esta registrado'], 409);
    }

    $existsNombre = $conn->prepare('SELECT id_usuario FROM usuario WHERE nombre = :nombre LIMIT 1');
    $existsNombre->execute([':nombre' => $nombre]);

    if ($existsNombre->fetch()) {
        api_json_response(['error' => 'El nombre de usuario ya esta registrado'], 409);
    }

    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    $insert = $conn->prepare(
        'INSERT INTO usuario (id_rol, nombre, correo, password)
         VALUES (:id_rol, :nombre, :correo, :password)'
    );

    $insert->execute([
        ':id_rol' => $idRol,
        ':nombre' => $nombre,
        ':correo' => $correo,
        ':password' => $hashedPassword,
    ]);

    api_json_response([
        'message' => 'Usuario registrado correctamente',
        'id_usuario' => (int)$conn->lastInsertId(),
    ], 201);
} catch (Throwable $e) {
    api_json_response(['error' => 'Error interno en registro'], 500);
}
