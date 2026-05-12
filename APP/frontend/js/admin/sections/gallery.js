export class GallerySection {
    constructor(apiClient, notificationManager) {
        this.api = apiClient;
        this.notify = notificationManager;
        this._images = [];
    }

    async render() {
        const data = await this.api.fetchWithAuth('/images');
        this._images = data?.images || [];
        return `
            <div class="space-y-4 sm:space-y-6">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Galería de imágenes</h1>
                        <p class="text-gray-600 mt-1 text-sm sm:text-base">Administrá las imágenes para productos y categorías</p>
                    </div>
                    <label for="galleryUploadInput" id="galleryUploadLabel"
                        class="cursor-pointer bg-primary text-white px-4 py-3 sm:px-6 sm:py-2 rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2 touch-button w-full sm:w-auto select-none">
                        <i class="fas fa-upload text-sm"></i>
                        <span class="font-medium">Subir imagen</span>
                    </label>
                    <input type="file" id="galleryUploadInput" accept="image/*,.heic,.heif" multiple class="hidden">
                </div>
                <div id="galleryGrid" class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                    ${this._renderGrid()}
                </div>
            </div>
        `;
    }

    _renderGrid() {
        if (!this._images.length) {
            return `
                <div class="text-center py-16 text-gray-400">
                    <i class="fas fa-images text-5xl mb-4"></i>
                    <p class="text-lg font-medium">No hay imágenes todavía</p>
                    <p class="text-sm mt-1">Subí una con el botón de arriba</p>
                </div>`;
        }
        return `
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                ${this._images.map(img => `
                    <div class="relative aspect-square rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
                        <img src="${img.url}" alt="" class="w-full h-full object-cover">
                        <button
                            class="delete-img-btn absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-9 h-9 flex items-center justify-center shadow-md transition-colors"
                            data-public-id="${img.publicId}"
                            title="Eliminar imagen">
                            <i class="fas fa-trash text-xs pointer-events-none"></i>
                        </button>
                    </div>
                `).join('')}
            </div>`;
    }

    initializeEvents() {
        document.getElementById('galleryUploadInput')?.addEventListener('change', e => {
            if (e.target.files.length) this._uploadImages(Array.from(e.target.files));
        });

        document.getElementById('galleryGrid')?.addEventListener('click', async e => {
            const btn = e.target.closest('.delete-img-btn');
            if (!btn) return;
            if (!confirm('¿Eliminar esta imagen? Esta acción no se puede deshacer.')) return;
            await this._deleteImage(btn.dataset.publicId);
        });
    }

    async _uploadImages(files) {
        const label = document.getElementById('galleryUploadLabel');
        const plural = files.length > 1 ? `${files.length} imágenes` : '1 imagen';
        if (label) label.innerHTML = `<i class="fas fa-spinner fa-spin text-sm"></i><span class="font-medium">Subiendo ${plural}...</span>`;

        const results = await Promise.all(files.map(file => {
            const formData = new FormData();
            formData.append('image', file);
            return this.api.uploadFile('/images/upload', formData);
        }));

        const failed = results.filter(r => !r?.success).length;
        if (failed === 0) {
            this.notify.show('Listo', `${plural} subida${files.length > 1 ? 's' : ''} correctamente`, 'success');
        } else if (failed < files.length) {
            this.notify.show('Parcial', `${files.length - failed} subidas, ${failed} con error`, 'warning');
        } else {
            this.notify.show('Error', 'No se pudieron subir las imágenes', 'error');
        }
        await this._refresh();
    }

    async _deleteImage(publicId) {
        const data = await this.api.fetchWithAuth(`/images?publicId=${encodeURIComponent(publicId)}`, { method: 'DELETE' });
        if (data?.success) {
            this.notify.show('Imagen eliminada', '', 'success');
        } else {
            this.notify.show('Error', 'No se pudo eliminar la imagen', 'error');
        }
        await this._refresh();
    }

    async _refresh() {
        const res = await this.api.fetchWithAuth('/images');
        this._images = res?.images || [];
        const grid = document.getElementById('galleryGrid');
        if (grid) grid.innerHTML = this._renderGrid();
        const label = document.getElementById('galleryUploadLabel');
        if (label) label.innerHTML = '<i class="fas fa-upload text-sm"></i><span class="font-medium">Subir imagen</span>';
        const input = document.getElementById('galleryUploadInput');
        if (input) input.value = '';
    }
}
