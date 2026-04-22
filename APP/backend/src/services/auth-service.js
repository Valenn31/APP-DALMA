const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const AdminUser = require('../models/AdminUser');

class AuthService {
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET;
        if (!this.jwtSecret) {
            if (process.env.NODE_ENV === 'production') {
                throw new Error('JWT_SECRET es obligatorio en producción');
            }
            console.warn('⚠️ JWT_SECRET no configurado. Generando clave temporal solo para desarrollo.');
            this.jwtSecret = require('crypto').randomBytes(64).toString('hex');
        }
        this.jwtExpire = process.env.JWT_EXPIRE || '24h';
        this.saltRounds = 12;
        this.tokenBlacklist = new Set();
        this.loginAttempts = new Map();
        this.maxLoginAttempts = 5;
        this.loginWindowMs = 15 * 60 * 1000;
    }

    async authenticateUser(username, password) {
        try {
            if (this.isRateLimited(username)) {
                return { success: false, message: 'Demasiados intentos fallidos. Intentá en 15 minutos.' };
            }

            const user = await AdminUser.findOne({ username });
            if (!user) {
                this.recordLoginAttempt(username);
                return { success: false, message: 'Usuario no encontrado' };
            }
            if (!user.active) {
                return { success: false, message: 'Usuario inactivo' };
            }

            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                this.recordLoginAttempt(username);
                return { success: false, message: 'Contraseña incorrecta' };
            }

            this.clearLoginAttempts(username);

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

    async changeUsername(userId, currentPassword, newUsername) {
        try {
            if (!newUsername || newUsername.length < 3) {
                return { success: false, message: 'El nuevo nombre de usuario debe tener al menos 3 caracteres' };
            }
            const user = await AdminUser.findOne({ id: userId });
            if (!user) {
                return { success: false, message: 'Usuario no encontrado' };
            }
            const isValidCurrent = await this.verifyPassword(currentPassword, user.password);
            if (!isValidCurrent) {
                return { success: false, message: 'Contraseña actual incorrecta' };
            }
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

    generateToken(payload) {
        return jwt.sign(payload, this.jwtSecret, {
            expiresIn: this.jwtExpire,
            issuer: 'una-cucharita-mas',
            audience: 'admin-panel'
        });
    }

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

    async hashPassword(password) {
        return bcrypt.hash(password, this.saltRounds);
    }

    async verifyPassword(password, hashedPassword) {
        return bcrypt.compare(password, hashedPassword);
    }

    async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await AdminUser.findOne({ id: userId });
            if (!user) {
                return { success: false, message: 'Usuario no encontrado' };
            }
            const isValidCurrent = await this.verifyPassword(currentPassword, user.password);
            if (!isValidCurrent) {
                return { success: false, message: 'Contraseña actual incorrecta' };
            }
            if (newPassword.length < 6) {
                return { success: false, message: 'La nueva contraseña debe tener al menos 6 caracteres' };
            }
            user.password = await this.hashPassword(newPassword);
            user.updatedAt = new Date();
            await user.save();
            return { success: true, message: 'Contraseña cambiada exitosamente' };
        } catch (error) {
            console.error('AuthService: Error al cambiar contraseña:', error);
            return { success: false, message: 'Error interno al cambiar contraseña' };
        }
    }

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

    async isTokenBlacklisted(token) {
        return this.tokenBlacklist.has(token);
    }

    blacklistToken(token) {
        this.tokenBlacklist.add(token);
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

    isRateLimited(username) {
        const attempts = this.loginAttempts.get(username);
        if (!attempts) return false;

        const now = Date.now();
        const recentAttempts = attempts.filter(t => now - t < this.loginWindowMs);

        if (recentAttempts.length === 0) {
            this.loginAttempts.delete(username);
            return false;
        }

        this.loginAttempts.set(username, recentAttempts);
        return recentAttempts.length >= this.maxLoginAttempts;
    }

    recordLoginAttempt(username) {
        const attempts = this.loginAttempts.get(username) || [];
        attempts.push(Date.now());
        this.loginAttempts.set(username, attempts);
    }

    clearLoginAttempts(username) {
        this.loginAttempts.delete(username);
    }

    async getAuthStats() {
        try {
            const users = await AdminUser.find().lean();
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
            return { totalUsers: 0, activeUsers: 0, inactiveUsers: 0, recentLogins: 0 };
        }
    }
}

module.exports = AuthService;
let instance = null;
module.exports.getInstance = () => {
    if (!instance) {
        instance = new AuthService();
    }
    return instance;
};
