# Code Review — APP-DALMA
> Fecha: 2026-05-11 | Revisado por: Claude Sonnet 4.6

---

## Críticos 🔴

---

### 1. Blacklist de tokens y rate-limiter en memoria
**Archivo:** `APP/backend/src/services/auth-service.js` / `api/index.js`

**Qué está mal:** `tokenBlacklist` (`Set`) y `loginAttempts` (`Map`) son estructuras por proceso.

**Por qué importa:** En Vercel cada cold start crea una nueva instancia — todos los tokens revocados via logout vuelven a ser válidos. El rate-limiter también se resetea, permitiendo fuerza bruta tras cada reinicio.

**Fix:** Para Render (proceso único) es aceptable. Para Vercel: usar tokens de corta duración (≤1h). Documentar explícitamente la limitación. (estoy usando render)

---

## Medios 🟡

---

### 2. Re-fetch innecesario por cada expansión de acordeón de categorías
**Archivo:** `APP/frontend/js/admin/sections/categories.js:449-492`

**Qué está mal:** Cada expansión de panel hace `GET /api/products?includeInactive=true`. Si hay N categorías y se expanden todas, son N requests idénticas.

**Fix:** Cachear el listado al cargar la sección y reutilizarlo.

---

## Bajos / Info 🔵

---

### 4. `initializeDefaultAdmin` no es idempotente bajo concurrencia
**Archivo:** `api/index.js:9-12`

`countDocuments` + `save` — dos procesos simultáneos (Vercel multi-instancia) pueden intentar crear el mismo admin. El índice único lo frena con error, pero es frágil.

**Fix:** Usar `findOneAndUpdate` con `upsert: true`.

---

### 5. Filtro de productos en admin opera sobre el DOM, no sobre datos
**Archivo:** `APP/frontend/js/admin/sections/products.js:509-530`

Si cambia la estructura HTML, el filtro se rompe silenciosamente. Deuda tolerable al volumen actual.

---

### 6. URL de producción hardcodeada en CSP
**Archivo:** `APP/backend/app.js:19`

`'https://unacucharitamas.onrender.com'` hardcodeado en `connectSrc`. Si el dominio cambia, el frontend rompe en producción.

**Fix:** Leer de variable de entorno: `...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])`.

---

## Deuda técnica tolerable (no urgente)

- **Blacklist de tokens en memoria:** OK para Render (proceso único persistente), riesgo real solo si se migra a Vercel.
- **Índices faltantes en MongoDB** (`active`, `category`): irrelevante al volumen actual del catálogo.
- **`toggleStatus` con read-modify-write:** riesgo teórico con un único admin real, tolerable.
- **Filtro de productos sobre DOM en lugar de datos:** frágil pero funcional.
- **URL de Render hardcodeada en CSP:** deuda de mantenimiento, no un bug activo.
- **`_removeProductFromCategory` usa doble toggle:** frágil pero funcional al caso de uso real.

---

---

## Ya resuelto ✅

---

### ✅ JWT_SECRET sin validación correcta
**Archivo:** `APP/backend/src/services/auth-service.js:9`

Cambiado `=== 'production'` por `!== 'development'`. Ahora lanza error en cualquier entorno que no sea desarrollo explícito, incluyendo Render sin `NODE_ENV` definido.

---

### ✅ Race condition en `createProduct`
**Archivo:** `APP/backend/src/services/data-service.js:47-53`

Reemplazado el patrón `findOne().sort({ id: -1 })` + create por un contador atómico en la colección `Config` usando `findOneAndUpdate` con pipeline de agregación (`$ifNull` + `$add`). El contador se auto-siembra del max existente la primera vez y luego incrementa sin race condition.

**Efecto secundario corregido:** El documento `_productIdCounter` en la colección `Config` se filtraba en el objeto de config retornado por `getConfig()`, contaminando `GET /api/config` con una key interna. Corregido filtrando keys que empiezan con `_` al construir el objeto (`if (!c.key.startsWith('_')) config[c.key] = c.value`).

---

### ✅ Health check público con 3 queries a MongoDB
**Archivo:** `APP/backend/src/controllers/config-controller.js:162-195`

Simplificado a un check de `mongoose.connection.readyState`. Ya no hace queries, no expone detalles del entorno ni `process.uptime()`.

---

### ✅ `parseInt` parcial en validación de IDs
**Archivo:** `APP/backend/src/controllers/product-controller.js:58, 133, 185, 243`

Reemplazado `isNaN(parseInt(id))` por `!/^\d+$/.test(id)` en las 4 ocurrencias. IDs como `"1abc"` ahora son rechazados con 400 en lugar de buscar por `1`.

---

### ✅ Upload de imagen usa extensión del cliente
**Archivo:** `APP/backend/src/routes/image-upload.js:18-23`

Reemplazado `path.extname(file.originalname)` por un mapa `extByMime` que deriva la extensión del MIME type validado, no del nombre de archivo provisto por el cliente. También se eliminó `file.fieldname` del nombre resultante.

---

### ✅ `updateConfig` sin whitelist de claves
**Archivo:** `APP/backend/src/controllers/config-controller.js:89`

Agregado filtro por `ALLOWED_KEYS = ['store', 'categories', 'business', 'stock']` antes de pasar el body a `dataService.updateConfig()`. Claves como `admin` ya no pueden escribirse desde la API.

---

### ✅ XSS en catálogo público
**Archivo:** `APP/frontend/js/app.js:177-199`

Agregada función `esc()` inline en `renderCategoryCards`. Los campos `cat.id`, `cat.name` y `cat.image` ahora se escapan antes de interpolarse en el template HTML.

---

### ✅ `resultDiv.innerHTML` con dato del servidor sin sanitizar
**Archivo:** `APP/frontend/js/admin/sections/products.js:288`

Reemplazado `innerHTML` con manipulación DOM explícita (`createElement`, `textContent`, `append`). El `imageUrl` del servidor ya no se interpola en HTML.

---

### ✅ `visibilitychange` congela la tab al volver
**Archivo:** `APP/frontend/js/app.js:80-84`

Agregado umbral de 5 minutos (`REFRESH_THRESHOLD_MS`). El refresh solo se dispara si pasaron 5+ minutos desde la última carga exitosa. Cambios de tab rápidos ya no triggean un fetch. `lastRefresh` se actualiza en el constructor, al inicializar y al completar cada refresh exitoso.

---

### ✅ Migración de categorías con spread en orden incorrecto
**Archivo:** `APP/backend/src/services/data-service.js:93-98`

Reestructurado el objeto de migración: `...cat` va primero, luego `available` y `order` como overrides, y finalmente `active: true` se fuerza solo para documentos viejos (los que no tienen campo `available`), usando `...(cat.available === undefined && { active: true })`.
