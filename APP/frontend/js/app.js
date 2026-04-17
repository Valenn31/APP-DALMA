import { ProductManager } from './products.js';
import { CartManager } from './cart.js';
import { UIManager } from './ui.js';

class App {
    constructor() {
        this.init();
    }

    async init() {
        try {
            // Inicializar managers
            this.productManager = new ProductManager();
            this.cartManager = new CartManager();
            
            // Cargar productos
            const loaded = await this.productManager.loadProducts();
            if (!loaded) {
                console.error('Failed to load products');
                return;
            }
            
            // Inicializar UI
            this.uiManager = new UIManager(this.cartManager, this.productManager);
            
            console.log('App initialized successfully');
        } catch (error) {
            console.error('Error initializing app:', error);
        }
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new App();
});