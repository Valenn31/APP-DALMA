const mongoose = require('mongoose');
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
                currency: storeConfig.currencySymbol || '$',
                maintenanceMode: config.business?.maintenanceMode || false,
                deliveryCost: storeConfig.deliveryCost ?? 300,
                backgroundColor: storeConfig.backgroundColor || '#f2e9dc',
                primaryColor: storeConfig.primaryColor || '#7d8c56',
                secondaryColor: storeConfig.secondaryColor || '#4a3b2a',
                logoUrl: storeConfig.logoUrl || '',
                heroTitle: storeConfig.heroTitle || ''
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
            
            const ALLOWED_KEYS = ['store', 'categories', 'business', 'stock'];
            const filtered = Object.fromEntries(
                Object.entries(configUpdates).filter(([k]) => ALLOWED_KEYS.includes(k))
            );

            const updatedConfig = await this.dataService.updateConfig(filtered);
            
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
        const isConnected = mongoose.connection.readyState === 1;
        const status = isConnected ? 200 : 503;
        res.status(status).json({
            success: isConnected,
            status: isConnected ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString()
        });
    }
}

module.exports = ConfigController;