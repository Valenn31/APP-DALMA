/**
 * ProductManager - Maneja la carga y consulta de productos
 * Responsabilidad: Gestionar datos de productos, stock y configuración
 */
import { API_BASE_URL } from './api-config.js';

export class ProductManager {
    constructor() {
        this.products = [];
        this.config = {};
        this.metadata = {};
        this.categories = [];
    }

    async loadProducts() {
        try {
            const [productsRes, storeRes] = await Promise.all([
                fetch(`${API_BASE_URL}/products`),
                fetch(`${API_BASE_URL}/config/store`)
            ]);

            const productsData = await productsRes.json();
            const storeData = await storeRes.json();
            
            this.products = productsData.success ? productsData.data : [];
            
            if (storeData.success) {
                this.config = {
                    store: storeData.data,
                    categories: storeData.data.categories || [],
                    stock: { trackStock: true }
                };
                this.categories = storeData.data.categories || [];
            }
            
            this.metadata = {};
            
            return true;
        } catch (error) {
            console.error('ProductManager: Error al cargar productos:', error);
            return false;
        }
    }

    /**
     * Obtiene productos por categoría (solo activos y en stock)
     * @param {string} category - Categoría a filtrar
     * @returns {Array} - Productos filtrados
     */
    getByCategory(category) {
        return this.products
            .filter(p => p.category === category && p.active !== false)
            .filter(p => this.config.stock?.trackStock ? p.stock > 0 : true)
            .map(p => this.normalizeProduct(p));
    }

    /**
     * Obtiene un producto por ID
     * @param {number} id - ID del producto
     * @returns {Object|null} - Producto encontrado o null
     */
    getById(id) {
        const product = this.products.find(p => p.id === id);
        return product ? this.normalizeProduct(product) : null;
    }

    /**
     * Obtiene todos los productos activos
     * @returns {Array} - Todos los productos
     */
    getAllProducts() {
        return this.products
            .filter(p => p.active !== false)
            .map(p => this.normalizeProduct(p));
    }

    /**
     * Obtiene productos para administración (incluye inactivos)
     * @returns {Array} - Todos los productos sin filtro
     */
    getAllProductsForAdmin() {
        return this.products.map(p => this.normalizeProduct(p, true));
    }

    /**
     * Normaliza un producto para compatibilidad con el frontend actual
     * @param {Object} product - Producto original
     * @param {boolean} adminMode - Si es para el admin (incluye campos extra)
     * @returns {Object} - Producto normalizado
     */
    normalizeProduct(product, adminMode = false) {
        const normalized = {
            id: product.id,
            name: product.name,
            price: product.price,
            category: product.category,
            desc: product.description, // Compatibilidad hacia atrás
            description: product.description,
            img: product.image, // Compatibilidad hacia atrás  
            image: product.image
        };

        // Campos adicionales para admin o análisis
        if (adminMode) {
            normalized.stock = product.stock || 0;
            normalized.active = product.active;
            normalized.featured = product.featured;
            normalized.tags = product.tags || [];
            normalized.cost = product.cost || 0;
            normalized.margin = product.margin || 0;
            normalized.sku = product.sku;
            normalized.weight = product.weight;
            normalized.preparationTime = product.preparationTime;
            normalized.allergens = product.allergens || [];
            normalized.createdAt = product.createdAt;
            normalized.updatedAt = product.updatedAt;
        }

        return normalized;
    }

    /**
     * Obtiene productos con stock bajo
     * @returns {Array} - Productos con stock bajo
     */
    getLowStockProducts() {
        const lowStockAlert = this.config.stock?.lowStockAlert || 3;
        return this.products
            .filter(p => p.active !== false && p.stock <= lowStockAlert)
            .map(p => this.normalizeProduct(p, true));
    }

    /**
     * Obtiene productos destacados
     * @returns {Array} - Productos destacados
     */
    getFeaturedProducts() {
        return this.products
            .filter(p => p.active !== false && p.featured === true)
            .filter(p => this.config.stock?.trackStock ? p.stock > 0 : true)
            .map(p => this.normalizeProduct(p));
    }

    /**
     * Verifica si un producto tiene stock
     * @param {number} productId - ID del producto
     * @returns {boolean} - True si tiene stock
     */
    hasStock(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return false;
        
        return this.config.stock?.trackStock ? product.stock > 0 : true;
    }

    /**
     * Obtiene el stock de un producto
     * @param {number} productId - ID del producto
     * @returns {number} - Cantidad en stock
     */
    getStock(productId) {
        const product = this.products.find(p => p.id === productId);
        return product ? (product.stock || 0) : 0;
    }

    /**
     * Obtiene la configuración de la tienda
     * @returns {Object} - Configuración completa
     */
    getConfig() {
        return this.config;
    }

    /**
     * Obtiene configuración específica de la tienda
     * @returns {Object} - Configuración de la tienda
     */
    getStoreConfig() {
        return this.config.store || {};
    }

    /**
     * Obtiene metadatos del sistema
     * @returns {Object} - Metadatos
     */
    getMetadata() {
        return this.metadata;
    }

    /**
     * Obtiene categorías disponibles
     * @returns {Array} - Categorías activas
     */
    getCategories() {
        return this.categories.filter(cat => cat.active !== false);
    }

    /**
     * Obtiene estadísticas del inventario
     * @returns {Object} - Estadísticas
     */
    getInventoryStats() {
        const activeProducts = this.products.filter(p => p.active !== false);
        const lowStockAlert = this.config.stock?.lowStockAlert || 3;
        
        return {
            totalProducts: this.products.length,
            activeProducts: activeProducts.length,
            inactiveProducts: this.products.length - activeProducts.length,
            lowStockCount: activeProducts.filter(p => p.stock <= lowStockAlert).length,
            outOfStockCount: activeProducts.filter(p => p.stock === 0).length,
            totalStockValue: activeProducts.reduce((sum, p) => sum + (p.stock * p.cost || 0), 0),
            featuredCount: activeProducts.filter(p => p.featured).length
        };
    }

    /**
     * Valida si el modo mantenimiento está activo
     * @returns {boolean} - True si está en mantenimiento
     */
    isMaintenanceMode() {
        return this.config.business?.maintenanceMode || false;
    }
}