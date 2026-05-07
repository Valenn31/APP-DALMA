# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos de desarrollo

El backend vive en `APP/backend/`. Todos los comandos se corren desde ahí:

```bash
cd APP/backend
npm run dev    # desarrollo con nodemon (puerto 3000)
npm start      # producción
```

No hay build step en el frontend — es HTML + ES Modules puro servido como estático.

## Arquitectura general

Este es un monorepo con backend Express + frontend Vanilla JS sin framework ni bundler.

```
APP/backend/   → API REST (Express + MongoDB Atlas)
APP/frontend/  → SPA estática (HTML/CSS/JS puro con ES Modules)
api/           → Entry point serverless para Vercel
```

### Backend

**Entry points:**
- `APP/backend/server.js` — servidor de desarrollo. Sirve el frontend como estático, conecta a MongoDB, crea admin por defecto.
- `api/index.js` — wrapper serverless para Vercel.
- `APP/backend/app.js` — configuración de Express (Helmet, CORS, rutas, manejo de errores).

**Capas:**
- `src/routes/` → solo define rutas y middleware de auth
- `src/controllers/` → lógica de negocio
- `src/services/data-service.js` → toda la interacción con MongoDB (singleton). Las categorías se almacenan como documentos `Config` con `key: 'categories'`, no en un modelo separado.
- `src/models/` → esquemas Mongoose: `Product`, `Config`, `AdminUser`

**Rutas de la API:**
- `GET/POST /api/products` y `PUT/DELETE /api/products/:id` — CRUD de productos
- `GET /api/config/store` y `GET /api/config/categories` — endpoints públicos (sin auth)
- `GET/PUT /api/config` — configuración completa (requiere admin)
- `POST /api/images/upload` — upload de imagen a `APP/frontend/assets/img/postres/` (requiere admin)
- `POST /api/auth/login`, `PUT /api/auth/change-password`

**Variables de entorno requeridas** (en `APP/backend/.env`):
```
MONGODB_URI=       # también acepta MONGO_URI
JWT_SECRET=
PORT=3000          # opcional
FRONTEND_URL=      # para CORS en producción
```

**Autenticación:** JWT en header `Authorization: Bearer <token>`. El middleware `verifyToken` + `requireAdmin` protege las rutas de escritura. El token se almacena en localStorage bajo la clave `admin_token`.

### Frontend — Catálogo público (`index.html`)

**Flujo de inicialización** (`js/app.js`):
1. `ProductManager.loadProducts()` — fetch paralelo a `/api/products` y `/api/config/store`
2. `CartManager` + `UIManager` (que instancia `ViewManager`, `ModalManager`, `OrderService`, `EventHandler`)
3. `renderCategoryCards()` — genera las cards de categorías dinámicamente desde `productManager.categories`

**Navegación de vistas** (manejada por `ViewManager`):
- Vista categorías → Vista productos → Modal detalle → Modal carrito (2 pasos)
- Toda la navegación usa `data-action` en el HTML y delegación de eventos en `EventHandler`

**Carrito de 2 pasos:**
- Paso 1: lista de items + total
- Paso 2: tipo de entrega (Delivery +$300 / Retiro), dirección, método de pago
- El pedido se envía como mensaje pre-armado a WhatsApp via `api.whatsapp.com/send`

**Variantes de producto:** Si `product.variants.length > 0`, el botón "+" de la lista de productos abre el modal de detalle en lugar de agregar directo.

### Frontend — Panel admin (`admin.html`)

**Coordinador:** `js/admin-app.js` instancia todas las secciones y maneja la navegación del sidebar.

**Secciones:**
- `js/admin/sections/dashboard.js` — stats
- `js/admin/sections/products.js` — CRUD de productos con upload de imagen
- `js/admin/sections/categories.js` — CRUD de categorías (crear, editar, borrar, reordenar, asignar/quitar productos)
- `js/admin/sections/config.js` — número de WhatsApp

**Cliente HTTP del admin:** `js/admin/api-client.js` — `fetchWithAuth()` para JSON, `uploadFile()` para FormData (ambos inyectan el JWT automáticamente).

### Modelo de datos — Categorías

Las categorías se guardan en MongoDB como `{ key: 'categories', value: [...] }` en la colección `Config`. Cada categoría tiene:

```js
{
  id: 'chocolates',   // slug auto-generado del nombre
  name: 'Chocolates',
  image: 'assets/img/postres/categoria_chocolates.jpeg',
  active: true,       // visibilidad: false = oculta del catálogo
  available: true,    // disponible: false = "No disponible" (grisada)
  order: 0            // orden de aparición (ascendente)
}
```

`data-service.js` normaliza automáticamente documentos viejos (sin `available`/`order`) al leerlos.

### Rutas de imágenes

Las imágenes se guardan en `APP/frontend/assets/img/postres/`. Al renderizarlas siempre verificar si la URL es absoluta o relativa:

```js
const src = image.startsWith('http') ? image : '/' + image;
```

### Deployment

- **Render** (producción actual): deploy manual desde el panel. La app duerme en plan gratuito — usar UptimeRobot con ping cada 5 min para mantenerla activa.
- **Vercel**: configurado en `vercel.json` pero no es el deploy activo.
- **Ramas:** `main` = producción estable. `dev` = trabajo en curso (no deployeado automáticamente).
