/**
 * Configuración global y estado del panel administrativo
 */
export const CONFIG = {
    API_BASE_URL: (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
        ? 'https://unacucharitamas.onrender.com/api'
        : '/api',
    TOKEN_KEY: 'admin_token',
    USER_KEY: 'admin_user'
};

export const appState = {
    isAuthenticated: false,
    user: null,
    token: null,
    currentSection: 'dashboard'
};
