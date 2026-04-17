const { getInstance: getAuthService } = require('../services/auth-service');

class AuthMiddleware {
    constructor() {
        this.authService = getAuthService();
    }

    /**
     * Middleware para verificar token JWT
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next function
     */
    async verifyToken(req, res, next) {
        try {
            // Obtener token del header Authorization
            const authHeader = req.headers.authorization;
            
            if (!authHeader) {
                return res.status(401).json({
                    success: false,
                    error: 'Token de acceso requerido',
                    code: 'MISSING_TOKEN'
                });
            }
            
            // Verificar formato "Bearer <token>"
            const tokenParts = authHeader.split(' ');
            if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
                return res.status(401).json({
                    success: false,
                    error: 'Formato de token inválido. Use: Bearer <token>',
                    code: 'INVALID_TOKEN_FORMAT'
                });
            }
            
            const token = tokenParts[1];
            
            // Verificar si el token está en blacklist (para logout)
            const isBlacklisted = await this.authService.isTokenBlacklisted(token);
            if (isBlacklisted) {
                return res.status(401).json({
                    success: false,
                    error: 'Token revocado',
                    code: 'TOKEN_REVOKED'
                });
            }
            
            // Verificar y decodificar token
            const decoded = this.authService.verifyToken(token);
            
            if (!decoded) {
                return res.status(401).json({
                    success: false,
                    error: 'Token inválido o expirado',
                    code: 'INVALID_TOKEN'
                });
            }
            
            // Verificar que el usuario existe y está activo
            const user = await this.authService.getUserById(decoded.id);
            if (!user || !user.active) {
                return res.status(401).json({
                    success: false,
                    error: 'Usuario inactivo o no encontrado',
                    code: 'USER_INACTIVE'
                });
            }
            
            // Agregar información del usuario al request
            req.user = {
                id: decoded.id,
                username: decoded.username,
                email: decoded.email,
                role: decoded.role
            };
            req.token = token;
            
            next();
        } catch (error) {
            console.error('AuthMiddleware: Error en verificación de token:', error);
            return res.status(500).json({
                success: false,
                error: 'Error interno de autenticación',
                code: 'AUTH_ERROR'
            });
        }
    }

    /**
     * Middleware para verificar rol de administrador
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next function
     */
    requireAdmin(req, res, next) {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Autenticación requerida',
                code: 'AUTHENTICATION_REQUIRED'
            });
        }
        
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Permisos de administrador requeridos',
                code: 'INSUFFICIENT_PRIVILEGES'
            });
        }
        
        next();
    }

    /**
     * Middleware opcional de autenticación (no falla si no hay token)
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next function
     */
    async optionalAuth(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            
            if (!authHeader) {
                req.user = null;
                return next();
            }
            
            const tokenParts = authHeader.split(' ');
            if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
                req.user = null;
                return next();
            }
            
            const token = tokenParts[1];
            const decoded = this.authService.verifyToken(token);
            
            if (decoded) {
                const user = await this.authService.getUserById(decoded.id);
                if (user && user.active) {
                    req.user = {
                        id: decoded.id,
                        username: decoded.username,
                        email: decoded.email,
                        role: decoded.role
                    };
                    req.token = token;
                }
            }
            
            next();
        } catch (error) {
            // En modo opcional, no fallar por errores de token
            req.user = null;
            next();
        }
    }

    /**
     * Middleware para registrar accesos administrativos
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next function
     */
    logAdminAccess(req, res, next) {
        if (req.user) {
            const timestamp = new Date().toISOString();
            console.log(`Admin Access: ${timestamp} - ${req.user.username} (${req.user.id}) - ${req.method} ${req.originalUrl}`);
        }
        next();
    }
}

// Crear instancia del middleware
const authMiddleware = new AuthMiddleware();

// Exportar funciones del middleware (no la clase)
module.exports = {
    verifyToken: (req, res, next) => authMiddleware.verifyToken(req, res, next),
    requireAdmin: (req, res, next) => authMiddleware.requireAdmin(req, res, next),
    optionalAuth: (req, res, next) => authMiddleware.optionalAuth(req, res, next),
    logAdminAccess: (req, res, next) => authMiddleware.logAdminAccess(req, res, next)
};