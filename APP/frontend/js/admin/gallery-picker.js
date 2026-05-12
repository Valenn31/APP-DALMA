export class GalleryPicker {
    constructor(apiClient) {
        this.api = apiClient;
        this._onSelect = null;
        this._modalEl = null;
    }

    open(onSelect) {
        this._onSelect = onSelect;
        this._renderModal();
        this._loadImages();
    }

    close() {
        if (this._modalEl) {
            this._modalEl.remove();
            this._modalEl = null;
        }
    }

    _renderModal() {
        this.close();
        const div = document.createElement('div');
        div.id = 'galleryPickerModal';
        div.className = 'fixed inset-0 bg-black bg-opacity-60 z-[100] flex items-center justify-center p-4';
        div.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
                <div class="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                    <h3 class="text-lg font-bold text-gray-900">Seleccionar imagen</h3>
                    <button id="closePickerBtn" class="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                <div id="pickerContent" class="flex-1 overflow-y-auto p-4">
                    <div class="flex items-center justify-center py-12">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(div);
        this._modalEl = div;
        div.addEventListener('click', e => { if (e.target === div) this.close(); });
        div.querySelector('#closePickerBtn').addEventListener('click', () => this.close());
    }

    async _loadImages() {
        const content = document.getElementById('pickerContent');
        if (!content) return;
        try {
            const data = await this.api.fetchWithAuth('/images');
            if (!data?.success) {
                content.innerHTML = `<div class="text-center py-12 text-red-400"><i class="fas fa-exclamation-circle text-3xl mb-2"></i><p>Error al cargar las imágenes</p></div>`;
                return;
            }
            if (!data.images.length) {
                content.innerHTML = `
                    <div class="text-center py-12 text-gray-400">
                        <i class="fas fa-images text-5xl mb-3"></i>
                        <p class="font-medium">No hay imágenes en la galería</p>
                        <p class="text-sm mt-1">Subí una desde la sección Galería del menú</p>
                    </div>`;
                return;
            }
            content.innerHTML = `
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    ${data.images.map(img => `
                        <button type="button"
                            class="picker-img-btn aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-primary focus:border-primary focus:outline-none transition-all shadow-sm hover:shadow-md"
                            data-url="${img.url}">
                            <img src="${img.url}" alt="" class="w-full h-full object-cover hover:opacity-90 transition-opacity">
                        </button>
                    `).join('')}
                </div>`;
            content.querySelectorAll('.picker-img-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (this._onSelect) this._onSelect(btn.dataset.url);
                    this.close();
                });
            });
        } catch {
            content.innerHTML = `<div class="text-center py-12 text-red-400"><i class="fas fa-exclamation-circle text-3xl mb-2"></i><p>Error al cargar las imágenes</p></div>`;
        }
    }
}
