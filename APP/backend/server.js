// server.js - Servidor local de desarrollo
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const { app, connectDB } = require('./app');

const PORT = process.env.PORT || 3000;

// Servir archivos estáticos del frontend (solo en local)
const express = require('express');
app.use(express.static(path.join(__dirname, '../frontend')));

// Rutas para páginas del frontend (después de API routes)
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

// SPA fallback - todas las demás rutas sirven index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Conectar a MongoDB e iniciar servidor
async function startServer() {
    try {
        await connectDB();

        // Inicializar admin por defecto si no existe
        const { getInstance: getAuthService } = require('./src/services/auth-service');
        await getAuthService().initializeDefaultAdmin();

        app.listen(PORT, () => {
            console.log('🍫 =====================================');
            console.log(`🚀 Una Cucharita Más API - Puerto ${PORT}`);
            console.log(`📱 Entorno: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 URL: http://localhost:${PORT}`);
            console.log(`🔧 Admin: http://localhost:${PORT}/admin`);
            console.log('🍭 =====================================');
        });
    } catch (error) {
        console.error('❌ Error al iniciar servidor:', error.message);
        process.exit(1);
    }
}

startServer();

// Manejar cierre graceful
process.on('SIGINT', async () => {
    console.log('\n🛑 Cerrando servidor...');
    await mongoose.connection.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Señal SIGTERM recibida, cerrando servidor...');
    await mongoose.connection.close();
    process.exit(0);
});