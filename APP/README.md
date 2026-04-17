# Una Cucharita Más

Catálogo web de productos artesanales con carrito de compras, checkout por WhatsApp y panel administrativo.

## Stack

- **Frontend**: HTML5, Tailwind CSS (CDN), JavaScript ES6+ (módulos)
- **Backend**: Node.js, Express, Mongoose
- **Base de datos**: MongoDB Atlas (M0 free tier)

## Estructura

```
APP/
├── frontend/
│   ├── index.html          # Catálogo público
│   ├── admin.html          # Panel administrativo
│   ├── css/                # Estilos
│   ├── js/                 # Módulos del catálogo
│   │   ├── admin/          # Módulos del panel admin
│   │   └── modules/        # UI, eventos, pedidos
│   └── assets/images/      # Imágenes de productos
├── backend/
│   ├── server.js           # Punto de entrada
│   ├── seed.js             # Inicializar base de datos
│   └── src/
│       ├── controllers/    # auth, products, config
│       ├── models/         # Product, AdminUser, Config
│       ├── routes/         # Rutas de la API
│       ├── middleware/      # Auth JWT
│       └── services/       # Data y auth services
└── README.md
```

## Instalación

```bash
cd backend
npm install
cp .env.example .env   # Configurar MONGODB_URI y JWT_SECRET
node seed.js           # Cargar datos iniciales
node server.js         # Iniciar servidor en :3000
```

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/products | Productos activos |
| GET | /api/config/store | Config pública (nombre, WhatsApp, categorías) |
| POST | /api/auth/login | Login admin |
| GET | /api/products/stats | Estadísticas (auth) |
| PUT | /api/products/:id | Editar producto (auth) |
| PUT | /api/config | Editar configuración (auth) |

## Funcionalidades

- Catálogo por categorías con carrito
- Dirección de envío y método de pago en checkout
- Pedido formateado vía WhatsApp
- Panel admin con login JWT
- Gestión de productos (CRUD, stock, imágenes)
- MongoDB Atlas para persistencia en deploy
4. Confirma pedido vía WhatsApp

## Tecnologías

- **HTML5**: Estructura semántica
- **CSS3**: Variables personalizadas y animaciones
- **JavaScript ES6+**: Módulos y clases
- **Tailwind CSS**: Framework de estilos
- **Font Awesome**: Iconografía