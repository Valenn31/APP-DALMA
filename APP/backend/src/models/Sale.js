const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
    productId: { type: Number, required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    unitCost: { type: Number, default: 0 }
}, { _id: false });

const changelogEntrySchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    description: { type: String, required: true }
}, { _id: false });

const saleSchema = new mongoose.Schema({
    orderId: { type: Number, required: true, unique: true },
    date: { type: Date, default: Date.now },
    customerName: { type: String, default: '' },
    items: { type: [saleItemSchema], default: [] },
    deliveryType: { type: String, default: 'retiro' },
    deliveryAddress: { type: String, default: '' },
    paymentMethod: { type: String, default: 'efectivo' },
    shippingCost: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    changelog: { type: [changelogEntrySchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);
