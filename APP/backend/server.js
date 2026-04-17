// server.js - Servidor API REST para Una Cucharita Más
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors({
    origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://127.0.0.1:5500'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${req.method} ${req.url}`);
    next();
});

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Importar rutas
const productRoutes = require('./src/routes/products');
const configRoutes = require('./src/routes/config');
const authRoutes = require('./src/routes/auth');

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/config', configRoutes);

// Ruta de salud básica
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true,
        status: 'OK', 
        message: 'Backend funcionando correctamente',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    console.error('Error no manejado:', err);
    
    // Error de JSON malformado
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            error: 'JSON malformado',
            message: 'Por favor verifica la sintaxis del JSON enviado'
        });
    }
    
    // Error genérico
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
    });
});

// Ruta 404 para APIs
app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        success: false,
        error: 'Endpoint no encontrado'
    });
});

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
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            console.error('❌ MONGODB_URI no configurado en .env');
            process.exit(1);
        }

        await mongoose.connect(mongoUri);
        console.log('✅ Conectado a MongoDB Atlas');

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
        console.error('❌ Error al conectar a MongoDB:', error.message);
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