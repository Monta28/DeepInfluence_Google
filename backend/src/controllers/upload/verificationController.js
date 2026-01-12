const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiResponse = require('../../utils/response');
const prisma = require('../../services/database');

// Créer le dossier pour les documents de vérification
const verificationDir = path.join(__dirname, '../../../public/uploads/verification');
if (!fs.existsSync(verificationDir)) {
    fs.mkdirSync(verificationDir, { recursive: true });
}

// Configuration de Multer pour gérer plusieurs champs de fichiers
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, verificationDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const extension = path.extname(file.originalname);
        cb(null, `expert-${req.user.id}-${file.fieldname}-${uniqueSuffix}${extension}`);
    }
});

const upload = multer({ storage }).fields([
    { name: 'identityDocumentFront', maxCount: 1 },
    { name: 'identityDocumentBack', maxCount: 1 },
    { name: 'selfieWithIdentity', maxCount: 1 },
    { name: 'bankDocument', maxCount: 1 } 
]);

class VerificationController {
    static async submitForVerification(req, res) {
        upload(req, res, async (err) => {
            if (err) {
                return ApiResponse.badRequest(res, 'Erreur lors du téléchargement des fichiers.');
            }

            const { identityDocumentType, bankDetails } = req.body;
            const files = req.files;

            if (!identityDocumentType || !bankDetails || !files.identityDocumentFront || !files.selfieWithIdentity || !files.bankDocument) {
                return ApiResponse.badRequest(res, 'Tous les champs et documents requis sont nécessaires.');
            }
            
            if (['CIN', 'DRIVING_LICENSE'].includes(identityDocumentType) && !files.identityDocumentBack) {
                return ApiResponse.badRequest(res, 'L\'image verso du document est requise.');
            }

            try {
                const expert = await prisma.expert.findUnique({ where: { userId: req.user.id } });
                if (!expert) {
                    return ApiResponse.notFound(res, 'Profil expert non trouvé.');
                }

                await prisma.expert.update({
                    where: { userId: req.user.id },
                    data: {
                        identityDocumentType: identityDocumentType,
                        bankDetails: bankDetails,
                        identityDocumentFront: `/uploads/verification/${files.identityDocumentFront[0].filename}`,
                        identityDocumentBack: files.identityDocumentBack ? `/uploads/verification/${files.identityDocumentBack[0].filename}` : null,
                        selfieWithIdentity: `/uploads/verification/${files.selfieWithIdentity[0].filename}`,
                        bankDocument: `/uploads/verification/${files.bankDocument[0].filename}`, // <-- SAUVEGARDE DU NOUVEAU DOCUMENT
                        verificationStatus: 'PENDING'
                    }
                });

                return ApiResponse.success(res, null, 'Vos documents ont été soumis pour vérification.');

            } catch (error) {
                console.error("Verification submission error:", error);
                return ApiResponse.error(res, 'Erreur lors de la soumission de vos documents.');
            }
        });
    }
}

module.exports = VerificationController;