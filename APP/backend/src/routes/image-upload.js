const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configuración de almacenamiento para multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Calcular la raíz del proyecto y guardar en frontend/assets/img/postres
    // Guardar en la carpeta del frontend real (no dentro de backend)
    const dest = path.join(__dirname, '../../../frontend/assets/img/postres');
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

// Endpoint para subir imagen
router.post('/upload', (req, res, next) => {
  console.log('Entrando a POST /api/images/upload');
  next();
}, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No se subió ningún archivo.' });
  }
  // Log ruta absoluta y relativa
  console.log('Imagen guardada en:', req.file.path);
  // Ruta relativa para guardar en el producto
  const relativePath = `assets/img/postres/${req.file.filename}`;
  res.json({ success: true, imageUrl: relativePath });
});

module.exports = router;
