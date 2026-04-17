const fs = require('fs').promises;
const path = require('path');

/**
 * DataService - Maneja la lectura y escritura del archivo JSON como base de datos
 * Responsabilidad: Gestionar persistencia de datos sin base de datos real
 */
class DataService {
    constructor() {
        // Ruta al archivo JSON (relativa desde el backend hacia el frontend)
        this.dataPath = path.join(__dirname, '../../../frontend/data/products.json');
        this.backupPath = path.join(__dirname, '../backups');
        this.data = null;
        this.lastModified = null;
    }

    /**
     * Carga los datos del archivo JSON
     * @returns {Object} Datos completos del archivo
     */
    async loadData() {
        try {
            const fileContent = await fs.readFile(this.dataPath, 'utf8');
            const stats = await fs.stat(this.dataPath);
            
            this.data = JSON.parse(fileContent);
            this.lastModified = stats.mtime;
            
            console.log(`DataService: Datos cargados - ${this.data.products?.length || 0} productos`);
            return this.data;
        } catch (error) {
            console.error('DataService: Error al cargar datos:', error);
            throw new Error('No se pudieron cargar los datos');
        }
    }

    /**
     * Obtiene los datos (carga si es necesario)
     * @returns {Object} Datos completos
     */
    async getData() {
        if (!this.data) {
            await this.loadData();
        }
        return this.data;
    }

    /**
     * Guarda los datos en el archivo JSON con backup
     * @param {Object} newData - Nuevos datos a guardar
     */
    async saveData(newData) {
        try {
            // Crear backup antes de modificar
            await this.createBackup();
            
            // Actualizar timestamp de modificación
            if (newData.metadata) {
                newData.metadata.lastUpdate = new Date().toISOString();
            }
            
            // Escribir archivo
            const jsonContent = JSON.stringify(newData, null, 2);
            await fs.writeFile(this.dataPath, jsonContent, 'utf8');
            
            // Actualizar datos en memoria
            this.data = newData;
            this.lastModified = new Date();
            
            console.log('DataService: Datos guardados exitosamente');
            return true;
        } catch (error) {
            console.error('DataService: Error al guardar datos:', error);
            throw new Error('No se pudieron guardar los datos');
        }
    }

    /**
     * Crea un backup del archivo actual y rota backups antiguos
     */
    async createBackup() {
        try {
            await fs.mkdir(this.backupPath, { recursive: true });
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFile = path.join(this.backupPath, `products-backup-${timestamp}.json`);
            
            await fs.copyFile(this.dataPath, backupFile);
            console.log(`DataService: Backup creado en ${backupFile}`);
            
            // Rotar backups: mantener solo los últimos 10
            await this.rotateBackups(10);
        } catch (error) {
            console.warn('DataService: No se pudo crear backup:', error.message);
        }
    }

    /**
     * Elimina backups antiguos, manteniendo solo los más recientes
     * @param {number} keepCount - Cantidad de backups a mantener
     */
    async rotateBackups(keepCount) {
        try {
            const files = await fs.readdir(this.backupPath);
            const backupFiles = files
                .filter(f => f.startsWith('products-backup-') && f.endsWith('.json'))
                .sort()
                .reverse();
            
            if (backupFiles.length > keepCount) {
                const toDelete = backupFiles.slice(keepCount);
                for (const file of toDelete) {
                    await fs.unlink(path.join(this.backupPath, file));
                }
                console.log(`DataService: ${toDelete.length} backups antiguos eliminados`);
            }
        } catch (error) {
            console.warn('DataService: Error rotando backups:', error.message);
        }
    }

    // ===================== MÉTODOS DE PRODUCTOS =====================

    /**
     * Obtiene todos los productos
     * @param {boolean} includeInactive - Incluir productos inactivos
     * @returns {Array} Lista de productos
     */
    async getProducts(includeInactive = false) {
        const data = await this.getData();
        let products = data.products || [];
        
        if (!includeInactive) {
            products = products.filter(p => p.active !== false);
        }
        
        return products;
    }

    /**
     * Obtiene un producto por ID
     * @param {number} id - ID del producto
     * @returns {Object|null} Producto encontrado
     */
    async getProductById(id) {
        const products = await this.getProducts(true); // Incluir inactivos para admin
        return products.find(p => p.id === parseInt(id)) || null;
    }

    /**
     * Crea un nuevo producto
     * @param {Object} productData - Datos del producto
     * @returns {Object} Producto creado
     */
    async createProduct(productData) {
        const data = await this.getData();
        
        // Generar nuevo ID
        const maxId = Math.max(...data.products.map(p => p.id), 0);
        const newProduct = {
            id: maxId + 1,
            ...productData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Agregar producto
        data.products.push(newProduct);
        
        // Guardar
        await this.saveData(data);
        
        console.log(`DataService: Producto creado con ID ${newProduct.id}`);
        return newProduct;
    }

    /**
     * Actualiza un producto existente
     * @param {number} id - ID del producto
     * @param {Object} updates - Datos a actualizar
     * @returns {Object|null} Producto actualizado
     */
    async updateProduct(id, updates) {
        const data = await this.getData();
        const productIndex = data.products.findIndex(p => p.id === parseInt(id));
        
        if (productIndex === -1) {
            return null;
        }
        
        // Actualizar producto
        data.products[productIndex] = {
            ...data.products[productIndex],
            ...updates,
            id: parseInt(id), // Preservar ID original
            updatedAt: new Date().toISOString()
        };
        
        // Guardar
        await this.saveData(data);
        
        console.log(`DataService: Producto ${id} actualizado`);
        return data.products[productIndex];
    }

    /**
     * Elimina un producto (soft delete)
     * @param {number} id - ID del producto
     * @returns {boolean} Éxito de la operación
     */
    async deleteProduct(id) {
        return await this.updateProduct(id, { active: false });
    }

    /**
     * Elimina un producto permanentemente
     * @param {number} id - ID del producto
     * @returns {boolean} Éxito de la operación
     */
    async deleteProductPermanently(id) {
        const data = await this.getData();
        const initialLength = data.products.length;
        
        data.products = data.products.filter(p => p.id !== parseInt(id));
        
        if (data.products.length < initialLength) {
            await this.saveData(data);
            console.log(`DataService: Producto ${id} eliminado permanentemente`);
            return true;
        }
        
        return false;
    }

    // ===================== MÉTODOS DE CONFIGURACIÓN =====================

    /**
     * Obtiene la configuración completa
     * @returns {Object} Configuración
     */
    async getConfig() {
        const data = await this.getData();
        return data.config || {};
    }

    /**
     * Actualiza la configuración
     * @param {Object} configUpdates - Actualizaciones de configuración
     * @returns {Object} Configuración actualizada
     */
    async updateConfig(configUpdates) {
        const data = await this.getData();
        
        data.config = {
            ...data.config,
            ...configUpdates
        };
        
        await this.saveData(data);
        console.log('DataService: Configuración actualizada');
        return data.config;
    }

    /**
     * Obtiene metadatos del sistema
     * @returns {Object} Metadatos
     */
    async getMetadata() {
        const data = await this.getData();
        return data.metadata || {};
    }

    // ===================== MÉTODOS DE ESTADÍSTICAS =====================

    /**
     * Obtiene estadísticas del inventario
     * @returns {Object} Estadísticas
     */
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