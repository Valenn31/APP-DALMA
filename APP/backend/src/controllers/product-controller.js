const { getInstance: getDataService } = require('../services/data-service');

class ProductController {
    constructor() {
        this.dataService = getDataService();
    }

    /**
     * Obtiene todos los productos
     * GET /api/products
     * Query params: ?includeInactive=true&category=chocolate
     */
    async getAllProducts(req, res) {
        try {
            const { includeInactive, category, featured, inStock } = req.query;
            
            let products = await this.dataService.getProducts(includeInactive === 'true');
            
            // Filtrar por categoría si se especifica
            if (category) {
                products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
            }
            
            // Filtrar por productos destacados
            if (featured === 'true') {
                products = products.filter(p => p.featured === true);
            }
            
            // Filtrar por stock disponible
            if (inStock === 'true') {
                products = products.filter(p => p.stock > 0);
            }
            
            res.json({
                success: true,
                data: products,
                count: products.length,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('ProductController.getAllProducts:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener productos',
                message: error.message
            });
        }
    }

    /**
     * Obtiene un producto por ID
     * GET /api/products/:id
     */
    async getProductById(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    success: false,
                    error: 'ID de producto inválido'
                });
            }
            
            const product = await this.dataService.getProductById(id);
            
            if (!product) {
                return res.status(404).json({
                    success: false,
                    error: 'Producto no encontrado'
                });
            }
            
            res.json({
                success: true,
                data: product,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('ProductController.getProductById:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener producto',
                message: error.message
            });
        }
    }

    /**
     * Crea un nuevo producto
     * POST /api/products
     * Requiere autenticación admin
     */
    async createProduct(req, res) {
        try {
            const productData = this.validateProductData(req.body);
            
            if (productData.errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Datos de producto inválidos',
                    details: productData.errors
                });
            }
            
            const newProduct = await this.dataService.createProduct(productData.data);
            
            res.status(201).json({
                success: true,
                data: newProduct,
                message: 'Producto creado exitosamente',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('ProductController.createProduct:', error);
            res.status(500).json({
                success: false,
                error: 'Error al crear producto',
                message: error.message
            });
        }
    }

    /**
     * Actualiza un producto existente
     * PUT /api/products/:id
     * Requiere autenticación admin
     */
    async updateProduct(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    success: false,
                    error: 'ID de producto inválido'
                });
            }
            
            const updateData = this.validateProductData(req.body, false); // false = no requiere todos los campos
            
            if (updateData.errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Datos de actualización inválidos',
                    details: updateData.errors
                });
            }
            
            const updatedProduct = await this.dataService.updateProduct(id, updateData.data);
            
            if (!updatedProduct) {
                return res.status(404).json({
                    success: false,
                    error: 'Producto no encontrado'
                });
            }
            
            res.json({
                success: true,
                data: updatedProduct,
                message: 'Producto actualizado exitosamente',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('ProductController.updateProduct:', error);
            res.status(500).json({
                success: false,
                error: 'Error al actualizar producto',
                message: error.message
            });
        }
    }

    /**
     * Actualiza solo el stock de un producto
     * PATCH /api/products/:id/stock
     * Requiere autenticación admin
     */
    async updateStock(req, res) {
        try {
            const { id } = req.params;
            const { stock, operation } = req.body; // operation: 'set', 'add', 'subtract'
            
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    success: false,
                    error: 'ID de producto inválido'
                });
            }
            
            const product = await this.dataService.getProductById(id);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    error: 'Producto no encontrado'
                });
            }
            
            let newStock = parseInt(stock);
            
            if (operation === 'add') {
                newStock = (product.stock || 0) + parseInt(stock);
            } else if (operation === 'subtract') {
                newStock = Math.max(0, (product.stock || 0) - parseInt(stock));
            }
            
            if (isNaN(newStock) || newStock < 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Cantidad de stock inválida'
                });
            }
            
            const updatedProduct = await this.dataService.updateProduct(id, { stock: newStock });
            
            res.json({
                success: true,
                data: updatedProduct,
                message: `Stock actualizado: ${product.stock || 0} → ${newStock}`,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('ProductController.updateStock:', error);
            res.status(500).json({
                success: false,
                error: 'Error al actualizar stock',
                message: error.message
            });
        }
    }

    /**
     * Desactiva un producto (soft delete)
     * DELETE /api/products/:id
     * Requiere autenticación admin
     */
    async deleteProduct(req, res) {
        try {
            const { id } = req.params;
            const { permanent } = req.query;
            
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    success: false,
                    error: 'ID de producto inválido'
                });
            }
            
            let success;
            if (permanent === 'true') {
                success = await this.dataService.deleteProductPermanently(id);
            } else {
                success = await this.dataService.deleteProduct(id);
            }
            
            if (!success) {
                return res.status(404).json({
                    success: false,
                    error: 'Producto no encontrado'
                });
            }
            
            const action = permanent === 'true' ? 'eliminado permanentemente' : 'desactivado';
            res.json({
                success: true,
                message: `Producto ${action} exitosamente`,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('ProductController.deleteProduct:', error);
            res.status(500).json({
                success: false,
                error: 'Error al eliminar producto',
                message: error.message
            });
        }
    }

    /**
     * Obtiene estadísticas de productos e inventario
     * GET /api/products/stats
     * Requiere autenticación admin
     */
    async getProductStats(req, res) {
        try {
            const stats = await this.dataService.getInventoryStats();
            
            res.json({
                success: true,
                data: stats,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('ProductController.getProductStats:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener estadísticas',
                message: error.message
            });
        }
    }

    /**
     * Valida los datos de un producto
     * @param {Object} data - Datos del producto
     * @param {boolean} requireAll - Si requiere todos los campos obligatorios
     * @returns {Object} Datos validados y errores
     */
    validateProductData(data, requireAll = true) {
        const errors = [];
        const validatedData = {};

        // Campos obligatorios para creación
        const requiredFields = ['name', 'description', 'price', 'category'];
        
        if (requireAll) {
            for (const field of requiredFields) {
                if (!data[field]) {
                    errors.push(`El campo '${field}' es obligatorio`);
                } else {
                    validatedData[field] = data[field];
                }
            }
        } else {
            // Para actualización, solo validar campos presentes
            requiredFields.forEach(field => {
                if (data[field]) {
                    validatedData[field] = data[field];
                }
            });
        }

        // Validar precio
        if (data.price !== undefined) {
            const price = parseFloat(data.price);
            if (isNaN(price) || price <= 0) {
                errors.push('El precio debe ser un número positivo');
            } else {
                validatedData.price = price;
            }
        }

        // Validar stock
        if (data.stock !== undefined) {
            const stock = parseInt(data.stock);
            if (isNaN(stock) || stock < 0) {
                errors.push('El stock debe ser un número entero no negativo');
            } else {
                validatedData.stock = stock;
            }
        }

        // Campos opcionales
        const optionalFields = ['image', 'active', 'featured', 'tags', 'cost', 'margin', 'sku', 'weight', 'preparationTime', 'allergens'];
        optionalFields.forEach(field => {
            if (data[field] !== undefined) {
                validatedData[field] = data[field];
            }
        });

        // Valores por defecto
        if (requireAll) {
            validatedData.active = data.active !== undefined ? data.active : true;
            validatedData.featured = data.featured !== undefined ? data.featured : false;
            validatedData.stock = validatedData.stock || 0;
            validatedData.tags = data.tags || [];
            validatedData.allergens = data.allergens || [];
        }

        return {
            data: validatedData,
            errors: errors
        };
    }
}

module.exports = ProductController;