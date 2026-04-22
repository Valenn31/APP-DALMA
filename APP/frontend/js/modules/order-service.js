/**
 * OrderService - Maneja el procesamiento y envío de pedidos
 * Responsabilidad única: Formatear pedidos y integrar con servicios externos (WhatsApp)
 */
export class OrderService {
    constructor() {
        this.defaultStoreName = "UNA CUCHARITA MÁS";
    }

    /**
     * Envía un pedido completo por WhatsApp
     * @param {Object} cartManager - Manejador del carrito
     * @param {Object} config - Configuración de la tienda (número de WhatsApp, etc.)
     */
    sendWhatsAppOrder(cartManager, config, address = '', paymentMethod = '', deliveryType = '', shippingCost = 0) {
        if (!cartManager || cartManager.isEmpty()) {
            console.warn('OrderService: Carrito vacío, no se puede enviar pedido');
            return;
        }

        // Obtener configuración de la tienda
        const storeConfig = config.store || config; // Compatibilidad hacia atrás
        const whatsappNumber = storeConfig.whatsappNumber || config.whatsappNumber;

        if (!whatsappNumber) {
            console.error('OrderService: Configuración de WhatsApp no encontrada');
            return;
        }

        try {
            // Formatear mensaje del pedido
            const message = this.formatOrderMessage(cartManager, storeConfig, address, paymentMethod, deliveryType, shippingCost);
            
            // Crear URL de WhatsApp
            const whatsappUrl = this.buildWhatsAppUrl(message, whatsappNumber);
            
            // Abrir WhatsApp via anchor para preservar encoding en mobile
            const a = document.createElement('a');
            a.href = whatsappUrl;
            a.target = '_blank';
            a.rel = 'noopener';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (error) {
            console.error('OrderService: Error al enviar pedido', error);
        }
    }

    /**
     * Formatea el mensaje completo del pedido
     * @param {Object} cartManager - Manejador del carrito
     * @param {Object} storeConfig - Configuración de la tienda
     * @returns {string} Mensaje formateado
     */
    formatOrderMessage(cartManager, storeConfig = {}, address = '', paymentMethod = '', deliveryType = '', shippingCost = 0) {
        const cart = cartManager.getCart();
        const subtotal = cartManager.getTotal();
        const finalTotal = subtotal + shippingCost;
        const storeName = storeConfig.name || this.defaultStoreName;
        const currencySymbol = storeConfig.currencySymbol || '$';

        // Unicode escapes para evitar problemas de encoding en Windows
        const ic = {
            chocolate: '\u{1F36B}',  // 🍫
            lollipop:  '\u{1F944}',  // 🥄 cucharita
            spoon:     '✅',    // ✅
            scooter:   '\u{1F697}',  // 🚗
            store:     '\u{1F3EA}',  // 🏪
            package:   '\u{1F4E6}',  // 📦
            pin:       '\u{1F4CD}',  // 📍
            card:      '\u{1F4B3}',  // 💳
            bank:      '\u{1F3E6}',  // 🏦
            money:     '\u{1F4B5}',  // 💵
            hearts:    '\u{1F970}',  // 🥰
        };

        const paymentLabels = {
            efectivo:      `${ic.money} Efectivo`,
            transferencia: `${ic.bank} Transferencia`
        };
        const deliveryLabels = {
            delivery: `${ic.scooter} Delivery`,
            retiro:   `${ic.store} Paso a retirar`
        };

        let lines = [];

        lines.push(`${ic.chocolate} *${storeName.toUpperCase()} - PEDIDO WEB* ${ic.lollipop}`);
        lines.push('');
        lines.push('Pedido a confirmar:');
        lines.push('─'.repeat(30));
        lines.push('');

        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            lines.push(`${ic.spoon} *${item.quantity}x* ${item.name} — _${currencySymbol}${itemTotal.toLocaleString()}_`);
        });

        lines.push('');
        lines.push('─'.repeat(30));

        if (shippingCost > 0) {
            lines.push(`Subtotal: ${currencySymbol}${subtotal.toLocaleString()}`);
            lines.push(`${ic.scooter} Envío: ${currencySymbol}${shippingCost.toLocaleString()}`);
        }

        lines.push(`*TOTAL: ${currencySymbol}${finalTotal.toLocaleString()}*`);
        lines.push('');

        if (deliveryType) {
            lines.push(`*Entrega:* ${deliveryLabels[deliveryType] || deliveryType}`);
        }
        if (address && deliveryType === 'delivery') {
            lines.push(`${ic.pin} *Enviar a:* ${address}`);
        }
        if (paymentMethod) {
            lines.push(`${ic.card} *Pago:* ${paymentLabels[paymentMethod] || paymentMethod}`);
            if (paymentMethod === 'transferencia') {
                lines.push(`${ic.bank} *Alias:* unacucharitamaszv`);
            }
        }

        lines.push('');
        lines.push(`Muchas gracias por elegirnos para endulzar tu momento ${ic.hearts}`);

        return lines.join('\n');
    }

    /**
     * Construye la URL de WhatsApp con el mensaje codificado
     * @param {string} message - Mensaje del pedido
     * @param {string} phoneNumber - Número de WhatsApp
     * @returns {string} URL completa de WhatsApp
     */
    buildWhatsAppUrl(message, phoneNumber) {
        const cleanPhoneNumber = this.cleanPhoneNumber(phoneNumber);
        const encodedMessage = encodeURIComponent(message);
        
        return `https://api.whatsapp.com/send?phone=${cleanPhoneNumber}&text=${encodedMessage}`;
    }

    /**
     * Limpia y valida el número de teléfono
     * @param {string} phoneNumber - Número de teléfono
     * @returns {string} Número limpio
     */
    cleanPhoneNumber(phoneNumber) {
        if (!phoneNumber) {
            throw new Error('Número de teléfono requerido');
        }

        // Remover espacios, guiones, paréntesis
        const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
        
        // Validar que contenga solo números y posible símbolo +
        if (!/^[\+]?[0-9]+$/.test(cleanNumber)) {
            throw new Error('Número de teléfono inválido');
        }

        return cleanNumber;
    }

    /**
     * Valida que un pedido sea válido antes de enviarlo
     * @param {Object} cartManager - Manejador del carrito
     * @param {Object} config - Configuración
     * @returns {Object} Resultado de validación {valid: boolean, errors: Array}
     */
    validateOrder(cartManager, config) {
        const errors = [];

        // Validar carrito
        if (!cartManager || cartManager.isEmpty()) {
            errors.push('El carrito está vacío');
        }

        // Validar configuración
        if (!config) {
            errors.push('Configuración no encontrada');
        } else {
            const storeConfig = config.store || config; // Compatibilidad hacia atrás
            const whatsappNumber = storeConfig.whatsappNumber || config.whatsappNumber;
            
            if (!whatsappNumber) {
                errors.push('Número de WhatsApp no configurado');
            }
        }

        // Validar productos del carrito
        if (cartManager && !cartManager.isEmpty()) {
            const cart = cartManager.getCart();
            cart.forEach((item, index) => {
                if (!item.name || !item.price || !item.quantity) {
                    errors.push(`Producto ${index + 1} tiene datos incompletos`);
                }
            });
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Obtiene un resumen del pedido para mostrar al usuario
     * @param {Object} cartManager - Manejador del carrito
     * @returns {Object} Resumen del pedido
     */
    getOrderSummary(cartManager) {
        if (!cartManager || cartManager.isEmpty()) {
            return {
                isEmpty: true,
                itemCount: 0,
                total: 0,
                items: []
            };
        }

        const cart = cartManager.getCart();
        
        return {
            isEmpty: false,
            itemCount: cartManager.getItemCount(),
            total: cartManager.getTotal(),
            items: cart.map(item => ({
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.price,
                totalPrice: item.price * item.quantity
            }))
        };
    }
}