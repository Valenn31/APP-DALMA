const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');

/**
 * AuthService - Maneja autenticación JWT y usuarios admin
 * Responsabilidad: Gestionar usuarios, tokens JWT y autenticación segura
 */
class AuthService {
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET;
        if (!this.jwtSecret) {
            console.warn('⚠️ JWT_SECRET no configurado. Generando clave temporal...');
            console.warn('⚠️ Configura JWT_SECRET en .env para producción');
            this.jwtSecret = require('crypto').randomBytes(64).toString('hex');
        }
        this.jwtExpire = process.env.JWT_EXPIRE || '24h';
        this.saltRounds = 12;
        
        // Token blacklist (in-memory, se limpia al reiniciar)
        this.tokenBlacklist = new Set();
        
        // Rate limiting para login
        this.loginAttempts = new Map();
        this.maxLoginAttempts = 5;
        this.loginWindowMs = 15 * 60 * 1000; // 15 minutos
        
        // Archivo de usuarios admin (simple para evitar base de datos)
        this.usersFile = path.join(__dirname, '../data/admin-users.json');
        
        // Inicializar usuario admin por defecto si no existe
        this.initializeDefaultAdmin();
    }

    /**
     * Inicializa usuario admin por defecto si no existe el archivo
     */
    async initializeDefaultAdmin() {
        try {
            // Verificar si existe el archivo de usuarios
            await fs.access(this.usersFile);
        } catch (error) {
            // El archivo no existe, crear usuario admin por defecto
            console.log('AuthService: Creando usuario admin por defecto...');
            
            const defaultAdmin = {
                id: 1,
                username: 'admin',
                password: await this.hashPassword('admin123'), // Contraseña temporal
                email: 'admin@unacucharitamas.com',
                role: 'admin',
                active: true,
                createdAt: new Date().toISOString(),
                lastLogin: null
            };
            
            const users = [defaultAdmin];
            
            // Crear directorio si no existe
            const dir = path.dirname(this.usersFile);
            await fs.mkdir(dir, { recursive: true });
            
            // Guardar archivo
            await fs.writeFile(this.usersFile, JSON.stringify(users, null, 2));
            
            console.log('AuthService: Usuario admin creado - username: admin, password: admin123');
            console.log('AuthService: ⚠️ CAMBIAR CONTRASEÑA INMEDIATAMENTE EN PRODUCCIÓN');
        }
    }

    /**
     * Carga usuarios del archivo JSON
     * @returns {Array} Lista de usuarios
     */
    async loadUsers() {
        try {
            const data = await fs.readFile(this.usersFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('AuthService: Error al cargar usuarios:', error);
            return [];
        }
    }

    /**
     * Guarda usuarios en el archivo JSON
     * @param {Array} users - Lista de usuarios
     */
    async saveUsers(users) {
        try {
            await fs.writeFile(this.usersFile, JSON.stringify(users, null, 2));
        } catch (error) {
            console.error('AuthService: Error al guardar usuarios:', error);
            throw new Error('No se pudieron guardar los usuarios');
        }
    }

    /**
     * Autentica un usuario
     * @param {string} username - Nombre de usuario
     * @param {string} password - Contraseña
     * @returns {Object} Resultado de autenticación
     */
    async authenticateUser(username, password) {
        try {
            // Verificar rate limiting
            if (this.isRateLimited(username)) {
                return {
                    success: false,
                    message: 'Demasiados intentos de login. Intente nuevamente en 15 minutos.'
                };
            }

            const users = await this.loadUsers();
            const user = users.find(u => u.username === username && u.active === true);
            
            if (!user) {
                this.recordLoginAttempt(username);
                return {
                    success: false,
                    message: 'Usuario no encontrado o inactivo'
                };
            }
            
            const isValidPassword = await this.verifyPassword(password, user.password);
            
            if (!isValidPassword) {
                this.recordLoginAttempt(username);
                return {
                    success: false,
                    message: 'Contraseña incorrecta'
                };
            }
            
            // Login exitoso, limpiar intentos
            this.clearLoginAttempts(username);
            
            // Actualizar último login
            user.lastLogin = new Date().toISOString();
            await this.saveUsers(users);
            
            // Generar token JWT
            const token = this.generateToken({
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            });
            
            return {
                success: true,
                message: 'Autenticación exitosa',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    lastLogin: user.lastLogin
                },
                token: token,
                expiresIn: this.jwtExpire
            };
        } catch (error) {
            console.error('AuthService: Error en autenticación:', error);
            return {
                success: false,
                message: 'Error interno de autenticación'
            };
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
            const users = await this.loadUsers();
            const userIndex = users.findIndex(u => u.id === userId);
            
            if (userIndex === -1) {
                return {
                    success: false,
                    message: 'Usuario no encontrado'
                };
            }
            
            const user = users[userIndex];
            
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
            users[userIndex].password = await this.hashPassword(newPassword);
            users[userIndex].updatedAt = new Date().toISOString();
            
            await this.saveUsers(users);
            
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
            const users = await this.loadUsers();
            const user = users.find(u => u.id === userId);
            
            if (!user) {
                return null;
            }
            
            // Retornar datos sin contraseña
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
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

module.exports = AuthService;

// Singleton instance
let instance = null;
module.exports.getInstance = () => {
    if (!instance) {
        instance = new AuthService();
    }
    return instance;
};