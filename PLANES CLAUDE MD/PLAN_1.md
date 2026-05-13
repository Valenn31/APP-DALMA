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

### Por realizar

- [ ] Agregar campo **precio de costo** a los productos (el campo `cost` ya existe en el modelo, hay que exponerlo en el formulario del admin con esa etiqueta)
- [ ] Agregar campo **precio de venta** con etiqueta clara en el admin (actualmente es `price`)
- [ ] Apartado de **ventas realizadas** en el panel admin
    - Lista tipo tabla/Excel con info de cada venta
    - Filas editables (por si hubo cambios en el pedido)
    - Posibilidad de borrar una venta
- [ ] **Reportes** semanales, mensuales y anuales de lo vendido
    - Requiere guardar las ventas en la base de datos al confirmar el pedido (actualmente solo van por WhatsApp)

---

## Preguntas pendientes

- ¿Querés que las ventas se guarden automáticamente al confirmar el pedido por WhatsApp, o que el admin las cargue manualmente?
