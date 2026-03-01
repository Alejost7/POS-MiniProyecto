# POS-MiniProyecto
Miniproyecto de Procesos y Diseno de Software para un sistema POS web.

## Estado del proyecto

### Historias de usuario implementadas (Sprint 1)
- `HU-001` Autenticacion de usuarios (login con sesion por cookie y persistencia al recargar).
- `HU-002` Gestion de roles y permisos.
- `HU-003` Diseño de Prototipo de Alta Fidelidad (UI/UX)
- `HU-004` Diseñar e implementar la base de datos 
- `HU-005` Registro de productos (validaciones de campos obligatorios y no negativos).
- `HU-006`  Implementación del Layout Base y Componentes.
- `HU-007` Visualizacion de inventario con busqueda y eliminacion logica.
- `HU-008` Creacion de usuarios con asignacion de rol y validaciones de unicidad.


## Stack
- Backend: PHP puro (API REST simple).
- Frontend: React + TypeScript + Vite.
- Base de datos: MySQL/MariaDB.

## Estructura principal

```text
api/
  auth/
  config/
  productos/
  ventas/
  bootstrap.php
frontend/
  src/
```

## Base de datos
Archivo de referencia: `u695699053_sistema_pos.sql`.

Tablas principales:
- `rol`
- `usuario`
- `producto`
- `ventas`
- `detalle_venta`
- `cliente`
- `proveedor`
- `registro_adquisiciones`

### Requisitos adicionales aplicados al proyecto
Para las HU actuales, se recomienda tener en `producto`:
- `codigo_barras` unico.
- `estado` para eliminacion logica (`activo` / `inactivo`).

Ejemplo de cambios:

```sql
ALTER TABLE producto
  ADD COLUMN estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo';
```

## Configuracion de backend (BD)
El backend carga configuracion en este orden:
1. `api/config/database.local.php` (si existe).
2. Variables de entorno (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`).

Archivo loader: `api/config/database.php`.

### Desarrollo local
Crear `api/config/database.local.php` con:

```php
<?php
$host = 'srv572.hstgr.io';
$port = '3306';
$db_name = 'u695699053_sistema_pos';
$username = 'TU_USUARIO_DB';
$password = 'TU_PASSWORD_DB';
```

## CORS y sesion
Configurado en `api/bootstrap.php`.

Orgenes permitidos por defecto:
- `http://localhost:5173`
- `http://127.0.0.1:5173`
- `https://myhsoftwarehouse.com`
- `https://www.myhsoftwarehouse.com`
- `https://pos.myhsoftwarehouse.com`

Sesion por cookie (`credentials: include`) para mantener login activo.

## Endpoints principales

### Auth
- `POST /api/auth/login.php`
- `GET /api/auth/me.php`
- `POST /api/auth/logout.php`
- `POST /api/auth/register.php` (solo admin)
- `GET /api/auth/roles.php` (solo admin)

### Productos
- `POST /api/productos/create.php` (solo admin)
- `GET /api/productos/read.php?q=texto` (admin/vendedor)
- `DELETE /api/productos/delete.php` (eliminacion logica, solo admin)

## Frontend (rutas)
- `/` Login
- `/inicio` Home
- `/inventario` Inventario con busqueda en tiempo real
- `/usuarios/nuevo` Formulario de creacion de usuarios (solo admin)


## Despliegue actual (hosting)
Si `api` esta en `public_html/pos/api`, la base del API es:
- `https://myhsoftwarehouse.com/pos/api`

En frontend, la constante centralizada esta en:
- `frontend/src/config/api.ts`

## Seguridad y recomendaciones
- No subir credenciales a Git.
- Mantener `api/config/database.local.php` fuera de repositorio.
- Usar `.htaccess` en `api/` para bloquear archivos sensibles y desactivar listado de directorios.
- El primer usuario admin se carga manualmente en BD (seed inicial).

