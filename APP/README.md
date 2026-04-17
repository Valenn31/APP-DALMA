# Una Cucharita Más - Aplicación Completa

Aplicación web de catálogo para productos artesanales con carrito de compras y integración con WhatsApp.

## Arquitectura del Proyecto

```
APP/
├── frontend/          # Aplicación cliente (Vercel)
│   ├── index.html
│   ├── css/
│   ├── js/
│   ├── data/         # Datos temporales (desarrollo)
│   └── assets/
└── backend/          # API REST (Railway)
    ├── src/
    ├── package.json
    └── server.js
```

## Frontend (Vercel)
- **Tecnologías**: HTML5, CSS3, JavaScript ES6+, Tailwind CSS
- **Despliegue**: Vercel
- **Características**: SPA con carrito, integración WhatsApp

## Backend (Railway) 
- **Tecnologías**: Node.js, Express, PostgreSQL/MySQL
- **Despliegue**: Railway
- **Características**: API REST, gestión de productos y pedidos

## Desarrollo Local
1. **Frontend**: Abrir `frontend/index.html` en navegador
2. **Backend**: Cuando esté implementado, `npm run dev`

## Producción
- Frontend conectará al backend vía variables de entorno
- Base de datos en Railway
- CORS configurado entre dominios

## Arquitectura Modular

### **app.js** - Punto de Entrada
- Inicializa la aplicación
- Coordina los diferentes módulos
- Maneja el ciclo de vida de la aplicación

### **products.js** - Gestión de Productos
- Carga productos desde JSON
- Filtrado por categorías
- Búsqueda por ID
- Gestión de configuración

### **cart.js** - Gestión del Carrito
- Agregar/quitar productos
- Actualizar cantidades
- Calcular totales
- Callbacks para actualizar UI

### **ui.js** - Interfaz de Usuario
- Renderizado de productos
- Gestión del carrito visual
- Navegación entre vistas
- Toast notifications
- Integración con WhatsApp

## Características

✅ **Modularidad**: Código separado por responsabilidades  
✅ **Escalabilidad**: Fácil agregar nuevas funcionalidades  
✅ **Mantenibilidad**: Cada módulo independiente  
✅ **Configurabilidad**: Datos externos en JSON  
✅ **Responsive**: Diseño adaptativo para móviles  

## Configuración

Para agregar productos, edita `data/products.json`:

```json
{
  "products": [
    {
      "id": 1,
      "name": "Nombre del producto",
      "price": 1000,
      "category": "categoria",
      "desc": "Descripción",
      "img": "URL de imagen"
    }
  ],
  "config": {
    "whatsappNumber": "5493471671286"
  }
}
```

## Uso

1. Abre `index.html` en un navegador
2. Selecciona una categoría (Chocolates/Postres)
3. Agrega productos al carrito
4. Confirma pedido vía WhatsApp

## Tecnologías

- **HTML5**: Estructura semántica
- **CSS3**: Variables personalizadas y animaciones
- **JavaScript ES6+**: Módulos y clases
- **Tailwind CSS**: Framework de estilos
- **Font Awesome**: Iconografía