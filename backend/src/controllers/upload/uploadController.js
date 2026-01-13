const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiResponse = require('../../utils/response');
const prisma = require('../../services/database');

// Créer les dossiers d'uploads dans le backend s'ils n'existent pas
const userUploadDir = path.join(__dirname, '../../../public/images/users');
const expertUploadDir = path.join(__dirname, '../../../public/images/experts');
const formationUploadDir = path.join(__dirname, '../../../public/images/formations');
if (!fs.existsSync(userUploadDir)) fs.mkdirSync(userUploadDir, { recursive: true });
if (!fs.existsSync(expertUploadDir)) fs.mkdirSync(expertUploadDir, { recursive: true });
if (!fs.existsSync(formationUploadDir)) fs.mkdirSync(formationUploadDir, { recursive: true });

// Configuration de Multer pour le stockage des fichiers
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = req.user.userType === 'expert' ? expertUploadDir : userUploadDir;
        cb(null, uploadPath);
    },
    filename: async (req, file, cb) => {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (user && user.avatar && user.avatar.startsWith('/images/')) {
            const oldPath = path.join(__dirname, '../../../public', user.avatar);
            if (fs.existsSync(oldPath)) {
                fs.unlink(oldPath, (err) => {
                    if (err) console.error("Erreur suppression ancien avatar:", err);
                });
            }
        }
        const extension = path.extname(file.originalname);
        const newFilename = `${req.user.id}${extension}`;
        cb(null, newFilename);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const mimeType = allowedTypes.test(file.mimetype);
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (mimeType && extname) {
            return cb(null, true);
        }
        cb(new Error('Type de fichier non supporté.'));
    }
}).single('avatar');

// Configuration de Multer pour les images de formation
const formationStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, formationUploadDir);
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname);
        const timestamp = Date.now();
        const newFilename = `formation_${req.user.id}_${timestamp}${extension}`;
        cb(null, newFilename);
    }
});

const uploadFormationImage = multer({
    storage: formationStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const mimeType = allowedTypes.test(file.mimetype);
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (mimeType && extname) {
            return cb(null, true);
        }
        cb(new Error('Type de fichier non supporté. Utilisez JPEG, PNG, GIF ou WebP.'));
    }
}).single('image');

class UploadController {
    static handleAvatarUpload(req, res) {
        upload(req, res, (err) => {
            if (err) {
                return ApiResponse.badRequest(res, err.message || 'Erreur lors du téléchargement.');
            }
            if (!req.file) {
                return ApiResponse.badRequest(res, 'Aucun fichier fourni.');
            }

            const subPath = req.user.userType === 'expert' ? 'experts' : 'users';
            const fileUrl = `/images/${subPath}/${req.file.filename}`;
            
            return ApiResponse.success(res, { url: fileUrl }, 'Image téléchargée avec succès.');
        });
    }

    static handleFormationImageUpload(req, res) {
        uploadFormationImage(req, res, (err) => {
            if (err) {
                return ApiResponse.badRequest(res, err.message || 'Erreur lors du téléchargement.');
            }
            if (!req.file) {
                return ApiResponse.badRequest(res, 'Aucun fichier fourni.');
            }

            const fileUrl = `/images/formations/${req.file.filename}`;

            return ApiResponse.success(res, { url: fileUrl }, 'Image de formation téléchargée avec succès.');
        });
    }
}

module.exports = UploadController;