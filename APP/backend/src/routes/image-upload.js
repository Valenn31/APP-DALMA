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

router.get('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const result = await cloudinary.api.resources({
            type: 'upload',
            prefix: 'dalma-products',
            resource_type: 'image',
            max_results: 500
        });
        res.json({
            success: true,
            images: result.resources.map(r => ({
                publicId: r.public_id,
                url: r.secure_url,
                createdAt: r.created_at,
                bytes: r.bytes
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener imágenes.' });
    }
});

router.delete('/', verifyToken, requireAdmin, async (req, res) => {
    try {
        const { publicId } = req.query;
        if (!publicId) return res.status(400).json({ success: false, message: 'Se requiere publicId.' });
        await cloudinary.uploader.destroy(publicId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al eliminar imagen.' });
    }
});

module.exports = router;
