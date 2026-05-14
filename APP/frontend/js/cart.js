export class CartManager {
    constructor() {
        this.cart = [];
        this.updateUICallback = null;
    }

    setUpdateUICallback(callback) {
        this.updateUICallback = callback;
    }

    addItem(product, variant = null) {
        const variantKey = variant?.name ?? null;
        const effectivePrice = (variant?.price != null) ? variant.price : product.price;
        const existing = this.cart.find(i => i.id === product.id && (i.selectedVariant?.name ?? null) === variantKey);
        if (existing) {
            existing.quantity++;
        } else {
            this.cart.push({ ...product, price: effectivePrice, quantity: 1, selectedVariant: variant });
        }
        this.triggerUIUpdate();
    }

    updateQuantity(id, delta, variantName = null) {
        const item = this.cart.find(i => i.id === id && (i.selectedVariant?.name ?? null) === (variantName || null));
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                this.cart = this.cart.filter(i => i !== item);
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

    getQuantityForProduct(id, variantName = null) {
        const item = this.cart.find(
            i => i.id === id && (i.selectedVariant?.name ?? null) === (variantName || null)
        );
        return item ? item.quantity : 0;
    }

    triggerUIUpdate() {
        if (this.updateUICallback) {
            this.updateUICallback();
        }
    }
}