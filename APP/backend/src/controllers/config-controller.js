const { getInstance: getDataService } = require('../services/data-service');

class ConfigController {
    constructor() {
        this.dataService = getDataService();
    }

    /**
     * Obtiene la configuración completa
     * GET /api/config
     */
    async getConfig(req, res) {
        try {
            const config = await this.dataService.getConfig();
            
            res.json({
                success: true,
                data: config,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('ConfigController.getConfig:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener configuración',
                message: error.message
            });
        }
    }

    /**
     * Obtiene configuración específica de la tienda (pública)
     * GET /api/config/store
     */
    async getStoreConfig(req, res) {
        try {
            const config = await this.dataService.getConfig();
            const storeConfig = config.store || {};
            
            // Remover información sensible para API pública
            const publicConfig = {
                name: storeConfig.name,
                description: storeConfig.description,
                address: storeConfig.address,
                phone: storeConfig.phone,
                email: storeConfig.email,
                whatsappNumber: storeConfig.whatsappNumber,
                socialMedia: storeConfig.socialMedia,
                businessHours: config.business?.hours,
                categories: config.categories,
                currency: storeConfig.currencySymbol || '$'
            };
            
            res.json({
                success: true,
                data: publicConfig,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('ConfigController.getStoreConfig:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener configuración de tienda',
                message: error.message
            });
        }
    }

    /**
     * Actualiza la configuración
     * PUT /api/config
     * Requiere autenticación admin
     */
    async updateConfig(req, res) {
        try {
            const configUpdates = req.body;
            
            // Validar estructura básica
            if (!configUpdates || typeof configUpdates !== 'object') {
                return res.status(400).json({
                    success: false,
                    error: 'Datos de configuración inválidos'
                });
            }
            
            const updatedConfig = await this.dataService.updateConfig(configUpdates);
            
            res.json({
                success: true,
                data: updatedConfig,
                message: 'Configuración actualizada exitosamente',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('ConfigController.updateConfig:', error);
            res.status(500).json({
                success: false,
                error: 'Error al actualizar configuración',
                message: error.message
            });
        }
    }

    /**
     * Obtiene las categorías disponibles
     * GET /api/config/categories
     */
    async getCategories(req, res) {
        try {
            const config = await this.dataService.getConfig();
            const categories = config.categories || [];
            
            // Filtrar solo categorías activas para API pública
            const activeCategories = categories.filter(cat => cat.active !== false);
            
            res.json({
                success: true,
                data: activeCategories,
                count: activeCategories.length,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('ConfigController.getCategories:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener categorías',
                message: error.message
            });
        }
    }

    /**
     * Obtiene metadatos del sistema
     * GET /api/config/metadata
     * Requiere autenticación admin
     */
    async getMetadata(req, res) {
        try {
            const metadata = await this.dataService.getMetadata();
            
            res.json({
                success: true,
                data: metadata,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('ConfigController.getMetadata:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener metadatos',
                message: error.message
            });
        }
    }

    /**
     * Verifica el estado del sistema
     * GET /api/config/health
     */
    async getHealthCheck(req, res) {
        try {
            const metadata = await this.dataService.getMetadata();
            const config = await this.dataService.getConfig();
            const products = await this.dataService.getProducts();
            
            const healthStatus = {
                status: 'healthy',
                version: metadata.version || '1.0.0',
                environment: process.env.NODE_ENV || 'development',
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
                dataStatus: {
                    productsCount: products.length,
                    lastUpdate: metadata.lastUpdate,
                    maintenanceMode: config.business?.maintenanceMode || false
                }
            };
            
            res.json({
                success: true,
                data: healthStatus
            });
        } catch (error) {
            console.error('ConfigController.getHealthCheck:', error);
            res.status(503).json({
                success: false,
                status: 'unhealthy',
                error: 'Error en verificación de salud del sistema',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
}

module.exports = ConfigController;