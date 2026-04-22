/**
 * ViewManager - Maneja la navegación entre vistas y renderizado de productos
 * Responsabilidad única: Controlar qué vista se muestra y cómo se renderizan los productos
 */
export class ViewManager {
    constructor(productManager) {
        this.productManager = productManager;
        this.currentCategory = '';
    }

    /**
     * Navega a la vista de productos de una categoría específica
     * @param {string} category - Categoría de productos a mostrar
     */
    selectCategory(category) {
        // Ocultar vista de categorías
        const categoriesView = document.getElementById('categories-view');
        const productsView = document.getElementById('products-view');
        const categoryTitle = document.getElementById('current-category-title');
        
        if (!categoriesView || !productsView || !categoryTitle) {
            console.error('ViewManager: Elementos de vista no encontrados');
            return;
        }

        categoriesView.classList.add('hidden');
        productsView.classList.remove('hidden');
        
        // Actualizar título de categoría
        categoryTitle.innerText = category.charAt(0).toUpperCase() + category.slice(1);
        
        // Guardar categoría actual
        this.currentCategory = category;
        
        // Renderizar productos de la categoría
        this.renderProducts(category);
        
        // Scroll al inicio
        window.scrollTo(0, 0);
    }

    /**
     * Navega de vuelta a la vista de categorías
     */
    showCategories() {
        const categoriesView = document.getElementById('categories-view');
        const productsView = document.getElementById('products-view');
        
        if (!categoriesView || !productsView) {
            console.error('ViewManager: Elementos de vista no encontrados');
            return;
        }

        productsView.classList.add('hidden');
        categoriesView.classList.remove('hidden');
        
        // Limpiar categoría actual
        this.currentCategory = '';
        
        // Scroll al inicio
        window.scrollTo(0, 0);
    }

    /**
     * Renderiza los productos de una categoría específica
     * @param {string} category - Categoría de productos a renderizar
     */
    renderProducts(category) {
        const container = document.getElementById('product-container');
        
        if (!container) {
            console.error('ViewManager: Container de productos no encontrado');
            return;
        }

        // Obtener productos filtrados por categoría
        const filteredProducts = this.productManager.getByCategory(category);
        
        if (!filteredProducts || filteredProducts.length === 0) {
            container.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                    <i class="fa-solid fa-box-open text-6xl mb-4"></i>
                    <p class="font-bold">No hay productos en esta categoría</p>
                </div>
            `;
            return;
        }

        // Renderizar productos
        container.innerHTML = filteredProducts.map(product => this.createProductCard(product)).join('');
    }

    /**
     * Crea el HTML de una tarjeta de producto
     * @param {Object} product - Datos del producto
     * @returns {string} HTML de la tarjeta
     */
    createProductCard(product) {
        return `
            <div class="product-card rounded-2xl overflow-hidden flex items-stretch">
                <div data-action="showProductDetail" data-product-id="${product.id}"
                     class="flex items-stretch flex-1 cursor-pointer min-w-0 active:opacity-75 transition-opacity">
                    <img src="${product.img}" class="w-28 h-28 object-cover flex-shrink-0" alt="${product.name}">
                    <div class="flex-1 px-4 py-3 min-w-0 flex flex-col justify-between">
                        <div>
                            <h3 class="font-bold text-chocolate text-[15px] leading-snug">${product.name}</h3>
                            <p class="text-gray-400 text-[11px] mt-1 line-clamp-1">${product.desc}</p>
                        </div>
                        <span class="font-black text-[#c49a6c] text-lg">$${product.price.toLocaleString()}</span>
                    </div>
                </div>
                <div class="flex items-center pr-3 flex-shrink-0">
                    <button data-action="addToCart" data-product-id="${product.id}"
                            class="bg-[#7d8c56] text-white w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 transition-all shadow-sm cursor-pointer">
                        <i class="fa-solid fa-plus text-sm"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Obtiene la categoría actualmente seleccionada
     * @returns {string} Categoría actual
     */
    getCurrentCategory() {
        return this.currentCategory;
    }

    /**
     * Refresca el renderizado de la categoría actual
     */
    refresh() {
        if (this.currentCategory) {
            this.renderProducts(this.currentCategory);
        }
    }
}