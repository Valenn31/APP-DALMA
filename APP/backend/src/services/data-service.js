const Product = require('../models/Product');
const Config = require('../models/Config');
const Sale = require('../models/Sale');

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
                minimumOrder: 0,
                deliveryCost: 300,
                backgroundColor: '#f2e9dc',
                primaryColor: '#7d8c56',
                secondaryColor: '#4a3b2a',
                logoUrl: '',
                heroTitle: '¿Qué vas a elegir hoy?'
            },
            categories: [
                { id: 'chocolates', name: 'Chocolates', description: '', active: true, available: true, order: 0, image: 'assets/img/postres/categoria_chocolates.jpeg' },
                { id: 'postres',    name: 'Postres',    description: '', active: true, available: true, order: 1, image: 'assets/img/postres/categoria_postres.jpeg' }
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
        const lastProduct = await Product.findOne().sort({ id: -1 }).select('id').lean();
        const nextId = (lastProduct?.id ?? 0) + 1;
        const product = new Product({ id: nextId, ...productData });
        const saved = await product.save();
        return this._cleanDoc(saved.toObject());
    }

    async updateProduct(id, updates) {
        const updated = await Product.findOneAndUpdate(
            { id: parseInt(id) },
            { ...updates, id: parseInt(id) },
            { new: true, runValidators: true }
        ).lean();

        if (!updated) return null;
        return this._cleanDoc(updated);
    }

    async deleteProduct(id) {
        return await this.updateProduct(id, { active: false });
    }

    async deleteProductPermanently(id) {
        const result = await Product.deleteOne({ id: parseInt(id) });
        if (result.deletedCount > 0) {
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
            if (!c.key.startsWith('_')) config[c.key] = c.value;
        }
        // Migración: normalizar categorías al nuevo formato (active=visibilidad, available=disponible, order)
        if (config.categories) {
            config.categories = config.categories.map((cat, i) => ({
                ...cat,
                available: cat.available ?? (cat.active !== false),
                order:     cat.order ?? i,
                // Documentos viejos usaban active=false para "no disponible".
                // En el esquema nuevo eso es available=false; active siempre es true para esos docs.
                ...(cat.available === undefined && { active: true }),
            }));
        }
        return config;
    }

    async updateConfig(configUpdates) {
        for (const [key, value] of Object.entries(configUpdates)) {
            await Config.findOneAndUpdate({ key }, { key, value }, { upsert: true, new: true });
        }
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

    // ===================== MÉTODOS DE VENTAS =====================

    async getSales() {
        const sales = await Sale.find().sort({ date: -1 }).lean();
        return sales.map(s => this._cleanSaleDoc(s));
    }

    async getSaleById(id) {
        const sale = await Sale.findById(id).lean();
        return sale ? this._cleanSaleDoc(sale) : null;
    }

    async createSale(saleData) {
        // Usa el max actual de orderId para garantizar unicidad sin pipeline
        const lastSale = await Sale.findOne().sort({ orderId: -1 }).select('orderId').lean();
        const orderId = (lastSale?.orderId ?? 0) + 1;

        const sale = new Sale({ orderId, ...saleData });
        const saved = await sale.save();
        return this._cleanSaleDoc(saved.toObject());
    }

    async updateSale(id, updates) {
        const updated = await Sale.findByIdAndUpdate(
            id,
            updates,
            { new: true }
        ).lean();
        return updated ? this._cleanSaleDoc(updated) : null;
    }

    async deleteSale(id) {
        const result = await Sale.findByIdAndDelete(id).lean();
        return result ? this._cleanSaleDoc(result) : null;
    }

    // ===================== HELPERS =====================

    _cleanSaleDoc(doc) {
        const { __v, ...clean } = doc;
        if (clean._id) clean._id = clean._id.toString();
        if (clean.createdAt) clean.createdAt = new Date(clean.createdAt).toISOString();
        if (clean.updatedAt) clean.updatedAt = new Date(clean.updatedAt).toISOString();
        return clean;
    }

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