# PLAN_ENV_EXAMPLE — Plantilla de variables de entorno por cliente

## Objetivo

Crear un archivo `.env.example` en la raíz del repo que sirva de plantilla
al agregar un cliente nuevo. Solo contiene variables técnicas — nombre de
tienda, WhatsApp, colores y logo se configuran desde el panel admin.

---

## Archivo a crear

**`APP/backend/.env.example`**

```
# ─── BASE DE DATOS ────────────────────────────────────────────────────────────
# Cambiar NOMBRE-CLIENTE por el nombre de la base de datos del cliente.
# El cluster y las credenciales son siempre los mismos.
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/NOMBRE-CLIENTE

# ─── SEGURIDAD ────────────────────────────────────────────────────────────────
# Generar uno distinto por cliente. Puede ser cualquier string largo y random.
# Ejemplo de cómo generar uno: https://generate-secret.vercel.app/32
JWT_SECRET=

# ─── CLOUDINARY ───────────────────────────────────────────────────────────────
# Las tres primeras son siempre las mismas (misma cuenta para todos los clientes).
# CLOUDINARY_FOLDER cambia por cliente — define la carpeta en la galería.
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=NOMBRE-CLIENTE

# ─── ADMIN INICIAL ────────────────────────────────────────────────────────────
# Contraseña para el primer login del cliente. Se puede cambiar desde el admin
# una vez que el cliente entra por primera vez.
ADMIN_PASSWORD=

# ─── OPCIONAL ─────────────────────────────────────────────────────────────────
PORT=3000
FRONTEND_URL=https://NOMBRE-CLIENTE.vercel.app
```

---

## Checklist de uso

Cada vez que se agrega un cliente nuevo:

1. Copiar este archivo y renombrarlo `.env` (o cargarlo directo en Vercel)
2. Reemplazar `NOMBRE-CLIENTE` en `MONGODB_URI` y `CLOUDINARY_FOLDER`
3. Generar un `JWT_SECRET` random
4. Completar las keys de Cloudinary (siempre las mismas)
5. Definir una `ADMIN_PASSWORD` inicial
6. Cargar en el proyecto Vercel del cliente
7. Hacer deploy
8. Entrar al admin → Config → completar nombre, WhatsApp, colores y logo

---

## Dependencias

Este plan requiere que el PLAN_3 esté implementado primero, ya que:
- `CLOUDINARY_FOLDER` como variable de entorno se implementa en el PLAN_3
- `ADMIN_PASSWORD` como variable de entorno se implementa en el PLAN_3
