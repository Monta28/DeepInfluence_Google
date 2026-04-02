const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiResponse = require('../../utils/response');
const prisma = require('../../services/database');

// Créer les dossiers d'uploads dans le backend s'ils n'existent pas
const userUploadDir = path.join(__dirname, '../../../public/images/users');
const expertUploadDir = path.join(__dirname, '../../../public/images/experts');
const formationUploadDir = path.join(__dirname, '../../../public/images/formations');
const videoUploadDir = path.join(__dirname, '../../../public/uploads/videos');
const thumbnailUploadDir = path.join(__dirname, '../../../public/uploads/thumbnails');
if (!fs.existsSync(userUploadDir)) fs.mkdirSync(userUploadDir, { recursive: true });
if (!fs.existsSync(expertUploadDir)) fs.mkdirSync(expertUploadDir, { recursive: true });
if (!fs.existsSync(formationUploadDir)) fs.mkdirSync(formationUploadDir, { recursive: true });
if (!fs.existsSync(videoUploadDir)) fs.mkdirSync(videoUploadDir, { recursive: true });
if (!fs.existsSync(thumbnailUploadDir)) fs.mkdirSync(thumbnailUploadDir, { recursive: true });
const chatUploadDir = path.join(__dirname, '../../../public/uploads/chat');
if (!fs.existsSync(chatUploadDir)) fs.mkdirSync(chatUploadDir, { recursive: true });

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

// Configuration de Multer pour les vidéos (Reels et vidéos normales)
const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, videoUploadDir);
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname);
        const timestamp = Date.now();
        const newFilename = `video_${req.user.id}_${timestamp}${extension}`;
        cb(null, newFilename);
    }
});

const uploadVideo = multer({
    storage: videoStorage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = /mp4|mov|avi|mkv|webm/;
        const mimeAllowed = /video\//;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeType = mimeAllowed.test(file.mimetype);
        if (mimeType && extname) {
            return cb(null, true);
        }
        cb(new Error('Type de fichier non supporté. Utilisez MP4, MOV, AVI, MKV ou WebM.'));
    }
}).single('video');

// Configuration de Multer pour les thumbnails de vidéos
const thumbnailStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, thumbnailUploadDir);
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname);
        const timestamp = Date.now();
        const newFilename = `thumb_${req.user.id}_${timestamp}${extension}`;
        cb(null, newFilename);
    }
});

const uploadThumbnail = multer({
    storage: thumbnailStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const mimeType = allowedTypes.test(file.mimetype);
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (mimeType && extname) {
            return cb(null, true);
        }
        cb(new Error('Type de fichier non supporté. Utilisez JPEG, PNG, GIF ou WebP.'));
    }
}).single('thumbnail');

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

    static handleVideoUpload(req, res) {
        uploadVideo(req, res, (err) => {
            if (err) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return ApiResponse.badRequest(res, 'Le fichier vidéo ne doit pas dépasser 500 MB.');
                }
                return ApiResponse.badRequest(res, err.message || 'Erreur lors du téléchargement de la vidéo.');
            }
            if (!req.file) {
                return ApiResponse.badRequest(res, 'Aucun fichier vidéo fourni.');
            }

            const fileUrl = `/uploads/videos/${req.file.filename}`;

            return ApiResponse.success(res, {
                url: fileUrl,
                filename: req.file.filename,
                size: req.file.size
            }, 'Vidéo téléchargée avec succès.');
        });
    }

    static handleThumbnailUpload(req, res) {
        uploadThumbnail(req, res, (err) => {
            if (err) {
                return ApiResponse.badRequest(res, err.message || 'Erreur lors du téléchargement de la miniature.');
            }
            if (!req.file) {
                return ApiResponse.badRequest(res, 'Aucun fichier miniature fourni.');
            }

            const fileUrl = `/uploads/thumbnails/${req.file.filename}`;

            return ApiResponse.success(res, { url: fileUrl }, 'Miniature téléchargée avec succès.');
        });
    }
    // Chat attachment upload (images, documents, voice, video)
    static handleChatAttachmentUpload(req, res) {
        const chatStorage = multer.diskStorage({
            destination: (req, file, cb) => cb(null, chatUploadDir),
            filename: (req, file, cb) => {
                const ext = path.extname(file.originalname);
                cb(null, `chat-${req.user.id}-${Date.now()}${ext}`);
            }
        });
        const chatUpload = multer({
            storage: chatStorage,
            limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
            fileFilter: (req, file, cb) => {
                const allowed = /jpeg|jpg|png|gif|webp|mp4|mov|webm|mp3|ogg|wav|m4a|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip/;
                const ext = allowed.test(path.extname(file.originalname).toLowerCase());
                const mime = allowed.test(file.mimetype.split('/')[1]) || file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/') || file.mimetype.startsWith('application/');
                if (ext || mime) cb(null, true);
                else cb(new Error('Type de fichier non supporté.'));
            }
        }).single('attachment');

        chatUpload(req, res, (err) => {
            if (err) return ApiResponse.badRequest(res, err.message || 'Erreur upload.');
            if (!req.file) return ApiResponse.badRequest(res, 'Aucun fichier fourni.');
            const fileUrl = `/uploads/chat/${req.file.filename}`;
            return ApiResponse.success(res, {
                url: fileUrl,
                filename: req.file.originalname,
                size: req.file.size,
                mimetype: req.file.mimetype
            }, 'Fichier téléchargé.');
        });
    }
}

module.exports = UploadController;