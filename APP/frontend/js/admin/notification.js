/**
 * NotificationManager - Sistema de notificaciones toast
 */
export class NotificationManager {
    constructor() {
        this._hideTimeout = null;
    }

    /**
     * Muestra una notificación toast
     */
    show(title, message, type = 'success') {
        const toast = document.getElementById('notificationToast');
        const icon = document.getElementById('toastIcon');
        const titleEl = document.getElementById('toastTitle');
        const messageEl = document.getElementById('toastMessage');
        
        const typeConfig = {
            success: { icon: 'fas fa-check', bg: 'bg-green-500' },
            error: { icon: 'fas fa-times', bg: 'bg-red-500' },
            warning: { icon: 'fas fa-exclamation', bg: 'bg-yellow-500' },
            info: { icon: 'fas fa-info', bg: 'bg-blue-500' }
        };
        
        const config = typeConfig[type] || typeConfig.success;
        
        icon.className = `flex-shrink-0 w-6 h-6 rounded-full ${config.bg} mr-3 flex items-center justify-center text-white`;
        icon.innerHTML = `<i class="${config.icon} text-sm"></i>`;
        titleEl.textContent = title;
        messageEl.textContent = message;
        
        toast.classList.remove('hidden');
        
        if (this._hideTimeout) clearTimeout(this._hideTimeout);
        this._hideTimeout = setTimeout(() => this.hide(), 5000);
    }

    /**
     * Oculta la notificación
     */
    hide() {
        document.getElementById('notificationToast').classList.add('hidden');
        if (this._hideTimeout) {
            clearTimeout(this._hideTimeout);
            this._hideTimeout = null;
        }
    }
}
