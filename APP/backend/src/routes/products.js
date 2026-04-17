const express = require('express');
const ProductController = require('../controllers/product-controller');
const { verifyToken, requireAdmin, logAdminAccess } = require('../middleware/auth-middleware');

const router = express.Router();
const productController = new ProductController();

/**
 * Rutas para productos
 * Maneja operaciones CRUD y consultas de productos
 */

// Rutas específicas públicas (van primero para evitar conflictos)
router.get('/stats', verifyToken, requireAdmin, logAdminAccess, (req, res) => productController.getProductStats(req, res));

// Rutas públicas generales (no requieren autenticación)
router.get('/', (req, res) => productController.getAllProducts(req, res));
router.get('/:id', (req, res) => productController.getProductById(req, res));

// Rutas administrativas (requieren autenticación JWT + rol admin)
router.post('/', verifyToken, requireAdmin, logAdminAccess, (req, res) => productController.createProduct(req, res));
router.put('/:id', verifyToken, requireAdmin, logAdminAccess, (req, res) => productController.updateProduct(req, res));
router.patch('/:id/stock', verifyToken, requireAdmin, logAdminAccess, (req, res) => productController.updateStock(req, res));
router.delete('/:id', verifyToken, requireAdmin, logAdminAccess, (req, res) => productController.deleteProduct(req, res));

module.exports = router;