export class CartManager {
    constructor() {
        this.cart = [];
        this.updateUICallback = null;
    }

    setUpdateUICallback(callback) {
        this.updateUICallback = callback;
    }

    addItem(product) {
        const existing = this.cart.find(item => item.id === product.id);
        if (existing) {
            existing.quantity++;
        } else {
            this.cart.push({ ...product, quantity: 1 });
        }
        this.triggerUIUpdate();
    }

    updateQuantity(id, delta) {
        const item = this.cart.find(i => i.id === id);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                this.cart = this.cart.filter(i => i.id !== id);
            }
            this.triggerUIUpdate();
        }
    }

    removeItem(id) {
        this.cart = this.cart.filter(i => i.id !== id);
        this.triggerUIUpdate();
    }

    clearCart() {
        this.cart = [];
        this.triggerUIUpdate();
    }

    getCart() {
        return this.cart;
    }

    getTotal() {
        return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    getItemCount() {
        return this.cart.reduce((sum, item) => sum + item.quantity, 0);
    }

    isEmpty() {
        return this.cart.length === 0;
    }

    triggerUIUpdate() {
        if (this.updateUICallback) {
            this.updateUICallback();
        }
    }
}