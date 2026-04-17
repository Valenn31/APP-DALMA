const Product = require('../models/Product');
const Config = require('../models/Config');

/**
 * DataService - Maneja la persistencia de datos usando MongoDB
 * Misma interfaz que la versión JSON para compatibilidad total
 */
class DataService {
    constructor() {
        this.defaultConfig = {
            store: {
                name: 'Una Cucharita Más',
                slogan: 'Endulzando tus momentos',
                whatsappNumber: '5493471671286',
                currency: 'ARS',
                currencySymbol: '$',
                minimumOrder: 0
            },
            categories: [
                { id: 'chocolates', name: 'Chocolates', description: 'Premium', active: true, image: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&q=80&w=800' },
                { id: 'postres', name: 'Postres', description: 'Artesanal', active: true, image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&q=80&w=800' }
            ],
            business: {
                hours: { open: '10:00', close: '20:00', timezone: 'America/Argentina/Buenos_Aires' },
                deliveryDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
                maintenanceMode: false
            },
            stock: { lowStockAlert: 3, outOfStockBehavior: 'hide', trackStock: true },
            admin: { lastLogin: null, sessionTimeout: 3600000, maxLoginAttempts: 3 }
        };
    }

    // ===================== MÉTODOS DE PRODUCTOS =====================

    async getProducts(includeInactive = false) {
        const filter = includeInactive ? {} : { active: { $ne: false } };
        const products = await Product.find(filter).sort({ id: 1 }).lean();
        return products.map(p => this._cleanDoc(p));
    }

    async getProductById(id) {
        const product = await Product.findOne({ id: parseInt(id) }).lean();
        return product ? this._cleanDoc(product) : null;
    }

    async createProduct(productData) {
        const lastProduct = await Product.findOne().sort({ id: -1 }).lean();
        const newId = (lastProduct?.id || 0) + 1;

        const product = new Product({ id: newId, ...productData });
        const saved = await product.save();

        console.log(`DataService: Producto creado con ID ${newId}`);
        return this._cleanDoc(saved.toObject());
    }

    async updateProduct(id, updates) {
        const updated = await Product.findOneAndUpdate(
            { id: parseInt(id) },
            { ...updates, id: parseInt(id) },
            { new: true, runValidators: true }
        ).lean();

        if (!updated) return null;
        console.log(`DataService: Producto ${id} actualizado`);
        return this._cleanDoc(updated);
    }

    async deleteProduct(id) {
        return await this.updateProduct(id, { active: false });
    }

    async deleteProductPermanently(id) {
        const result = await Product.deleteOne({ id: parseInt(id) });
        if (result.deletedCount > 0) {
            console.log(`DataService: Producto ${id} eliminado permanentemente`);
            return true;
        }
        return false;
    }

    // ===================== MÉTODOS DE CONFIGURACIÓN =====================

    async getConfig() {
        const configs = await Config.find().lean();
        if (configs.length === 0) {
            await this._initializeConfig();
            return { ...this.defaultConfig };
        }
        const config = {};
        for (const c of configs) {
            config[c.key] = c.value;
        }
        return config;
    }

    async updateConfig(configUpdates) {
        for (const [key, value] of Object.entries(configUpdates)) {
            await Config.findOneAndUpdate({ key }, { key, value }, { upsert: true, new: true });
        }
        console.log('DataService: Configuración actualizada');
        return await this.getConfig();
    }

    async getMetadata() {
        const count = await Product.countDocuments();
        return {
            version: '2.0.0',
            lastUpdated: new Date().toISOString(),
            totalProducts: count,
            systemInfo: { created: '2026-04-01T00:00:00.000Z', environment: process.env.NODE_ENV || 'development' }
        };
    }

    // ===================== MÉTODOS DE ESTADÍSTICAS =====================

    async getInventoryStats() {
        const products = await this.getProducts(true);
        const config = await this.getConfig();
        const lowStockAlert = config.stock?.lowStockAlert || 3;
        const activeProducts = products.filter(p => p.active !== false);

        return {
            totalProducts: products.length,
            activeProducts: activeProducts.length,
            inactiveProducts: products.length - activeProducts.length,
            lowStockCount: activeProducts.filter(p => p.stock <= lowStockAlert).length,
            outOfStockCount: activeProducts.filter(p => p.stock === 0).length,
            totalStockValue: activeProducts.reduce((sum, p) => sum + ((p.stock || 0) * (p.cost || 0)), 0),
            featuredCount: activeProducts.filter(p => p.featured).length,
            categoriesCount: new Set(activeProducts.map(p => p.category)).size
        };
    }

    // ===================== HELPERS =====================

    _cleanDoc(doc) {
        const { _id, __v, ...clean } = doc;
        if (clean.createdAt) clean.createdAt = new Date(clean.createdAt).toISOString();
        if (clean.updatedAt) clean.updatedAt = new Date(clean.updatedAt).toISOString();
        return clean;
    }

    async _initializeConfig() {
        for (const [key, value] of Object.entries(this.defaultConfig)) {
            await Config.findOneAndUpdate({ key }, { key, value }, { upsert: true });
        }
        console.log('DataService: Configuración por defecto inicializada en MongoDB');
    }
}

module.exports = DataService;

// Singleton instance
let instance = null;
module.exports.getInstance = () => {
    if (!instance) {
        instance = new DataService();
    }
    return instance;
};