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
- `src/models/` → esquemas Mongoose: `Product`, `Config`, `AdminUser`, `Sale`

**Rutas de la API:**
- `GET/POST /api/products` y `PUT/DELETE /api/products/:id` — CRUD de productos
- `POST /api/products/consume-stock` — descuenta stock al confirmar un pedido (público). Body: `{ items: [{productId, quantity, variantName?}] }`. Si `variantName` está presente y la variante tiene `stock` propio, descuenta ese; si no, descuenta el stock global del producto. Clampea a 0.
- `GET /api/sales` — lista ventas ordenadas por fecha desc (requiere admin)
- `POST /api/sales` — crea venta (público — llamado desde el catálogo al confirmar pedido). El backend enriquece cada item con `unitCost` desde `Product.cost`.
- `PUT /api/sales/:id` — edita venta, ajusta stock según diferencia de items/cantidades y agrega entrada al changelog (requiere admin)
- `DELETE /api/sales/:id` — elimina venta y restaura el stock de todos sus items (requiere admin)
- `GET /api/config/store` — endpoint público (sin auth). Devuelve campos seleccionados del store: nombre, whatsapp, deliveryCost, categorías, maintenanceMode, y los campos de branding (`backgroundColor`, `primaryColor`, `secondaryColor`, `logoUrl`, `heroTitle`). **Importante:** el controlador construye un `publicConfig` explícito — cualquier campo nuevo del store hay que agregarlo acá o el catálogo no lo recibirá.
- `GET /api/config/categories` — endpoint público (sin auth)
- `GET/PUT /api/config` — configuración completa (requiere admin)
- `GET /api/images` — lista imágenes del folder `dalma-products` en Cloudinary (requiere admin)
- `POST /api/images/upload` — upload de imagen a Cloudinary (requiere admin). Devuelve `{ success, imageUrl }` donde `imageUrl` es una URL `https://res.cloudinary.com/...`
- `DELETE /api/images?publicId=dalma-products/xxx` — elimina imagen de Cloudinary (requiere admin)
- `POST /api/auth/login`, `PUT /api/auth/change-password`

**Variables de entorno requeridas** (en `APP/backend/.env`):
```
MONGODB_URI=              # también acepta MONGO_URI
JWT_SECRET=
CLOUDINARY_CLOUD_NAME=    # almacenamiento de imágenes
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
PORT=3000                 # opcional
FRONTEND_URL=             # para CORS en producción
```

**Autenticación:** JWT en header `Authorization: Bearer <token>`. El middleware `verifyToken` + `requireAdmin` protege las rutas de escritura. El token se almacena en localStorage bajo la clave `admin_token`.

### Frontend — Catálogo público (`index.html`)

**Flujo de inicialización** (`js/app.js`):
1. `ProductManager.loadProducts()` — fetch paralelo a `/api/products` y `/api/config/store`
2. `applyBranding()` — aplica `--color-primary` y `--color-secondary` al `:root`, actualiza el título de la pestaña, y escribe `store.name` y `store.heroTitle` en los elementos del DOM (`#catalog-brand-name`, `#catalog-hero-title`, `#cart-brand-name`)
3. `CartManager` + `UIManager` (que instancia `ViewManager`, `ModalManager`, `OrderService`, `EventHandler`)
4. `renderCategoryCards()` — genera las cards de categorías dinámicamente desde `productManager.categories`

**Navegación de vistas** (manejada por `ViewManager`):
- Vista categorías → Vista productos → Modal detalle → Modal carrito (2 pasos)
- Toda la navegación usa `data-action` en el HTML y delegación de eventos en `EventHandler`

**Carrito de 2 pasos:**
- Paso 1: lista de items + total
- Paso 2: tipo de entrega (Delivery +$300 / Retiro), dirección, método de pago
- El pedido se envía como mensaje pre-armado a WhatsApp via `api.whatsapp.com/send`

**Variantes de producto:** Si `product.variants.length > 0`, el botón "+" de la lista de productos abre el modal de detalle en lugar de agregar directo. Cada variante puede tener `stock` propio (`null` = usa el stock global del producto). El badge de stock en el modal se actualiza al cambiar la variante seleccionada.

### Frontend — Panel admin (`admin.html`)

**Coordinador:** `js/admin-app.js` instancia todas las secciones y maneja la navegación del sidebar.

**Secciones:**
- `js/admin/sections/dashboard.js` — stats
- `js/admin/sections/products.js` — CRUD de productos con upload de imagen
- `js/admin/sections/categories.js` — CRUD de categorías (crear, editar, borrar, reordenar, asignar/quitar productos)
- `js/admin/sections/config.js` — identidad visual (colores, logo), costo de envío, número de WhatsApp
- `js/admin/sections/gallery.js` — galería de imágenes (ver, subir, borrar desde Cloudinary)

**Componentes compartidos:**
- `js/admin/gallery-picker.js` — modal picker para seleccionar imagen de la galería. Se instancia en `admin-app.js` y se pasa como tercer parámetro a `ProductsSection` y `CategoriesSection`.

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

### Identidad visual multi-cliente

Los colores del catálogo son dinámicos y se configuran desde el admin (sección "Colores del catálogo"):
- `backgroundColor` — fondo general de la tienda. Defecto: `#f2e9dc` → CSS var `--color-bg`
- `primaryColor` — botones CTA, badge de stock, carrito flotante. Defecto: `#7d8c56` → CSS var `--color-primary`
- `secondaryColor` — textos, botón "Continuar", radios de entrega/pago. Defecto: `#4a3b2a` → CSS var `--color-secondary`
- `logoUrl` — URL de imagen del logo (Cloudinary o externa)
- `name` — nombre visible en el header del catálogo y pestaña del browser
- `heroTitle` — titular grande en la vista de categorías. Defecto: `'¿Qué vas a elegir hoy?'`

Se guardan en `Config.store` en MongoDB. Al iniciar, `applyBranding()` en `app.js` lee `productManager.getStoreConfig()` y aplica los tres CSS vars (`--color-bg`, `--color-primary`, `--color-secondary`) en `:root`, actualiza el `document.title`, y escribe `name` y `heroTitle` en los elementos del DOM (`#catalog-brand-name`, `#catalog-hero-title`, `#cart-brand-name`).

`css/variables.css`: `--color-bg` es el var raíz del fondo; `--color-crema` lo alias. `--color-chocolate = var(--color-secondary)`. `--color-verde = var(--color-primary)`. `body` usa `var(--color-crema)` para el fondo y `var(--color-chocolate)` para el color de texto.

`index.html` tiene un `<style>` inline con overrides dinámicos que cubren: `#floating-cart`, `#cart-count`, `#product-detail-add-btn`, botón `[data-action="goToCheckout"]`, `#toast`, radios `.peer:checked ~ div`, y los fondos del header de productos y pie del carrito. El botón "Confirmar Pedido" (`.btn-confirm`) usa el verde de WhatsApp `#25D366` definido en `styles.css` — no conectar al color secundario.

Para un cliente nuevo: crear proyecto Vercel desde el mismo repo, cargar las 5 variables de entorno, y configurar nombre/colores/logo desde el admin.

### Imágenes

Las imágenes nuevas se suben a **Cloudinary** (folder `dalma-products`) y se almacenan en MongoDB como URLs absolutas `https://res.cloudinary.com/...`. Las imágenes antiguas siguen como rutas relativas `assets/img/postres/...` (commiteadas en el repo). Al renderizar siempre verificar:

```js
const src = image.startsWith('http') ? image : '/' + image;
```

### Deployment

- **Render** (producción actual, plan gratuito): deploy manual desde el panel. La app duerme tras inactividad — usar UptimeRobot con ping cada 5 min para mantenerla activa. El filesystem es efímero: cualquier archivo escrito en runtime (ej. imágenes subidas) se pierde en el siguiente deploy.
- **MongoDB Atlas** (base de datos): cluster gratuito (M0). La URI de conexión va en `MONGODB_URI` en el `.env` y en las variables de entorno de Render.
- **Vercel**: target de deployment multi-cliente. `api-config.js` usa `/api` relativa — funciona en Vercel y en desarrollo local sin cambios. Cada cliente = un proyecto Vercel con su propio MongoDB y variables de entorno.
- **Ramas:** `main` = producción estable. `dev` = trabajo en curso (no deployeado automáticamente).
