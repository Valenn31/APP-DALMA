/**
 * Script de seed - Importa datos desde products.json a MongoDB
 * Uso: node seed.js
 * Requiere MONGODB_URI en .env
 */
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Product = require('./src/models/Product');
const Config = require('./src/models/Config');
const AdminUser = require('./src/models/AdminUser');
const bcrypt = require('bcryptjs');

async function seed() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('❌ MONGODB_URI no configurado en .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(mongoUri);
        console.log('✅ Conectado a MongoDB');

        // Leer datos del JSON existente
        const jsonPath = path.join(__dirname, '../frontend/data/products.json');
        const rawData = fs.readFileSync(jsonPath, 'utf8');
        const data = JSON.parse(rawData);

        // --- Productos ---
        const existingProducts = await Product.countDocuments();
        if (existingProducts > 0) {
            console.log(`⚠️ Ya hay ${existingProducts} productos en MongoDB. Limpiando...`);
            await Product.deleteMany({});
        }

        if (data.products && data.products.length > 0) {
            await Product.insertMany(data.products);
            console.log(`✅ ${data.products.length} productos importados`);
        }

        // --- Configuración ---
        await Config.deleteMany({});
        if (data.config) {
            for (const [key, value] of Object.entries(data.config)) {
                await Config.create({ key, value });
            }
            console.log(`✅ Configuración importada (${Object.keys(data.config).length} claves)`);
        }

        // --- Admin user ---
        const existingAdmin = await AdminUser.countDocuments();
        if (existingAdmin === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 12);
            await AdminUser.create({
                id: 1,
                username: 'admin',
                password: hashedPassword,
                email: 'admin@unacucharitamas.com',
                role: 'admin',
                active: true
            });
            console.log('✅ Usuario admin creado (admin / admin123)');
        } else {
            console.log(`⚠️ Ya hay ${existingAdmin} usuario(s) admin, no se creó uno nuevo`);
        }

        console.log('\n🎉 Seed completado exitosamente');
    } catch (error) {
        console.error('❌ Error en seed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Conexión a MongoDB cerrada');
    }
}

seed();
