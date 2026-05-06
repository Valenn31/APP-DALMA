import { ProductManager } from './products.js';
import { CartManager } from './cart.js';
import { UIManager } from './ui.js';

/**
 * Aplicación principal - Punto de entrada y orquestador de alto nivel
 * Responsabilidad: Inicializar y coordinar todos los managers principales
 */
class App {
    constructor() {
        this.productManager = null;
        this.cartManager = null;
        this.uiManager = null;
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * Inicializa la aplicación completa
     */
    async init() {
        try {
            this.showLoading();
            await this.initializeManagers();
            this.setupApplication();
            this.hideLoading();
            this.isInitialized = true;
        } catch (error) {
            console.error('App: Error al inicializar:', error);
            this.handleInitializationError(error);
            return;
        }

        this.renderCategoryCards();
    }

    /**
     * Inicializa todos los managers principales
     */
    async initializeManagers() {
        this.productManager = new ProductManager();
        
        const productsLoaded = await this.productManager.loadProducts();
        if (!productsLoaded) {
            throw new Error('No se pudieron cargar los productos');
        }
        
        this.cartManager = new CartManager();
        this.uiManager = new UIManager(this.cartManager, this.productManager);
    }

    /**
     * Configura aspectos adicionales de la aplicación
     */
    setupApplication() {
        this.setupErrorHandling();
        this.setupWindowEvents();
    }

    /**
     * Configura el manejo de errores globales
     */
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('App: Error global capturado:', event.error);
            this.handleError(event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('App: Promise rechazada no manejada:', event.reason);
            this.handleError(event.reason);
        });
    }

    /**
     * Configura eventos de la ventana
     */
    setupWindowEvents() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.isInitialized) {
                this.refresh();
            }
        });

        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }

    /**
     * Muestra indicador de carga
     */
    showLoading() {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'flex';
        }
    }

    /**
     * Oculta indicador de carga
     */
    hideLoading() {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    /**
     * Maneja errores de inicialización
     * @param {Error} error - Error ocurrido
     */
    handleInitializationError(error) {
        this.hideLoading();
        
        // Mostrar mensaje de error al usuario
        const errorMessage = 'No se pudo cargar la aplicación. Por favor, recarga la página.';
        
        // Intentar mostrar en un elemento específico
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = errorMessage;
            errorElement.style.display = 'block';
        } else {
            // Fallback a alert si no hay elemento de error
            alert(errorMessage);
        }
    }

    /**
     * Maneja errores durante la ejecución
     * @param {Error} error - Error ocurrido
     */
    handleError(error) {
        // Por ahora solo log, en producción podríamos enviar a un servicio de monitoreo
        console.error('App: Error durante ejecución:', error);
        
        // Mostrar toast de error si el UI está disponible
        if (this.uiManager) {
            this.uiManager.showToast('Ocurrió un error inesperado', 3000);
        }
    }

    /**
     * Refresca la aplicación
     */
    async refresh() {
        if (!this.isInitialized) return;
        
        try {
            await this.productManager.loadProducts();
            this.uiManager.refresh();
        } catch (error) {
            console.error('App: Error al refrescar:', error);
            this.handleError(error);
        }
    }

    renderCategoryCards() {
        const container = document.getElementById('categories-container');
        if (!container) return;

        const allCategories = this.productManager.categories;
        const sorted = [...allCategories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const visible = sorted.filter(cat => cat.active !== false);
        const allUnavailable = visible.length > 0 && visible.every(cat => cat.available === false);

        if (allUnavailable || visible.length === 0) {
            document.getElementById('store-closed-view')?.classList.remove('hidden');
            document.getElementById('categories-view')?.classList.add('hidden');
            document.getElementById('floating-cart')?.classList.add('hidden');
            return;
        }

        container.innerHTML = visible.map(cat => {
            const ok = cat.available !== false;
            return `
                <div id="category-card-${cat.id}"
                     ${ok ? `data-action="selectCategory" data-category="${cat.id}"` : ''}
                     class="category-card flex-1 rounded-[28px] overflow-hidden flex flex-col ${ok ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}"
                     ${ok ? '' : 'style="pointer-events:none"'}>
                    <div class="flex-1 relative overflow-hidden">
                        <img src="${cat.image ? (cat.image.startsWith('http') ? cat.image : '/' + cat.image) : ''}" class="absolute inset-0 w-full h-full object-cover" alt="${cat.name}">
                    </div>
                    <div class="category-card-info px-6 py-4 flex items-center justify-between">
                        <div>
                            <h3 class="font-display text-2xl font-bold text-chocolate">${cat.name}</h3>
                            <p id="category-subtitle-${cat.id}" class="text-[11px] text-chocolate/40 mt-0.5 font-medium tracking-wide">
                                ${ok ? 'Tocá para ver más' : 'No disponible'}
                            </p>
                        </div>
                        <div class="w-10 h-10 rounded-full bg-[#f2e9dc] flex items-center justify-center flex-shrink-0">
                            <i class="fa-solid fa-chevron-right text-chocolate text-xs"></i>
                        </div>
                    </div>
                </div>`;
        }).join('');
    }

    cleanup() {
        if (this.uiManager) {
            this.uiManager.cleanup();
        }
    }

    /**
     * Obtiene el estado de la aplicación para debugging
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            productCount: this.productManager ? this.productManager.getAllProducts().length : 0,
            cartItemCount: this.cartManager ? this.cartManager.getItemCount() : 0,
            cartTotal: this.cartManager ? this.cartManager.getTotal() : 0
        };
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.dalmaApp = app;
    }
});