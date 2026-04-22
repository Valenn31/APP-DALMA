// app.js - Express app exportable para Vercel y desarrollo local
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", 'https://cdn.tailwindcss.com', "'unsafe-inline'"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com', 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://cdnjs.cloudflare.com', 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'https://images.unsplash.com', 'blob:'],
            connectSrc: ["'self'", 'https://unacucharitamas.onrender.com'],
        }
    }
}));

// --- CORS ---
const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(s => s.trim())
    : ['http://localhost:3000', 'http://127.0.0.1:5500'];

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- Rutas de la API ---
const productRoutes = require('./src/routes/products');
const configRoutes = require('./src/routes/config');
const authRoutes = require('./src/routes/auth');
const imageUploadRoutes = require('./src/routes/image-upload');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/config', configRoutes);
app.use('/api/images', imageUploadRoutes);

// Ruta de salud
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

    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            success: false,
            error: 'JSON malformado',
            message: 'Por favor verifica la sintaxis del JSON enviado'
        });
    }

    res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
    });
});

// 404 para APIs
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint no encontrado'
    });
});

// --- Conexión a MongoDB con cache para serverless ---
let isConnected = false;

async function connectDB() {
    if (isConnected && mongoose.connection.readyState === 1) {
        return;
    }

    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
        throw new Error('MONGO_URI no configurado');
    }

    await mongoose.connect(mongoUri);
    isConnected = true;
    console.log('✅ Conectado a MongoDB Atlas');
}

module.exports = { app, connectDB };
