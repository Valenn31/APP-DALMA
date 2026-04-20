/**
 * ProductsSection - Gestión completa de productos (CRUD, templates, filtros)
 */
export class ProductsSection {
    constructor(apiClient, notificationManager) {
        this.apiClient = apiClient;
        this.notify = notificationManager;
    }

    // --- Rendering ---

    async render() {
        const productsResponse = await this.apiClient.fetchWithAuth('/products?includeInactive=true');
        const products = productsResponse?.data || [];

        return `
            <div class="space-y-4 sm:space-y-6">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                    <div>
                        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Gestión de Productos</h1>
                        <p class="text-gray-600 mt-1 text-sm sm:text-base">Administra tu catálogo de productos</p>
                    </div>
                    <button id="addProductBtn" class="bg-primary text-white px-4 py-3 sm:px-6 sm:py-2 rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center space-x-2 touch-button w-full sm:w-auto">
                        <i class="fas fa-plus text-sm"></i>
                        <span class="font-medium">Agregar Producto</span>
                    </button>
                </div>
                
                ${this._renderFilters()}
                
                <div class="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div class="p-4 sm:p-6 border-b border-gray-200">
                        <h2 class="text-lg font-semibold text-gray-900">Lista de Productos (${products.length})</h2>
                    </div>
                    
                    <div class="hidden md:block overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="productsTableBody" class="bg-white divide-y divide-gray-200">
                                ${this._renderRows(products)}
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="md:hidden" id="productsCardsContainer">
                        ${this._renderCards(products)}
                    </div>
                </div>
            </div>
            
            ${this._renderModal()}
        `;
    }

    _renderFilters() {
        return `
            <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div class="space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
                    <div class="w-full sm:flex-1 sm:max-w-md">
                        <div class="relative">
                            <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                            <input type="text" id="searchProducts" placeholder="Buscar productos..." 
                                   class="w-full pl-10 pr-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-base">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3 sm:flex sm:space-x-3">
                        <select id="filterCategory" class="px-3 py-3 sm:px-4 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-base">
                            <option value="">Todas las categorías</option>
                            <option value="postres">Postres</option>
                            <option value="chocolates">Chocolates</option>
                        </select>
                        <select id="filterStatus" class="px-3 py-3 sm:px-4 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-base">
                            <option value="">Todos los estados</option>
                            <option value="true">Activos</option>
                            <option value="false">Inactivos</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    }

    _renderRows(products) {
        if (products.length === 0) {
            return `<tr><td colspan="6" class="px-6 py-12 text-center text-gray-500">
                <div class="flex flex-col items-center">
                    <i class="fas fa-birthday-cake text-4xl text-gray-300 mb-4"></i>
                    <p class="text-lg font-medium">No hay productos registrados</p>
                    <p class="text-sm">¡Agrega tu primer producto para comenzar!</p>
                </div>
            </td></tr>`;
        }

        return products.map(p => `
            <tr class="hover:bg-gray-50 product-row" data-id="${p.id}">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-12 w-12">
                            ${p.image ? 
                                `<img class="h-12 w-12 rounded-lg object-cover" src="${this._escapeHtml(p.image)}" alt="${this._escapeHtml(p.name)}">` :
                                `<div class="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center"><i class="fas fa-birthday-cake text-gray-400"></i></div>`}
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${this._escapeHtml(p.name)}</div>
                            ${p.sku ? `<div class="text-sm text-gray-500">SKU: ${this._escapeHtml(p.sku)}</div>` : ''}
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">${this._escapeHtml(p.category || 'Sin categoría')}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$${(p.price || 0).toFixed(2)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div class="flex items-center">
                        <span class="${this._stockColorClass(p)}">${p.stock || 0}</span>
                        ${p.minStock ? `<span class="text-xs text-gray-500 ml-1">(Min: ${p.minStock})</span>` : ''}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${p.active ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <button onclick="adminApp.editProduct(${p.id})" class="text-indigo-600 hover:text-indigo-900" title="Editar"><i class="fas fa-edit"></i></button>
                        <button onclick="adminApp.toggleProductStatus(${p.id})" class="text-yellow-600 hover:text-yellow-900" title="${p.active ? 'Desactivar' : 'Activar'}"><i class="fas fa-${p.active ? 'eye-slash' : 'eye'}"></i></button>
                        <button onclick="adminApp.deleteProduct(${p.id})" class="text-red-600 hover:text-red-900" title="Eliminar"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    _renderCards(products) {
        if (products.length === 0) {
            return `<div class="p-8 text-center text-gray-500">
                <div class="flex flex-col items-center">
                    <i class="fas fa-birthday-cake text-4xl text-gray-300 mb-4"></i>
                    <p class="text-lg font-medium">No hay productos registrados</p>
                    <p class="text-sm">¡Agrega tu primer producto para comenzar!</p>
                </div>
            </div>`;
        }

        return `<div class="space-y-3 p-4">${products.map(p => `
            <div class="bg-white border border-gray-200 rounded-lg p-4 product-card" data-id="${p.id}">
                <div class="flex items-start space-x-4">
                    <div class="flex-shrink-0">
                        ${p.image ? 
                            `<img class="h-16 w-16 rounded-lg object-cover" src="${this._escapeHtml(p.image)}" alt="${this._escapeHtml(p.name)}">` :
                            `<div class="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center"><i class="fas fa-birthday-cake text-gray-400 text-xl"></i></div>`}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-start justify-between">
                            <div class="flex-1">
                                <h3 class="text-base font-medium text-gray-900 truncate">${this._escapeHtml(p.name)}</h3>
                                ${p.sku ? `<p class="text-sm text-gray-500">SKU: ${this._escapeHtml(p.sku)}</p>` : ''}
                                <div class="flex flex-wrap gap-2 mt-2">
                                    <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">${this._escapeHtml(p.category || 'Sin categoría')}</span>
                                    <span class="px-2 py-1 text-xs font-medium rounded-full ${p.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${p.active ? 'Activo' : 'Inactivo'}</span>
                                </div>
                                <div class="flex items-center justify-between mt-3">
                                    <div class="text-lg font-bold text-gray-900">$${(p.price || 0).toFixed(2)}</div>
                                    <div class="text-right">
                                        <div class="text-sm text-gray-500">Stock</div>
                                        <div class="${this._stockColorClass(p)} font-semibold">
                                            ${p.stock || 0}
                                            ${p.minStock ? `<span class="text-xs text-gray-500 ml-1">(Min: ${p.minStock})</span>` : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="flex space-x-2 mt-4">
                            <button onclick="adminApp.editProduct(${p.id})" class="flex-1 bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors touch-button flex items-center justify-center space-x-1">
                                <i class="fas fa-edit text-xs"></i><span>Editar</span>
                            </button>
                            <button onclick="adminApp.toggleProductStatus(${p.id})" class="flex-1 bg-yellow-50 text-yellow-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-yellow-100 transition-colors touch-button flex items-center justify-center space-x-1">
                                <i class="fas fa-${p.active ? 'eye-slash' : 'eye'} text-xs"></i><span>${p.active ? 'Ocultar' : 'Mostrar'}</span>
                            </button>
                            <button onclick="adminApp.deleteProduct(${p.id})" class="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors touch-button flex items-center justify-center">
                                <i class="fas fa-trash text-xs"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('')}</div>`;
    }

    _renderModal() {
        return `
            <div id="productModal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50 flex items-center justify-center p-4">
                <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
                    <div class="p-4 sm:p-6 border-b border-gray-200">
                        <div class="flex items-center justify-between">
                            <h3 id="modalTitle" class="text-lg sm:text-xl font-bold text-gray-900">Agregar Producto</h3>
                            <button id="closeModal" class="text-gray-400 hover:text-gray-600 p-2 touch-button"><i class="fas fa-times text-xl"></i></button>
                        </div>
                    </div>
                    <form id="productForm" class="p-4 sm:p-6 space-y-4">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">Nombre *</label><input type="text" id="productName" name="name" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">SKU</label><input type="text" id="productSku" name="sku" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">Categoría *</label>
                                <select id="productCategory" name="category" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary">
                                    <option value="">Seleccionar categoría</option>
                                    <option value="postres">Postres</option><option value="chocolates">Chocolates</option>
                                </select>
                            </div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">Precio *</label><input type="number" id="productPrice" name="price" step="0.01" min="0" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">Stock Inicial</label><input type="number" id="productStock" name="stock" min="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"></div>
                            <div><label class="block text-sm font-medium text-gray-700 mb-2">Stock Mínimo</label><input type="number" id="productMinStock" name="minStock" min="0" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"></div>
                        </div>
                        <div><label class="block text-sm font-medium text-gray-700 mb-2">Descripción *</label><textarea id="productDescription" name="description" rows="3" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"></textarea></div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">URL o Ruta de Imagen</label>
                            <input type="text" id="productImage" name="image" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" placeholder="Ej: https://... o assets/img/postres/archivo.jpg">
                            <p class="text-xs text-gray-500 mt-1">Puedes pegar una URL completa o subir una imagen y se completará automáticamente.</p>
                            <div id="imagePreview" class="mt-2 hidden"><img id="imagePreviewImg" class="h-24 w-24 rounded-lg object-cover border border-gray-200" alt="Vista previa"></div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">O subir imagen</label>
                            <input type="file" id="imageInput" name="image" accept="image/*" class="mb-2">
                            <button type="button" id="uploadImageBtn" class="bg-primary text-white px-3 py-1 rounded hover:bg-opacity-90">Subir Imagen</button>
                            <div id="imageUploadResult" class="mt-2 text-sm"></div>
                        </div>
                        <div class="flex items-center"><input type="checkbox" id="productActive" name="active" class="mr-2"><label for="productActive" class="text-sm text-gray-700">Producto activo</label></div>
                        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                            <button type="button" id="cancelModal" class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancelar</button>
                            <button type="submit" id="saveProductBtn" class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90">
                                <span id="saveButtonText">Guardar</span>
                                <div id="saveLoader" class="hidden inline-block ml-2"><div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div></div>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    // --- Imagen Upload Logic ---
    setupImageUpload() {
        const uploadBtn = document.getElementById('uploadImageBtn');
        if (!uploadBtn) return;
        uploadBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('imageInput');
            const resultDiv = document.getElementById('imageUploadResult');
            if (!fileInput.files.length) {
                resultDiv.textContent = 'Selecciona un archivo primero.';
                return;
            }
            const formData = new FormData();
            formData.append('image', fileInput.files[0]);
            resultDiv.textContent = 'Subiendo...';
            try {
                const res = await fetch('/api/images/upload', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (data.success) {
                    resultDiv.innerHTML = 'Imagen subida: <code>' + data.imageUrl + '</code><br><img src="/' + data.imageUrl + '" width="100">';
                    // Poner la URL devuelta en el campo de imagen
                    document.getElementById('productImage').value = data.imageUrl;
                    this._updateImagePreview(data.imageUrl);
                } else {
                    resultDiv.textContent = 'Error: ' + data.message;
                }
            } catch (err) {
                resultDiv.textContent = 'Error al subir la imagen.';
            }
        });
    }

    // --- CRUD Operations ---

    showModal(product = null) {
        const modal = document.getElementById('productModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('productForm');
        
        if (product) {
            title.textContent = 'Editar Producto';
            this._fillForm(product);
            form.setAttribute('data-product-id', product.id);
        } else {
            title.textContent = 'Agregar Producto';
            form.reset();
            form.removeAttribute('data-product-id');
            document.getElementById('productActive').checked = true;
        }
        
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // Inicializar lógica de subida de imagen
        setTimeout(() => this.setupImageUpload(), 100);
    }

    hideModal() {
        document.getElementById('productModal').classList.add('hidden');
        document.body.style.overflow = 'auto';
        document.getElementById('productForm').reset();
        this._updateImagePreview('');
    }

    _fillForm(product) {
        document.getElementById('productName').value = product.name || '';
        document.getElementById('productSku').value = product.sku || '';
        document.getElementById('productCategory').value = product.category || '';
        document.getElementById('productPrice').value = product.price != null ? product.price : '';
        document.getElementById('productStock').value = product.stock != null ? product.stock : '';
        document.getElementById('productMinStock').value = product.minStock != null ? product.minStock : '';
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productImage').value = product.image || '';
        document.getElementById('productActive').checked = product.active !== false;
        this._updateImagePreview(product.image || '');
    }

    async save() {
        const form = document.getElementById('productForm');
        const productId = form.getAttribute('data-product-id');
        const isEditing = !!productId;
        
        const stockVal = document.getElementById('productStock').value;
        const minStockVal = document.getElementById('productMinStock').value;
        
        const productData = {
            name: document.getElementById('productName').value.trim(),
            sku: document.getElementById('productSku').value.trim(),
            category: document.getElementById('productCategory').value,
            price: parseFloat(document.getElementById('productPrice').value),
            stock: stockVal !== '' ? parseInt(stockVal) : 0,
            minStock: minStockVal !== '' ? parseInt(minStockVal) : 0,
            description: document.getElementById('productDescription').value.trim(),
            image: document.getElementById('productImage').value.trim(),
            active: document.getElementById('productActive').checked
        };
        
        if (!productData.name || !productData.category || !productData.price || !productData.description) {
            this.notify.show('Error', 'Por favor complete todos los campos requeridos (nombre, categoría, precio, descripción)', 'error');
            return;
        }
        
        this._setSaveLoading(true);
        this._setFormDisabled(true);
        
        try {
            const endpoint = isEditing ? `/products/${productId}` : '/products';
            const method = isEditing ? 'PUT' : 'POST';
            
            const response = await this.apiClient.fetchWithAuth(endpoint, {
                method,
                body: JSON.stringify(productData)
            });
            
            if (response?.success) {
                this.notify.show('Éxito', `Producto ${isEditing ? 'actualizado' : 'creado'} correctamente`, 'success');
                this.hideModal();
                return true;
            } else {
                const errorMsg = response?.details?.length
                    ? response.details.join(', ')
                    : (response?.error || `Error al ${isEditing ? 'actualizar' : 'crear'} producto`);
                this.notify.show('Error', errorMsg, 'error');
                return false;
            }
        } catch (error) {
            console.error('Error guardando producto:', error);
            this.notify.show('Error', 'Error de conexión', 'error');
            return false;
        } finally {
            this._setSaveLoading(false);
            this._setFormDisabled(false);
        }
    }

    async edit(productId) {
        try {
            const response = await this.apiClient.fetchWithAuth(`/products/${productId}`);
            if (response?.success) {
                this.showModal(response.data);
            } else {
                this.notify.show('Error', 'No se pudo cargar el producto', 'error');
            }
        } catch (error) {
            console.error('Error cargando producto:', error);
            this.notify.show('Error', 'Error de conexión', 'error');
        }
    }

    async toggleStatus(productId) {
        try {
            const response = await this.apiClient.fetchWithAuth(`/products/${productId}`);
            if (response?.success) {
                const product = response.data;
                const updateResponse = await this.apiClient.fetchWithAuth(`/products/${productId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ ...product, active: !product.active })
                });
                
                if (updateResponse?.success) {
                    this.notify.show('Éxito', `Producto ${!product.active ? 'activado' : 'desactivado'} correctamente`, 'success');
                    return true;
                } else {
                    this.notify.show('Error', 'No se pudo actualizar el estado', 'error');
                }
            }
        } catch (error) {
            console.error('Error cambiando estado:', error);
            this.notify.show('Error', 'Error de conexión', 'error');
        }
        return false;
    }

    async delete(productId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.')) {
            return false;
        }
        
        try {
            const response = await this.apiClient.fetchWithAuth(`/products/${productId}?permanent=true`, { method: 'DELETE' });
            if (response?.success) {
                this.notify.show('Éxito', 'Producto eliminado correctamente', 'success');
                return true;
            } else {
                this.notify.show('Error', response?.error || 'No se pudo eliminar el producto', 'error');
            }
        } catch (error) {
            console.error('Error eliminando producto:', error);
            this.notify.show('Error', 'Error de conexión', 'error');
        }
        return false;
    }

    // --- Filtering ---

    filterProducts() {
        const searchTerm = document.getElementById('searchProducts')?.value.toLowerCase() || '';
        const categoryFilter = document.getElementById('filterCategory')?.value || '';
        const statusFilter = document.getElementById('filterStatus')?.value || '';
        
        // Filter table rows (desktop)
        document.querySelectorAll('.product-row').forEach(row => {
            const name = row.querySelector('.text-sm.font-medium')?.textContent.toLowerCase() || '';
            const category = row.querySelector('.rounded-full')?.textContent.toLowerCase() || '';
            const isActive = row.querySelector('.bg-green-100') !== null;
            
            let show = true;
            if (searchTerm && !name.includes(searchTerm)) show = false;
            if (categoryFilter && !category.includes(categoryFilter)) show = false;
            if (statusFilter && (statusFilter === 'true') !== isActive) show = false;
            
            row.style.display = show ? '' : 'none';
        });
        
        // Filter cards (mobile)
        document.querySelectorAll('.product-card').forEach(card => {
            const name = card.querySelector('.text-base.font-medium')?.textContent.toLowerCase() || '';
            const category = card.querySelector('.bg-blue-100')?.textContent.toLowerCase() || '';
            const isActive = card.querySelector('.bg-green-100') !== null;
            
            let show = true;
            if (searchTerm && !name.includes(searchTerm)) show = false;
            if (categoryFilter && !category.includes(categoryFilter)) show = false;
            if (statusFilter && (statusFilter === 'true') !== isActive) show = false;
            
            card.style.display = show ? '' : 'none';
        });
    }

    // --- Section initialization ---

    initializeEvents() {
        const addBtn = document.getElementById('addProductBtn');
        if (addBtn) addBtn.addEventListener('click', () => this.showModal());
        
        const closeModal = document.getElementById('closeModal');
        const cancelModal = document.getElementById('cancelModal');
        if (closeModal) closeModal.addEventListener('click', () => this.hideModal());
        if (cancelModal) cancelModal.addEventListener('click', () => this.hideModal());
        
        const form = document.getElementById('productForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const success = await this.save();
                if (success) window.dispatchEvent(new CustomEvent('products:refresh'));
            });
        }
        
        const searchInput = document.getElementById('searchProducts');
        const categoryFilter = document.getElementById('filterCategory');
        const statusFilter = document.getElementById('filterStatus');
        if (searchInput) searchInput.addEventListener('input', () => this.filterProducts());
        if (categoryFilter) categoryFilter.addEventListener('change', () => this.filterProducts());
        if (statusFilter) statusFilter.addEventListener('change', () => this.filterProducts());
        
        const imageInput = document.getElementById('productImage');
        if (imageInput) imageInput.addEventListener('input', (e) => this._updateImagePreview(e.target.value));
        
        const modalEl = document.getElementById('productModal');
        if (modalEl) {
            modalEl.addEventListener('click', (e) => {
                if (e.target === modalEl) this.hideModal();
            });
        }
    }

    // --- Helpers ---

    _stockColorClass(product) {
        const stock = product.stock || 0;
        const minStock = product.minStock || 5;
        if (stock === 0) return 'text-red-600 font-bold';
        if (stock <= minStock) return 'text-yellow-600 font-semibold';
        return 'text-green-600';
    }

    _setSaveLoading(loading) {
        const button = document.getElementById('saveProductBtn');
        const text = document.getElementById('saveButtonText');
        const loader = document.getElementById('saveLoader');
        if (loading) {
            button.disabled = true;
            text.textContent = 'Guardando...';
            loader.classList.remove('hidden');
        } else {
            button.disabled = false;
            text.textContent = 'Guardar';
            loader.classList.add('hidden');
        }
    }

    _setFormDisabled(disabled) {
        const form = document.getElementById('productForm');
        if (!form) return;
        form.querySelectorAll('input, select, textarea').forEach(el => {
            el.disabled = disabled;
        });
    }

    _updateImagePreview(url) {
        const preview = document.getElementById('imagePreview');
        const img = document.getElementById('imagePreviewImg');
        if (!preview || !img) return;
        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
            img.src = url;
            img.onerror = () => preview.classList.add('hidden');
            img.onload = () => preview.classList.remove('hidden');
        } else {
            preview.classList.add('hidden');
        }
    }

    _escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}
