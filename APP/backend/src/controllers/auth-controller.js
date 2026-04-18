const { getInstance: getAuthService } = require('../services/auth-service');

class AuthController {
    constructor() {
        this.authService = getAuthService();
    }

    /**
     * Login de usuario administrador
     * POST /api/auth/login
     */
    async login(req, res) {
        try {
            const { username, password } = req.body;
            
            // Validar datos de entrada
            if (!username || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Username y password son requeridos',
                    code: 'MISSING_CREDENTIALS'
                });
            }
            
            // Autenticar usuario
            const result = await this.authService.authenticateUser(username, password);
            
            if (!result.success) {
                return res.status(401).json({
                    success: false,
                    error: result.message,
                    code: 'AUTHENTICATION_FAILED'
                });
            }
            
            // Login exitoso
            res.json({
                success: true,
                message: 'Login exitoso',
                data: {
                    user: result.user,
                    token: result.token,
                    expiresIn: result.expiresIn
                },
                timestamp: new Date().toISOString()
            });
            
            console.log(`AuthController: Login exitoso - ${result.user.username} (${result.user.id})`);
        } catch (error) {
            console.error('AuthController.login:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno durante el login',
                code: 'LOGIN_ERROR'
            });
        }
    }

    /**
     * Logout de usuario (invalida token)
     * POST /api/auth/logout
     * Requiere autenticación
     */
    async logout(req, res) {
        try {
            const { user, token } = req;
            
            // Invalidar el token agregándolo a la blacklist
            this.authService.blacklistToken(token);
            
            res.json({
                success: true,
                message: 'Logout exitoso',
                timestamp: new Date().toISOString()
            });
            
            console.log(`AuthController: Logout - ${user.username} (${user.id})`);
        } catch (error) {
            console.error('AuthController.logout:', error);
            res.status(500).json({
                success: false,
                error: 'Error durante el logout',
                code: 'LOGOUT_ERROR'
            });
        }
    }

    /**
     * Obtiene información del usuario actual
     * GET /api/auth/profile
     * Requiere autenticación
     */
    async getProfile(req, res) {
        try {
            const { user } = req;
            
            // Obtener datos actualizados del usuario
            const userData = await this.authService.getUserById(user.id);
            
            if (!userData) {
                return res.status(404).json({
                    success: false,
                    error: 'Usuario no encontrado',
                    code: 'USER_NOT_FOUND'
                });
            }
            
            res.json({
                success: true,
                data: userData,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('AuthController.getProfile:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener perfil',
                code: 'PROFILE_ERROR'
            });
        }
    }

    /**
     * Cambia la contraseña del usuario actual
     * PUT /api/auth/change-password
     * Requiere autenticación
     */
    async changePassword(req, res) {
        try {
            const { user } = req;
            const { currentPassword, newPassword, confirmPassword } = req.body;
            if (!currentPassword || !newPassword || !confirmPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'Todos los campos de contraseña son requeridos',
                    code: 'MISSING_PASSWORD_FIELDS'
                });
            }
            if (newPassword !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'La nueva contraseña y su confirmación no coinciden',
                    code: 'PASSWORD_MISMATCH'
                });
            }
            const result = await this.authService.changePassword(user.id, currentPassword, newPassword);
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: result.message,
                    code: 'PASSWORD_CHANGE_FAILED'
                });
            }
            res.json({
                success: true,
                message: result.message,
                timestamp: new Date().toISOString()
            });
            console.log(`AuthController: Contraseña cambiada - ${user.username} (${user.id})`);
        } catch (error) {
            console.error('AuthController.changePassword:', error);
            res.status(500).json({
                success: false,
                error: 'Error al cambiar contraseña',
                code: 'PASSWORD_ERROR'
            });
        }
    }

    /**
     * Cambia el nombre de usuario del usuario actual
     * PUT /api/auth/change-username
     * Requiere autenticación
     */
    async changeUsername(req, res) {
        try {
            const { user } = req;
            const { currentPassword, newUsername } = req.body;
            if (!currentPassword || !newUsername) {
                return res.status(400).json({
                    success: false,
                    error: 'Debes ingresar la contraseña actual y el nuevo nombre de usuario',
                    code: 'MISSING_FIELDS'
                });
            }
            const result = await this.authService.changeUsername(user.id, currentPassword, newUsername);
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: result.message,
                    code: 'USERNAME_CHANGE_FAILED'
                });
            }
            res.json({
                success: true,
                message: result.message,
                timestamp: new Date().toISOString()
            });
            console.log(`AuthController: Username cambiado - ${user.username} → ${newUsername} (${user.id})`);
        } catch (error) {
            console.error('AuthController.changeUsername:', error);
            res.status(500).json({
                success: false,
                error: 'Error al cambiar nombre de usuario',
                code: 'USERNAME_ERROR'
            });
        }
    }

    /**
     * Verifica si el token actual es válido
     * GET /api/auth/verify
     * Requiere autenticación
     */
    async verifyToken(req, res) {
        try {
            // Si llegamos aquí, el token es válido (verificado por middleware)
            const { user } = req;
            
            res.json({
                success: true,
                message: 'Token válido',
                data: {
                    user: user,
                    valid: true
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('AuthController.verifyToken:', error);
            res.status(500).json({
                success: false,
                error: 'Error en verificación de token',
                code: 'VERIFY_ERROR'
            });
        }
    }

    /**
     * Obtiene estadísticas de autenticación
     * GET /api/auth/stats
     * Requiere autenticación admin
     */
    async getAuthStats(req, res) {
        try {
            const stats = await this.authService.getAuthStats();
            
            res.json({
                success: true,
                data: stats,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('AuthController.getAuthStats:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener estadísticas de autenticación',
                code: 'STATS_ERROR'
            });
        }
    }

    /**
     * Endpoint de prueba para verificar que la autenticación funciona
     * GET /api/auth/test
     * Requiere autenticación admin
     */
    async testAuth(req, res) {
        try {
            const { user } = req;
            
            res.json({
                success: true,
                message: '🎉 Autenticación funcionando correctamente',
                data: {
                    authenticatedUser: user,
                    serverTime: new Date().toISOString(),
                    message: 'Este endpoint solo es accesible con token JWT válido'
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('AuthController.testAuth:', error);
            res.status(500).json({
                success: false,
                error: 'Error en endpoint de prueba',
                code: 'TEST_ERROR'
            });
        }
    }
}

module.exports = AuthController;