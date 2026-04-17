const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, default: '' },
    stock: { type: Number, default: 0 },
    minStock: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    tags: { type: [String], default: [] },
    cost: { type: Number, default: 0 },
    margin: { type: Number, default: 0 },
    sku: { type: String, default: '' },
    weight: { type: Number, default: 0 },
    preparationTime: { type: Number, default: 0 },
    allergens: { type: [String], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
