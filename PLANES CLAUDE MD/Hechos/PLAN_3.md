# PLAN 3 — Configuración del catálogo desde el admin

## Pedido original
- Poder cambiar los colores del catálogo (no solo los del admin)
- Poder cambiar los textos de la página (título y subtítulo)

---

## ✅ Realizado

### Colores del catálogo
- **Nuevo picker "Color de fondo"** (`store.backgroundColor`) — controla el fondo general de la tienda, el header sticky de la vista de productos y los pies del carrito.
- **Picker "Color primario"** — ya existía, pero no llegaba al catálogo por un bug en el backend.
- **Picker "Color secundario"** — ídem. Ahora también cubre el botón "Continuar", los radios de tipo de entrega y método de pago, y el toast de notificación.
- **Bug fix crítico:** `GET /api/config/store` filtraba los campos de color en el backend (`config-controller.js`). Se agregaron `backgroundColor`, `primaryColor`, `secondaryColor`, `logoUrl` y `heroTitle` al `publicConfig`.
- **CSS var `--color-bg`** agregada a `variables.css` como var raíz. `--color-crema` la referencia, por lo que `body { background-color: var(--color-crema) }` en `styles.css` ya tira del color configurable.
- **Overrides dinámicos en `index.html`** (bloque `<style>`): `#floating-cart`, `#cart-count`, `#product-detail-add-btn`, `button[data-action="goToCheckout"]`, `#toast`, `.peer:checked ~ div` (radios), header sticky y pies del carrito. El botón "Confirmar Pedido" (`.btn-confirm`) conserva el verde WhatsApp.

### Textos del catálogo
- **Nueva card "Textos del catálogo"** en la sección Config del admin.
- **Campo "Nombre de la tienda"** (`store.name`) — aparece en el tagline del header del catálogo, el subtítulo del carrito y el `document.title`.
- **Campo "Título principal"** (`store.heroTitle`) — el titular grande "¿Qué vas a elegir hoy?" de la vista de categorías.
- `applyBranding()` en `app.js` aplica los textos al DOM en los elementos `#catalog-brand-name`, `#catalog-hero-title` y `#cart-brand-name`.

### Archivos modificados
- `APP/backend/src/controllers/config-controller.js` — fix publicConfig
- `APP/backend/src/services/data-service.js` — defaults backgroundColor y heroTitle
- `APP/frontend/css/variables.css` — --color-bg
- `APP/frontend/index.html` — IDs en elementos de texto, overrides CSS
- `APP/frontend/js/app.js` — applyBranding() actualizado
- `APP/frontend/js/admin/sections/config.js` — pickers de color, card de textos, saveTexts()

### Commit
`67b80b9` en rama `dev`
