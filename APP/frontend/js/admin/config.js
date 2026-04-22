import { API_BASE_URL } from '../api-config.js';

export const CONFIG = {
    API_BASE_URL,
    TOKEN_KEY: 'admin_token',
    USER_KEY: 'admin_user'
};

export const appState = {
    isAuthenticated: false,
    user: null,
    token: null,
    currentSection: 'dashboard'
};
