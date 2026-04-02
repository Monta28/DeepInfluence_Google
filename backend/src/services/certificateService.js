const fs = require('fs');
const path = require('path');

/**
 * Service de génération de certificats PDF
 * Note: Cette implémentation utilise HTML/CSS pour créer un certificat
 * qui peut être converti en PDF côté client ou avec puppeteer côté serveur
 */
class CertificateService {
  /**
   * Générer un certificat HTML (peut être converti en PDF)
   * @param {Object} data - Données du certificat
   * @returns {Promise<string>} - Chemin du fichier HTML généré
   */
  static async generateCertificate(data) {
    const {
      studentName,
      courseTitle,
      expertName,
      completedAt,
      certificateId
    } = data;

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificat de Complétion</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 0;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Georgia', serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }

        .certificate {
            background: white;
            width: 297mm;
            height: 210mm;
            padding: 60px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            position: relative;
            overflow: hidden;
        }

        .certificate::before {
            content: '';
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            bottom: 20px;
            border: 3px solid #667eea;
            border-radius: 10px;
            pointer-events: none;
        }

        .certificate::after {
            content: '';
            position: absolute;
            top: 30px;
            left: 30px;
            right: 30px;
            bottom: 30px;
            border: 1px solid #e0e0e0;
            border-radius: 5px;
            pointer-events: none;
        }

        .header {
            text-align: center;
            margin-bottom: 40px;
            position: relative;
            z-index: 1;
        }

        .logo {
            font-size: 48px;
            font-weight: bold;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }

        .title {
            font-size: 42px;
            color: #333;
            font-weight: 600;
            letter-spacing: 2px;
            margin-bottom: 10px;
        }

        .subtitle {
            font-size: 18px;
            color: #666;
            font-style: italic;
        }

        .content {
            text-align: center;
            margin: 60px 0;
            position: relative;
            z-index: 1;
        }

        .award-text {
            font-size: 20px;
            color: #555;
            margin-bottom: 20px;
        }

        .student-name {
            font-size: 52px;
            color: #667eea;
            font-weight: 700;
            margin: 30px 0;
            text-transform: uppercase;
            letter-spacing: 3px;
        }

        .course-title {
            font-size: 32px;
            color: #333;
            font-weight: 600;
            margin: 30px 0;
            font-style: italic;
        }

        .completion-text {
            font-size: 18px;
            color: #666;
            margin-top: 30px;
            line-height: 1.6;
        }

        .footer {
            display: flex;
            justify-content: space-between;
            margin-top: 80px;
            padding-top: 40px;
            border-top: 2px solid #e0e0e0;
            position: relative;
            z-index: 1;
        }

        .signature-block {
            text-align: center;
            flex: 1;
        }

        .signature-line {
            width: 200px;
            height: 2px;
            background: #333;
            margin: 20px auto;
        }

        .signature-name {
            font-size: 18px;
            font-weight: 600;
            color: #333;
        }

        .signature-title {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
        }

        .certificate-id {
            position: absolute;
            bottom: 40px;
            right: 60px;
            font-size: 12px;
            color: #999;
            font-family: 'Courier New', monospace;
        }

        .date {
            font-size: 16px;
            color: #666;
            margin-top: 20px;
        }

        .decoration {
            position: absolute;
            opacity: 0.05;
            font-size: 300px;
            color: #667eea;
            z-index: 0;
        }

        .decoration-1 {
            top: -100px;
            left: -100px;
            transform: rotate(-15deg);
        }

        .decoration-2 {
            bottom: -100px;
            right: -100px;
            transform: rotate(15deg);
        }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="decoration decoration-1">★</div>
        <div class="decoration decoration-2">★</div>

        <div class="header">
            <div class="logo">DeepInfluence</div>
            <div class="title">CERTIFICAT DE COMPLÉTION</div>
            <div class="subtitle">Certificate of Completion</div>
        </div>

        <div class="content">
            <div class="award-text">Ce certificat est décerné à</div>

            <div class="student-name">${studentName}</div>

            <div class="award-text">pour avoir complété avec succès le cours</div>

            <div class="course-title">"${courseTitle}"</div>

            <div class="completion-text">
                Ce programme de formation a été dispensé par <strong>${expertName}</strong><br>
                sur la plateforme DeepInfluence.
            </div>

            <div class="date">
                Délivré le ${new Date(completedAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
            </div>
        </div>

        <div class="footer">
            <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-name">${expertName}</div>
                <div class="signature-title">Expert Formateur</div>
            </div>

            <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-name">DeepInfluence</div>
                <div class="signature-title">Plateforme E-Learning</div>
            </div>
        </div>

        <div class="certificate-id">ID: ${certificateId}</div>
    </div>
</body>
</html>
    `;

    // Créer le dossier certificates s'il n'existe pas
    const certificatesDir = path.join(__dirname, '../../public/certificates');
    if (!fs.existsSync(certificatesDir)) {
      fs.mkdirSync(certificatesDir, { recursive: true });
    }

    // Sauvegarder le fichier HTML
    const filename = `${certificateId}.html`;
    const filepath = path.join(certificatesDir, filename);
    fs.writeFileSync(filepath, html, 'utf8');

    return `/certificates/${filename}`;
  }

  /**
   * Vérifier si un certificat existe
   * @param {string} certificateId - ID du certificat
   * @returns {boolean}
   */
  static certificateExists(certificateId) {
    const filepath = path.join(__dirname, '../../public/certificates', `${certificateId}.html`);
    return fs.existsSync(filepath);
  }
}

module.exports = CertificateService;
