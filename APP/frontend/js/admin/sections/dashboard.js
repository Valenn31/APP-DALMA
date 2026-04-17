/**
 * DashboardSection - Genera el contenido del dashboard
 */
export class DashboardSection {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }

    async render() {
        const stats = await this.apiClient.fetchWithAuth('/products/stats');
        const s = stats?.data || {};

        return `
            <div class="space-y-6">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
                        <p class="text-gray-600 mt-1">Resumen general de Una Cucharita Más</p>
                    </div>
                    <div class="text-sm text-gray-500">
                        Última actualización: ${new Date().toLocaleString('es-ES')}
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    ${this._statCard('fas fa-birthday-cake', 'blue', 'Total Productos', s.totalProducts || 0)}
                    ${this._statCard('fas fa-check-circle', 'green', 'Productos Activos', s.activeProducts || 0)}
                    ${this._statCard('fas fa-exclamation-triangle', 'yellow', 'Stock Bajo', s.lowStockCount || 0)}
                    ${this._statCard('fas fa-times-circle', 'red', 'Sin Stock', s.outOfStockCount || 0)}
                </div>
                
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        ${this._quickAction('fas fa-plus-circle', 'Agregar Producto', 'Crear un nuevo producto', 'products')}
                        ${this._quickAction('fas fa-boxes', 'Gestionar Stock', 'Actualizar inventario', 'stock')}
                        ${this._quickAction('fas fa-cog', 'Configuración', 'Ajustes de la tienda', 'config')}
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">Actividad Reciente</h2>
                    <div class="space-y-3">
                        <div class="flex items-center space-x-3 text-sm">
                            <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span class="text-gray-600">Sistema iniciado correctamente</span>
                            <span class="text-gray-400 ml-auto">${new Date().toLocaleTimeString('es-ES')}</span>
                        </div>
                        <div class="flex items-center space-x-3 text-sm">
                            <div class="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span class="text-gray-600">Panel administrativo cargado</span>
                            <span class="text-gray-400 ml-auto">${new Date().toLocaleTimeString('es-ES')}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    _statCard(icon, color, label, value) {
        return `
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div class="flex items-center">
                    <div class="bg-${color}-100 p-3 rounded-lg">
                        <i class="${icon} text-${color}-600 text-xl"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-600">${label}</p>
                        <p class="text-2xl font-bold text-gray-900">${value}</p>
                    </div>
                </div>
            </div>
        `;
    }

    _quickAction(icon, title, desc, section) {
        return `
            <button class="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left" onclick="adminApp.navigateToSection('${section}')">
                <div class="flex items-center space-x-3">
                    <i class="${icon} text-primary text-xl"></i>
                    <div>
                        <p class="font-medium text-gray-900">${title}</p>
                        <p class="text-sm text-gray-600">${desc}</p>
                    </div>
                </div>
            </button>
        `;
    }
}
