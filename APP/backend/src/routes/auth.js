const express = require('express');
const AuthController = require('../controllers/auth-controller');
const { verifyToken, requireAdmin, logAdminAccess } = require('../middleware/auth-middleware');

const router = express.Router();
const authController = new AuthController();

/**
 * Rutas de autenticación
 * Maneja login, logout, perfiles y verificación de tokens
 */

// Rutas públicas (no requieren autenticación)
router.post('/login', (req, res) => authController.login(req, res));

// Rutas protegidas (requieren token JWT válido)
router.use(verifyToken); // Todas las rutas siguientes requieren autenticación
router.use(logAdminAccess); // Log de accesos administrativos

// Rutas básicas de usuario autenticado
router.post('/logout', (req, res) => authController.logout(req, res));
router.get('/profile', (req, res) => authController.getProfile(req, res));
router.get('/verify', (req, res) => authController.verifyToken(req, res));
router.put('/change-password', (req, res) => authController.changePassword(req, res));

// Rutas administrativas (requieren rol admin)
router.use(requireAdmin); // Todas las rutas siguientes requieren rol admin

router.get('/stats', (req, res) => authController.getAuthStats(req, res));

module.exports = router;