# Control de stock

### ✅ Realizado

- [x] Al confirmar el pedido desde el catálogo, el stock se descuenta automáticamente según los items del carrito
    - Nuevo endpoint público `POST /api/products/consume-stock` en el backend
    - Al abrir WhatsApp, el frontend llama al endpoint y actualiza el stock local
    - La vista de productos se refresca: los que llegan a stock=0 desaparecen

- [x] Límite de unidades en el carrito según stock disponible
    - Al intentar agregar más unidades de las disponibles → toast "Solo hay X unidades disponibles"
    - Lo mismo aplica al botón "+" dentro del carrito
    - Mensaje especial para la última unidad: "¡Es la última unidad!"

- [x] Badge de stock bajo en el modal de detalle del producto
    - Stock = 1 → badge rojo "¡Última unidad!"
    - Stock 2–5 → badge naranja "Solo quedan X unidades"
    - Stock > 5 → sin badge

### Por realizar

- [ ] Stock por variante: si el producto tiene variantes, poder asignarle stock independiente a cada una
    - Requiere cambio en el modelo (variants debe tener campo `stock`)
    - Requiere cambio en la validación del carrito (usar el stock de la variante en vez del producto)

---

# Control de ganancias

### ✅ Realizado

- [x] Campo **precio de costo** expuesto en el formulario de productos del admin
    - El campo `cost` ya existía en el modelo; ahora aparece con la etiqueta "Precio de costo" y el campo `price` dice "Precio de venta"

- [x] Las ventas se guardan automáticamente al confirmar el pedido por WhatsApp
    - Nuevo endpoint público `POST /api/sales` — guarda el pedido con cliente, items, totales, tipo de entrega y pago
    - El backend enriquece cada item con `unitCost` desde `Product.cost`
    - El frontend lo llama desde el catálogo al mismo tiempo que descuenta el stock (fire-and-forget)

- [x] Apartado **Ventas** en el panel admin
    - Tabla con columnas: # | Fecha | Cliente | Items | Total | Entrega | Pago | Acciones
    - Vista de cards en móvil
    - Sidebar item "Ventas" (reemplazó el botón "Pedidos - Próximo")

- [x] **Edición de ventas** con ajuste de stock automático
    - Cambiar cantidades, agregar o quitar items, editar precio final
    - Cada edición genera una entrada en el historial de cambios (changelog)
    - Historial visible como acordeón colapsado en el modal de edición
    - Al editar, el stock se ajusta automáticamente según la diferencia

- [x] **Eliminación de ventas** con restauración de stock
    - Borrar una venta restaura el stock de todos sus items

### Por realizar

- [ ] **Reportes** semanales, mensuales y anuales de lo vendido
    - Requiere sumar ventas por período y mostrar totales, ganancia bruta (precio_venta - precio_costo) y cantidad de pedidos
