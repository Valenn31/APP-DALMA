export class UIManager {
    constructor(cartManager, productManager) {
        this.cartManager = cartManager;
        this.productManager = productManager;
        this.currentCategory = '';
        
        this.initializeEventListeners();
        this.cartManager.setUpdateUICallback(() => this.updateCartUI());
    }

    initializeEventListeners() {
        // Hacer que las funciones estén disponibles globalmente para onclick
        window.selectCategory = (category) => this.selectCategory(category);
        window.showCategories = () => this.showCategories();
        window.addToCart = (id) => this.addToCart(id);
        window.updateQuantity = (id, delta) => this.updateQuantity(id, delta);
        window.toggleCart = () => this.toggleCart();
        window.sendWhatsAppOrder = () => this.sendWhatsAppOrder();
        window.showProductDetail = (id) => this.showProductDetail(id);
        window.closeProductDetail = () => this.closeProductDetail();
    }

    selectCategory(category) {
        document.getElementById('categories-view').classList.add('hidden');
        document.getElementById('products-view').classList.remove('hidden');
        document.getElementById('current-category-title').innerText = category;
        this.currentCategory = category;
        this.renderProducts(category);
        window.scrollTo(0, 0);
    }

    showCategories() {
        document.getElementById('products-view').classList.add('hidden');
        document.getElementById('categories-view').classList.remove('hidden');
        window.scrollTo(0, 0);
    }

    renderProducts(category) {
        const container = document.getElementById('product-container');
        const filtered = this.productManager.getByCategory(category);
        
        container.innerHTML = filtered.map(product => `
            <div onclick="showProductDetail(${product.id})" class="product-card rounded-[15px] p-1 shadow-sm flex items-center gap-5 border border-white cursor-pointer active:scale-95 transition-transform">
                <img src="${product.img}" class="w-24 h-24 rounded-[10px] object-cover">
                <div class="flex-1">
                    <h3 class="font-bold text-chocolate text-base leading-tight">${product.name}</h3>
                    <p class="text-gray-400 text-[10px] my-1 line-clamp-2">${product.desc}</p>
                    <div class="flex justify-between items-center mt-2">
                        <span class="font-black text-chocolate text-lg">$${product.price.toLocaleString()}</span>
                        <button onclick="event.stopPropagation(); addToCart(${product.id})" class="bg-[#7d8c56] text-white w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-all shadow-md">
                            <i class="fa-solid fa-plus text-xs"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    addToCart(id) {
        const product = this.productManager.getById(id);
        if (product) {
            this.cartManager.addItem(product);
            this.showToast(`¡${product.name} agregado!`);
        }
    }

    updateQuantity(id, delta) {
        this.cartManager.updateQuantity(id, delta);
    }

    showProductDetail(id) {
        const product = this.productManager.getById(id);
        if (!product) return;

        // Llenar información del modal
        document.getElementById('product-detail-img').src = product.img;
        document.getElementById('product-detail-name').textContent = product.name;
        document.getElementById('product-detail-desc').textContent = product.desc;
        document.getElementById('product-detail-price').textContent = `$${product.price.toLocaleString()}`;
        
        // Configurar botón de agregar
        const addBtn = document.getElementById('product-detail-add-btn');
        addBtn.onclick = () => {
            this.addToCart(id);
            this.closeProductDetail();
        };

        // Mostrar modal
        const modal = document.getElementById('product-detail-modal');
        const sheet = document.getElementById('product-detail-sheet');
        
        modal.classList.remove('hidden');
        setTimeout(() => {
            sheet.classList.remove('translate-y-full');
        }, 10);
    }

    closeProductDetail() {
        const modal = document.getElementById('product-detail-modal');
        const sheet = document.getElementById('product-detail-sheet');
        
        sheet.classList.add('translate-y-full');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 500);
    }

    updateCartUI() {
        const list = document.getElementById('cart-items-list');
        const empty = document.getElementById('empty-cart-msg');
        const totalEl = document.getElementById('cart-total');
        const countEl = document.getElementById('cart-count');

        const cart = this.cartManager.getCart();

        if (this.cartManager.isEmpty()) {
            list.innerHTML = '';
            empty.style.display = 'flex';
            countEl.classList.add('hidden');
            totalEl.innerText = '$0';
            return;
        }

        empty.style.display = 'none';
        list.innerHTML = cart.map(item => `
            <div class="flex items-center gap-4 bg-gray-50/50 p-4 rounded-3xl border border-[#f2e9dc]">
                <img src="${item.img}" class="w-12 h-12 rounded-2xl object-cover">
                <div class="flex-1">
                    <h4 class="font-bold text-chocolate text-xs leading-none mb-1">${item.name}</h4>
                    <p class="text-verde font-black text-xs">$${(item.price * item.quantity).toLocaleString()}</p>
                </div>
                <div class="flex items-center gap-3 bg-white rounded-2xl px-3 py-2 border border-[#f2e9dc]">
                    <button onclick="updateQuantity(${item.id}, -1)" class="text-chocolate"><i class="fa-solid fa-minus text-[8px]"></i></button>
                    <span class="font-black text-xs min-w-[15px] text-center">${item.quantity}</span>
                    <button onclick="updateQuantity(${item.id}, 1)" class="text-chocolate"><i class="fa-solid fa-plus text-[8px]"></i></button>
                </div>
            </div>
        `).join('');

        const total = this.cartManager.getTotal();
        const count = this.cartManager.getItemCount();
        totalEl.innerText = `$${total.toLocaleString()}`;
        countEl.innerText = count;
        countEl.classList.remove('hidden');
    }

    toggleCart() {
        const modal = document.getElementById('cart-modal');
        const sheet = document.getElementById('cart-sheet');
        if (modal.classList.contains('hidden')) {
            modal.classList.remove('hidden');
            setTimeout(() => sheet.style.transform = "translateY(0)", 10);
        } else {
            sheet.style.transform = "translateY(100%)";
            setTimeout(() => modal.classList.add('hidden'), 500);
        }
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        document.getElementById('toast-text').innerText = message;
        toast.classList.remove('opacity-0', 'translate-y-10');
        setTimeout(() => toast.classList.add('opacity-0', 'translate-y-10'), 2500);
    }

sendWhatsAppOrder() {
    if (this.cartManager.isEmpty()) return;
    
    const cart = this.cartManager.getCart();
    const config = this.productManager.getConfig();
    
    // Encabezado con calidez
    let msg = "🍫 *UNA CUCHARITA MÁS - PEDIDO WEB* 🍭\n\n";
    msg += "Pedido a confirmar: \n";
    msg += "____________________________________________________\n\n";

    // Listado de productos
    cart.forEach(item => {
        msg += `🥄 *${item.quantity}x* ${item.name}\n`;
        msg += `   _($${(item.price * item.quantity).toLocaleString()})_\n\n`;
    });

    msg += "____________________________________________________\n\n";
    
    // Mensaje de agradecimiento
    msg += "Muchas gracias por elegirnos para endulzar tu momento. 🥰\n\n";
    
    // Total final bien destacado
    const total = this.cartManager.getTotal();
    msg += `*TOTAL: $${total.toLocaleString()}*`;

    // Abrir WhatsApp
    const whatsappUrl = `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, '_blank');
} }