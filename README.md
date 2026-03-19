# POS-MiniProyecto
Miniproyecto de Procesos y Diseno de Software para un sistema POS web.

## Estado del proyecto

Todas las historias de usuario definidas para el proyecto se encuentran implementadas.

### Historias de usuario implementadas (Sprint 1)
- `HU-001` Autenticacion de usuarios.
- `HU-002` Gestion de roles y permisos.
- `HU-003` Diseno de prototipo de alta fidelidad (UI/UX).
- `HU-004` Diseno e implementacion de la base de datos.
- `HU-005` Registro de productos.
- `HU-006` Implementacion del layout base y componentes.
- `HU-007` Visualizacion de inventario con busqueda.
- `HU-008` Creacion de usuarios con asignacion de rol y validaciones de unicidad.

### Historias de usuario implementadas (Sprint 2)
- `HU-009` Automatizacion de correos para confirmar venta / factura del cliente.
- `HU-010` Sistema de cliente recurrente.
- `HU-011` Historico de ventas por caja.
- `HU-012` Modulo de ventas con carrito de compras.
- `HU-013` Generacion de comprobante de pago.
- `HU-014` Edicion y actualizacion de productos.
- `HU-015` Dashboard de metricas y reportes visuales.
- `HU-016` Gestion de categorias y alertas de stock bajo.

## Stack
- Backend: PHP puro con endpoints REST simples.
- Frontend: React + TypeScript + Vite.
- Base de datos: MySQL / MariaDB.
- Correo saliente: SMTP de Hostinger.

## Estructura principal

```text
api/
  auth/
  categorias/
  catalogos/
  clientes/
  compras/
  config/
  productos/
  proveedores/
  reportes/
  ventas/
  bootstrap.php
frontend/
  src/
  dist/
u695699053_sistema_pos.sql
README.md
```

## Base de datos

Archivo de referencia: `u695699053_sistema_pos.sql`.

Tablas principales:
- `rol`
- `usuario`
- `producto`
- `categoria`
- `ventas`
- `detalle_venta`
- `cliente`
- `proveedor`
- `registro_adquisiciones`


## Configuracion del backend

### Base de datos
El backend carga configuracion en este orden:
1. `api/config/database.local.php` si existe.
2. Variables de entorno `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`.

Archivo loader: `api/config/database.php`.

Ejemplo local:

```php
<?php
$host = 'srv572.hstgr.io';
$port = '3306';
$db_name = 'u695699053_sistema_pos';
$username = 'TU_USUARIO_DB';
$password = 'TU_PASSWORD_DB';
```

### Correo SMTP
El sistema envia confirmaciones de venta por correo usando SMTP.

Carga de configuracion:
1. `api/config/mail.local.php` si existe.
2. Variables de entorno de correo.

Archivo loader: `api/config/mail.php`.

Ejemplo:

```php
<?php
declare(strict_types=1);

$mailEnabled = true;
$mailMode = 'smtp';
$mailFromAddress = 'contact@myhsoftwarehouse.com';
$mailFromName = 'M&H Super Market';
$mailSmtpHost = 'smtp.hostinger.com';
$mailSmtpPort = 465;
$mailSmtpEncryption = 'ssl';
$mailSmtpUsername = 'contact@myhsoftwarehouse.com';
$mailSmtpPassword = 'TU_PASSWORD_DEL_BUZON';
$mailSmtpTimeout = 20;
```

## CORS y sesion

Configurado en `api/bootstrap.php`.

Origenes permitidos por defecto:
- `http://localhost:5173`
- `http://127.0.0.1:5173`
- `https://myhsoftwarehouse.com`
- `https://www.myhsoftwarehouse.com`
- `https://pos.myhsoftwarehouse.com`

La autenticacion usa sesion por cookie con `credentials: include`.

## Endpoints principales

### Auth
- `POST /api/auth/login.php`
- `GET /api/auth/me.php`
- `POST /api/auth/logout.php`
- `POST /api/auth/register.php`
- `GET /api/auth/roles.php`

### Productos
- `POST /api/productos/create.php`
- `GET /api/productos/read.php?q=texto`
- `PUT /api/productos/update.php`
- `POST /api/productos/delete.php`

### Ventas
- `POST /api/ventas/create.php`
- `GET /api/ventas/list.php`

### Clientes
- `GET /api/clientes/list.php?q=texto`
- `POST /api/clientes/create.php`
- `PUT /api/clientes/update.php`
- `POST /api/clientes/delete.php`

### Compras
- `GET /api/compras/list.php?q=texto`
- `POST /api/compras/create.php`
- `POST /api/compras/delete.php`

### Categorias
- `GET /api/categorias/list.php`
- `POST /api/categorias/create.php`
- `PUT /api/categorias/update.php`
- `POST /api/categorias/delete.php`

### Proveedores
- `POST /api/proveedores/create.php`

### Catalogos y reportes
- `GET /api/catalogos/options.php`
- `GET /api/reportes/dashboard.php`

## Frontend

### Rutas actuales
- `/login`
- `/`
- `/products`
- `/clients`
- `/sales`
- `/purchases`
- `/admin`

### Configuracion del API
El frontend usa como base:
- `VITE_API_BASE_URL`

Si no se define, usa:
- `/api`

Archivo centralizado:
- `frontend/src/app/lib/api.ts`

## Funcionalidades principales
- Login con persistencia por cookie de sesion.
- Roles y permisos por modulo.
- CRUD de productos con categoria.
- CRUD de clientes.
- Registro de compras y actualizacion de stock.
- Registro de ventas con descuento de inventario.
- Carrito de compras en tiempo real.
- Ticket imprimible al finalizar venta.
- Dashboard con metricas y reportes.
- Indicadores de stock bajo.
- Gestion de categorias.
- Creacion rapida de clientes en checkout.
- Creacion rapida de proveedores desde compras.
- Confirmacion de venta por correo para clientes con email valido.

## Despliegue

Distribucion actual esperada en hosting:

```text
public_html/
  api/
  assets/
  index.html
```

Si frontend y backend se publican bajo el mismo sitio, el frontend debe consumir el backend con:
- `/api`

Caso actual de produccion:
- `https://pos.myhsoftwarehouse.com`
- `https://pos.myhsoftwarehouse.com/api`

Pasos recomendados:
1. Compilar frontend con `npm run build`.
2. Subir `frontend/dist` al directorio publico del sitio.
3. Subir la carpeta `api/` al mismo nivel que `index.html`.
4. Verificar credenciales de `database.local.php` y `mail.local.php`.
5. Confirmar que `api/config/.htaccess` este presente.

## Seguridad
- No subir credenciales reales a Git.
- Mantener `api/config/database.local.php` fuera del repositorio.
- Mantener `api/config/mail.local.php` fuera del repositorio.
- Bloquear acceso web a `api/config/` con `.htaccess`.
- Usar remitentes de correo reales y activos en Hostinger.
- El primer usuario administrador se registra manualmente en la base de datos o desde una cuenta ya administradora.

## Verificacion recomendada post-despliegue
- Probar `GET /api/auth/me.php`.
- Iniciar sesion y validar persistencia al recargar.
- Crear categoria, producto, cliente y compra.
- Registrar una venta y confirmar descuento de stock.
- Revisar ticket imprimible.
- Verificar respuesta `email.sent` en `POST /api/ventas/create.php`.
