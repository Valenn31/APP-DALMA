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

        const saveDeliveryBtn = document.getElementById('save-delivery-cost-btn');
        if (saveDeliveryBtn) saveDeliveryBtn.addEventListener('click', () => this.saveDeliveryCost());


        const saveBtn = document.getElementById('save-whatsapp-btn');
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveWhatsAppNumber());

        const testBtn = document.getElementById('test-whatsapp-btn');
        if (testBtn) testBtn.addEventListener('click', () => this.testWhatsAppNumber());
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
