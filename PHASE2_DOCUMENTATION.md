# 📚 DOCUMENTATION PHASE 2 - DeepInfluence

**Version** : 2.0
**Date** : Février 2026
**Statut** : ✅ Production Ready

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Installation & Configuration](#installation--configuration)
4. [API Backend](#api-backend)
5. [Pages Frontend](#pages-frontend)
6. [Guide Utilisateur](#guide-utilisateur)
7. [Tests](#tests)
8. [Déploiement](#déploiement)

---

## 🎯 Vue d'ensemble

Phase 2 introduit 4 nouveaux modules majeurs :

1. **📱 Module Reels** - Vidéos verticales courtes (TikTok-style)
2. **🎓 Module E-Learning** - Formations en ligne avec certificats
3. **💳 Module Paiement Flouci** - Achat de coins via paiement tunisien
4. **✅ Module Validation KYC** - Vérification renforcée des experts

### Statistiques
- **23 fichiers** créés/modifiés
- **70+ endpoints** API
- **9 pages** frontend
- **~7000 lignes** de code

---

## 🏗️ Architecture

### Backend (Node.js + Express + Prisma)

```
backend/
├── src/
│   ├── controllers/
│   │   ├── videos/
│   │   │   ├── videoController.js      (étendu Phase 2)
│   │   │   └── reelController.js       (nouveau)
│   │   ├── elearning/
│   │   │   ├── courseController.js     (nouveau)
│   │   │   ├── lessonController.js     (nouveau)
│   │   │   └── enrollmentController.js (nouveau)
│   │   ├── payments/
│   │   │   └── paymentController.js    (nouveau)
│   │   ├── experts/
│   │   │   └── expertController.js     (étendu Phase 2)
│   │   └── admin/
│   │       └── adminController.js      (étendu Phase 2)
│   ├── routes/
│   │   ├── videos.js                   (étendu Phase 2)
│   │   ├── reels.js                    (nouveau)
│   │   ├── courses.js                  (nouveau)
│   │   ├── payments.js                 (nouveau)
│   │   ├── experts.js                  (étendu Phase 2)
│   │   └── admin.js                    (étendu Phase 2)
│   └── server.js
├── prisma/
│   └── schema.prisma                   (13 nouveaux models)
└── scripts/
    ├── seedCoinPacks.js
    └── migrateVideosPhase2.js
```

### Frontend (Next.js 14 + TypeScript + TailwindCSS)

```
frontend/
└── app/
    ├── reels/
    │   └── page.tsx                    (nouveau)
    ├── coins/
    │   └── shop/
    │       └── page.tsx                (nouveau)
    ├── payment/
    │   ├── success/
    │   │   └── page.tsx                (nouveau)
    │   └── failed/
    │       └── page.tsx                (nouveau)
    ├── courses/
    │   ├── page.tsx                    (nouveau)
    │   └── [id]/
    │       └── page.tsx                (nouveau)
    ├── dashboard/
    │   ├── my-courses/
    │   │   └── page.tsx                (nouveau)
    │   └── verification/
    │       └── page.tsx                (nouveau)
    └── admin/
        └── verifications/
            └── page.tsx                (nouveau)
```

---

## ⚙️ Installation & Configuration

### Prérequis

- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Variables d'environnement

Créer `.env` dans `backend/` :

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# JWT
JWT_SECRET=your_super_secret_jwt_key_here

# Flouci Payment Gateway (Phase 2)
FLOUCI_APP_TOKEN=your_flouci_app_token
FLOUCI_APP_SECRET=your_flouci_app_secret

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Server
PORT=3001
NODE_ENV=development
```

### Installation

```bash
# Backend
cd backend
npm install
npx prisma db push --accept-data-loss
node scripts/seedCoinPacks.js
npm run dev  # Port 3001

# Frontend (terminal séparé)
cd frontend
npm install
npm run dev  # Port 3000
```

---

## 🔌 API Backend

### 📱 Module Reels

#### `GET /api/reels/feed`
Feed de Reels avec pagination cursor-based

**Query params** :
- `cursor` (number, optionnel) - ID du dernier Reel chargé
- `limit` (number, défaut: 10, max: 50) - Nombre de Reels
- `category` (string, optionnel) - Filtrer par catégorie
- `accessType` (string, optionnel) - FREE ou PAID
- `sortBy` (string, défaut: recent) - views, likes, recent

**Réponse** :
```json
{
  "success": true,
  "data": {
    "reels": [
      {
        "id": 1,
        "title": "Titre du Reel",
        "videoUrl": "https://...",
        "thumbnail": "https://...",
        "duration": "45",
        "views": 1234,
        "likes": 89,
        "comments": 12,
        "isLiked": false,
        "isUnlocked": true,
        "expert": {
          "id": 1,
          "name": "Expert Name",
          "verified": true
        }
      }
    ],
    "pagination": {
      "nextCursor": 10,
      "hasNextPage": true,
      "limit": 10
    }
  }
}
```

#### `GET /api/reels/:id`
Détails d'un Reel spécifique

#### `GET /api/reels/expert/:expertId`
Reels d'un expert

#### `GET /api/reels/categories`
Liste des catégories disponibles

---

### 🎓 Module E-Learning

#### `GET /api/courses`
Catalogue de cours

**Query params** :
- `category` (string, optionnel)
- `level` (string, optionnel) - BEGINNER, INTERMEDIATE, ADVANCED
- `search` (string, optionnel)
- `page` (number, défaut: 1)
- `limit` (number, défaut: 20)

**Réponse** :
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": 1,
        "title": "Cours de développement web",
        "description": "...",
        "thumbnail": "https://...",
        "level": "BEGINNER",
        "priceCoins": 500,
        "modulesCount": 5,
        "enrollmentsCount": 123,
        "isEnrolled": false,
        "expert": {
          "id": 1,
          "name": "Expert",
          "verified": true
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

#### `GET /api/courses/:id`
Détails d'un cours avec modules et leçons

#### `POST /api/courses/:courseId/enroll`
S'inscrire à un cours (authentifié)

#### `GET /api/enrollments/my`
Mes inscriptions

#### `GET /api/courses/:courseId/progress`
Progression d'un cours

#### `POST /api/lessons/:id/complete`
Marquer une leçon comme complétée

#### `POST /api/courses/:courseId/certificate`
Générer le certificat de complétion

---

### 💳 Module Paiement Flouci

#### `GET /api/payments/coin-packs`
Liste des packs de coins disponibles

**Réponse** :
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Starter",
      "coins": 100,
      "priceTND": 5.000,
      "bonus": 0,
      "popular": false
    },
    {
      "id": 3,
      "name": "Pro",
      "coins": 500,
      "priceTND": 20.000,
      "bonus": 50,
      "popular": true
    }
  ]
}
```

#### `POST /api/payments/buy-coins`
Acheter un pack de coins

**Body** :
```json
{
  "coinPackId": 3
}
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "paymentId": 123,
    "flouciPaymentUrl": "https://developers.flouci.com/payment/...",
    "amount": 20.000,
    "coins": 500,
    "bonus": 50,
    "total": 550
  }
}
```

#### `GET /api/payments/:id/verify`
Vérifier le statut d'un paiement

#### `POST /api/payments/webhook/flouci`
Webhook Flouci (signature HMAC-SHA256 requise)

#### `GET /api/payments/my`
Historique de mes paiements

---

### ✅ Module Validation KYC

#### `GET /api/experts/verification/status`
Statut de vérification de l'expert connecté (authentifié, expert only)

**Réponse** :
```json
{
  "success": true,
  "data": {
    "expertId": 1,
    "verified": false,
    "verificationStatus": "PENDING",
    "submittedAt": "2026-02-15T10:00:00Z",
    "hasDocuments": true,
    "statusInfo": {
      "title": "Vérification en cours",
      "message": "Votre demande est en cours d'examen...",
      "canResubmit": false
    }
  }
}
```

#### `POST /api/experts/submit-verification`
Soumettre des documents KYC (authentifié, expert only, multipart/form-data)

**Form data** :
- `diploma` (file, requis) - JPG, PNG ou PDF (max 5MB)
- `identity` (file, requis) - JPG, PNG ou PDF (max 5MB)
- `experience` (string, requis)
- `specialization` (string, requis)
- `motivation` (string, optionnel)

#### `GET /api/admin/verifications/pending`
Liste des demandes en attente (authentifié, admin only)

#### `GET /api/admin/verifications/:expertId`
Détails d'une demande

#### `POST /api/admin/verifications/:expertId/review`
Approuver/Rejeter une demande (authentifié, admin only)

**Body** :
```json
{
  "action": "approve",  // ou "reject"
  "rejectionReason": "Documents non conformes",  // si reject
  "verificationNote": "Note interne"  // optionnel
}
```

---

### 🎥 Module Vidéos (étendu Phase 2)

#### `POST /api/videos/:id/comment`
Ajouter un commentaire (authentifié)

**Body** :
```json
{
  "content": "Super vidéo !",
  "parentId": 5  // optionnel, pour réponses
}
```

#### `GET /api/videos/:id/comments`
Récupérer les commentaires avec pagination

**Query params** :
- `page` (number, défaut: 1)
- `limit` (number, défaut: 20)

#### `POST /api/videos/:id/view`
Tracker une vue de vidéo (optionalAuth)

**Body** :
```json
{
  "watchTime": 120  // secondes
}
```

---

## 🎨 Pages Frontend

### 📱 Module Reels

#### `/reels`
**Description** : Feed vertical TikTok-style avec scroll infini

**Fonctionnalités** :
- Scroll vertical avec snap (une vidéo à la fois)
- Auto-play/pause selon position
- Like, commentaires, partage
- Navigation clavier (↑/↓)
- Stats temps réel (vues, likes)
- Badge vérifié expert
- Cursor-based pagination automatique

**Technologies** :
- `useRef` pour gérer les vidéos
- `useCallback` pour scroll handling
- `IntersectionObserver` concept (scroll snap CSS)

---

### 💳 Module Paiement

#### `/coins/shop`
**Description** : Boutique d'achat de coins

**Fonctionnalités** :
- Affichage packs avec badge "populaire"
- Solde coins actuel
- Validation format/taille fichiers
- Redirection Flouci
- FAQ intégrée

#### `/payment/success`
**Description** : Page confirmation paiement réussi

**Fonctionnalités** :
- Vérification automatique (polling API)
- Animation confetti
- Affichage coins reçus
- Actions rapides (dashboard, vidéos)

#### `/payment/failed`
**Description** : Page échec paiement

**Fonctionnalités** :
- Raisons possibles d'échec
- Contact support
- Bouton réessayer
- Rassure l'utilisateur (aucun débit)

---

### 🎓 Module E-Learning

#### `/courses`
**Description** : Catalogue de formations

**Fonctionnalités** :
- Filtres (recherche, niveau, catégorie)
- Grid responsive avec cards
- Badges (niveau, inscrit, vérifié)
- Prix (coins/TND/gratuit)
- Pagination

#### `/courses/[id]`
**Description** : Page détails cours

**Fonctionnalités** :
- Hero section immersive
- Description complète
- Curriculum (modules/leçons pliables)
- Sidebar prix + CTA inscription
- Barre de progression si inscrit
- Infos expert détaillées
- Icônes type contenu (vidéo, texte, quiz, document)

#### `/dashboard/my-courses`
**Description** : Dashboard étudiant - Mes formations

**Fonctionnalités** :
- Stats (total, actifs, terminés, progression moyenne)
- Filtres status (tous, en cours, terminés)
- Cards cours avec progression
- Bouton "Continuer" contextuel
- Génération certificat PDF
- Badge status

---

### ✅ Module KYC

#### `/dashboard/verification`
**Description** : Soumission KYC expert

**Fonctionnalités** :
- Affichage statut actuel avec icônes
- Upload diplôme/CIN (drag & drop visuel)
- Validation fichiers (taille max 5MB, formats JPG/PNG/PDF)
- Champs expérience, spécialisation, motivation
- Message de refus si rejeté
- Note informative (confidentialité, délais)
- Formulaire résoumission si rejeté/expiré

#### `/admin/verifications`
**Description** : Dashboard Admin KYC

**Fonctionnalités** :
- Stats (en attente, approuvées, rejetées)
- Filtres status + tableau liste
- Modal détails avec infos complètes
- Preview documents (liens ouvrent nouvel onglet)
- Toggle Approve/Reject
- Champ motif refus (obligatoire si reject)
- Note interne admin (optionnelle)
- Validation avec audit log automatique

---

## 👤 Guide Utilisateur

### Pour les Utilisateurs

#### Acheter des coins

1. Aller sur **Menu → Boutique de Coins** (`/coins/shop`)
2. Choisir un pack (pack "Pro" recommandé pour meilleur bonus)
3. Cliquer "Acheter maintenant"
4. Compléter le paiement sur Flouci (carte bancaire/e-Dinar)
5. Redirection automatique → Page succès
6. Coins crédités instantanément ✅

#### Suivre une formation

1. Parcourir le **Catalogue** (`/courses`)
2. Utiliser les filtres (niveau, catégorie, recherche)
3. Cliquer sur un cours pour voir les détails
4. Vérifier curriculum (modules/leçons)
5. Cliquer "S'inscrire maintenant"
6. Paiement en coins si payant
7. Accès immédiat → "Commencer le cours"
8. Compléter les leçons une par une
9. Marquer comme terminé après chaque leçon
10. Obtenir le certificat à 100% de progression ✅

#### Regarder des Reels

1. Aller sur **Reels** (`/reels`)
2. Scroller verticalement (swipe haut/bas ou flèches clavier)
3. La vidéo courante joue automatiquement
4. Cliquer ❤️ pour liker
5. Cliquer 💬 pour commenter
6. Cliquer "Suivre" pour suivre l'expert

---

### Pour les Experts

#### Créer un cours

1. **Dashboard Expert** → "Créer un cours"
2. Remplir informations :
   - Titre, description
   - Niveau (débutant/intermédiaire/avancé)
   - Catégorie
   - Prix (en coins ou TND ou gratuit)
   - Image de couverture
3. Créer les modules (chapitres)
4. Ajouter des leçons à chaque module :
   - Type : Vidéo, Texte, Quiz, Document
   - Durée estimée
   - Gratuit ou payant
5. Status "DRAFT" par défaut (brouillon)
6. Publier quand prêt → Status "PUBLISHED" ✅

#### Créer un Reel

1. **Dashboard Expert** → "Créer une vidéo"
2. Sélectionner `videoType: REEL`
3. Uploader vidéo **portrait 9:16** (obligatoire)
4. Durée : **15 secondes à 3 minutes** (obligatoire)
5. Ajouter titre, description, catégorie
6. Prix (coins) si payant
7. Publier ✅

#### Obtenir le badge vérifié

1. **Dashboard** → "Vérification KYC"
2. Uploader documents :
   - Diplôme ou certification (JPG/PNG/PDF, max 5MB)
   - Pièce d'identité CIN (JPG/PNG/PDF, max 5MB)
3. Remplir informations :
   - Années d'expérience
   - Spécialisation
   - Motivation (optionnel)
4. Soumettre la demande
5. Attendre validation admin (2-3 jours ouvrables)
6. Recevoir notification ✅ ou ❌
7. Si refusé : corriger et resoumettre

---

### Pour les Admins

#### Valider une demande KYC

1. **Admin Panel** → "Validations KYC"
2. Voir la liste des demandes (filtres disponibles)
3. Cliquer "Voir détails" sur une demande
4. Modal s'ouvre avec :
   - Infos expert (nom, email, profil)
   - Documents (diplôme, CIN) - cliquer pour voir
   - Stats expert (vidéos, formations, avis)
5. Décision :
   - **✓ Approuver** : Badge vérifié accordé
   - **✕ Rejeter** : Indiquer motif (obligatoire, visible par expert)
6. Ajouter note interne (optionnelle, admin only)
7. Confirmer
8. Expert reçoit notification automatique ✅
9. Audit log créé automatiquement

---

## 🧪 Tests

### Tests manuels Backend (Thunder Client / Postman)

#### Test 1 : Récupérer les packs de coins
```
GET http://localhost:3001/api/payments/coin-packs
```

**Résultat attendu** : 5 packs (Starter, Basic, Pro, Premium, Ultimate)

#### Test 2 : Feed Reels
```
GET http://localhost:3001/api/reels/feed?limit=5
```

**Résultat attendu** : Liste de Reels avec pagination cursor-based

#### Test 3 : Catalogue cours
```
GET http://localhost:3001/api/courses?level=BEGINNER&limit=10
```

**Résultat attendu** : Liste cours débutants

#### Test 4 : Statut vérification (authentifié)
```
GET http://localhost:3001/api/experts/verification/status
Headers:
  Authorization: Bearer <YOUR_JWT_TOKEN>
```

**Résultat attendu** : Statut KYC de l'expert

---

### Tests Frontend

#### Test navigation
1. Ouvrir http://localhost:3000
2. Naviguer vers chaque page :
   - `/reels` - Feed doit scroller verticalement
   - `/coins/shop` - Packs doivent s'afficher
   - `/courses` - Catalogue avec filtres
   - `/courses/1` - Détails cours (remplacer 1 par ID valide)
   - `/dashboard/my-courses` - Mes inscriptions
   - `/dashboard/verification` - Formulaire KYC

#### Test responsive
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

Toutes les pages doivent être responsive ✅

---

## 🚀 Déploiement

### Backend

#### Variables d'environnement Production

```env
DATABASE_URL="postgresql://..."
JWT_SECRET=production_secret_key_here
FLOUCI_APP_TOKEN=prod_token
FLOUCI_APP_SECRET=prod_secret
FRONTEND_URL=https://deepinfluence.tn
PORT=3001
NODE_ENV=production
```

#### Commandes

```bash
# Build
npm run build

# Migration production
npx prisma migrate deploy

# Seed production (coins only)
node scripts/seedCoinPacks.js

# Start
npm start
```

### Frontend

#### Variables d'environnement Production

```env
NEXT_PUBLIC_API_URL=https://api.deepinfluence.tn
```

#### Commandes

```bash
# Build
npm run build

# Start
npm start
```

---

## 📊 Métriques & Monitoring

### Endpoints à monitorer

- `GET /api/reels/feed` - Temps de réponse < 500ms
- `POST /api/payments/buy-coins` - Taux de succès > 95%
- `POST /api/payments/webhook/flouci` - Latency < 200ms
- `GET /api/courses` - Cache recommandé (5 min)

### Logs importants

```bash
# Backend logs
tail -f backend/logs/app.log | grep ERROR

# Webhook Flouci
tail -f backend/logs/flouci-webhook.log
```

---

## 🆘 Troubleshooting

### Problème : Paiement Flouci échoue

**Causes possibles** :
1. Credentials Flouci invalides (vérifier `.env`)
2. Montant en millimes incorrect (doit être TND × 1000)
3. Webhook signature invalide

**Solution** :
```bash
# Vérifier logs
tail -f backend/logs/flouci.log

# Test credentials
curl https://developers.flouci.com/api/generate_payment \
  -H "Content-Type: application/json" \
  -d '{"app_token":"...","app_secret":"...","amount":5000}'
```

### Problème : Feed Reels ne charge pas

**Causes possibles** :
1. Aucun Reel en base (status PUBLISHED)
2. Problème de CORS
3. Frontend API URL incorrecte

**Solution** :
```sql
-- Vérifier Reels en base
SELECT id, title, videoType, status FROM "Video" WHERE videoType = 'REEL';

-- Créer un Reel de test
INSERT INTO "Video" (title, videoType, accessType, orientation, status, expertId, ...)
VALUES ('Test Reel', 'REEL', 'FREE', 'PORTRAIT', 'PUBLISHED', 1, ...);
```

### Problème : Certificat ne se génère pas

**Causes possibles** :
1. Progression < 100%
2. certificateEnabled = false sur le cours

**Solution** :
```sql
-- Vérifier progression
SELECT progress FROM "Enrollment" WHERE userId = X AND courseId = Y;

-- Activer certificats
UPDATE "Course" SET "certificateEnabled" = true WHERE id = Y;
```

---

## 📞 Support

**Email** : support@deepinfluence.tn
**Discord** : https://discord.gg/deepinfluence
**Documentation** : https://docs.deepinfluence.tn

---

## 📝 Changelog

### Version 2.0 (Phase 2) - Février 2026
- ✅ Module Reels (vidéos verticales)
- ✅ Module E-Learning (formations + certificats)
- ✅ Module Paiement Flouci (achat coins)
- ✅ Module Validation KYC (vérification experts)
- ✅ 70+ nouveaux endpoints API
- ✅ 9 nouvelles pages frontend
- ✅ 13 nouveaux models Prisma

### Version 1.0 - Janvier 2026
- Base application (experts, vidéos, formations, rendez-vous)

---

**Développé avec ❤️ par l'équipe DeepInfluence**
