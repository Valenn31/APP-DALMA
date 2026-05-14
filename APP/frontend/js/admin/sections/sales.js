const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export class SalesSection {
    constructor(apiClient, notificationManager) {
        this.apiClient = apiClient;
        this.notify = notificationManager;
        this._editingSale = null;
        this._editingItems = [];
        this._allProducts = [];
        this._sales = [];
        this._activeTab = 'pedidos';
        this._reportPeriod = 'monthly';
        this._reportDate = new Date();
        this._reportCategory = '';
        this._reportProduct = '';
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
                <div>
                    <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Ventas</h1>
                    <p class="text-gray-600 mt-1 text-sm sm:text-base">${this._sales.length} pedido${this._sales.length !== 1 ? 's' : ''} registrado${this._sales.length !== 1 ? 's' : ''}</p>
                </div>

                <!-- Tab bar -->
                <div class="flex border-b border-gray-200">
                    <button id="tab-pedidos" class="tab-btn px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${this._activeTab === 'pedidos' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}" data-tab="pedidos">
                        <i class="fas fa-list-ul mr-1.5"></i>Pedidos
                    </button>
                    <button id="tab-reportes" class="tab-btn px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${this._activeTab === 'reportes' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}" data-tab="reportes">
                        <i class="fas fa-chart-bar mr-1.5"></i>Reportes
                    </button>
                </div>

                <!-- Contenido de la pestaña activa -->
                <div id="sales-tab-content">
                    ${this._activeTab === 'pedidos' ? this._renderPedidosTab() : this._renderReportesTab()}
                </div>
            </div>

            ${this._renderModal()}
        `;
    }

    // ─── Pestaña Pedidos ────────────────────────────────────────────────────────

    _renderPedidosTab() {
        return `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200">
                <div class="hidden md:block overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidades</th>
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
                <div class="md:hidden divide-y divide-gray-100" id="salesCardsContainer">
                    ${this._sales.length ? this._sales.map(s => this._renderCard(s)).join('') : `
                        <div class="py-12 text-center text-gray-400">
                            <i class="fas fa-receipt text-4xl mb-3 block"></i>
                            Todavía no hay ventas registradas
                        </div>`}
                </div>
            </div>
        `;
    }

    // ─── Pestaña Reportes ───────────────────────────────────────────────────────

    _renderReportesTab() {
        const label = this._periodLabel();
        return `
            <div class="space-y-5" id="reportes-container">
                <!-- Selector de período y filtros -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
                    <div class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                        <div class="flex rounded-lg overflow-hidden border border-gray-200">
                            ${['weekly','monthly','annual'].map(p => `
                                <button class="report-period-btn px-4 py-2 text-sm font-medium transition-colors ${this._reportPeriod === p ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}" data-period="${p}">
                                    ${{ weekly: 'Semana', monthly: 'Mes', annual: 'Año' }[p]}
                                </button>
                            `).join('')}
                        </div>
                        <div class="flex items-center gap-3">
                            <button id="report-prev" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                                <i class="fas fa-chevron-left text-xs"></i>
                            </button>
                            <span id="report-period-label" class="text-sm font-semibold text-gray-700 min-w-[130px] text-center">${label}</span>
                            <button id="report-next" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                                <i class="fas fa-chevron-right text-xs"></i>
                            </button>
                        </div>
                    </div>
                    <!-- Filtros -->
                    <div id="report-filters-row" class="flex flex-col sm:flex-row gap-2 pt-1 border-t border-gray-100">
                        ${this._renderFilterSelects()}
                    </div>
                </div>

                <div id="report-metrics">
                    ${this._renderReportesContent()}
                </div>
            </div>
        `;
    }

    _renderReportesContent() {
        const { filtered, totalFacturado, gananciaBruta, cantidadPedidos, promedio, topProducts, breakdown } = this._computeReportData();

        const noData = filtered.length === 0;

        return `
            <!-- Stat cards -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" id="report-stats">
                ${this._statCard('Facturado', `$${totalFacturado.toLocaleString()}`, 'fa-dollar-sign', 'green')}
                ${this._statCard('Ganancia bruta', `$${gananciaBruta.toLocaleString()}`, 'fa-chart-line', 'blue')}
                ${this._statCard('Pedidos', cantidadPedidos, 'fa-receipt', 'yellow')}
                ${this._statCard('Promedio/pedido', cantidadPedidos ? `$${Math.round(promedio).toLocaleString()}` : '—', 'fa-calculator', 'purple')}
            </div>

            ${noData ? `
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 py-12 text-center text-gray-400">
                    <i class="fas fa-chart-bar text-4xl mb-3 block"></i>
                    Sin ventas en este período
                </div>
            ` : `
                <!-- Desglose por subperíodo -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div class="px-4 py-3 border-b border-gray-100">
                        <h3 class="font-semibold text-gray-800 text-sm">Desglose por período</h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Período</th>
                                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pedidos</th>
                                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Facturado</th>
                                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ganancia</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100">
                                ${breakdown.map(row => `
                                    <tr class="${row.count ? 'hover:bg-gray-50' : 'text-gray-400'}">
                                        <td class="px-4 py-2.5 text-sm font-medium text-gray-700">${row.label}</td>
                                        <td class="px-4 py-2.5 text-sm text-right">${row.count || '—'}</td>
                                        <td class="px-4 py-2.5 text-sm text-right font-medium">${row.count ? `$${row.total.toLocaleString()}` : '—'}</td>
                                        <td class="px-4 py-2.5 text-sm text-right ${row.ganancia > 0 ? 'text-green-600 font-semibold' : ''}">${row.count ? `$${row.ganancia.toLocaleString()}` : '—'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Productos más vendidos -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div class="px-4 py-3 border-b border-gray-100">
                        <h3 class="font-semibold text-gray-800 text-sm">Productos más vendidos</h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unidades</th>
                                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100">
                                ${topProducts.map(([name, data], idx) => `
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-4 py-2.5 text-sm text-gray-800">
                                            <span class="text-gray-400 text-xs mr-2">${idx + 1}.</span>${esc(name)}
                                        </td>
                                        <td class="px-4 py-2.5 text-sm text-right font-semibold">${data.units}</td>
                                        <td class="px-4 py-2.5 text-sm text-right text-green-700 font-semibold">$${data.revenue.toLocaleString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `}
        `;
    }

    _renderFilterSelects() {
        const categories = [...new Set(this._allProducts.map(p => p.category))].sort();
        const products = this._reportCategory
            ? this._allProducts.filter(p => p.category === this._reportCategory)
            : this._allProducts;
        return `
            <select id="report-filter-category" class="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:ring-2 focus:ring-primary focus:border-primary bg-white">
                <option value="">Todas las categorías</option>
                ${categories.map(c => `<option value="${c}" ${this._reportCategory === c ? 'selected' : ''}>${c.charAt(0).toUpperCase() + c.slice(1)}</option>`).join('')}
            </select>
            <select id="report-filter-product" class="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:ring-2 focus:ring-primary focus:border-primary bg-white">
                <option value="">Todos los productos</option>
                ${products.map(p => `<option value="${p.name}" ${this._reportProduct === p.name ? 'selected' : ''}>${p.name}</option>`).join('')}
            </select>
            ${(this._reportCategory || this._reportProduct) ? `
                <button id="report-clear-filters" class="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-red-500 border border-gray-200 rounded-lg hover:border-red-300 transition-colors whitespace-nowrap">
                    <i class="fas fa-times mr-1"></i>Limpiar
                </button>` : ''}
        `;
    }

    _statCard(label, value, icon, color) {
        const colors = {
            green:  { bg: 'bg-green-50',  icon: 'text-green-600',  val: 'text-green-700' },
            blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   val: 'text-blue-700' },
            yellow: { bg: 'bg-yellow-50', icon: 'text-yellow-600', val: 'text-yellow-700' },
            purple: { bg: 'bg-purple-50', icon: 'text-purple-600', val: 'text-purple-700' }
        };
        const c = colors[color];
        return `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div class="flex items-center gap-3 mb-2">
                    <div class="w-8 h-8 ${c.bg} rounded-lg flex items-center justify-center flex-shrink-0">
                        <i class="fas ${icon} text-sm ${c.icon}"></i>
                    </div>
                    <span class="text-xs font-medium text-gray-500 uppercase tracking-wide leading-tight">${label}</span>
                </div>
                <p class="text-2xl font-bold ${c.val}">${value}</p>
            </div>
        `;
    }

    // ─── Cálculos de reportes ───────────────────────────────────────────────────

    _computeReportData() {
        const catMap = {};
        for (const p of this._allProducts) catMap[p.id] = p.category;

        const hasFilter = !!(this._reportCategory || this._reportProduct);

        const filterItems = (items) => {
            if (!hasFilter) return items;
            return items.filter(item => {
                if (this._reportProduct && item.productName !== this._reportProduct) return false;
                if (this._reportCategory && catMap[item.productId] !== this._reportCategory) return false;
                return true;
            });
        };

        const periodSales = this._sales.filter(s => this._isInPeriod(new Date(s.date)));

        let totalFacturado = 0, gananciaBruta = 0, cantidadPedidos = 0;
        const productMap = {};
        const filtered = [];

        for (const sale of periodSales) {
            const items = filterItems(sale.items);
            if (hasFilter && !items.length) continue;
            filtered.push(sale);
            cantidadPedidos++;
            totalFacturado += hasFilter
                ? items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
                : (sale.total || 0);
            gananciaBruta += items.reduce((s, i) => s + (i.unitPrice - i.unitCost) * i.quantity, 0);
            for (const item of items) {
                if (!productMap[item.productName]) productMap[item.productName] = { units: 0, revenue: 0 };
                productMap[item.productName].units += item.quantity;
                productMap[item.productName].revenue += item.unitPrice * item.quantity;
            }
        }

        const promedio = cantidadPedidos ? totalFacturado / cantidadPedidos : 0;
        const topProducts = Object.entries(productMap).sort((a, b) => b[1].units - a[1].units).slice(0, 10);
        const breakdown = this._buildBreakdown(filtered, filterItems, hasFilter);

        return { filtered, totalFacturado, gananciaBruta, cantidadPedidos, promedio, topProducts, breakdown };
    }

    _isInPeriod(date) {
        const d = this._reportDate;
        if (this._reportPeriod === 'weekly') {
            const mon = this._weekStart(d);
            const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23, 59, 59, 999);
            return date >= mon && date <= sun;
        }
        if (this._reportPeriod === 'monthly') {
            return date.getFullYear() === d.getFullYear() && date.getMonth() === d.getMonth();
        }
        return date.getFullYear() === d.getFullYear();
    }

    _weekStart(date) {
        const d = new Date(date);
        const day = d.getDay(); // 0=Dom, 1=Lun
        const diff = (day === 0 ? -6 : 1 - day);
        d.setDate(d.getDate() + diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    _buildBreakdown(filtered, filterItems = x => x, hasFilter = false) {
        const d = this._reportDate;
        const rows = [];

        const calcRow = (sales) => {
            let total = 0, ganancia = 0;
            for (const x of sales) {
                const items = filterItems(x.items);
                total += hasFilter ? items.reduce((s, i) => s + i.unitPrice * i.quantity, 0) : (x.total || 0);
                ganancia += items.reduce((s, i) => s + (i.unitPrice - i.unitCost) * i.quantity, 0);
            }
            return { count: sales.length, total, ganancia };
        };

        if (this._reportPeriod === 'weekly') {
            const mon = this._weekStart(d);
            for (let i = 0; i < 7; i++) {
                const day = new Date(mon); day.setDate(mon.getDate() + i);
                const dayEnd = new Date(day); dayEnd.setHours(23, 59, 59, 999);
                const sales = filtered.filter(s => { const sd = new Date(s.date); return sd >= day && sd <= dayEnd; });
                rows.push({ label: `${DAYS_ES[day.getDay()]} ${day.getDate()} ${MONTHS_SHORT[day.getMonth()]}`, ...calcRow(sales) });
            }
        } else if (this._reportPeriod === 'monthly') {
            const year = d.getFullYear(), month = d.getMonth();
            const lastDay = new Date(year, month + 1, 0);
            let weekNum = 1, cur = new Date(year, month, 1);
            while (cur <= lastDay) {
                const weekEnd = new Date(cur); weekEnd.setDate(cur.getDate() + 6); weekEnd.setHours(23, 59, 59, 999);
                if (weekEnd > lastDay) weekEnd.setTime(new Date(year, month + 1, 0, 23, 59, 59, 999).getTime());
                const sales = filtered.filter(s => { const sd = new Date(s.date); return sd >= cur && sd <= weekEnd; });
                const s1 = `${cur.getDate()} ${MONTHS_SHORT[cur.getMonth()]}`, s2 = `${weekEnd.getDate()} ${MONTHS_SHORT[weekEnd.getMonth()]}`;
                rows.push({ label: `Sem ${weekNum} (${s1} – ${s2})`, ...calcRow(sales) });
                cur.setDate(cur.getDate() + 7);
                weekNum++;
            }
        } else {
            const year = d.getFullYear();
            for (let m = 0; m < 12; m++) {
                const sales = filtered.filter(s => { const sd = new Date(s.date); return sd.getFullYear() === year && sd.getMonth() === m; });
                rows.push({ label: MONTHS_ES[m], ...calcRow(sales) });
            }
        }

        return rows;
    }

    _periodLabel() {
        const d = this._reportDate;
        if (this._reportPeriod === 'weekly') {
            const mon = this._weekStart(d);
            const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
            const sameMonth = mon.getMonth() === sun.getMonth();
            return sameMonth
                ? `${mon.getDate()}–${sun.getDate()} ${MONTHS_SHORT[mon.getMonth()]} ${mon.getFullYear()}`
                : `${mon.getDate()} ${MONTHS_SHORT[mon.getMonth()]} – ${sun.getDate()} ${MONTHS_SHORT[sun.getMonth()]} ${sun.getFullYear()}`;
        }
        if (this._reportPeriod === 'monthly') return `${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`;
        return `${d.getFullYear()}`;
    }

    _navigateDate(dir) {
        const d = new Date(this._reportDate);
        if (this._reportPeriod === 'weekly')  d.setDate(d.getDate() + dir * 7);
        if (this._reportPeriod === 'monthly') d.setMonth(d.getMonth() + dir);
        if (this._reportPeriod === 'annual')  d.setFullYear(d.getFullYear() + dir);
        this._reportDate = d;
    }

    _refreshReportes() {
        const container = document.getElementById('reportes-container');
        if (!container) return;

        // Label del período
        const label = document.getElementById('report-period-label');
        if (label) label.textContent = this._periodLabel();

        // Botones de período
        document.querySelectorAll('.report-period-btn').forEach(btn => {
            const active = btn.dataset.period === this._reportPeriod;
            btn.classList.toggle('bg-primary', active);
            btn.classList.toggle('text-white', active);
            btn.classList.toggle('bg-white', !active);
            btn.classList.toggle('text-gray-600', !active);
        });

        // Filtros (re-renderizar para mostrar/ocultar botón limpiar)
        const filtersRow = document.getElementById('report-filters-row');
        if (filtersRow) filtersRow.innerHTML = this._renderFilterSelects();

        // Stats + tablas
        const metrics = document.getElementById('report-metrics');
        if (metrics) metrics.innerHTML = this._renderReportesContent();
    }

    // ─── Render de filas ────────────────────────────────────────────────────────

    _renderRow(sale) {
        const date = new Date(sale.date).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
        const itemsText = sale.items.map(i => `${i.quantity}x ${esc(i.productName)}`).join(', ');
        const deliveryLabel = sale.deliveryType === 'delivery' ? '<span class="text-blue-600">Delivery</span>' : '<span class="text-gray-500">Retiro</span>';
        const payLabel = sale.paymentMethod === 'transferencia' ? '<span class="text-purple-600">Transfer.</span>' : '<span class="text-green-600">Efectivo</span>';
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm font-bold text-gray-700">#${sale.orderId}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${date}</td>
                <td class="px-4 py-3 text-sm text-gray-800 font-medium">${esc(sale.customerName) || '—'}</td>
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
        const date = new Date(sale.date).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
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
                <p class="font-medium text-gray-700">${esc(sale.customerName) || '—'}</p>
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
                        <div>
                            <div class="flex items-center justify-between mb-2">
                                <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Items del pedido</label>
                                <p id="saleSubtotalCalc" class="text-xs text-gray-400">Subtotal: $0</p>
                            </div>
                            <div id="saleItemsList" class="space-y-2 mb-3"></div>
                            <div class="flex gap-2">
                                <div class="flex-1 relative">
                                    <input id="saleProductSearch" type="text" placeholder="Buscar producto para agregar..."
                                        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary">
                                    <div id="saleProductDropdown" class="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 hidden max-h-40 overflow-y-auto"></div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Notas</label>
                            <textarea id="saleNotes" rows="2" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary resize-none" placeholder="Observaciones del pedido..."></textarea>
                        </div>
                        <div>
                            <button id="toggleChangelog" class="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 font-semibold uppercase tracking-wide">
                                <i class="fas fa-chevron-right text-[10px] transition-transform" id="changelogChevron"></i>
                                Historial de cambios
                            </button>
                            <div id="changelogContent" class="hidden mt-2 space-y-1 border-l-2 border-gray-100 pl-3"></div>
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
                    <p class="text-sm font-medium text-gray-800 truncate">${esc(item.productName)}</p>
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
        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this._activeTab = btn.dataset.tab;
                document.querySelectorAll('.tab-btn').forEach(b => {
                    const active = b.dataset.tab === this._activeTab;
                    b.classList.toggle('border-primary', active);
                    b.classList.toggle('text-primary', active);
                    b.classList.toggle('border-transparent', !active);
                    b.classList.toggle('text-gray-500', !active);
                });
                const content = document.getElementById('sales-tab-content');
                if (content) content.innerHTML = this._activeTab === 'pedidos' ? this._renderPedidosTab() : this._renderReportesTab();
                this._attachTabEvents();
            });
        });

        this._attachTabEvents();
    }

    _attachTabEvents() {
        if (this._activeTab === 'pedidos') {
            this._attachPedidosEvents();
        } else {
            this._attachReportesEvents();
        }
        this._attachModalEvents();
    }

    _attachPedidosEvents() {
        document.querySelectorAll('.sale-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => this._openEdit(btn.dataset.id));
        });
        document.querySelectorAll('.sale-delete-btn').forEach(btn => {
            btn.addEventListener('click', () => this._confirmDelete(btn.dataset.id, btn.dataset.order));
        });
    }

    _attachReportesEvents() {
        // Abortar listeners previos para no acumularlos
        if (this._reportesAbort) this._reportesAbort.abort();
        this._reportesAbort = new AbortController();
        const signal = this._reportesAbort.signal;

        const container = document.getElementById('reportes-container');
        if (!container) return;

        // Un solo listener de click en el container (event delegation)
        container.addEventListener('click', (e) => {
            const periodBtn = e.target.closest('.report-period-btn');
            if (periodBtn) { this._reportPeriod = periodBtn.dataset.period; this._refreshReportes(); return; }
            if (e.target.closest('#report-prev'))           { this._navigateDate(-1); this._refreshReportes(); return; }
            if (e.target.closest('#report-next'))           { this._navigateDate(1);  this._refreshReportes(); return; }
            if (e.target.closest('#report-clear-filters'))  { this._reportCategory = ''; this._reportProduct = ''; this._refreshReportes(); return; }
        }, { signal });

        // Un solo listener de change para los selects
        container.addEventListener('change', (e) => {
            if (e.target.id === 'report-filter-category') {
                this._reportCategory = e.target.value;
                this._reportProduct = '';
                this._refreshReportes();
            } else if (e.target.id === 'report-filter-product') {
                this._reportProduct = e.target.value;
                this._refreshReportes();
            }
        }, { signal });
    }

    _attachModalEvents() {
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
        document.getElementById('toggleChangelog')?.addEventListener('click', () => {
            document.getElementById('changelogContent')?.classList.toggle('hidden');
            document.getElementById('changelogChevron')?.classList.toggle('rotate-90');
        });

        const searchInput = document.getElementById('saleProductSearch');
        const dropdown = document.getElementById('saleProductDropdown');
        if (searchInput && dropdown) {
            searchInput.addEventListener('input', () => {
                const q = searchInput.value.trim().toLowerCase();
                if (!q) { dropdown.classList.add('hidden'); return; }
                const matches = this._allProducts.filter(p => p.name.toLowerCase().includes(q)).slice(0, 8);
                if (!matches.length) { dropdown.classList.add('hidden'); return; }
                dropdown.innerHTML = matches.map(p => `
                    <button class="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-0" data-pid="${p.id}" data-pname="${esc(p.name)}" data-pprice="${p.price}">
                        ${esc(p.name)} — $${p.price.toLocaleString()}
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

        const changelogContent = document.getElementById('changelogContent');
        if (changelogContent) {
            changelogContent.innerHTML = sale.changelog?.length
                ? [...sale.changelog].reverse().map(entry => {
                    const d = new Date(entry.date).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
                    return `<p class="text-xs text-gray-500"><span class="text-gray-400">${d}</span> — ${esc(entry.description)}</p>`;
                }).join('')
                : '<p class="text-xs text-gray-400 italic">Sin cambios registrados</p>';
        }

        this._renderItemsList();
        document.getElementById('saleModal').classList.remove('hidden');
    }

    _renderItemsList() {
        const list = document.getElementById('saleItemsList');
        if (!list) return;
        list.innerHTML = this._editingItems.map((item, i) => this._renderItemRow(item, i)).join('');
        this._updateSubtotal();

        list.querySelectorAll('.sale-item-qty').forEach(input => {
            input.addEventListener('input', () => {
                this._editingItems[parseInt(input.dataset.index)].quantity = parseInt(input.value) || 0;
                this._updateSubtotal();
            });
        });
        list.querySelectorAll('.sale-item-price').forEach(input => {
            input.addEventListener('input', () => {
                this._editingItems[parseInt(input.dataset.index)].unitPrice = parseFloat(input.value) || 0;
                this._updateSubtotal();
            });
        });
        list.querySelectorAll('.sale-item-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                this._editingItems.splice(parseInt(btn.dataset.index), 1);
                this._renderItemsList();
            });
        });
    }

    _addItem(item) {
        const existing = this._editingItems.find(i => i.productId === item.productId);
        if (existing) { existing.quantity++; } else { this._editingItems.push(item); }
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
        btn.disabled = true; btn.textContent = 'Guardando...';

        const payload = {
            customerName: document.getElementById('saleCustomerName').value.trim(),
            total: parseFloat(document.getElementById('saleTotal').value) || 0,
            notes: document.getElementById('saleNotes').value.trim(),
            items: this._editingItems,
            changeDescription: this._detectChanges() || 'Venta editada desde el panel admin'
        };

        const res = await this.apiClient.fetchWithAuth(`/sales/${this._editingSale._id}`, {
            method: 'PUT', body: JSON.stringify(payload)
        });

        btn.disabled = false; btn.textContent = 'Guardar cambios';

        if (res?.success) {
            this.notify.show('Venta actualizada', 'Los cambios se guardaron correctamente', 'success');
            document.getElementById('saleModal').classList.add('hidden');
            const idx = this._sales.findIndex(s => s._id === this._editingSale._id);
            if (idx !== -1) this._sales[idx] = res.data;
            this._editingSale = null; this._editingItems = [];
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
        if (oldIds !== newIds) { parts.push('items modificados'); }
        else {
            for (const newItem of this._editingItems) {
                const oldItem = old.items.find(i => i.productId === newItem.productId);
                if (oldItem && oldItem.quantity !== newItem.quantity) parts.push(`${newItem.productName}: ${oldItem.quantity} → ${newItem.quantity}`);
            }
        }
        return parts.join('; ');
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
        if (tbody) tbody.innerHTML = this._sales.length ? this._sales.map(s => this._renderRow(s)).join('') : `<tr><td colspan="8" class="px-4 py-12 text-center text-gray-400"><i class="fas fa-receipt text-4xl mb-3 block"></i>Todavía no hay ventas registradas</td></tr>`;
        if (cards) cards.innerHTML = this._sales.length ? this._sales.map(s => this._renderCard(s)).join('') : `<div class="py-12 text-center text-gray-400"><i class="fas fa-receipt text-4xl mb-3 block"></i>Todavía no hay ventas registradas</div>`;
        this._attachPedidosEvents();
    }
}
