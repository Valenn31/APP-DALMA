# Backend - Una Cucharita Más API

API REST para gestionar productos, pedidos y configuración.

## Estructura (Preparada para Railway)
```
backend/
├── src/
│   ├── controllers/   # Controladores de rutas
│   ├── models/        # Modelos de base de datos
│   ├── routes/        # Definición de rutas
│   ├── middleware/    # Middlewares personalizados
│   └── config/        # Configuración de DB y app
├── package.json       # Dependencias de Node.js
└── server.js         # Punto de entrada del servidor
```

## Endpoints planificados
- `GET /api/products` - Obtener todos los productos
- `GET /api/products/category/:category` - Productos por categoría  
- `POST /api/orders` - Crear pedido
- `GET /api/config` - Obtener configuración (WhatsApp, etc.)

## Base de datos (Railway)
- PostgreSQL/MySQL para productos y pedidos
- Variables de entorno para conexión

## Tecnologías
- Node.js + Express
- Base de datos (PostgreSQL/MySQL)
- CORS habilitado para el frontend