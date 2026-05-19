# PLAN 3 — Cloudinary por cliente y ajustes multi-cliente

## Objetivo

Completar el soporte multi-cliente resolviendo los problemas que aparecen
cuando hay más de un cliente usando la misma cuenta de Cloudinary y el
mismo cluster de MongoDB Atlas.

---

## Problema 1 — Galería mezclada entre clientes

### Qué pasa hoy

El backend sube todas las imágenes a la carpeta `dalma-products` en Cloudinary,
hardcodeada en el código. Si hay 5 clientes en la misma cuenta de Cloudinary,
cuando el admin de cliente A abre la galería ve también las fotos de los otros 4.

### Solución

Agregar una variable de entorno `CLOUDINARY_FOLDER` que cada proyecto Vercel
define con su propio valor. El backend la usa al subir y al listar imágenes.

**Variables de entorno requeridas (una por cliente en Vercel):**
```
CLOUDINARY_FOLDER=cliente-dalma        # cliente A
CLOUDINARY_FOLDER=cliente-pasteleria   # cliente B
```

**Archivos a modificar:**

`APP/backend/src/controllers/images-controller.js` — reemplazar el string
`'dalma-products'` hardcodeado por `process.env.CLOUDINARY_FOLDER || 'dalma-products'`
en las tres operaciones: upload, list y delete.

`CLAUDE.md` — agregar `CLOUDINARY_FOLDER` a la lista de variables de entorno requeridas.

---

## Problema 2 — Admin por defecto con datos de "Una Cucharita Más"

### Qué pasa hoy

`server.js` crea un admin por defecto con username `admin` y también el
`defaultConfig` en `data-service.js` tiene el nombre `'Una Cucharita Más'`
y el número de WhatsApp de Dalma hardcodeados. Cuando se despliega para un
cliente nuevo, la primera vez que arranca el servidor ya tiene datos de otro cliente.

### Solución

Mover esos valores hardcodeados a variables de entorno con fallback genérico:

```
STORE_NAME=           # nombre de la tienda (default: "Mi Tienda")
WHATSAPP_NUMBER=      # número sin prefijo 549 (default: vacío)
ADMIN_USERNAME=       # usuario admin inicial (default: admin)
ADMIN_PASSWORD=       # contraseña admin inicial (requerida)
```

**Archivos a modificar:**

`APP/backend/src/services/data-service.js` — en `defaultConfig.store`:
```js
name: process.env.STORE_NAME || 'Mi Tienda',
whatsappNumber: process.env.WHATSAPP_NUMBER || '',
```

`APP/backend/server.js` — en la creación del admin por defecto:
```js
username: process.env.ADMIN_USERNAME || 'admin',
password: process.env.ADMIN_PASSWORD || 'admin123',
```

---

## Problema 3 — Sin modo mantenimiento por cliente

### Qué pasa hoy

El campo `maintenanceMode` existe en el modelo de datos pero no hay forma
de activarlo desde el panel admin. Si un cliente quiere cerrar temporalmente
su tienda sin eliminar productos, no puede.

### Solución

Agregar un toggle en la sección Config del admin que active/desactive
`business.maintenanceMode` en la config. El catálogo ya muestra la pantalla
de "Tienda cerrada" cuando ese campo es `true` — solo falta la UI para controlarlo.

**Archivos a modificar:**

`APP/frontend/js/admin/sections/config.js` — agregar card con toggle
(switch on/off) que llame `PUT /api/config` con `{ business: { maintenanceMode: true/false } }`.

---

## Checklist de onboarding actualizado (post PLAN 2)

Una vez aplicados estos cambios, agregar un cliente nuevo requiere solo:

- [ ] Crear nuevo proyecto en Vercel desde el mismo repo
- [ ] Conectar dominio del cliente (o usar `.vercel.app`)
- [ ] Crear base de datos en MongoDB Atlas (nueva db en el cluster existente)
- [ ] Cargar variables de entorno en Vercel:
  ```
  MONGODB_URI=.../<nombre-db-cliente>
  JWT_SECRET=<secreto-unico>
  CLOUDINARY_CLOUD_NAME=
  CLOUDINARY_API_KEY=
  CLOUDINARY_API_SECRET=
  CLOUDINARY_FOLDER=<nombre-carpeta-cliente>
  STORE_NAME=<nombre de la tienda>
  WHATSAPP_NUMBER=<numero sin 549>
  ADMIN_USERNAME=admin
  ADMIN_PASSWORD=<password-inicial>
  ```
- [ ] Hacer deploy
- [ ] Entrar al admin → Config → ajustar colores, logo, costo de envío
- [ ] Crear categorías y productos iniciales
