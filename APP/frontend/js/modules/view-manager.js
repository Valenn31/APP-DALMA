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
            <div data-action="showProductDetail" data-product-id="${product.id}" class="product-card rounded-[15px] p-1 shadow-sm flex items-center gap-5 border border-white cursor-pointer active:scale-95 transition-transform">
                <img src="${product.img}" class="w-24 h-24 rounded-[10px] object-cover" alt="${product.name}">
                <div class="flex-1">
                    <h3 class="font-bold text-chocolate text-base leading-tight">${product.name}</h3>
                    <p class="text-gray-400 text-[10px] my-1 line-clamp-2">${product.desc}</p>
                    <div class="flex justify-between items-center mt-2">
                        <span class="font-black text-chocolate text-lg">$${product.price.toLocaleString()}</span>
                        <button data-action="addToCart" data-product-id="${product.id}" class="bg-[#7d8c56] text-white w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-all shadow-md cursor-pointer">
                            <i class="fa-solid fa-plus text-xs"></i>
                        </button>
                    </div>
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