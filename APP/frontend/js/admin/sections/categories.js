export class CategoriesSection {
    constructor(apiClient, notificationManager) {
        this.api = apiClient;
        this.notify = notificationManager;
        this.categories = [];
        this.allProducts = [];
        this.orderMode = false;
        this.editingId = null;
    }

    // ─── Render ────────────────────────────────────────────────────────────────

    async render() {
        const res = await this.api.fetchWithAuth('/config');
        if (!res?.success) return `<div class="text-center py-12 text-red-500">Error al cargar categorías</div>`;

        this.categories = [...(res.data.categories || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        return `
            <div class="space-y-4 sm:space-y-6">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Categorías</h1>
                        <p class="text-gray-500 text-sm mt-1">Gestioná las categorías del catálogo</p>
                    </div>
                    <div class="flex gap-2">
                        <button id="orderModeBtn" class="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors">
                            <i class="fas fa-sort"></i> Ordenar
                        </button>
                        <button id="newCategoryBtn" class="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-opacity-90 text-sm font-medium transition-colors">
                            <i class="fas fa-plus"></i> Nueva Categoría
                        </button>
                    </div>
                </div>

                <div id="orderModeBar" class="hidden bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between">
                    <span class="text-blue-700 text-sm font-medium"><i class="fas fa-arrows-alt mr-2"></i>Modo ordenar activo — usá las flechas para mover</span>
                    <div class="flex gap-2">
                        <button id="saveOrderBtn" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors">Guardar orden</button>
                        <button id="cancelOrderBtn" class="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">Cancelar</button>
                    </div>
                </div>

                <div id="categoriesList" class="space-y-3">
                    ${this._renderCategoryCards()}
                </div>

                ${this.categories.length === 0 ? `
                    <div class="text-center py-16 text-gray-400">
                        <i class="fas fa-tags text-5xl mb-4"></i>
                        <p class="text-lg font-medium">No hay categorías todavía</p>
                        <p class="text-sm">Creá la primera para empezar</p>
                    </div>` : ''}
            </div>

            ${this._renderCategoryModal()}
            ${this._renderAssignProductsModal()}
        `;
    }

    _renderCategoryCards() {
        return this.categories.map((cat, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === this.categories.length - 1;
            return `
            <div class="category-admin-card bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" data-cat-id="${cat.id}">
                <div class="flex items-center gap-4 p-4">
                    <!-- Imagen -->
                    <div class="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-gray-100">
                        ${cat.image ? `<img src="${cat.image.startsWith('http') ? cat.image : '/' + cat.image}" class="w-full h-full object-cover" alt="${this._esc(cat.name)}">` : `<div class="w-full h-full flex items-center justify-center text-gray-400"><i class="fas fa-image text-2xl"></i></div>`}
                    </div>

                    <!-- Info -->
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                            <h3 class="font-bold text-gray-900">${this._esc(cat.name)}</h3>
                            <span class="text-xs px-2 py-0.5 rounded-full font-medium ${cat.active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}">
                                ${cat.active !== false ? 'Visible' : 'Oculta'}
                            </span>
                            <span class="text-xs px-2 py-0.5 rounded-full font-medium ${cat.available !== false ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-600'}">
                                ${cat.available !== false ? 'Disponible' : 'No disponible'}
                            </span>
                        </div>
                        <p class="text-xs text-gray-400 mt-0.5">ID: ${cat.id}</p>
                    </div>

                    <!-- Acciones modo normal -->
                    <div class="normal-actions flex items-center gap-2 flex-shrink-0">
                        <!-- Controles de estado: visible + disponible agrupados -->
                        <div class="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                            <button data-action="toggleActive" data-cat-id="${cat.id}" title="${cat.active !== false ? 'Ocultar del catálogo' : 'Mostrar en catálogo'}"
                                class="p-2 ${cat.active !== false ? 'text-gray-600' : 'text-gray-300'} hover:bg-gray-100 transition-colors text-sm border-r border-gray-200">
                                <i class="fas fa-${cat.active !== false ? 'eye' : 'eye-slash'}"></i>
                            </button>
                            <button data-action="toggleAvailable" data-cat-id="${cat.id}" title="${cat.available !== false ? 'Marcar no disponible' : 'Marcar disponible'}"
                                class="p-2 hover:bg-gray-100 transition-colors text-sm">
                                <i class="fas fa-${cat.available !== false ? 'toggle-on text-blue-500' : 'toggle-off text-gray-300'}"></i>
                            </button>
                        </div>
                        <!-- Acciones: editar y borrar -->
                        <button data-action="editCategory" data-cat-id="${cat.id}"
                            class="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors text-sm">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button data-action="deleteCategory" data-cat-id="${cat.id}"
                            class="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors text-sm">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>

                    <!-- Acciones modo ordenar -->
                    <div class="order-actions hidden flex-col gap-1 flex-shrink-0">
                        <button data-action="moveUp" data-cat-id="${cat.id}" ${isFirst ? 'disabled' : ''}
                            class="p-2 rounded-lg ${isFirst ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'} transition-colors">
                            <i class="fas fa-chevron-up text-sm"></i>
                        </button>
                        <button data-action="moveDown" data-cat-id="${cat.id}" ${isLast ? 'disabled' : ''}
                            class="p-2 rounded-lg ${isLast ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'} transition-colors">
                            <i class="fas fa-chevron-down text-sm"></i>
                        </button>
                    </div>
                </div>

                <!-- Sección de productos -->
                <div class="border-t border-gray-100 px-4 py-2 flex items-center justify-between">
                    <button data-action="toggleProducts" data-cat-id="${cat.id}"
                        class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors">
                        <i class="fas fa-box-open text-xs"></i>
                        <span class="cat-product-count-${cat.id}">Ver productos</span>
                        <i class="fas fa-chevron-down text-xs ml-1 toggle-chevron-${cat.id}"></i>
                    </button>
                    <button data-action="assignProduct" data-cat-id="${cat.id}"
                        class="text-sm text-primary hover:text-green-700 flex items-center gap-1 font-medium transition-colors">
                        <i class="fas fa-plus text-xs"></i> Agregar producto
                    </button>
                </div>
                <div id="products-panel-${cat.id}" class="hidden px-4 pb-3">
                    <p class="text-xs text-gray-400 italic">Cargando...</p>
                </div>
            </div>`;
        }).join('');
    }

    _renderCategoryModal() {
        return `
        <div id="categoryModal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div class="p-5 border-b border-gray-200 flex items-center justify-between">
                    <h3 id="categoryModalTitle" class="text-lg font-bold text-gray-900">Nueva Categoría</h3>
                    <button id="closeCategoryModal" class="text-gray-400 hover:text-gray-600 p-1"><i class="fas fa-times text-xl"></i></button>
                </div>
                <div class="p-5 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                        <input type="text" id="catName" placeholder="Ej: Tortas" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">URL o ruta de imagen</label>
                        <input type="text" id="catImageUrl" placeholder="Ej: assets/img/postres/tortas.jpeg" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary">
                        <div id="catImagePreview" class="mt-2 hidden"><img id="catImagePreviewImg" class="h-20 w-20 rounded-lg object-cover border border-gray-200" alt="Vista previa"></div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">O subir imagen</label>
                        <input type="file" id="catImageFile" accept="image/*,.heic,.heif" class="mb-2 text-sm">
                        <button type="button" id="uploadCatImageBtn" class="bg-primary text-white px-3 py-1.5 rounded-lg text-sm hover:bg-opacity-90">Subir imagen</button>
                        <div id="catUploadResult" class="mt-1 text-xs text-gray-500"></div>
                    </div>
                    <div class="flex gap-4">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="catActive" checked class="rounded">
                            <span class="text-sm text-gray-700">Visible en catálogo</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="catAvailable" checked class="rounded">
                            <span class="text-sm text-gray-700">Disponible</span>
                        </label>
                    </div>
                </div>
                <div class="p-5 border-t border-gray-200 flex justify-end gap-3">
                    <button id="cancelCategoryModal" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-50">Cancelar</button>
                    <button id="saveCategoryBtn" class="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-opacity-90">
                        <span id="saveCatText">Guardar</span>
                    </button>
                </div>
            </div>
        </div>`;
    }

    _renderAssignProductsModal() {
        return `
        <div id="assignProductsModal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
                <div class="p-5 border-b border-gray-200 flex items-center justify-between">
                    <h3 class="text-lg font-bold text-gray-900">Agregar producto existente</h3>
                    <button id="closeAssignModal" class="text-gray-400 hover:text-gray-600 p-1"><i class="fas fa-times text-xl"></i></button>
                </div>
                <div class="p-4 border-b border-gray-100">
                    <input type="text" id="assignProductSearch" placeholder="Buscar por nombre..." class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary">
                </div>
                <div id="assignProductsList" class="flex-1 overflow-y-auto p-4 space-y-2">
                    <p class="text-gray-400 text-sm text-center py-6">Cargando productos...</p>
                </div>
                <div class="p-4 border-t border-gray-100 text-xs text-gray-400">
                    Solo se muestran productos que no pertenecen a esta categoría
                </div>
            </div>
        </div>`;
    }

    // ─── Events ────────────────────────────────────────────────────────────────

    initializeEvents() {
        // Botones superiores
        document.getElementById('newCategoryBtn')?.addEventListener('click', () => this._openModal());
        document.getElementById('orderModeBtn')?.addEventListener('click', () => this._enterOrderMode());
        document.getElementById('saveOrderBtn')?.addEventListener('click', () => this._saveOrder());
        document.getElementById('cancelOrderBtn')?.addEventListener('click', () => this._cancelOrderMode());

        // Modal categoría
        document.getElementById('closeCategoryModal')?.addEventListener('click', () => this._closeModal());
        document.getElementById('cancelCategoryModal')?.addEventListener('click', () => this._closeModal());
        document.getElementById('categoryModal')?.addEventListener('click', e => { if (e.target.id === 'categoryModal') this._closeModal(); });
        document.getElementById('saveCategoryBtn')?.addEventListener('click', () => this._saveCategory());
        document.getElementById('catImageUrl')?.addEventListener('input', e => this._updateCatImagePreview(e.target.value));
        document.getElementById('uploadCatImageBtn')?.addEventListener('click', () => this._uploadCategoryImage());

        // Modal asignar productos
        document.getElementById('closeAssignModal')?.addEventListener('click', () => this._closeAssignModal());
        document.getElementById('assignProductsModal')?.addEventListener('click', e => { if (e.target.id === 'assignProductsModal') this._closeAssignModal(); });
        document.getElementById('assignProductSearch')?.addEventListener('input', e => this._filterAssignList(e.target.value));

        // Delegación en la lista de categorías
        document.getElementById('categoriesList')?.addEventListener('click', e => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const catId = btn.dataset.catId;
            const action = btn.dataset.action;
            if (action === 'editCategory')    this._openModal(catId);
            if (action === 'deleteCategory')  this._deleteCategory(catId);
            if (action === 'toggleActive')    this._toggleField(catId, 'active');
            if (action === 'toggleAvailable') this._toggleField(catId, 'available');
            if (action === 'moveUp')          this._moveCategory(catId, -1);
            if (action === 'moveDown')        this._moveCategory(catId, 1);
            if (action === 'toggleProducts')  this._toggleProductsPanel(catId);
            if (action === 'assignProduct')   this._openAssignModal(catId);
        });

        // Delegación en modal de asignar
        document.getElementById('assignProductsList')?.addEventListener('click', e => {
            const btn = e.target.closest('[data-assign-product]');
            if (btn) this._assignProductToCategory(parseInt(btn.dataset.assignProduct));
        });

        // Delegación para quitar producto de categoría (panel expandido)
        document.getElementById('categoriesList')?.addEventListener('click', e => {
            const btn = e.target.closest('[data-remove-product]');
            if (btn) this._removeProductFromCategory(parseInt(btn.dataset.removeProduct), btn.dataset.catPanel);
        });
    }

    // ─── Orden ─────────────────────────────────────────────────────────────────

    _enterOrderMode() {
        this.orderMode = true;
        this._originalOrder = this.categories.map(c => c.id);
        document.getElementById('orderModeBar')?.classList.remove('hidden');
        document.querySelectorAll('.normal-actions').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.order-actions').forEach(el => el.classList.remove('hidden'));
        document.getElementById('newCategoryBtn')?.setAttribute('disabled', '');
    }

    _cancelOrderMode() {
        // Restaurar orden original
        const original = this._originalOrder || [];
        this.categories.sort((a, b) => original.indexOf(a.id) - original.indexOf(b.id));
        this._exitOrderMode();
        this._refreshList();
    }

    _exitOrderMode() {
        this.orderMode = false;
        document.getElementById('orderModeBar')?.classList.add('hidden');
        document.querySelectorAll('.normal-actions').forEach(el => el.classList.remove('hidden'));
        document.querySelectorAll('.order-actions').forEach(el => el.classList.add('hidden'));
        document.getElementById('newCategoryBtn')?.removeAttribute('disabled');
    }

    _moveCategory(catId, dir) {
        const idx = this.categories.findIndex(c => c.id === catId);
        const newIdx = idx + dir;
        if (newIdx < 0 || newIdx >= this.categories.length) return;
        [this.categories[idx], this.categories[newIdx]] = [this.categories[newIdx], this.categories[idx]];
        this._refreshList();
        // Volver a modo ordenar después del refresh
        document.getElementById('orderModeBar')?.classList.remove('hidden');
        document.querySelectorAll('.normal-actions').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.order-actions').forEach(el => el.classList.remove('hidden'));
        document.getElementById('newCategoryBtn')?.setAttribute('disabled', '');
    }

    async _saveOrder() {
        const btn = document.getElementById('saveOrderBtn');
        if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }

        const updatedCategories = this.categories.map((cat, i) => ({ ...cat, order: i }));
        const res = await this.api.fetchWithAuth('/config', {
            method: 'PUT',
            body: JSON.stringify({ categories: updatedCategories })
        });

        if (!res?.success) {
            this.notify.show('Error', 'No se pudo guardar el orden', 'error');
            if (btn) { btn.disabled = false; btn.textContent = 'Guardar orden'; }
            return;
        }

        this.categories = updatedCategories;
        this.notify.show('Listo', 'Orden guardado', 'success');
        this._exitOrderMode();
        this._refreshList();
    }

    // ─── CRUD ──────────────────────────────────────────────────────────────────

    _openModal(catId = null) {
        this.editingId = catId;
        const modal = document.getElementById('categoryModal');
        const title = document.getElementById('categoryModalTitle');
        if (!modal) return;

        if (catId) {
            const cat = this.categories.find(c => c.id === catId);
            title.textContent = 'Editar Categoría';
            document.getElementById('catName').value = cat.name || '';
            document.getElementById('catImageUrl').value = cat.image || '';
            document.getElementById('catActive').checked = cat.active !== false;
            document.getElementById('catAvailable').checked = cat.available !== false;
            this._updateCatImagePreview(cat.image || '');
        } else {
            title.textContent = 'Nueva Categoría';
            document.getElementById('catName').value = '';
            document.getElementById('catImageUrl').value = '';
            document.getElementById('catActive').checked = true;
            document.getElementById('catAvailable').checked = true;
            this._updateCatImagePreview('');
            document.getElementById('catUploadResult').textContent = '';
        }
        modal.classList.remove('hidden');
    }

    _closeModal() {
        document.getElementById('categoryModal')?.classList.add('hidden');
        this.editingId = null;
    }

    async _saveCategory() {
        const name = document.getElementById('catName')?.value?.trim();
        if (!name) { this.notify.show('Error', 'El nombre es obligatorio', 'error'); return; }

        const image     = document.getElementById('catImageUrl')?.value?.trim() || '';
        const active    = document.getElementById('catActive')?.checked ?? true;
        const available = document.getElementById('catAvailable')?.checked ?? true;

        const btn     = document.getElementById('saveCategoryBtn');
        const btnText = document.getElementById('saveCatText');
        if (btn)     btn.disabled = true;
        if (btnText) btnText.textContent = 'Guardando...';

        const resetBtn = () => {
            if (btn)     btn.disabled = false;
            if (btnText) btnText.textContent = 'Guardar';
        };

        let updatedCategories;
        if (this.editingId) {
            updatedCategories = this.categories.map(cat =>
                cat.id === this.editingId ? { ...cat, name, image, active, available } : cat
            );
        } else {
            const id = name.toLowerCase()
                .normalize('NFD').replace(/[̀-ͯ]/g, '')
                .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || Date.now().toString();
            updatedCategories = [...this.categories, { id, name, image, active, available, order: this.categories.length }];
        }

        try {
            const res = await this.api.fetchWithAuth('/config', {
                method: 'PUT',
                body: JSON.stringify({ categories: updatedCategories })
            });

            if (!res?.success) {
                this.notify.show('Error', res?.error || 'No se pudo guardar la categoría', 'error');
                resetBtn();
                return;
            }

            this.categories = updatedCategories;
            this.notify.show('Listo', this.editingId ? 'Categoría actualizada' : 'Categoría creada', 'success');
            this._closeModal();
            this._refreshList();
        } catch (err) {
            console.error('_saveCategory error:', err);
            this.notify.show('Error', 'Error de conexión al guardar', 'error');
            resetBtn();
        }
    }

    async _deleteCategory(catId) {
        // Contar productos de esta categoría
        const prodRes = await this.api.fetchWithAuth('/products?includeInactive=true');
        const products = prodRes?.data || [];
        const count = products.filter(p => p.category === catId).length;

        const msg = count > 0
            ? `¿Borrar la categoría? ${count} producto${count > 1 ? 's' : ''} quedarán sin categoría asignada.`
            : '¿Borrar esta categoría?';

        if (!confirm(msg)) return;

        const updatedCategories = this.categories.filter(c => c.id !== catId);
        const res = await this.api.fetchWithAuth('/config', {
            method: 'PUT',
            body: JSON.stringify({ categories: updatedCategories })
        });

        if (!res?.success) { this.notify.show('Error', 'No se pudo eliminar la categoría', 'error'); return; }

        this.categories = updatedCategories;
        this.notify.show('Listo', 'Categoría eliminada', 'success');
        this._refreshList();
    }

    async _toggleField(catId, field) {
        const updatedCategories = this.categories.map(cat =>
            cat.id === catId ? { ...cat, [field]: !(cat[field] !== false) } : cat
        );
        const res = await this.api.fetchWithAuth('/config', {
            method: 'PUT',
            body: JSON.stringify({ categories: updatedCategories })
        });
        if (!res?.success) { this.notify.show('Error', 'No se pudo actualizar', 'error'); return; }
        this.categories = updatedCategories;
        this._refreshList();
    }

    // ─── Panel de productos ────────────────────────────────────────────────────

    async _toggleProductsPanel(catId) {
        const panel = document.getElementById(`products-panel-${catId}`);
        const chevron = document.querySelector(`.toggle-chevron-${catId}`);
        if (!panel) return;

        if (!panel.classList.contains('hidden')) {
            panel.classList.add('hidden');
            chevron?.classList.remove('fa-chevron-up');
            chevron?.classList.add('fa-chevron-down');
            return;
        }

        panel.classList.remove('hidden');
        chevron?.classList.remove('fa-chevron-down');
        chevron?.classList.add('fa-chevron-up');

        // Cargar productos de esta categoría
        const res = await this.api.fetchWithAuth('/products?includeInactive=true');
        const products = (res?.data || []).filter(p => p.category === catId);

        const countEl = document.querySelector(`.cat-product-count-${catId}`);
        if (countEl) countEl.textContent = `${products.length} producto${products.length !== 1 ? 's' : ''}`;

        if (products.length === 0) {
            panel.innerHTML = `<p class="text-xs text-gray-400 italic py-2">Sin productos asignados</p>`;
            return;
        }

        panel.innerHTML = `<div class="space-y-1 pt-1">${products.map(p => `
            <div class="flex items-center gap-3 py-1.5">
                <div class="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    ${p.image ? `<img src="${p.image.startsWith('http') ? p.image : '/' + p.image}" class="w-full h-full object-cover">` : `<i class="fas fa-birthday-cake text-gray-300 text-xs m-auto block mt-2"></i>`}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-xs font-medium text-gray-800 truncate">${this._esc(p.name)}</p>
                    <p class="text-xs text-gray-400">$${(p.price || 0).toLocaleString()}</p>
                </div>
                <span class="text-xs ${p.active !== false ? 'text-green-500' : 'text-gray-400'}">${p.active !== false ? 'Activo' : 'Inactivo'}</span>
                <button data-remove-product="${p.id}" data-cat-panel="${catId}"
                    class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0" title="Quitar de esta categoría">
                    <i class="fas fa-times text-xs"></i>
                </button>
            </div>`).join('')}</div>`;
    }

    // ─── Asignar producto ──────────────────────────────────────────────────────

    async _openAssignModal(catId) {
        this._assigningCatId = catId;
        const modal = document.getElementById('assignProductsModal');
        const list  = document.getElementById('assignProductsList');
        if (!modal || !list) return;

        modal.classList.remove('hidden');
        list.innerHTML = `<p class="text-gray-400 text-sm text-center py-6">Cargando productos...</p>`;
        document.getElementById('assignProductSearch').value = '';

        const res = await this.api.fetchWithAuth('/products?includeInactive=true');
        this.allProducts = (res?.data || []).filter(p => p.category !== catId);
        this._renderAssignList(this.allProducts);
    }

    _closeAssignModal() {
        document.getElementById('assignProductsModal')?.classList.add('hidden');
        this._assigningCatId = null;
    }

    _renderAssignList(products) {
        const list = document.getElementById('assignProductsList');
        if (!list) return;
        if (products.length === 0) {
            list.innerHTML = `<p class="text-gray-400 text-sm text-center py-6">No hay productos disponibles</p>`;
            return;
        }
        list.innerHTML = products.map(p => `
            <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <div class="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    ${p.image ? `<img src="${p.image.startsWith('http') ? p.image : '/' + p.image}" class="w-full h-full object-cover">` : `<div class="w-full h-full flex items-center justify-center text-gray-300"><i class="fas fa-birthday-cake text-sm"></i></div>`}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-800 truncate">${this._esc(p.name)}</p>
                    <p class="text-xs text-gray-400">Cat actual: ${p.category || '—'} · $${(p.price || 0).toLocaleString()}</p>
                </div>
                <button data-assign-product="${p.id}" class="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-opacity-90 flex-shrink-0">
                    Agregar
                </button>
            </div>`).join('');
    }

    _filterAssignList(term) {
        const filtered = this.allProducts.filter(p => p.name.toLowerCase().includes(term.toLowerCase()));
        this._renderAssignList(filtered);
    }

    async _removeProductFromCategory(productId, catId) {
        const res = await this.api.fetchWithAuth(`/products/${productId}`, {
            method: 'PUT',
            body: JSON.stringify({ category: '' })
        });
        if (!res?.success) { this.notify.show('Error', 'No se pudo quitar el producto', 'error'); return; }
        this.notify.show('Listo', 'Producto quitado de la categoría', 'success');
        // Recargar el panel de esa categoría
        await this._toggleProductsPanel(catId); // cierra
        await this._toggleProductsPanel(catId); // vuelve a abrir con datos frescos
    }

    async _assignProductToCategory(productId) {
        const catId = this._assigningCatId;
        if (!catId) return;

        const res = await this.api.fetchWithAuth(`/products/${productId}`, {
            method: 'PUT',
            body: JSON.stringify({ category: catId })
        });

        if (!res?.success) { this.notify.show('Error', 'No se pudo asignar el producto', 'error'); return; }

        this.notify.show('Listo', 'Producto asignado a la categoría', 'success');
        // Quitar de la lista del modal
        this.allProducts = this.allProducts.filter(p => p.id !== productId);
        this._renderAssignList(this.allProducts);
    }

    // ─── Imagen ────────────────────────────────────────────────────────────────

    _updateCatImagePreview(url) {
        const preview = document.getElementById('catImagePreview');
        const img     = document.getElementById('catImagePreviewImg');
        if (!preview || !img) return;
        if (url) {
            const src = url.startsWith('http') ? url : `/${url}`;
            img.src = src;
            img.onload  = () => preview.classList.remove('hidden');
            img.onerror = () => preview.classList.add('hidden');
        } else {
            preview.classList.add('hidden');
        }
    }

    async _uploadCategoryImage() {
        const fileInput = document.getElementById('catImageFile');
        const result    = document.getElementById('catUploadResult');
        if (!fileInput?.files.length) { result.textContent = 'Seleccioná un archivo primero.'; return; }

        result.textContent = 'Subiendo...';
        const formData = new FormData();
        formData.append('image', fileInput.files[0]);

        const data = await this.api.uploadFile('/images/upload', formData);
        if (data?.success) {
            result.textContent = '✓ Imagen subida';
            document.getElementById('catImageUrl').value = data.imageUrl;
            this._updateCatImagePreview(data.imageUrl);
        } else {
            result.textContent = 'Error al subir la imagen.';
        }
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    _refreshList() {
        const sorted = [...this.categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        this.categories = sorted;
        const list = document.getElementById('categoriesList');
        if (list) list.innerHTML = this._renderCategoryCards();
        // Re-registrar eventos delegados (el contenedor no cambia)
    }

    _esc(str) {
        if (!str) return '';
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }
}
