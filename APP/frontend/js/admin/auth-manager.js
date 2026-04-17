/**
 * AuthManager - Maneja autenticación, login, logout y verificación de tokens
 */
import { CONFIG, appState } from './config.js';

export class AuthManager {
    /**
     * Maneja el proceso de login desde el formulario
     */
    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        return await this.performLogin(username, password);
    }
    
    /**
     * Realiza el login con las credenciales proporcionadas
     */
    async performLogin(username, password) {
        if (!username || !password) {
            this.showLoginError('Por favor complete todos los campos');
            return false;
        }
        
        this.setLoginLoading(true);
        this.hideLoginError();
        
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                appState.token = data.data.token;
                appState.user = data.data.user;
                appState.isAuthenticated = true;
                
                localStorage.setItem(CONFIG.TOKEN_KEY, data.data.token);
                localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(data.data.user));
                
                return true;
            } else {
                this.showLoginError(data.error || 'Error de autenticación');
                return false;
            }
        } catch (error) {
            console.error('Error durante login:', error);
            this.showLoginError('Error de conexión. Verifique que el servidor esté ejecutándose.');
            return false;
        } finally {
            this.setLoginLoading(false);
        }
    }

    /**
     * Verifica si un token es válido
     */
    async verifyToken(token) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/verify`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    /**
     * Maneja el logout
     */
    async handleLogout() {
        if (appState.token) {
            try {
                await fetch(`${CONFIG.API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${appState.token}` }
                });
            } catch (error) {
                console.error('Error durante logout:', error);
            }
        }
        this.clearStoredAuth();
    }

    /**
     * Limpia la autenticación almacenada
     */
    clearStoredAuth() {
        localStorage.removeItem(CONFIG.TOKEN_KEY);
        localStorage.removeItem(CONFIG.USER_KEY);
        appState.isAuthenticated = false;
        appState.user = null;
        appState.token = null;
    }

    /**
     * Intenta restaurar sesión desde localStorage
     * @returns {boolean} true si se restauró una sesión válida
     */
    async tryRestoreSession() {
        const savedToken = localStorage.getItem(CONFIG.TOKEN_KEY);
        const savedUser = localStorage.getItem(CONFIG.USER_KEY);
        
        if (savedToken && savedUser) {
            try {
                const isValid = await this.verifyToken(savedToken);
                if (isValid) {
                    appState.token = savedToken;
                    appState.user = JSON.parse(savedUser);
                    appState.isAuthenticated = true;
                    return true;
                }
            } catch (error) {
                console.log('Token guardado inválido, mostrando login');
                this.clearStoredAuth();
            }
        }
        return false;
    }

    // --- UI helpers para login ---

    setLoginLoading(loading) {
        const button = document.getElementById('loginButton');
        const text = document.getElementById('loginButtonText');
        const loader = document.getElementById('loginLoader');
        
        if (loading) {
            button.disabled = true;
            text.textContent = 'Iniciando...';
            loader.classList.remove('hidden');
        } else {
            button.disabled = false;
            text.textContent = 'Iniciar Sesión';
            loader.classList.add('hidden');
        }
    }

    showLoginError(message) {
        const errorDiv = document.getElementById('loginError');
        const errorText = document.getElementById('loginErrorText');
        errorText.textContent = message;
        errorDiv.classList.remove('hidden');
    }

    hideLoginError() {
        document.getElementById('loginError').classList.add('hidden');
    }
}
