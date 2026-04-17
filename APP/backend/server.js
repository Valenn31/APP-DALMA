// server.js - Punto de entrada del backend
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas básicas (implementar después)
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Backend funcionando correctamente' });
});

// Rutas de productos (pendientes de implementar)
// app.use('/api/products', require('./src/routes/products'));
// app.use('/api/config', require('./src/routes/config'));
// app.use('/api/orders', require('./src/routes/orders'));

// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Algo salió mal!' });
});

// Ruta 404
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL}`);
});