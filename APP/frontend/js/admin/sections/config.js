export class ConfigSection {
    constructor(apiClient, notificationManager) {
        this.api = apiClient;
        this.notify = notificationManager;
        this.currentConfig = null;
    }

    async render() {
        const res = await this.api.fetchWithAuth('/config');
        if (!res || !res.success) {
            return `<div class="text-center py-12 text-red-500">Error al cargar la configuración</div>`;
        }

        this.currentConfig = res.data;
        const isOpen = !res.data.business?.maintenanceMode;

        return `
            <div class="p-6 max-w-lg mx-auto">
                <h1 class="text-2xl font-black text-gray-800 mb-6">Configuración</h1>

                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 class="text-lg font-bold text-gray-700 mb-4">Estado de la tienda</h2>

                    <div class="flex flex-col items-center gap-6 py-4">

                        <div class="flex flex-col items-center gap-2">
                            <div class="w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-inner ${isOpen ? 'bg-green-100' : 'bg-red-100'}">
                                <i class="fa-solid ${isOpen ? 'fa-store text-green-600' : 'fa-store-slash text-red-500'}"></i>
                            </div>
                            <span id="store-status-label" class="text-xl font-black ${isOpen ? 'text-green-600' : 'text-red-500'}">
                                ${isOpen ? 'ABIERTA' : 'CERRADA'}
                            </span>
                            <p class="text-gray-400 text-sm text-center">
                                ${isOpen
                                    ? 'El catálogo es visible y los clientes pueden hacer pedidos.'
                                    : 'El catálogo muestra un mensaje de tienda cerrada.'}
                            </p>
                        </div>

                        <button id="toggle-store-btn"
                            class="w-full py-3 px-6 rounded-xl font-bold text-white transition-all active:scale-95 ${isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'}">
                            <i class="fa-solid ${isOpen ? 'fa-lock' : 'fa-lock-open'} mr-2"></i>
                            ${isOpen ? 'Cerrar tienda' : 'Abrir tienda'}
                        </button>

                    </div>
                </div>
            </div>
        `;
    }

    initializeEvents() {
        const btn = document.getElementById('toggle-store-btn');
        if (btn) {
            btn.addEventListener('click', () => this.toggleStore());
        }
    }

    async toggleStore() {
        const btn = document.getElementById('toggle-store-btn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Guardando...';
        }

        const currentBusiness = this.currentConfig?.business || {};
        const newMaintenanceMode = !currentBusiness.maintenanceMode;

        const res = await this.api.fetchWithAuth('/config', {
            method: 'PUT',
            body: JSON.stringify({
                business: { ...currentBusiness, maintenanceMode: newMaintenanceMode }
            })
        });

        if (!res || !res.success) {
            this.notify.show('Error', 'No se pudo cambiar el estado de la tienda', 'error');
            if (btn) btn.disabled = false;
            return;
        }

        const action = newMaintenanceMode ? 'cerrada' : 'abierta';
        this.notify.show('Listo', `La tienda ahora está ${action}`, 'success');

        // Re-renderizar la sección con el nuevo estado
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.innerHTML = await this.render();
            this.initializeEvents();
        }
    }
}
