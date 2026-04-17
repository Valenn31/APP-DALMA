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
    sendWhatsAppOrder(cartManager, config) {
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
            const message = this.formatOrderMessage(cartManager, storeConfig);
            
            // Crear URL de WhatsApp
            const whatsappUrl = this.buildWhatsAppUrl(message, whatsappNumber);
            
            // Abrir WhatsApp
            window.open(whatsappUrl, '_blank');
            
            console.log('OrderService: Pedido enviado por WhatsApp');
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
    formatOrderMessage(cartManager, storeConfig = {}) {
        const cart = cartManager.getCart();
        const total = cartManager.getTotal();
        const storeName = storeConfig.name || this.defaultStoreName;
        
        let message = '';
        
        // Encabezado
        message += this.formatHeader(storeName);
        
        // Lista de productos
        message += this.formatProductList(cart);
        
        // Separador
        message += this.formatSeparator();
        
        // Total
        message += this.formatTotal(total, storeConfig.currencySymbol || '$');
        
        // Mensaje de cierre
        message += this.formatClosingMessage();
        
        return message;
    }

    /**
     * Formatea el encabezado del pedido
     * @param {string} storeName - Nombre de la tienda
     * @returns {string} Encabezado formateado
     */
    formatHeader(storeName = this.defaultStoreName) {
        return `🍫 *${storeName.toUpperCase()} - PEDIDO WEB* 🍭\\n\\nPedido a confirmar:\\n${"_".repeat(52)}\\n\\n`;
    }

    /**
     * Formatea la lista de productos del carrito
     * @param {Array} cart - Array de items del carrito
     * @returns {string} Lista formateada
     */
    formatProductList(cart) {
        if (!cart || cart.length === 0) {
            return "No hay productos en el carrito\\n\\n";
        }

        return cart.map(item => {
            const itemTotal = item.price * item.quantity;
            return `🥄 *${item.quantity}x* ${item.name}\\n   _($${itemTotal.toLocaleString()})_\\n\\n`;
        }).join('');
    }

    /**
     * Formatea el separador visual
     * @returns {string} Separador formateado
     */
    formatSeparator() {
        return `${"_".repeat(52)}\\n\\n`;
    }

    /**
     * Formatea el total del pedido
     * @param {number} total - Total del pedido
     * @param {string} currencySymbol - Símbolo de moneda
     * @returns {string} Total formateado
     */
    formatTotal(total, currencySymbol = '$') {
        return `*TOTAL: ${currencySymbol}${total.toLocaleString()}*\\n\\n`;
    }

    /**
     * Formatea el mensaje de cierre
     * @returns {string} Mensaje de cierre
     */
    formatClosingMessage() {
        return "Muchas gracias por elegirnos para endulzar tu momento. 🥰\\n\\n";
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
        
        return `https://wa.me/${cleanPhoneNumber}?text=${encodedMessage}`;
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