const mongoose = require('mongoose');

const adminUserSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, default: '' },
    role: { type: String, default: 'admin' },
    active: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('AdminUser', adminUserSchema);
