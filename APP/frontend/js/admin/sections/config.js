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

        return `
            <div class="p-6 max-w-lg mx-auto">
                <h1 class="text-2xl font-black text-gray-800 mb-6">Configuración</h1>

                <!-- Card: Disponibilidad de categorías -->
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
                    <h2 class="text-lg font-bold text-gray-700 mb-1">Disponibilidad de categorías</h2>
                    <p class="text-gray-400 text-sm mb-4">Activá o desactivá cada categoría. Si las dos están cerradas, el catálogo muestra "Tienda cerrada".</p>
                    <div class="flex flex-col divide-y divide-gray-50">
                        ${(this.currentConfig?.categories || []).map(cat => {
                            const active = cat.active !== false;
                            const icon = cat.id === 'chocolates' ? 'fa-cookie-bite' : 'fa-ice-cream';
                            return `
                            <div class="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-xl flex items-center justify-center ${active ? 'bg-green-100' : 'bg-gray-100'}">
                                        <i class="fa-solid ${icon} ${active ? 'text-green-600' : 'text-gray-400'}"></i>
                                    </div>
                                    <div>
                                        <p class="font-bold text-gray-700 text-sm">${cat.name}</p>
                                        <p class="text-xs font-medium ${active ? 'text-green-500' : 'text-gray-400'}">${active ? 'Disponible' : 'No disponible'}</p>
                                    </div>
                                </div>
                                <button data-toggle-category="${cat.id}"
                                    class="py-2 px-4 rounded-xl font-bold text-sm transition-all active:scale-95 ${active ? 'bg-red-100 text-red-500 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}">
                                    ${active ? 'Cerrar' : 'Abrir'}
                                </button>
                            </div>`;
                        }).join('')}
                    </div>
                </div>

                <!-- Card: Costo de envío -->
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
                    <h2 class="text-lg font-bold text-gray-700 mb-1">Costo de envío</h2>
                    <p class="text-gray-400 text-sm mb-4">
                        Monto que se suma al total cuando el cliente elige Delivery.
                    </p>
                    <div class="flex gap-2">
                        <div class="flex items-center flex-1 rounded-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-[#48332c]/20">
                            <span class="px-3 py-3 bg-gray-50 text-gray-400 text-sm font-mono border-r border-gray-200 select-none">$</span>
                            <input id="delivery-cost-input" type="number" min="0" step="1"
                                value="${this.currentConfig?.store?.deliveryCost ?? 300}"
                                class="flex-1 px-3 py-3 text-sm focus:outline-none bg-white">
                        </div>
                        <button id="save-delivery-cost-btn"
                            class="py-3 px-4 rounded-xl font-bold text-white bg-[#48332c] hover:bg-[#3a2820] transition-all active:scale-95 text-sm">
                            <i class="fa-solid fa-floppy-disk mr-2"></i>Guardar
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
        document.querySelectorAll('[data-toggle-category]').forEach(btn => {
            btn.addEventListener('click', () => this.toggleCategory(btn.dataset.toggleCategory));
        });

        const saveDeliveryBtn = document.getElementById('save-delivery-cost-btn');
        if (saveDeliveryBtn) saveDeliveryBtn.addEventListener('click', () => this.saveDeliveryCost());

        const saveBtn = document.getElementById('save-whatsapp-btn');
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveWhatsAppNumber());

        const testBtn = document.getElementById('test-whatsapp-btn');
        if (testBtn) testBtn.addEventListener('click', () => this.testWhatsAppNumber());
    }

    async toggleCategory(categoryId) {
        const categories = this.currentConfig?.categories || [];
        const updatedCategories = categories.map(cat =>
            cat.id === categoryId ? { ...cat, active: !cat.active } : cat
        );

        const res = await this.api.fetchWithAuth('/config', {
            method: 'PUT',
            body: JSON.stringify({ categories: updatedCategories })
        });

        if (!res?.success) {
            this.notify.show('Error', 'No se pudo actualizar la categoría', 'error');
            return;
        }

        this.currentConfig.categories = updatedCategories;
        const cat = updatedCategories.find(c => c.id === categoryId);
        this.notify.show('Listo', `${cat.name} ahora está ${cat.active ? 'disponible' : 'no disponible'}`, 'success');

        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.innerHTML = await this.render();
            this.initializeEvents();
        }
    }

    async saveDeliveryCost() {
        const input = document.getElementById('delivery-cost-input');
        const value = parseInt(input?.value);

        if (isNaN(value) || value < 0) {
            this.notify.show('Error', 'Ingresá un valor válido (número entero positivo)', 'error');
            return;
        }

        const btn = document.getElementById('save-delivery-cost-btn');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Guardando...'; }

        const currentStore = this.currentConfig?.store || {};
        const res = await this.api.fetchWithAuth('/config', {
            method: 'PUT',
            body: JSON.stringify({ store: { ...currentStore, deliveryCost: value } })
        });

        if (!res?.success) {
            this.notify.show('Error', 'No se pudo guardar el costo de envío', 'error');
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk mr-2"></i>Guardar'; }
            return;
        }

        if (this.currentConfig?.store) this.currentConfig.store.deliveryCost = value;
        this.notify.show('Listo', `Costo de envío actualizado a $${value.toLocaleString()}`, 'success');
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk mr-2"></i>Guardar'; }
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
