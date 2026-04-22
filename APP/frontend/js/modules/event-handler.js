/**
 * EventHandler - Maneja todos los eventos del DOM de manera centralizada
 * Responsabilidad única: Capturar eventos y delegarlos a los managers apropiados
 */
export class EventHandler {
    constructor(viewManager, modalManager, cartManager, orderService, productManager) {
        this.viewManager = viewManager;
        this.modalManager = modalManager;
        this.cartManager = cartManager;
        this.orderService = orderService;
        this.productManager = productManager;
        
        this.setupEventListeners();
    }

    /**
     * Configura todos los event listeners usando event delegation
     */
    setupEventListeners() {
        document.addEventListener('click', (e) => this.handleClick(e));
        document.addEventListener('change', (e) => {
            if (e.target.name === 'delivery-type') {
                this.handleDeliveryTypeChange(e.target.value);
            }
        });

        // Al abrir el teclado en mobile, desplazar el campo de dirección para que quede visible
        const addressInput = document.getElementById('delivery-address');
        if (addressInput) {
            addressInput.addEventListener('focus', () => {
                setTimeout(() => {
                    addressInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            });
        }
    }

    /**
     * Maneja todos los clicks usando data-attributes
     * @param {Event} e - Evento de click
     */
    handleClick(e) {
        // Buscar el elemento más cercano con data-action
        const actionElement = e.target.closest('[data-action]');
        
        if (!actionElement) {
            return; // No hay acción definida
        }

        // Prevenir comportamiento por defecto si es necesario
        const { action, category, productId } = actionElement.dataset;

        // Ejecutar la acción correspondiente
        switch (action) {
            case 'selectCategory':
                this.handleSelectCategory(category);
                break;
                
            case 'showCategories':
                this.handleShowCategories();
                break;
                
            case 'showProductDetail':
                this.handleShowProductDetail(parseInt(productId));
                break;
                
            case 'closeProductDetail':
                this.handleCloseProductDetail();
                break;
                
            case 'addToCart':
                e.stopPropagation(); // Evitar que dispare otros eventos
                this.handleAddToCart(parseInt(productId));
                break;
                
            case 'toggleCart':
                this.handleToggleCart();
                break;

            case 'goToCheckout':
                this.handleGoToCheckout();
                break;

            case 'backToCart':
                this.modalManager.showCartStep();
                break;
                
            case 'updateQuantity':
                e.stopPropagation();
                const delta = parseInt(actionElement.dataset.delta) || 0;
                this.handleUpdateQuantity(parseInt(productId), delta);
                break;
                
            case 'sendWhatsAppOrder':
                this.handleSendWhatsAppOrder();
                break;
                
            default:
                console.warn('EventHandler: Acción no reconocida:', action);
        }
    }

    /**
     * Maneja la selección de una categoría
     * @param {string} category - Categoría seleccionada
     */
    handleSelectCategory(category) {
        if (!category) return;
        this.viewManager.selectCategory(category);
    }

    handleShowCategories() {
        this.viewManager.showCategories();
    }

    handleShowProductDetail(productId) {
        if (!productId || isNaN(productId)) return;
        this.modalManager.showProductDetail(productId);
    }

    handleCloseProductDetail() {
        this.modalManager.closeProductDetail();
    }

    /**
     * Maneja agregar un producto al carrito
     * @param {number} productId - ID del producto
     */
    handleAddToCart(productId) {
        if (!productId || isNaN(productId)) {
            console.error('EventHandler: ID de producto inválido para agregar al carrito:', productId);
            return;
        }

        const product = this.productManager.getById(productId);
        if (!product) return;

        this.cartManager.addItem(product);
        this.modalManager.showToast(`¡${product.name} agregado!`);
    }

    handleToggleCart() {
        this.modalManager.toggleCart();
    }

    /**
     * Maneja actualizar la cantidad de un producto en el carrito
     * @param {number} productId - ID del producto
     * @param {number} delta - Cambio en la cantidad (+1, -1)
     */
    handleUpdateQuantity(productId, delta) {
        if (!productId || isNaN(productId) || !delta || isNaN(delta)) return;
        this.cartManager.updateQuantity(productId, delta);
    }

    handleGoToCheckout() {
        if (this.cartManager.isEmpty()) {
            this.modalManager.showToast('Agregá productos antes de continuar', 3000);
            return;
        }
        this.modalManager.showCheckoutStep();
    }

    handleDeliveryTypeChange(value) {
        const addressSection = document.getElementById('address-section');
        if (addressSection) addressSection.classList.toggle('hidden', value !== 'delivery');
        this.modalManager.updateCheckoutTotal();
    }

    /**
     * Maneja el envío del pedido por WhatsApp
     */
    handleSendWhatsAppOrder() {
        const config = this.productManager.getConfig();

        // Obtener tipo de entrega
        const deliveryTypeInput = document.querySelector('input[name="delivery-type"]:checked');
        const deliveryType = deliveryTypeInput ? deliveryTypeInput.value : '';

        if (!deliveryType) {
            this.modalManager.showToast('Elegí el tipo de entrega', 3000);
            return;
        }

        // Dirección solo requerida para delivery
        const addressInput = document.getElementById('delivery-address');
        const address = addressInput ? addressInput.value.trim() : '';

        if (deliveryType === 'delivery' && !address) {
            this.modalManager.showToast('Ingresá tu dirección de envío', 3000);
            if (addressInput) addressInput.focus();
            return;
        }

        // Obtener método de pago
        const paymentInput = document.querySelector('input[name="payment-method"]:checked');
        const paymentMethod = paymentInput ? paymentInput.value : '';

        if (!paymentMethod) {
            this.modalManager.showToast('Elegí un método de pago', 3000);
            return;
        }

        // Validar pedido antes de enviar
        const validation = this.orderService.validateOrder(this.cartManager, config);

        if (!validation.valid) {
            console.error('EventHandler: Pedido inválido:', validation.errors);
            this.modalManager.showToast('Error: ' + validation.errors.join(', '), 4000);
            return;
        }

        const shippingCost = deliveryType === 'delivery' ? 300 : 0;
        this.orderService.sendWhatsAppOrder(this.cartManager, config, address, paymentMethod, deliveryType, shippingCost);
        this.modalManager.showToast('¡Pedido enviado por WhatsApp!', 3000);
    }

    /**
     * Configura callbacks para la comunicación entre managers
     */
    setupManagerCallbacks() {
        // Callback para agregar al carrito desde el modal de producto
        this.modalManager.setAddToCartCallback((productId) => {
            this.handleAddToCart(productId);
        });
    }
}