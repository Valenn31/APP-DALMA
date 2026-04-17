/**
 * Configuración global y estado del panel administrativo
 */
export const CONFIG = {
    API_BASE_URL: 'http://localhost:3000/api',
    TOKEN_KEY: 'admin_token',
    USER_KEY: 'admin_user'
};

export const appState = {
    isAuthenticated: false,
    user: null,
    token: null,
    currentSection: 'dashboard'
};
