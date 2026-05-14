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

        // Al abrir el teclado en mobile, desplazar el campo para que quede visible
        const addressInput = document.getElementById('delivery-address');
        if (addressInput) {
            addressInput.addEventListener('focus', () => {
                setTimeout(() => {
                    addressInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            });
        }
        const nameInput = document.getElementById('customer-name');
        if (nameInput) {
            nameInput.addEventListener('focus', () => {
                setTimeout(() => {
                    nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
                const variantName = actionElement.dataset.variantName || null;
                this.handleUpdateQuantity(parseInt(productId), delta, variantName);
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
    handleAddToCart(productId, variant = null) {
        if (!productId || isNaN(productId)) return;

        const product = this.productManager.getById(productId);
        if (!product) return;

        // Si tiene variantes y no se eligió ninguna, abrir el modal de detalle
        if (product.variants?.length > 0 && !variant) {
            this.handleShowProductDetail(productId);
            return;
        }

        const available = this.productManager.getStock(productId);
        const inCart = this.cartManager.getQuantityForProduct(productId, variant?.name ?? null);
        if (inCart >= available) {
            const msg = available === 1 ? '¡Es la última unidad!' : `Solo hay ${available} unidades disponibles`;
            this.modalManager.showToast(msg, 3000);
            return;
        }

        this.cartManager.addItem(product, variant);
        const variantText = variant ? ` (${variant.name})` : '';
        this.modalManager.showToast(`¡${product.name}${variantText} agregado!`);
    }

    handleToggleCart() {
        this.modalManager.toggleCart();
    }

    /**
     * Maneja actualizar la cantidad de un producto en el carrito
     * @param {number} productId - ID del producto
     * @param {number} delta - Cambio en la cantidad (+1, -1)
     */
    handleUpdateQuantity(productId, delta, variantName = null) {
        if (!productId || isNaN(productId) || !delta || isNaN(delta)) return;
        if (delta > 0) {
            const available = this.productManager.getStock(productId);
            const inCart = this.cartManager.getQuantityForProduct(productId, variantName);
            if (inCart >= available) {
                this.modalManager.showToast(`Solo hay ${available} unidades disponibles`, 3000);
                return;
            }
        }
        this.cartManager.updateQuantity(productId, delta, variantName || null);
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

        // Obtener nombre del cliente
        const nameInput = document.getElementById('customer-name');
        const customerName = nameInput ? nameInput.value.trim() : '';

        if (!customerName) {
            this.modalManager.showToast('Ingresá tu nombre', 3000);
            if (nameInput) nameInput.focus();
            return;
        }

        // Validar pedido antes de enviar
        const validation = this.orderService.validateOrder(this.cartManager, config);

        if (!validation.valid) {
            console.error('EventHandler: Pedido inválido:', validation.errors);
            this.modalManager.showToast('Error: ' + validation.errors.join(', '), 4000);
            return;
        }

        const deliveryCost = this.productManager.getStoreConfig()?.deliveryCost ?? 300;
        const shippingCost = deliveryType === 'delivery' ? deliveryCost : 0;
        const categories = this.productManager.categories || [];
        this.orderService.sendWhatsAppOrder(this.cartManager, config, address, paymentMethod, deliveryType, shippingCost, categories, customerName);
        this.modalManager.showToast('¡Pedido enviado por WhatsApp!', 3000);

        const cartItems = this.cartManager.getCart();
        const stockItems = cartItems.map(item => ({ productId: item.id, quantity: item.quantity }));
        this.productManager.consumeStock(stockItems).then(() => {
            this.viewManager.refresh();
        });

        const saleData = {
            customerName,
            items: cartItems.map(item => ({
                productId: item.id,
                productName: item.name,
                quantity: item.quantity,
                unitPrice: item.price
            })),
            deliveryType,
            deliveryAddress: address,
            paymentMethod,
            shippingCost,
            subtotal: this.cartManager.getTotal(),
            total: this.cartManager.getTotal() + shippingCost
        };
        this.productManager.saveSale(saleData);
    }

    /**
     * Configura callbacks para la comunicación entre managers
     */
    setupManagerCallbacks() {
        // Callback para agregar al carrito desde el modal de producto
        this.modalManager.setAddToCartCallback((productId, variant) => {
            this.handleAddToCart(productId, variant);
        });
    }
}