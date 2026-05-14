const express = require('express');
const SaleController = require('../controllers/sale-controller');
const { verifyToken, requireAdmin, logAdminAccess } = require('../middleware/auth-middleware');

const router = express.Router();
const saleController = new SaleController();

router.get('/', verifyToken, requireAdmin, logAdminAccess, (req, res) => saleController.getAllSales(req, res));
router.post('/', (req, res) => saleController.createSale(req, res));
router.put('/:id', verifyToken, requireAdmin, logAdminAccess, (req, res) => saleController.updateSale(req, res));
router.delete('/:id', verifyToken, requireAdmin, logAdminAccess, (req, res) => saleController.deleteSale(req, res));

module.exports = router;
