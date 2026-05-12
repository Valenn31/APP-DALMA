const express = require('express');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { verifyToken, requireAdmin } = require('../middleware/auth-middleware');

const router = express.Router();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido. Solo se aceptan imágenes (JPG, PNG, GIF, WEBP).'));
        }
    }
});

router.post('/upload', verifyToken, requireAdmin, (req, res) => {
    upload.single('image')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ success: false, message: 'El archivo supera el límite de 5MB.' });
            }
            return res.status(400).json({ success: false, message: err.message });
        }
        if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No se subió ningún archivo.' });
        }

        const stream = cloudinary.uploader.upload_stream(
            { folder: 'dalma-products' },
            (error, result) => {
                if (error) {
                    return res.status(500).json({ success: false, message: 'Error al subir imagen a Cloudinary.' });
                }
                res.json({ success: true, imageUrl: result.secure_url });
            }
        );
        stream.end(req.file.buffer);
    });
});

module.exports = router;
