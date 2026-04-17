/**
 * ApiClient - Maneja peticiones HTTP autenticadas al backend
 */
import { CONFIG, appState } from './config.js';

export class ApiClient {
    /**
     * Realiza peticiones HTTP autenticadas
     */
    async fetchWithAuth(endpoint, options = {}) {
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${appState.token}`,
                ...options.headers
            }
        };
        
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, config);
            
            if (response.status === 401) {
                // Token expirado o inválido - emitir evento
                window.dispatchEvent(new CustomEvent('auth:expired'));
                return null;
            }
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                return { success: false, error: errorData.error || `Error ${response.status}` };
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error en petición autenticada:', error);
            throw error;
        }
    }
}
