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

                <!-- Card: Estado de la tienda -->
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
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

                <!-- Card: Número de WhatsApp -->
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 class="text-lg font-bold text-gray-700 mb-1">Número de WhatsApp</h2>
                    <p class="text-gray-400 text-sm mb-4">
                        Los pedidos se envían a este número. Podés cambiarlo cuando una de las chicas esté tomando pedidos desde otro teléfono.
                    </p>
                    <div class="flex flex-col gap-3">
                        <div class="flex items-center rounded-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-[#48332c]/20">
                            <span class="px-3 py-3 bg-gray-50 text-gray-400 text-sm font-mono border-r border-gray-200 select-none">+549</span>
                            <input id="whatsapp-number-input" type="tel"
                                value="${(() => { const n = this.currentConfig?.store?.whatsappNumber || ''; return n.startsWith('549') ? n.slice(3) : n; })()}"
                                placeholder="3471671286"
                                class="flex-1 px-3 py-3 text-sm focus:outline-none bg-white">
                        </div>
                        <div class="flex gap-2">
                            <button id="save-whatsapp-btn"
                                class="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-[#48332c] hover:bg-[#3a2820] transition-all active:scale-95 text-sm">
                                <i class="fa-solid fa-floppy-disk mr-2"></i>Guardar
                            </button>
                            <button id="test-whatsapp-btn"
                                class="py-3 px-4 rounded-xl font-bold text-white bg-[#25D366] hover:bg-[#1ebe5d] transition-all active:scale-95 text-sm">
                                <i class="fa-brands fa-whatsapp mr-1"></i>Probar
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        `;
    }

    initializeEvents() {
        const btn = document.getElementById('toggle-store-btn');
        if (btn) btn.addEventListener('click', () => this.toggleStore());

        const saveBtn = document.getElementById('save-whatsapp-btn');
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveWhatsAppNumber());

        const testBtn = document.getElementById('test-whatsapp-btn');
        if (testBtn) testBtn.addEventListener('click', () => this.testWhatsAppNumber());
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

        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.innerHTML = await this.render();
            this.initializeEvents();
        }
    }

    async saveWhatsAppNumber() {
        const input = document.getElementById('whatsapp-number-input');
        const localPart = input?.value.trim().replace(/[\s\-\(\)]/g, '');
        const number = '549' + localPart;

        if (!localPart || !/^[0-9]+$/.test(localPart)) {
            this.notify.show('Error', 'Ingresá solo los dígitos del número local', 'error');
            return;
        }

        const saveBtn = document.getElementById('save-whatsapp-btn');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Guardando...';
        }

        const currentStore = this.currentConfig?.store || {};
        const res = await this.api.fetchWithAuth('/config', {
            method: 'PUT',
            body: JSON.stringify({ store: { ...currentStore, whatsappNumber: number } })
        });

        if (!res || !res.success) {
            this.notify.show('Error', 'No se pudo guardar el número', 'error');
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk mr-2"></i>Guardar';
            }
            return;
        }

        if (this.currentConfig?.store) this.currentConfig.store.whatsappNumber = number;
        this.notify.show('Listo', 'Número de WhatsApp actualizado', 'success');
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk mr-2"></i>Guardar';
        }
    }

    testWhatsAppNumber() {
        const input = document.getElementById('whatsapp-number-input');
        const localPart = input?.value.trim().replace(/[\s\-\(\)]/g, '');
        const number = '549' + localPart;

        if (!localPart || !/^[0-9]+$/.test(localPart)) {
            this.notify.show('Error', 'Ingresá un número válido antes de probar', 'error');
            return;
        }

        const a = document.createElement('a');
        a.href = `https://wa.me/${number}`;
        a.target = '_blank';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}
