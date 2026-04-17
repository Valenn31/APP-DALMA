const express = require('express');
const ConfigController = require('../controllers/config-controller');
const { verifyToken, requireAdmin, logAdminAccess } = require('../middleware/auth-middleware');

const router = express.Router();
const configController = new ConfigController();

/**
 * Rutas para configuración
 * Maneja configuración de la tienda, categorías y metadatos
 */

// Rutas públicas (accesibles sin autenticación)
router.get('/health', (req, res) => configController.getHealthCheck(req, res));
router.get('/store', (req, res) => configController.getStoreConfig(req, res));
router.get('/categories', (req, res) => configController.getCategories(req, res));

// Rutas administrativas (requieren autenticación JWT + rol admin)
router.use(verifyToken);        // Verificar token JWT
router.use(requireAdmin);       // Verificar rol admin  
router.use(logAdminAccess);     // Log de accesos administrativos

router.get('/', (req, res) => configController.getConfig(req, res));
router.put('/', (req, res) => configController.updateConfig(req, res));
router.get('/metadata', (req, res) => configController.getMetadata(req, res));

module.exports = router;