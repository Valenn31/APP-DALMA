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
            console.log('🚀 App: Iniciando aplicación...');
            
            // Mostrar loading si existe
            this.showLoading();
            
            // Inicializar managers en orden
            await this.initializeManagers();
            
            // Configurar la aplicación
            this.setupApplication();
            
            // Ocultar loading
            this.hideLoading();
            
            this.isInitialized = true;
            console.log('✅ App: Aplicación inicializada exitosamente');
            
        } catch (error) {
            console.error('❌ App: Error al inicializar la aplicación:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Inicializa todos los managers principales
     */
    async initializeManagers() {
        console.log('📦 App: Inicializando managers...');
        
        // 1. Inicializar ProductManager
        this.productManager = new ProductManager();
        
        // 2. Cargar productos desde JSON
        const productsLoaded = await this.productManager.loadProducts();
        if (!productsLoaded) {
            throw new Error('No se pudieron cargar los productos');
        }
        console.log('📄 App: Productos cargados correctamente');
        
        // 3. Inicializar CartManager
        this.cartManager = new CartManager();
        console.log('🛒 App: CartManager inicializado');
        
        // 4. Inicializar UIManager (que a su vez inicializa todos los sub-managers)
        this.uiManager = new UIManager(this.cartManager, this.productManager);
        console.log('🎨 App: UIManager y sub-managers inicializados');
    }

    /**
     * Configura aspectos adicionales de la aplicación
     */
    setupApplication() {
        console.log('⚙️ App: Configurando aplicación...');
        
        // Configurar manejo de errores globales
        this.setupErrorHandling();
        
        // Configurar eventos de la ventana
        this.setupWindowEvents();
        
        // Configurar PWA si es necesario
        this.setupPWA();
        
        console.log('⚙️ App: Configuración completada');
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
        // Manejar cambio de visibilidad de la página
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.isInitialized) {
                console.log('App: Página visible, refrescando datos...');
                this.refresh();
            }
        });

        // Manejar beforeunload para limpiar recursos
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }

    /**
     * Configura PWA si es necesario (placeholder)
     */
    setupPWA() {
        // TODO: Agregar service worker si se requiere PWA
        if ('serviceWorker' in navigator) {
            console.log('App: Service Worker disponible');
        }
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
            console.log('🔄 App: Refrescando aplicación...');
            
            // Recargar productos
            await this.productManager.loadProducts();
            
            // Refrescar UI
            this.uiManager.refresh();
            
            console.log('✅ App: Aplicación refrescada');
        } catch (error) {
            console.error('❌ App: Error al refrescar:', error);
            this.handleError(error);
        }
    }

    /**
     * Limpia recursos antes de cerrar
     */
    cleanup() {
        if (this.uiManager) {
            this.uiManager.cleanup();
        }
        
        console.log('🧹 App: Recursos limpiados');
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
    
    // Exponer para debugging en desarrollo
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.dalmaApp = app;
        console.log('🐛 App: Aplicación expuesta en window.dalmaApp para debugging');
    }
});