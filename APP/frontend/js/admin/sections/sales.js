export class SalesSection {
    constructor(apiClient, notificationManager) {
        this.apiClient = apiClient;
        this.notify = notificationManager;
        this._editingSale = null;
        this._editingItems = [];
        this._allProducts = [];
    }

    // ─── Render principal ───────────────────────────────────────────────────────

    async render() {
        const [salesRes, productsRes] = await Promise.all([
            this.apiClient.fetchWithAuth('/sales'),
            this.apiClient.fetchWithAuth('/products?includeInactive=false')
        ]);
        this._sales = salesRes?.data || [];
        this._allProducts = productsRes?.data || [];

        return `
            <div class="space-y-4 sm:space-y-6">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                    <div>
                        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Ventas</h1>
                        <p class="text-gray-600 mt-1 text-sm sm:text-base">${this._sales.length} pedido${this._sales.length !== 1 ? 's' : ''} registrado${this._sales.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm border border-gray-200">
                    <!-- Tabla desktop -->
                    <div class="hidden md:block overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entrega</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pago</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="salesTableBody" class="bg-white divide-y divide-gray-200">
                                ${this._sales.length ? this._sales.map(s => this._renderRow(s)).join('') : `
                                    <tr><td colspan="8" class="px-4 py-12 text-center text-gray-400">
                                        <i class="fas fa-receipt text-4xl mb-3 block"></i>
                                        Todavía no hay ventas registradas
                                    </td></tr>`}
                            </tbody>
                        </table>
                    </div>

                    <!-- Cards móvil -->
                    <div class="md:hidden divide-y divide-gray-100" id="salesCardsContainer">
                        ${this._sales.length ? this._sales.map(s => this._renderCard(s)).join('') : `
                            <div class="py-12 text-center text-gray-400">
                                <i class="fas fa-receipt text-4xl mb-3 block"></i>
                                Todavía no hay ventas registradas
                            </div>`}
                    </div>
                </div>
            </div>

            ${this._renderModal()}
        `;
    }

    _renderRow(sale) {
        const date = new Date(sale.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
        const itemsText = sale.items.map(i => `${i.quantity}x ${i.productName}`).join(', ');
        const deliveryLabel = sale.deliveryType === 'delivery' ? '<span class="text-blue-600">Delivery</span>' : '<span class="text-gray-500">Retiro</span>';
        const payLabel = sale.paymentMethod === 'transferencia' ? '<span class="text-purple-600">Transfer.</span>' : '<span class="text-green-600">Efectivo</span>';
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm font-bold text-gray-700">#${sale.orderId}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${date}</td>
                <td class="px-4 py-3 text-sm text-gray-800 font-medium">${sale.customerName || '—'}</td>
                <td class="px-4 py-3 text-sm text-gray-600 max-w-[180px]">
                    <span title="${itemsText}" class="truncate block">${sale.items.reduce((s, i) => s + i.quantity, 0)} unid.</span>
                </td>
                <td class="px-4 py-3 text-sm font-bold text-gray-900">$${(sale.total || 0).toLocaleString()}</td>
                <td class="px-4 py-3 text-sm">${deliveryLabel}</td>
                <td class="px-4 py-3 text-sm">${payLabel}</td>
                <td class="px-4 py-3 text-sm">
                    <div class="flex items-center gap-2">
                        <button class="sale-edit-btn text-blue-600 hover:text-blue-800 p-1" data-id="${sale._id}" title="Editar">
                            <i class="fas fa-pen text-xs"></i>
                        </button>
                        <button class="sale-delete-btn text-red-500 hover:text-red-700 p-1" data-id="${sale._id}" data-order="${sale.orderId}" title="Eliminar">
                            <i class="fas fa-trash text-xs"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    _renderCard(sale) {
        const date = new Date(sale.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
        return `
            <div class="p-4 space-y-2">
                <div class="flex items-start justify-between">
                    <div>
                        <span class="font-bold text-gray-800">#${sale.orderId}</span>
                        <span class="text-gray-400 text-xs ml-2">${date}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button class="sale-edit-btn text-blue-600 p-1" data-id="${sale._id}"><i class="fas fa-pen text-sm"></i></button>
                        <button class="sale-delete-btn text-red-500 p-1" data-id="${sale._id}" data-order="${sale.orderId}"><i class="fas fa-trash text-sm"></i></button>
                    </div>
                </div>
                <p class="font-medium text-gray-700">${sale.customerName || '—'}</p>
                <p class="text-sm text-gray-500">${sale.items.reduce((s, i) => s + i.quantity, 0)} unid. · ${sale.deliveryType === 'delivery' ? 'Delivery' : 'Retiro'} · ${sale.paymentMethod === 'transferencia' ? 'Transferencia' : 'Efectivo'}</p>
                <p class="font-bold text-gray-900">$${(sale.total || 0).toLocaleString()}</p>
            </div>
        `;
    }

    // ─── Modal de edición ────────────────────────────────────────────────────────

    _renderModal() {
        return `
            <div id="saleModal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                <div class="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[92vh] flex flex-col">
                    <div class="flex items-center justify-between p-5 border-b border-gray-200 flex-shrink-0">
                        <h3 id="saleModalTitle" class="text-lg font-bold text-gray-900">Editar venta</h3>
                        <button id="closeSaleModal" class="text-gray-400 hover:text-gray-600 p-1"><i class="fas fa-times text-lg"></i></button>
                    </div>

                    <div class="overflow-y-auto flex-1 p-5 space-y-5">
                        <!-- Info básica -->
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Cliente</label>
                                <input id="saleCustomerName" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary" placeholder="Nombre del cliente">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total ($)</label>
                                <input id="saleTotal" type="number" step="0.01" min="0" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary" placeholder="0">
                            </div>
                        </div>

                        <!-- Items -->
                        <div>
                            <div class="flex items-center justify-between mb-2">
                                <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Items del pedido</label>
                                <p id="saleSubtotalCalc" class="text-xs text-gray-400">Subtotal: $0</p>
                            </div>
                            <div id="saleItemsList" class="space-y-2 mb-3"></div>

                            <!-- Agregar producto -->
                            <div class="flex gap-2">
                                <div class="flex-1 relative">
                                    <input id="saleProductSearch" type="text" placeholder="Buscar producto para agregar..."
                                        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary">
                                    <div id="saleProductDropdown" class="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 hidden max-h-40 overflow-y-auto"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Notas -->
                        <div>
                            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notas</label>
                            <textarea id="saleNotes" rows="2" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary resize-none" placeholder="Observaciones del pedido..."></textarea>
                        </div>

                        <!-- Changelog (colapsado) -->
                        <div>
                            <button id="toggleChangelog" class="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 font-semibold uppercase tracking-wide">
                                <i class="fas fa-chevron-right text-[10px] transition-transform" id="changelogChevron"></i>
                                Historial de cambios
                            </button>
                            <div id="changelogContent" class="hidden mt-2 space-y-1 border-l-2 border-gray-100 pl-3">
                            </div>
                        </div>
                    </div>

                    <div class="p-5 border-t border-gray-200 flex gap-3 flex-shrink-0">
                        <button id="cancelSaleModal" class="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 text-sm">Cancelar</button>
                        <button id="saveSaleBtn" class="flex-1 bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-opacity-90 text-sm">Guardar cambios</button>
                    </div>
                </div>
            </div>
        `;
    }

    _renderItemRow(item, index) {
        return `
            <div class="flex items-center gap-2 bg-gray-50 rounded-lg p-2" data-item-index="${index}">
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-800 truncate">${item.productName}</p>
                    <p class="text-xs text-gray-400">$<input type="number" min="0" step="0.01" value="${item.unitPrice}"
                        class="sale-item-price w-20 border-b border-gray-300 bg-transparent text-xs focus:outline-none focus:border-primary" data-index="${index}"> c/u</p>
                </div>
                <input type="number" min="0" max="999" value="${item.quantity}"
                    class="sale-item-qty w-14 border border-gray-300 rounded px-2 py-1 text-sm text-center focus:ring-1 focus:ring-primary focus:border-primary" data-index="${index}">
                <button class="sale-item-remove text-red-400 hover:text-red-600 p-1 flex-shrink-0" data-index="${index}">
                    <i class="fas fa-times text-xs"></i>
                </button>
            </div>
        `;
    }

    // ─── Eventos ─────────────────────────────────────────────────────────────────

    initializeEvents() {
        // Editar venta
        document.querySelectorAll('.sale-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => this._openEdit(btn.dataset.id));
        });

        // Eliminar venta
        document.querySelectorAll('.sale-delete-btn').forEach(btn => {
            btn.addEventListener('click', () => this._confirmDelete(btn.dataset.id, btn.dataset.order));
        });

        // Modal controls
        const closeModal = () => {
            document.getElementById('saleModal')?.classList.add('hidden');
            this._editingSale = null;
            this._editingItems = [];
        };
        document.getElementById('closeSaleModal')?.addEventListener('click', closeModal);
        document.getElementById('cancelSaleModal')?.addEventListener('click', closeModal);
        document.getElementById('saleModal')?.addEventListener('click', e => {
            if (e.target.id === 'saleModal') closeModal();
        });

        document.getElementById('saveSaleBtn')?.addEventListener('click', () => this._save());

        // Toggle changelog
        document.getElementById('toggleChangelog')?.addEventListener('click', () => {
            const content = document.getElementById('changelogContent');
            const chevron = document.getElementById('changelogChevron');
            content?.classList.toggle('hidden');
            chevron?.classList.toggle('rotate-90');
        });

        // Search de producto para agregar
        const searchInput = document.getElementById('saleProductSearch');
        const dropdown = document.getElementById('saleProductDropdown');
        if (searchInput && dropdown) {
            searchInput.addEventListener('input', () => {
                const q = searchInput.value.trim().toLowerCase();
                if (!q) { dropdown.classList.add('hidden'); return; }
                const matches = this._allProducts.filter(p => p.name.toLowerCase().includes(q)).slice(0, 8);
                if (!matches.length) { dropdown.classList.add('hidden'); return; }
                dropdown.innerHTML = matches.map(p => `
                    <button class="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-0" data-pid="${p.id}" data-pname="${p.name}" data-pprice="${p.price}">
                        ${p.name} — $${p.price.toLocaleString()}
                    </button>
                `).join('');
                dropdown.classList.remove('hidden');
                dropdown.querySelectorAll('button').forEach(btn => {
                    btn.addEventListener('click', () => {
                        this._addItem({ productId: parseInt(btn.dataset.pid), productName: btn.dataset.pname, quantity: 1, unitPrice: parseFloat(btn.dataset.pprice), unitCost: 0 });
                        searchInput.value = '';
                        dropdown.classList.add('hidden');
                    });
                });
            });
            document.addEventListener('click', e => {
                if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) dropdown.classList.add('hidden');
            });
        }
    }

    // ─── Lógica interna ──────────────────────────────────────────────────────────

    async _openEdit(saleId) {
        const sale = this._sales.find(s => s._id === saleId);
        if (!sale) return;

        this._editingSale = sale;
        this._editingItems = sale.items.map(i => ({ ...i }));

        document.getElementById('saleModalTitle').textContent = `Editar pedido #${sale.orderId}`;
        document.getElementById('saleCustomerName').value = sale.customerName || '';
        document.getElementById('saleTotal').value = sale.total || 0;
        document.getElementById('saleNotes').value = sale.notes || '';

        // Changelog
        const changelogContent = document.getElementById('changelogContent');
        if (changelogContent) {
            if (sale.changelog?.length) {
                changelogContent.innerHTML = [...sale.changelog].reverse().map(entry => {
                    const d = new Date(entry.date).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
                    return `<p class="text-xs text-gray-500"><span class="text-gray-400">${d}</span> — ${entry.description}</p>`;
                }).join('');
            } else {
                changelogContent.innerHTML = '<p class="text-xs text-gray-400 italic">Sin cambios registrados</p>';
            }
        }

        this._renderItemsList();
        document.getElementById('saleModal').classList.remove('hidden');
    }

    _renderItemsList() {
        const list = document.getElementById('saleItemsList');
        if (!list) return;
        list.innerHTML = this._editingItems.map((item, i) => this._renderItemRow(item, i)).join('');
        this._updateSubtotal();

        // Eventos de los items
        list.querySelectorAll('.sale-item-qty').forEach(input => {
            input.addEventListener('input', () => {
                const idx = parseInt(input.dataset.index);
                this._editingItems[idx].quantity = parseInt(input.value) || 0;
                this._updateSubtotal();
            });
        });
        list.querySelectorAll('.sale-item-price').forEach(input => {
            input.addEventListener('input', () => {
                const idx = parseInt(input.dataset.index);
                this._editingItems[idx].unitPrice = parseFloat(input.value) || 0;
                this._updateSubtotal();
            });
        });
        list.querySelectorAll('.sale-item-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.index);
                this._editingItems.splice(idx, 1);
                this._renderItemsList();
            });
        });
    }

    _addItem(item) {
        const existing = this._editingItems.find(i => i.productId === item.productId);
        if (existing) {
            existing.quantity++;
        } else {
            this._editingItems.push(item);
        }
        this._renderItemsList();
    }

    _updateSubtotal() {
        const subtotal = this._editingItems.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);
        const el = document.getElementById('saleSubtotalCalc');
        if (el) el.textContent = `Subtotal: $${subtotal.toLocaleString()}`;
    }

    async _save() {
        if (!this._editingSale) return;

        const btn = document.getElementById('saveSaleBtn');
        btn.disabled = true;
        btn.textContent = 'Guardando...';

        // Detectar descripción de cambios para el changelog
        const changes = this._detectChanges();

        const payload = {
            customerName: document.getElementById('saleCustomerName').value.trim(),
            total: parseFloat(document.getElementById('saleTotal').value) || 0,
            notes: document.getElementById('saleNotes').value.trim(),
            items: this._editingItems,
            changeDescription: changes || 'Venta editada desde el panel admin'
        };

        const res = await this.apiClient.fetchWithAuth(`/sales/${this._editingSale._id}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });

        btn.disabled = false;
        btn.textContent = 'Guardar cambios';

        if (res?.success) {
            this.notify.show('Venta actualizada', 'Los cambios se guardaron correctamente', 'success');
            document.getElementById('saleModal').classList.add('hidden');
            // Actualizar localmente y re-renderizar tabla
            const idx = this._sales.findIndex(s => s._id === this._editingSale._id);
            if (idx !== -1) this._sales[idx] = res.data;
            this._editingSale = null;
            this._editingItems = [];
            this._refreshTable();
        } else {
            this.notify.show('Error', res?.error || 'No se pudo guardar la venta', 'error');
        }
    }

    _detectChanges() {
        if (!this._editingSale) return '';
        const parts = [];
        const old = this._editingSale;

        const newName = document.getElementById('saleCustomerName').value.trim();
        if (newName !== (old.customerName || '')) parts.push(`cliente: "${old.customerName || '—'}" → "${newName}"`);

        const newTotal = parseFloat(document.getElementById('saleTotal').value) || 0;
        if (newTotal !== old.total) parts.push(`total: $${old.total} → $${newTotal}`);

        const oldIds = old.items.map(i => i.productId).sort().join(',');
        const newIds = this._editingItems.map(i => i.productId).sort().join(',');
        if (oldIds !== newIds) parts.push('items modificados');
        else {
            for (const newItem of this._editingItems) {
                const oldItem = old.items.find(i => i.productId === newItem.productId);
                if (oldItem && oldItem.quantity !== newItem.quantity) {
                    parts.push(`${newItem.productName}: ${oldItem.quantity} → ${newItem.quantity}`);
                }
            }
        }

        return parts.length ? parts.join('; ') : '';
    }

    async _confirmDelete(saleId, orderId) {
        if (!confirm(`¿Eliminar el pedido #${orderId}? Se restaurará el stock de todos sus items.`)) return;

        const res = await this.apiClient.fetchWithAuth(`/sales/${saleId}`, { method: 'DELETE' });
        if (res?.success) {
            this.notify.show('Venta eliminada', 'El stock fue restaurado', 'success');
            this._sales = this._sales.filter(s => s._id !== saleId);
            this._refreshTable();
        } else {
            this.notify.show('Error', res?.error || 'No se pudo eliminar la venta', 'error');
        }
    }

    _refreshTable() {
        const tbody = document.getElementById('salesTableBody');
        const cards = document.getElementById('salesCardsContainer');
        if (tbody) {
            tbody.innerHTML = this._sales.length
                ? this._sales.map(s => this._renderRow(s)).join('')
                : `<tr><td colspan="8" class="px-4 py-12 text-center text-gray-400"><i class="fas fa-receipt text-4xl mb-3 block"></i>Todavía no hay ventas registradas</td></tr>`;
        }
        if (cards) {
            cards.innerHTML = this._sales.length
                ? this._sales.map(s => this._renderCard(s)).join('')
                : `<div class="py-12 text-center text-gray-400"><i class="fas fa-receipt text-4xl mb-3 block"></i>Todavía no hay ventas registradas</div>`;
        }
        // Re-attachar eventos a los nuevos botones
        document.querySelectorAll('.sale-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => this._openEdit(btn.dataset.id));
        });
        document.querySelectorAll('.sale-delete-btn').forEach(btn => {
            btn.addEventListener('click', () => this._confirmDelete(btn.dataset.id, btn.dataset.order));
        });
    }
}
