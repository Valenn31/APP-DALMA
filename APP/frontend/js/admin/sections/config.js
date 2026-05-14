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
        const store = this.currentConfig?.store || {};
        const backgroundColor = store.backgroundColor || '#f2e9dc';
        const primaryColor = store.primaryColor || '#7d8c56';
        const secondaryColor = store.secondaryColor || '#4a3b2a';
        const logoUrl = store.logoUrl || '';
        const storeName = store.name || 'Una cucharita más';
        const heroTitle = store.heroTitle || '¿Qué vas a elegir hoy?';

        return `
            <div class="p-6 max-w-lg mx-auto">
                <h1 class="text-2xl font-black text-gray-800 mb-6">Configuración</h1>

                <!-- Card: Identidad visual -->
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
                    <h2 class="text-lg font-bold text-gray-700 mb-1">Colores del catálogo</h2>
                    <p class="text-gray-400 text-sm mb-5">
                        Se aplican en el catálogo público. Guardá para que persistan.
                    </p>

                    <!-- Color de fondo -->
                    <div class="mb-4">
                        <label class="block text-sm font-semibold text-gray-600 mb-2">Color de fondo</label>
                        <p class="text-xs text-gray-400 mb-2">Fondo general de la tienda, header de productos y pie del carrito.</p>
                        <div class="flex items-center gap-3">
                            <input id="bg-color-input" type="color" value="${backgroundColor}"
                                class="w-12 h-12 rounded-xl border border-gray-200 cursor-pointer p-1 bg-white">
                            <input id="bg-color-hex" type="text" value="${backgroundColor}" maxlength="7"
                                placeholder="#f2e9dc"
                                class="flex-1 px-3 py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 font-mono">
                            <div id="bg-color-preview" class="w-12 h-12 rounded-xl border border-gray-200 flex-shrink-0" style="background-color:${backgroundColor}"></div>
                        </div>
                    </div>

                    <!-- Color primario -->
                    <div class="mb-4">
                        <label class="block text-sm font-semibold text-gray-600 mb-2">Color primario</label>
                        <p class="text-xs text-gray-400 mb-2">Botón "Agregar al carrito", badge de stock, carrito flotante.</p>
                        <div class="flex items-center gap-3">
                            <input id="primary-color-input" type="color" value="${primaryColor}"
                                class="w-12 h-12 rounded-xl border border-gray-200 cursor-pointer p-1 bg-white">
                            <input id="primary-color-hex" type="text" value="${primaryColor}" maxlength="7"
                                placeholder="#7d8c56"
                                class="flex-1 px-3 py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 font-mono">
                            <div id="primary-color-preview" class="w-12 h-12 rounded-xl border border-gray-200 flex-shrink-0" style="background-color:${primaryColor}"></div>
                        </div>
                    </div>

                    <!-- Color secundario -->
                    <div class="mb-5">
                        <label class="block text-sm font-semibold text-gray-600 mb-2">Color secundario</label>
                        <p class="text-xs text-gray-400 mb-2">Títulos, textos, botón "Continuar", radios de entrega y pago.</p>
                        <div class="flex items-center gap-3">
                            <input id="secondary-color-input" type="color" value="${secondaryColor}"
                                class="w-12 h-12 rounded-xl border border-gray-200 cursor-pointer p-1 bg-white">
                            <input id="secondary-color-hex" type="text" value="${secondaryColor}" maxlength="7"
                                placeholder="#4a3b2a"
                                class="flex-1 px-3 py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 font-mono">
                            <div id="secondary-color-preview" class="w-12 h-12 rounded-xl border border-gray-200 flex-shrink-0" style="background-color:${secondaryColor}"></div>
                        </div>
                    </div>

                    <!-- Logo URL -->
                    <div class="mb-5">
                        <label class="block text-sm font-semibold text-gray-600 mb-2">Logo</label>
                        <p class="text-xs text-gray-400 mb-2">URL de imagen del logo (Cloudinary o externa). Dejá vacío para usar el ícono por defecto.</p>
                        <div class="flex gap-2">
                            <input id="logo-url-input" type="text" value="${logoUrl}"
                                placeholder="https://res.cloudinary.com/..."
                                class="flex-1 px-3 py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300">
                        </div>
                        <div id="logo-preview-container" class="${logoUrl ? '' : 'hidden'} mt-3">
                            <p class="text-xs text-gray-400 mb-1">Preview:</p>
                            <img id="logo-preview" src="${logoUrl}" alt="Logo" class="h-16 w-auto rounded-xl border border-gray-200 object-contain bg-gray-50 p-2">
                        </div>
                    </div>

                    <button id="save-branding-btn"
                        class="w-full py-3 px-4 rounded-xl font-bold text-white bg-[#48332c] hover:bg-[#3a2820] transition-all active:scale-95 text-sm">
                        <i class="fa-solid fa-floppy-disk mr-2"></i>Guardar colores
                    </button>
                </div>

                <!-- Card: Textos del catálogo -->
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
                    <h2 class="text-lg font-bold text-gray-700 mb-1">Textos del catálogo</h2>
                    <p class="text-gray-400 text-sm mb-5">
                        Textos visibles en la tienda pública.
                    </p>

                    <div class="mb-4">
                        <label class="block text-sm font-semibold text-gray-600 mb-2">Nombre de la tienda</label>
                        <p class="text-xs text-gray-400 mb-2">Aparece en el header del catálogo, el carrito y el título de la pestaña.</p>
                        <input id="store-name-input" type="text" value="${storeName}" maxlength="50"
                            placeholder="Una cucharita más"
                            class="w-full px-3 py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300">
                    </div>

                    <div class="mb-5">
                        <label class="block text-sm font-semibold text-gray-600 mb-2">Título principal</label>
                        <p class="text-xs text-gray-400 mb-2">El titular grande en la vista de categorías.</p>
                        <input id="store-hero-title-input" type="text" value="${heroTitle}" maxlength="60"
                            placeholder="¿Qué vas a elegir hoy?"
                            class="w-full px-3 py-3 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300">
                    </div>

                    <button id="save-texts-btn"
                        class="w-full py-3 px-4 rounded-xl font-bold text-white bg-[#48332c] hover:bg-[#3a2820] transition-all active:scale-95 text-sm">
                        <i class="fa-solid fa-floppy-disk mr-2"></i>Guardar textos
                    </button>
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
                                value="${store.deliveryCost ?? 300}"
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
                                value="${(() => { const n = store.whatsappNumber || ''; return n.startsWith('549') ? n.slice(3) : n; })()}"
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
        // Color de fondo — sync picker ↔ hex input, preview en tiempo real
        const bgPicker = document.getElementById('bg-color-input');
        const bgHex = document.getElementById('bg-color-hex');
        const bgPreview = document.getElementById('bg-color-preview');

        bgPicker?.addEventListener('input', (e) => {
            const val = e.target.value;
            bgHex.value = val;
            bgPreview.style.backgroundColor = val;
            document.documentElement.style.setProperty('--color-bg', val);
        });
        bgHex?.addEventListener('input', (e) => {
            const val = e.target.value;
            if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                bgPicker.value = val;
                bgPreview.style.backgroundColor = val;
                document.documentElement.style.setProperty('--color-bg', val);
            }
        });

        // Color primario — sync picker ↔ hex input, preview en tiempo real
        const primaryPicker = document.getElementById('primary-color-input');
        const primaryHex = document.getElementById('primary-color-hex');
        const primaryPreview = document.getElementById('primary-color-preview');

        primaryPicker?.addEventListener('input', (e) => {
            const val = e.target.value;
            primaryHex.value = val;
            primaryPreview.style.backgroundColor = val;
            document.documentElement.style.setProperty('--color-primary', val);
        });
        primaryHex?.addEventListener('input', (e) => {
            const val = e.target.value;
            if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                primaryPicker.value = val;
                primaryPreview.style.backgroundColor = val;
                document.documentElement.style.setProperty('--color-primary', val);
            }
        });

        // Color secundario — sync picker ↔ hex input, preview en tiempo real
        const secondaryPicker = document.getElementById('secondary-color-input');
        const secondaryHex = document.getElementById('secondary-color-hex');
        const secondaryPreview = document.getElementById('secondary-color-preview');

        secondaryPicker?.addEventListener('input', (e) => {
            const val = e.target.value;
            secondaryHex.value = val;
            secondaryPreview.style.backgroundColor = val;
            document.documentElement.style.setProperty('--color-secondary', val);
        });
        secondaryHex?.addEventListener('input', (e) => {
            const val = e.target.value;
            if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                secondaryPicker.value = val;
                secondaryPreview.style.backgroundColor = val;
                document.documentElement.style.setProperty('--color-secondary', val);
            }
        });

        // Logo — preview en tiempo real al escribir URL
        const logoInput = document.getElementById('logo-url-input');
        const logoContainer = document.getElementById('logo-preview-container');
        const logoImg = document.getElementById('logo-preview');

        logoInput?.addEventListener('input', (e) => {
            const url = e.target.value.trim();
            if (url) {
                logoImg.src = url;
                logoContainer.classList.remove('hidden');
            } else {
                logoContainer.classList.add('hidden');
            }
        });

        // Guardar colores
        const saveBrandingBtn = document.getElementById('save-branding-btn');
        if (saveBrandingBtn) saveBrandingBtn.addEventListener('click', () => this.saveBranding());

        // Guardar textos
        const saveTextsBtn = document.getElementById('save-texts-btn');
        if (saveTextsBtn) saveTextsBtn.addEventListener('click', () => this.saveTexts());

        // Costo de envío
        const saveDeliveryBtn = document.getElementById('save-delivery-cost-btn');
        if (saveDeliveryBtn) saveDeliveryBtn.addEventListener('click', () => this.saveDeliveryCost());

        // WhatsApp
        const saveBtn = document.getElementById('save-whatsapp-btn');
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveWhatsAppNumber());

        const testBtn = document.getElementById('test-whatsapp-btn');
        if (testBtn) testBtn.addEventListener('click', () => this.testWhatsAppNumber());
    }

    async saveBranding() {
        const backgroundColor = document.getElementById('bg-color-input')?.value;
        const primaryColor = document.getElementById('primary-color-input')?.value;
        const secondaryColor = document.getElementById('secondary-color-input')?.value;
        const logoUrl = document.getElementById('logo-url-input')?.value.trim() || '';

        const btn = document.getElementById('save-branding-btn');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Guardando...'; }

        const currentStore = this.currentConfig?.store || {};
        const res = await this.api.fetchWithAuth('/config', {
            method: 'PUT',
            body: JSON.stringify({ store: { ...currentStore, backgroundColor, primaryColor, secondaryColor, logoUrl } })
        });

        if (!res?.success) {
            this.notify.show('Error', 'No se pudo guardar los colores', 'error');
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk mr-2"></i>Guardar colores'; }
            return;
        }

        if (this.currentConfig?.store) {
            this.currentConfig.store.backgroundColor = backgroundColor;
            this.currentConfig.store.primaryColor = primaryColor;
            this.currentConfig.store.secondaryColor = secondaryColor;
            this.currentConfig.store.logoUrl = logoUrl;
        }
        this.notify.show('Listo', 'Colores guardados', 'success');
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk mr-2"></i>Guardar colores'; }
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

    async saveTexts() {
        const name = document.getElementById('store-name-input')?.value.trim();
        const heroTitle = document.getElementById('store-hero-title-input')?.value.trim();

        if (!name) {
            this.notify.show('Error', 'El nombre de la tienda no puede estar vacío', 'error');
            return;
        }

        const btn = document.getElementById('save-texts-btn');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Guardando...'; }

        const currentStore = this.currentConfig?.store || {};
        const res = await this.api.fetchWithAuth('/config', {
            method: 'PUT',
            body: JSON.stringify({ store: { ...currentStore, name, heroTitle } })
        });

        if (!res?.success) {
            this.notify.show('Error', 'No se pudo guardar los textos', 'error');
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk mr-2"></i>Guardar textos'; }
            return;
        }

        if (this.currentConfig?.store) {
            this.currentConfig.store.name = name;
            this.currentConfig.store.heroTitle = heroTitle;
        }
        this.notify.show('Listo', 'Textos del catálogo guardados', 'success');
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk mr-2"></i>Guardar textos'; }
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
