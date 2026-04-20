const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const AdminUser = require('../models/AdminUser');

class AuthService {
            /**
             * Autentica un usuario admin por username y password
             * @param {string} username
             * @param {string} password
             * @returns {Object} { success, user, token, expiresIn, message }
             */
            async authenticateUser(username, password) {
                try {
                    // Buscar usuario por username
                    const user = await AdminUser.findOne({ username });
                    if (!user) {
                        return { success: false, message: 'Usuario no encontrado' };
                    }
                    if (!user.active) {
                        return { success: false, message: 'Usuario inactivo' };
                    }
                    // Verificar contraseña
                    const isValid = await bcrypt.compare(password, user.password);
                    if (!isValid) {
                        return { success: false, message: 'Contraseña incorrecta' };
                    }
                    // Generar token JWT
                    const payload = {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role
                    };
                    const token = this.generateToken(payload);
                    return {
                        success: true,
                        user: {
                            id: user.id,
                            username: user.username,
                            email: user.email,
                            role: user.role,
                            active: user.active
                        },
                        token,
                        expiresIn: this.jwtExpire
                    };
                } catch (error) {
                    console.error('AuthService: Error en authenticateUser:', error);
                    return { success: false, message: 'Error interno de autenticación' };
                }
            }
        /**
         * Inicializa el usuario admin por defecto si no existe
         */
        async initializeDefaultAdmin() {
            try {
                const count = await AdminUser.countDocuments();
                if (count > 0) return;

                console.log('AuthService: Creando usuario admin por defecto...');
                const defaultAdmin = new AdminUser({
                    id: 1,
                    username: 'admin',
                    password: await this.hashPassword('admin123'),
                    email: 'admin@unacucharitamas.com',
                    role: 'admin',
                    active: true,
                    lastLogin: null
                });
                await defaultAdmin.save();
                console.log('AuthService: Usuario admin por defecto creado. Cambiar contraseña en producción.');
            } catch (error) {
                console.error('AuthService: Error al inicializar admin:', error);
            }
        }
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET;
        if (!this.jwtSecret) {
            if (process.env.NODE_ENV === 'production') {
                throw new Error('JWT_SECRET es obligatorio en producción');
            }
            console.warn('⚠️ JWT_SECRET no configurado. Generando clave temporal...');
            this.jwtSecret = require('crypto').randomBytes(64).toString('hex');
        }
        this.jwtExpire = process.env.JWT_EXPIRE || '24h';
        this.saltRounds = 12;
        this.tokenBlacklist = new Set();
        this.loginAttempts = new Map();
        this.maxLoginAttempts = 5;
        this.loginWindowMs = 15 * 60 * 1000;
    }

    // ...existing methods...

    /**
     * Cambia el nombre de usuario de un usuario
     * @param {number} userId
     * @param {string} currentPassword
     * @param {string} newUsername
     * @returns {Object}
     */
    async changeUsername(userId, currentPassword, newUsername) {
        try {
            if (!newUsername || newUsername.length < 3) {
                return { success: false, message: 'El nuevo nombre de usuario debe tener al menos 3 caracteres' };
            }
            const user = await AdminUser.findOne({ id: userId });
            if (!user) {
                return { success: false, message: 'Usuario no encontrado' };
            }
            // Verificar contraseña actual
            const isValidCurrent = await this.verifyPassword(currentPassword, user.password);
            if (!isValidCurrent) {
                return { success: false, message: 'Contraseña actual incorrecta' };
            }
            // Verificar que el nuevo username no esté en uso
            const usernameExists = await AdminUser.findOne({ username: newUsername, id: { $ne: userId } });
            if (usernameExists) {
                return { success: false, message: 'El nombre de usuario ya está en uso' };
            }
            user.username = newUsername;
            user.updatedAt = new Date();
            await user.save();
            return { success: true, message: 'Nombre de usuario cambiado exitosamente' };
        } catch (error) {
            console.error('AuthService: Error al cambiar nombre de usuario:', error);
            return { success: false, message: 'Error interno al cambiar nombre de usuario' };
        }
    }

    /**
     * Genera un token JWT
     * @param {Object} payload - Datos del usuario
     * @returns {string} Token JWT
     */
    generateToken(payload) {
        return jwt.sign(payload, this.jwtSecret, {
            expiresIn: this.jwtExpire,
            issuer: 'una-cucharita-mas',
            audience: 'admin-panel'
        });
    }

    /**
     * Verifica y decodifica un token JWT
     * @param {string} token - Token a verificar
     * @returns {Object} Datos decodificados o null si es inválido
     */
    verifyToken(token) {
        try {
            return jwt.verify(token, this.jwtSecret, {
                issuer: 'una-cucharita-mas',
                audience: 'admin-panel'
            });
        } catch (error) {
            console.error('AuthService: Token inválido:', error.message);
            return null;
        }
    }

    /**
     * Hashea una contraseña
     * @param {string} password - Contraseña en texto plano
     * @returns {string} Contraseña hasheada
     */
    async hashPassword(password) {
        return bcrypt.hash(password, this.saltRounds);
    }

    /**
     * Verifica una contraseña
     * @param {string} password - Contraseña en texto plano
     * @param {string} hashedPassword - Contraseña hasheada
     * @returns {boolean} Verdadero si es válida
     */
    async verifyPassword(password, hashedPassword) {
        return bcrypt.compare(password, hashedPassword);
    }

    /**
     * Cambia la contraseña de un usuario
     * @param {number} userId - ID del usuario
     * @param {string} currentPassword - Contraseña actual
     * @param {string} newPassword - Nueva contraseña
     * @returns {Object} Resultado de la operación
     */
    async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await AdminUser.findOne({ id: userId });
            if (!user) {
                return {
                    success: false,
                    message: 'Usuario no encontrado'
                };
            }
            // Verificar contraseña actual
            const isValidCurrent = await this.verifyPassword(currentPassword, user.password);
            if (!isValidCurrent) {
                return {
                    success: false,
                    message: 'Contraseña actual incorrecta'
                };
            }
            // Validar nueva contraseña
            if (newPassword.length < 6) {
                return {
                    success: false,
                    message: 'La nueva contraseña debe tener al menos 6 caracteres'
                };
            }
            // Cambiar contraseña
            user.password = await this.hashPassword(newPassword);
            user.updatedAt = new Date();
            await user.save();
            return {
                success: true,
                message: 'Contraseña cambiada exitosamente'
            };
        } catch (error) {
            console.error('AuthService: Error al cambiar contraseña:', error);
            return {
                success: false,
                message: 'Error interno al cambiar contraseña'
            };
        }
    }

    /**
     * Obtiene información de un usuario por ID
     * @param {number} userId - ID del usuario
     * @returns {Object|null} Datos del usuario sin contraseña
     */
    async getUserById(userId) {
        try {
            const user = await AdminUser.findOne({ id: userId });
            if (!user) return null;
            const { password, ...userData } = user.toObject();
            return userData;
        } catch (error) {
            console.error('AuthService: Error al obtener usuario:', error);
            return null;
        }
    }

    /**
     * Verifica si un token está en la blacklist (para logout)
     * @param {string} token - Token a verificar
     * @returns {boolean} True si está en blacklist
     */
    async isTokenBlacklisted(token) {
        return this.tokenBlacklist.has(token);
    }

    /**
     * Agrega un token a la blacklist
     * @param {string} token - Token a invalidar
     */
    blacklistToken(token) {
        this.tokenBlacklist.add(token);
        
        // Limpiar tokens expirados periódicamente
        const decoded = this.verifyToken(token);
        if (decoded && decoded.exp) {
            const ttl = (decoded.exp * 1000) - Date.now();
            if (ttl > 0) {
                setTimeout(() => {
                    this.tokenBlacklist.delete(token);
                }, ttl);
            }
        }
    }

    /**
     * Rate limiting: verifica si un usuario está bloqueado
     * @param {string} username
     * @returns {boolean}
     */
    isRateLimited(username) {
        const attempts = this.loginAttempts.get(username);
        if (!attempts) return false;
        
        // Limpiar intentos expirados
        const now = Date.now();
        const recentAttempts = attempts.filter(t => now - t < this.loginWindowMs);
        
        if (recentAttempts.length === 0) {
            this.loginAttempts.delete(username);
            return false;
        }
        
        this.loginAttempts.set(username, recentAttempts);
        return recentAttempts.length >= this.maxLoginAttempts;
    }

    /**
     * Registra un intento de login fallido
     * @param {string} username
     */
    recordLoginAttempt(username) {
        const attempts = this.loginAttempts.get(username) || [];
        attempts.push(Date.now());
        this.loginAttempts.set(username, attempts);
    }

    /**
     * Limpia intentos de login para un usuario
     * @param {string} username
     */
    clearLoginAttempts(username) {
        this.loginAttempts.delete(username);
    }

    /**
     * Obtiene estadísticas de autenticación
     * @returns {Object} Estadísticas
     */
    async getAuthStats() {
        try {
            const users = await this.loadUsers();
            
            return {
                totalUsers: users.length,
                activeUsers: users.filter(u => u.active).length,
                inactiveUsers: users.filter(u => !u.active).length,
                recentLogins: users.filter(u => {
                    if (!u.lastLogin) return false;
                    const lastLogin = new Date(u.lastLogin);
                    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    return lastLogin > dayAgo;
                }).length
            };
        } catch (error) {
            console.error('AuthService: Error al obtener estadísticas:', error);
            return {
                totalUsers: 0,
                activeUsers: 0,
                inactiveUsers: 0,
                recentLogins: 0
            };
        }
    }
}

// Exportación por clase y singleton para compatibilidad legacy
module.exports = AuthService;
let instance = null;
module.exports.getInstance = () => {
    if (!instance) {
        instance = new AuthService();
    }
    return instance;
};