# PLAN 2 — Multi-cliente en Vercel

## Objetivo
Convertir el proyecto en un producto vendible a múltiples clientes. Cada cliente
tiene su propio deploy en Vercel (mismo repo, distintas variables de entorno) con
su propia base de datos y su propia identidad visual configurable desde el panel admin.

---

## Resumen de cambios

| Área | Qué cambia |
|---|---|
| `api-config.js` | URL relativa `/api` en lugar de hardcodeada |
| `defaultConfig` en `data-service.js` | Agregar `primaryColor`, `secondaryColor`, `logoUrl` |
| `admin.html` + `index.html` | CSS usa variables CSS en lugar de colores fijos |
| `app.js` (catálogo) | Aplica colores y título desde config al iniciar |
| `admin-app.js` | Aplica colores y título desde config al iniciar |
| Sección Config del admin (`config.js`) | Color picker + campo de logo |
| `vercel.json` | Verificar que rutas estén bien configuradas |

---

## Fase 1 — URL de la API relativa

**`APP/frontend/js/api-config.js`**

Actualmente:
```js
export const API_BASE_URL = window.location.hostname === 'localhost'
    ? '/api'
    : 'https://unacucharitamas.onrender.com/api';
```

Cambiar a:
```js
export const API_BASE_URL = '/api';
```

En Vercel, el frontend y el backend viven en el mismo dominio → `/api` funciona en
todos los entornos sin tocar nada por cliente. En desarrollo local también funciona
porque Express sirve el frontend estáticamente.

---

## Fase 2 — Colores y logo en Config

### Backend: `APP/backend/src/services/data-service.js`

Agregar al `defaultConfig.store`:
```js
primaryColor: '#7d8c56',
secondaryColor: '#4a3b2a',
logoUrl: ''
```

### Frontend CSS: `APP/frontend/admin.html` + `APP/frontend/index.html`

Cambiar los colores hardcodeados en `<style>` a variables CSS con fallback:
```css
.bg-primary     { background-color: var(--color-primary, #7d8c56); }
.text-primary   { color: var(--color-primary, #7d8c56); }
.border-primary { border-color: var(--color-primary, #7d8c56); }
.ring-primary   { --tw-ring-color: var(--color-primary, #7d8c56); }
.bg-chocolate   { background-color: var(--color-secondary, #4a3b2a); }
.text-chocolate { color: var(--color-secondary, #4a3b2a); }
```

---

## Fase 3 — Aplicar config al iniciar

### Catálogo: `APP/frontend/js/app.js`

Después de `ProductManager.loadProducts()`, leer la config y aplicar:
```js
const store = productManager.getStoreConfig();
const root = document.documentElement;
root.style.setProperty('--color-primary', store.primaryColor || '#7d8c56');
root.style.setProperty('--color-secondary', store.secondaryColor || '#4a3b2a');
if (store.name) document.title = store.name;
// Logo: si store.logoUrl existe, reemplazar el ícono del header con <img>
```

### Admin: `APP/frontend/js/admin-app.js`

En `showAdminPanel()`, después de restaurar sesión:
```js
const config = await this.api.fetchWithAuth('/config');
const store = config?.data?.store || {};
const root = document.documentElement;
root.style.setProperty('--color-primary', store.primaryColor || '#7d8c56');
root.style.setProperty('--color-secondary', store.secondaryColor || '#4a3b2a');
if (store.name) document.title = store.name + ' — Admin';
```

---

## Fase 4 — Panel admin: editar colores y logo

**`APP/frontend/js/admin/sections/config.js`**

Agregar a la sección de configuración:
- **Input color** (`type="color"`) para color primario → guarda `primaryColor` en Config
- **Input color** para color secundario → guarda `secondaryColor` en Config
- **Input text / selector de galería** para logo → guarda `logoUrl` en Config
- Preview en tiempo real: al cambiar el color picker, actualizar las variables CSS inmediatamente sin guardar aún (feedback visual)
- Al hacer "Guardar", llamar `PUT /api/config` con los nuevos valores

---

## Fase 5 — Verificar Vercel

**`vercel.json`** (ya existe, verificar que tenga esto):
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.js" },
    { "source": "/(.*)", "destination": "/APP/frontend/$1" }
  ]
}
```

Probar que:
- `GET /` sirve `index.html`
- `GET /admin.html` sirve el panel
- `GET /api/products` responde desde el serverless

**Variables de entorno requeridas en cada proyecto Vercel:**
```
MONGODB_URI=
JWT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## Checklist de onboarding para un cliente nuevo

Una vez que el código esté listo, agregar un cliente nuevo toma ~15 minutos:

- [ ] Crear nuevo proyecto en Vercel desde el mismo repo
- [ ] Conectar dominio del cliente (o usar `.vercel.app`)
- [ ] Crear cluster M0 en MongoDB Atlas y copiar la URI
- [ ] Cargar las variables de entorno en Vercel
- [ ] Hacer deploy
- [ ] Entrar al admin → Config → cargar nombre, WhatsApp, colores, logo del cliente
- [ ] Crear categorías y productos iniciales

---

## Por realizar después de este plan (backlog)

- [ ] Stock por variante (del Plan 1)
- [ ] Favicon dinámico desde `logoUrl`
- [ ] Modo mantenimiento por cliente desde el admin
- [ ] Reportes: exportar a CSV
