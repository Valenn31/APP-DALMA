export class ProductManager {
    constructor() {
        this.products = [];
        this.config = {};
    }

    async loadProducts() {
        try {
            const response = await fetch('./data/products.json');
            const data = await response.json();
            this.products = data.products;
            this.config = data.config;
            return true;
        } catch (error) {
            console.error('Error loading products:', error);
            return false;
        }
    }

    getByCategory(category) {
        return this.products.filter(p => p.category === category);
    }

    getById(id) {
        return this.products.find(p => p.id === id);
    }

    getAllProducts() {
        return this.products;
    }

    getConfig() {
        return this.config;
    }
}