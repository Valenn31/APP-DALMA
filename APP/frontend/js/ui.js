import { ViewManager } from './modules/view-manager.js';
import { ModalManager } from './modules/modal-manager.js';
import { OrderService } from './modules/order-service.js';
import { EventHandler } from './modules/event-handler.js';

/**
 * UIManager - Orquestador principal de la interfaz de usuario
 * Responsabilidad: Coordinar y sincronizar todos los managers
 */
export class UIManager {
    constructor(cartManager, productManager) {
        this.cartManager = cartManager;
        this.productManager = productManager;
        
        // Inicializar managers especializados
        this.viewManager = new ViewManager(productManager);
        this.modalManager = new ModalManager(productManager, cartManager);
        this.orderService = new OrderService();
        
        // Configurar event handler
        this.eventHandler = new EventHandler(
            this.viewManager,
            this.modalManager,
            this.cartManager,
            this.orderService,
            this.productManager
        );
        
        this.initialize();
    }

    /**
     * Inicializa el UIManager y sus componentes
     */
    initialize() {
        console.log('UIManager: Inicializando componentes');
        
        // Configurar callbacks entre managers
        this.setupManagerCallbacks();
        
        // Ya no necesitamos exponer métodos globales - todo usa event delegation
        console.log('UIManager: Event delegation configurado correctamente');
        
        console.log('UIManager: Inicialización completa');
    }

    /**
     * Configura la comunicación entre managers
     */
    setupManagerCallbacks() {
        // Configurar callback del carrito para actualizar UI
        this.cartManager.setUpdateUICallback(() => {
            this.modalManager.updateCartUI();
        });

        // Configurar callbacks del modal manager
        this.eventHandler.setupManagerCallbacks();
    }

    /**
     * Obtiene el manager de vistas
     * @returns {ViewManager}
     */
    getViewManager() {
        return this.viewManager;
    }

    /**
     * Obtiene el manager de modales
     * @returns {ModalManager}
     */
    getModalManager() {
        return this.modalManager;
    }

    /**
     * Obtiene el servicio de pedidos
     * @returns {OrderService}
     */
    getOrderService() {
        return this.orderService;
    }

    /**
     * Obtiene el manejador de eventos
     * @returns {EventHandler}
     */
    getEventHandler() {
        return this.eventHandler;
    }

    /**
     * Limpia recursos y event listeners
     */
    cleanup() {
        console.log('UIManager: Limpiando recursos');
        
        // Los event listeners se limpian automáticamente con event delegation
        console.log('UIManager: Cleanup completo');
    }

    /**
     * Refresca toda la interfaz
     */
    refresh() {
        console.log('UIManager: Refrescando interfaz');
        
        // Refrescar vista actual
        this.viewManager.refresh();
        
        // Actualizar carrito
        this.modalManager.updateCartUI();
    }
}