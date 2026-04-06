# 📚 DOCUMENTATION COMPLÈTE - DEEPINFLUENCE

## 🎯 Vue d'ensemble de l'application

**DeepInfluence** est une plateforme de mise en relation entre experts et utilisateurs pour :
- **Consultations vidéo** en temps réel
- **Formations en ligne** ou en présentiel
- **Messagerie** et chat en direct
- **Vidéos éducatives** à la demande
- **Système de réservation** avec disponibilités personnalisables

---

## 👥 TYPES D'UTILISATEURS

### 1. **USER** (Utilisateur Standard)
Utilisateur lambda qui cherche à se former ou consulter des experts

### 2. **EXPERT** (Expert/Formateur)
Professionnel qui propose ses services, formations et consultations

### 3. **ADMIN** (Administrateur)
Gestionnaire de la plateforme avec accès total

---

## 🔧 STACK TECHNIQUE

### **Frontend**
- **Framework** : Next.js 14 (App Router)
- **Langage** : TypeScript/JavaScript
- **Styling** : TailwindCSS
- **État** : React Context (AuthContext, CurrencyContext)
- **Vidéo** : Jitsi Meet (JaaS)

### **Backend**
- **Framework** : Express.js (Node.js)
- **Base de données** : PostgreSQL
- **ORM** : Prisma
- **Authentification** : JWT + OAuth (Google, Facebook)
- **Upload** : Multer
- **Vidéo** : Jitsi (avec génération de tokens JWT)

---

## 📦 MODULES PAR TYPE D'UTILISATEUR

## 👤 MODULES USER (Utilisateur)

### 🔐 Authentification & Profil
| Module | Route Frontend | Route Backend | Description |
|--------|---------------|---------------|-------------|
| Inscription | `/signup` | `POST /api/auth/register` | Création de compte |
| Connexion | `/signin` | `POST /api/auth/login` | Connexion (email/password ou OAuth) |
| OAuth Google/Facebook | `/auth/callback` | `POST /api/auth/google`, `/api/auth/facebook` | Connexion sociale |
| Mot de passe oublié | `/forgot-password` | `POST /api/auth/forgot-password` | Réinitialisation |
| Profil | `/dashboard/profile` | `GET/PUT /api/users/profile` | Gestion profil complet |

### 📊 Dashboard
| Module | Route Frontend | Description |
|--------|---------------|-------------|
| Vue d'ensemble | `/dashboard` | Statistiques, sessions récentes, formations |
| Recherche | `/dashboard/search` | Recherche globale (experts, formations, vidéos) |
| Explorer | `/dashboard/explorer` | Découverte de contenu |
| Favoris | `/dashboard/favorites` | Experts et formations favoris |
| Notifications | `/dashboard/notifications` | Centre de notifications |

### 👨‍🏫 Experts
| Module | Route Frontend | Route Backend | Description |
|--------|---------------|---------------|-------------|
| Liste experts | `/experts` | `GET /api/experts` | Recherche et filtrage d'experts |
| Profil expert | `/experts/[id]` | `GET /api/experts/:id` | Détails d'un expert |
| Réserver consultation | `/experts/[id]/book` | `POST /api/appointments` | Prise de RDV |
| Contacter expert | `/experts/[id]/contact` | `POST /api/messages` | Messagerie |
| Avis expert | `/experts/[id]/reviews` | `GET /api/reviews/expert/:id` | Notes et commentaires |

### 🎓 Formations
| Module | Route Frontend | Route Backend | Description |
|--------|---------------|---------------|-------------|
| Catalogue formations | `/formations` | `GET /api/formations` | Liste des formations |
| Détails formation | `/formations/[id]` | `GET /api/formations/:id` | Info complète |
| Inscription formation | `/formations/[id]/reserve` | `POST /api/formations/:id/enroll` | S'inscrire |
| Mes formations | `/dashboard/formations` | `GET /api/formations/my-enrollments` | Formations suivies |
| Session vidéo formation | `/formation-video/[formationId]` | - | Visioconférence Jitsi |

### 📹 Vidéos
| Module | Route Frontend | Route Backend | Description |
|--------|---------------|---------------|-------------|
| Bibliothèque vidéos | `/videos` | `GET /api/videos` | Catalogue vidéos |
| Lecture vidéo | `/videos/[id]` | `GET /api/videos/:id` | Player + infos |
| Mes vidéos | `/dashboard/videos` | `GET /api/videos/my-videos` | Historique |
| Enregistrements | `/dashboard/recordings` | - | Sessions enregistrées |

### 💬 Communication
| Module | Route Frontend | Route Backend | Description |
|--------|---------------|---------------|-------------|
| Chat | `/dashboard/chat` | `GET /api/messages/conversations` | Conversations |
| Chat privé | `/dashboard/chat/[id]` | `GET/POST /api/messages/:conversationId` | Messagerie 1-1 |
| Visioconférence | `/video-session/[sessionId]` | `GET /api/videoSessions/:id` | Session Jitsi |

### 📅 Rendez-vous
| Module | Route Frontend | Route Backend | Description |
|--------|---------------|---------------|-------------|
| Mes RDV | `/dashboard/appointments` | `GET /api/appointments/my` | Liste des consultations |

### 💰 Système monétaire
| Module | Route Frontend | Route Backend | Description |
|--------|---------------|---------------|-------------|
| Gestion coins | `/dashboard/coins` | `GET /api/users/coins` | Solde et transactions |

---

## 👨‍🏫 MODULES EXPERT (Expert/Formateur)

*L'expert hérite de TOUS les modules USER +*

### 📋 Profil Expert
| Module | Route Frontend | Route Backend | Description |
|--------|---------------|---------------|-------------|
| Configuration profil | `/expert-profile/configuration` | `PUT /api/experts/profile` | Tarifs, spécialité, tags |
| Paramètres | `/expert-profile/settings` | - | Config avancée |
| Vérification identité | `/dashboard/profile` (tab Vérification) | `POST /api/experts/submit-verification` | KYC (CIN, RIB, selfie) |

### ⏰ Disponibilités
| Module | Route Frontend | Route Backend | Description |
|--------|---------------|---------------|-------------|
| Gestion disponibilités | `/dashboard/profile` (tab Disponibilité) | `GET/PUT /api/experts/availability` | Jours, horaires, congés, intervalles |
| Périodes de congé | `/dashboard/profile` (tab Disponibilité) | `PUT /api/experts/availability` | Plages de dates indisponibles |

### 🎓 Gestion Formations
| Module | Route Frontend | Route Backend | Description |
|--------|---------------|---------------|-------------|
| Mes formations | `/dashboard/formations` | `GET /api/formations/my-formations` | Formations créées |
| Créer formation | `/dashboard/formations/create` | `POST /api/formations` | Nouvelle formation (live/présentiel) |
| Sessions vidéo auto | - | Auto-généré | Lien Jitsi pour formations "live" |

### 📹 Gestion Vidéos
| Module | Route Frontend | Route Backend | Description |
|--------|---------------|---------------|-------------|
| Mes vidéos | `/dashboard/videos` | `GET /api/videos/expert` | Vidéos publiées |
| Créer vidéo | `/dashboard/videos/create` | `POST /api/videos` | Upload nouvelle vidéo |

### 📅 Gestion Rendez-vous
| Module | Route Frontend | Route Backend | Description |
|--------|---------------|---------------|-------------|
| RDV reçus | `/dashboard/appointments` | `GET /api/appointments/expert` | Consultations des clients |
| Rejoindre session | `/video-session/[sessionId]` | - | Rejoindre visio client |

---

## 🛡️ MODULES ADMIN (Administrateur)

*L'admin a accès à TOUT +*

### 📊 Dashboard Admin
| Module | Route Frontend | Route Backend | Description |
|--------|---------------|---------------|-------------|
| Vue d'ensemble | `/admin` | `GET /api/admin/stats` | Statistiques globales |
| Paramètres plateforme | `/admin/settings` | `GET/PUT /api/admin/settings` | Configuration globale |

### 👥 Gestion Utilisateurs
| Module | Route Frontend | Route Backend | Description |
|--------|---------------|---------------|-------------|
| Liste utilisateurs | `/admin/users` | `GET /api/admin/users` | Tous les users |
| Bannir/Activer | `/admin/users` | `PUT /api/admin/users/:id/ban` | Modération |
| Modifier utilisateur | `/admin/users` | `PUT /api/admin/users/:id` | Édition |

### 👨‍🏫 Gestion Experts
| Module | Route Frontend | Route Backend | Description |
|--------|---------------|---------------|-------------|
| Liste experts | `/admin/experts` | `GET /api/admin/experts` | Tous les experts |
| Vérification experts | `/admin/experts` | `PUT /api/admin/experts/:id/verify` | Approuver/Refuser KYC |
| Modifier expert | `/admin/experts` | `PUT /api/admin/experts/:id` | Édition profil |

### 📅 Gestion Rendez-vous
| Module | Route Frontend | Route Backend | Description |
|--------|---------------|---------------|-------------|
| Tous les RDV | `/admin/appointments` | `GET /api/admin/appointments` | Vue globale |
| Annuler RDV | `/admin/appointments` | `DELETE /api/appointments/:id` | Modération |

### 💰 Gestion Transactions
| Module | Route Frontend | Route Backend | Description |
|--------|---------------|---------------|-------------|
| Historique | `/admin/transactions` | `GET /api/admin/transactions` | Paiements, coins |

### ⭐ Modération Avis
| Module | Route Frontend | Route Backend | Description |
|--------|---------------|---------------|-------------|
| Liste avis | `/admin/reviews` | `GET /api/admin/reviews` | Tous les reviews |
| Supprimer avis | `/admin/reviews` | `DELETE /api/reviews/:id` | Modération |

### 🔔 Notifications
| Module | Route Frontend | Route Backend | Description |
|--------|---------------|---------------|-------------|
| Envoyer notifications | `/admin/notifications` | `POST /api/admin/notifications/send` | Push global/ciblé |

### 📝 Gestion Contenu
| Module | Route Frontend | Route Backend | Description |
|--------|---------------|---------------|-------------|
| Modération contenu | `/admin/content` | `GET/PUT /api/admin/content` | Formations, vidéos |

### 📋 Logs & Audit
| Module | Route Frontend | Route Backend | Description |
|--------|---------------|---------------|-------------|
| Logs système | `/admin/logs` | `GET /api/admin/logs` | Audit trail |

---

## 🎥 SYSTÈME DE VISIOCONFÉRENCE

### Architecture Jitsi
| Composant | Technologie | Description |
|-----------|-------------|-------------|
| Service | Jitsi as a Service (JaaS) | Hébergement Cloud |
| Token | JWT | Authentification sécurisée |
| Room ID | Généré aléatoirement | Unique par session/formation |

### Types de sessions vidéo
1. **Consultation Expert** (`appointment-{appointmentId}`)
   - Rendez-vous 1-1 entre user et expert
   - Contrôle pause/reprise (timer 3min)
   - Statut temps réel (connecté/déconnecté)

2. **Formation Live** (`formation-{roomId}`)
   - Créée automatiquement si type = "En direct"
   - Accessible uniquement aux inscrits
   - Pas de lien si type = "Présentiel"

### Fonctionnalités vidéo
- ✅ Partage d'écran
- ✅ Chat intégré
- ✅ Enregistrement (selon config)
- ✅ Timer de pause (3 minutes max)
- ✅ Détection connexion/déconnexion
- ✅ Overlay pause/reprise

---

## 💾 MODÈLES DE DONNÉES PRINCIPAUX

### User
```
id, firstName, lastName, email, password, phone, bio, location, avatar
userType (user/expert/admin), coins, profileCompleted, isVerified
googleId, facebookId, banned, sessionsCompleted, formationsFollowed
```

### Expert
```
userId (FK), name, specialty, rating, reviews, hourlyRate, pricePerMessage
tags, languages, category, verified, verificationStatus
availableDays, availableTimeSlots, vacationDays, appointmentInterval
identityDocumentFront/Back, selfieWithIdentity, bankDetails
```

### Formation
```
id, title, instructorId (FK Expert), duration, level, rating
type (live/presentiel), price, maxPlaces, currentPlaces, location
image, nextSession, schedule, description, category
tags, modules, objectives, prerequisites, included, tools
videoConferenceLink (uniquement si type=live)
```

### Appointment
```
id, userId (FK), expertId (FK), date, time, duration
status (pending/confirmed/completed/cancelled)
sessionLink (lien Jitsi), price, notes
```

### Video
```
id, title, description, expertId (FK), category, duration
thumbnail, videoUrl, views, rating, price, tags
```

### Message
```
id, senderId (FK), receiverId (FK), conversationId (FK)
content, sentAt, read, attachments
```

### Transaction
```
id, userId (FK), type (purchase/refund/earning)
amount, description, status, relatedId
```

---

## 🔄 WORKFLOWS PRINCIPAUX

### 1️⃣ Workflow Réservation Consultation
```
1. User browse experts (/experts)
2. User clique sur expert (/experts/[id])
3. User clique "Réserver" (/experts/[id]/book)
4. User sélectionne date/heure (selon disponibilités expert)
5. User paie avec coins
6. Backend crée Appointment + génère lien Jitsi
7. Notification envoyée à expert et user
8. À l'heure H, user/expert rejoignent /video-session/[sessionId]
```

### 2️⃣ Workflow Inscription Formation
```
1. User browse formations (/formations)
2. User clique sur formation (/formations/[id])
3. User clique "S'inscrire" (/formations/[id]/reserve)
4. User paie
5. Backend crée UserFormation (enrollment)
6. Si type=live, lien Jitsi accessible dans /formations/[id]
7. User peut rejoindre /formation-video/[formationId]
```

### 3️⃣ Workflow Création Formation (Expert)
```
1. Expert va dans /dashboard/formations/create
2. Expert remplit formulaire (titre, type, durée, prix, etc.)
3. Expert sélectionne type:
   - "En direct" → Backend génère videoConferenceLink automatiquement
   - "Présentiel" → Pas de lien vidéo
4. Expert configure sessions (dates multiples)
5. Backend crée Formation
6. Formation visible dans catalogue
```

### 4️⃣ Workflow Disponibilités Expert
```
1. Expert va dans /dashboard/profile (tab Disponibilité)
2. Expert sélectionne:
   - Jours disponibles (Lun-Dim)
   - Plages horaires (09:00-12:00, 14:00-18:00, etc.)
   - Intervalle RDV (15min, 30min, 1h, etc.)
   - Périodes de congé (dates de début/fin)
3. Expert sauvegarde
4. Backend stocke dans Expert.availableDays/TimeSlots/vacationDays
5. Utilisateurs voient uniquement créneaux disponibles
```

### 5️⃣ Workflow Vérification Expert
```
1. Expert upload CIN (recto/verso), selfie, RIB
2. Backend stocke documents + verificationStatus = PENDING
3. Admin voit demande dans /admin/experts
4. Admin valide ou refuse
5. Expert notifié + verificationStatus = VERIFIED/REJECTED
```

---

## 🌐 PAGES PUBLIQUES

| Page | Route | Description |
|------|-------|-------------|
| Accueil | `/` | Landing page |
| Aide | `/aide` | Centre d'aide |
| FAQ | `/faq` | Questions fréquentes |
| Contact | `/contact` | Formulaire contact |
| CGU | `/cgu` | Conditions générales |
| Confidentialité | `/confidentialite` | Politique données |
| Cookies | `/cookies` | Politique cookies |
| Mentions légales | `/mentions-legales` | Infos légales |
| Sécurité | `/securite` | Infos sécurité |
| Bibliothèque | `/bibliotheque` | Ressources |
| Parrainage | `/parrainage` | Programme parrainage |

---

## 🔒 SYSTÈME D'AUTHENTIFICATION

### Méthodes
1. **Email/Password** (classique)
2. **Google OAuth**
3. **Facebook OAuth**

### Tokens
- **JWT** stocké dans localStorage
- Durée: 24h (configurable)
- Refresh: Auto si token expire

### Middleware Backend
```javascript
verifyToken → Vérifie JWT
requireExpert → Vérifie si user est expert
requireAdmin → Vérifie si user est admin
```

---

## 💰 SYSTÈME DE COINS

### Utilisation
- Réserver consultations
- S'inscrire à formations
- Acheter vidéos premium
- Messagerie payante (optionnel)

### Obtention
- 100 coins offerts à l'inscription
- Achat de packs (à implémenter)
- Parrainage (à implémenter)

### Transactions
- Débit automatique lors d'achats
- Crédit pour experts (revenus)
- Historique dans `/dashboard/coins`

---

## 📁 STRUCTURE DES FICHIERS

### Backend
```
backend/
├── prisma/
│   └── schema.prisma           # Modèles de données
├── src/
│   ├── controllers/            # Logique métier
│   │   ├── experts/
│   │   ├── formations/
│   │   ├── appointments/
│   │   └── ...
│   ├── routes/                 # Endpoints API
│   ├── middleware/             # Auth, validation
│   ├── services/               # Services (DB, email, etc.)
│   └── server.js               # Point d'entrée
└── public/                     # Fichiers statiques (uploads)
```

### Frontend
```
frontend/
├── app/                        # Pages Next.js 14
│   ├── (auth)/                 # Pages auth
│   ├── dashboard/              # Dashboard user/expert
│   ├── admin/                  # Dashboard admin
│   ├── experts/                # Pages experts
│   ├── formations/             # Pages formations
│   └── ...
├── components/                 # Composants réutilisables
├── contexts/                   # React Context
├── services/                   # API calls
└── public/                     # Assets statiques
```

---

## 🚀 FONCTIONNALITÉS À AJOUTER (Suggestions)

### 🎯 Priorité Haute
- [ ] **Paiement réel** (Stripe/PayPal) pour acheter coins
- [ ] **Email notifications** (confirmation RDV, rappels)
- [ ] **SMS notifications** (rappels RDV)
- [ ] **Système de rating** après chaque consultation
- [ ] **Historique vidéo** (replay sessions)

### 🎯 Priorité Moyenne
- [ ] **Programme de parrainage** (coins bonus)
- [ ] **Abonnements experts** (accès illimité)
- [ ] **Badges et certifications** experts
- [ ] **Chat en direct** (WebSocket pour temps réel)
- [ ] **Notifications push** (Web Push API)

### 🎯 Priorité Basse
- [ ] **Blog/Actualités**
- [ ] **Forum communautaire**
- [ ] **Application mobile** (React Native)
- [ ] **Analytics avancées** (Google Analytics, Mixpanel)
- [ ] **Multilingue** (i18n)

---

## 📊 MÉTRIQUES & KPIs

### Utilisateurs
- Nouveaux inscrits / jour
- Taux de complétion profil
- Taux d'activation (1ère action)

### Experts
- Nouveaux experts / semaine
- Taux de vérification
- Revenus moyen / expert
- Taux de disponibilité

### Formations
- Inscriptions / formation
- Taux de complétion
- Note moyenne

### Consultations
- RDV réservés / jour
- Taux d'annulation
- Durée moyenne session

---

## 🔐 SÉCURITÉ

### Implémenté
- ✅ Hash passwords (bcrypt)
- ✅ JWT tokens
- ✅ CORS configuré
- ✅ Validation inputs (côté backend)
- ✅ SQL injection protection (Prisma)
- ✅ XSS protection (React)

### À renforcer
- ⚠️ Rate limiting (limiter requêtes)
- ⚠️ HTTPS obligatoire en prod
- ⚠️ Validation fichiers upload (taille, type)
- ⚠️ 2FA (authentification double facteur)
- ⚠️ Logs audit admin

---

## 📞 SUPPORT

Pour toute question sur cette documentation, contactez l'équipe de développement.

**Date de dernière mise à jour** : 2026-02-16
**Version** : 1.0
