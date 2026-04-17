/**
 * ModalManager - Maneja todos los modales y notificaciones de la aplicación
 * Responsabilidad única: Abrir/cerrar modales y mostrar notificaciones
 */
export class ModalManager {
    constructor(productManager, cartManager) {
        this.productManager = productManager;
        this.cartManager = cartManager;
    }

    /**
     * Muestra el modal de detalle de un producto específico
     * @param {number} productId - ID del producto a mostrar
     */
    showProductDetail(productId) {
        const product = this.productManager.getById(productId);
        
        if (!product) {
            console.error('ModalManager: Producto no encontrado:', productId);
            return;
        }

        // Elementos del modal
        const modal = document.getElementById('product-detail-modal');
        const sheet = document.getElementById('product-detail-sheet');
        const img = document.getElementById('product-detail-img');
        const name = document.getElementById('product-detail-name');
        const desc = document.getElementById('product-detail-desc');
        const price = document.getElementById('product-detail-price');
        const addBtn = document.getElementById('product-detail-add-btn');

        if (!modal || !sheet) {
            console.error('ModalManager: Elementos del modal de producto no encontrados');
            return;
        }

        // Llenar información del producto
        if (img) img.src = product.img;
        if (name) name.textContent = product.name;
        if (desc) desc.textContent = product.desc;
        if (price) price.textContent = `$${product.price.toLocaleString()}`;
        
        // Configurar botón de agregar al carrito
        if (addBtn) {
            addBtn.onclick = () => {
                // Notificar al componente padre que agregue al carrito
                this.onAddToCart?.(productId);
                this.closeProductDetail();
            };
        }

        // Mostrar modal con animación
        modal.classList.remove('hidden');
        setTimeout(() => {
            sheet.classList.remove('translate-y-full');
        }, 10);
    }

    /**
     * Cierra el modal de detalle del producto
     */
    closeProductDetail() {
        const modal = document.getElementById('product-detail-modal');
        const sheet = document.getElementById('product-detail-sheet');
        
        if (!modal || !sheet) {
            console.error('ModalManager: Elementos del modal de producto no encontrados');
            return;
        }

        // Animar cierre
        sheet.classList.add('translate-y-full');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 500);
    }

    /**
     * Alterna la visibilidad del modal del carrito
     */
    toggleCart() {
        const modal = document.getElementById('cart-modal');
        const sheet = document.getElementById('cart-sheet');
        
        if (!modal || !sheet) {
            console.error('ModalManager: Elementos del modal de carrito no encontrados');
            return;
        }

        if (modal.classList.contains('hidden')) {
            // Abrir carrito
            modal.classList.remove('hidden');
            setTimeout(() => {
                sheet.style.transform = "translateY(0)";
            }, 10);
        } else {
            // Cerrar carrito
            sheet.style.transform = "translateY(100%)";
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 500);
        }
    }

    /**
     * Actualiza la interfaz visual del carrito
     */
    updateCartUI() {
        const list = document.getElementById('cart-items-list');
        const empty = document.getElementById('empty-cart-msg');
        const totalEl = document.getElementById('cart-total');
        const countEl = document.getElementById('cart-count');

        if (!list || !empty || !totalEl || !countEl) {
            console.error('ModalManager: Elementos del carrito no encontrados');
            return;
        }

        const cart = this.cartManager.getCart();

        if (this.cartManager.isEmpty()) {
            // Carrito vacío
            list.innerHTML = '';
            empty.style.display = 'flex';
            countEl.classList.add('hidden');
            totalEl.innerText = '$0';
            return;
        }

        // Carrito con productos
        empty.style.display = 'none';
        list.innerHTML = cart.map(item => this.createCartItemHTML(item)).join('');

        // Actualizar totales
        const total = this.cartManager.getTotal();
        const count = this.cartManager.getItemCount();
        totalEl.innerText = `$${total.toLocaleString()}`;
        countEl.innerText = count;
        countEl.classList.remove('hidden');
    }

    /**
     * Crea el HTML para un item del carrito
     * @param {Object} item - Item del carrito
     * @returns {string} HTML del item
     */
    createCartItemHTML(item) {
        return `
            <div class="flex items-center gap-4 bg-gray-50/50 p-4 rounded-3xl border border-[#f2e9dc]">
                <img src="${item.img}" class="w-12 h-12 rounded-2xl object-cover" alt="${item.name}">
                <div class="flex-1">
                    <h4 class="font-bold text-chocolate text-xs leading-none mb-1">${item.name}</h4>
                    <p class="text-verde font-black text-xs">$${(item.price * item.quantity).toLocaleString()}</p>
                </div>
                <div class="flex items-center gap-3 bg-white rounded-2xl px-3 py-2 border border-[#f2e9dc]">
                    <button data-action="updateQuantity" data-product-id="${item.id}" data-delta="-1" class="text-chocolate cursor-pointer">
                        <i class="fa-solid fa-minus text-[8px]"></i>
                    </button>
                    <span class="font-black text-xs min-w-[15px] text-center">${item.quantity}</span>
                    <button data-action="updateQuantity" data-product-id="${item.id}" data-delta="1" class="text-chocolate cursor-pointer">
                        <i class="fa-solid fa-plus text-[8px]"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Muestra una notificación toast
     * @param {string} message - Mensaje a mostrar
     * @param {number} duration - Duración en ms (default: 2500)
     */
    showToast(message, duration = 2500) {
        const toast = document.getElementById('toast');
        const toastText = document.getElementById('toast-text');
        
        if (!toast || !toastText) {
            console.error('ModalManager: Elementos del toast no encontrados');
            return;
        }

        // Configurar mensaje
        toastText.innerText = message;
        
        // Mostrar toast
        toast.classList.remove('opacity-0', 'translate-y-10');
        
        // Ocultar después del tiempo especificado
        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-10');
        }, duration);
    }

    /**
     * Establece el callback que se ejecuta cuando se agrega un producto al carrito desde el modal
     * @param {Function} callback - Función a ejecutar (productId) => {}
     */
    setAddToCartCallback(callback) {
        this.onAddToCart = callback;
    }

    /**
     * Establece el callback que se ejecuta cuando se actualiza la cantidad de un producto
     * @param {Function} callback - Función a ejecutar (productId, delta) => {}
     */
    setUpdateQuantityCallback(callback) {
        this.onUpdateQuantity = callback;
    }
}