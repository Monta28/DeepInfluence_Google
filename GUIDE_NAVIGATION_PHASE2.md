# 🎯 Guide de Navigation - Nouvelles Fonctionnalités Phase 2

## 📖 Comment Accéder aux Nouvelles Fonctionnalités

Ce guide vous montre comment accéder à toutes les nouvelles fonctionnalités **sans taper d'URLs manuellement** - uniquement en naviguant dans l'interface.

---

## 1. 🎓 Quiz E-Learning

### 📍 Chemin de Navigation
```
1. Connectez-vous (admin@deepinfluent.local / password123)
2. Cliquez sur "Dashboard" dans le menu
3. Cliquez sur "Mes Cours" dans la sidebar
4. Sélectionnez un cours dans lequel vous êtes inscrit
5. Cliquez sur un module, puis sur une leçon qui contient un quiz
6. Le quiz s'affichera automatiquement
7. Répondez aux questions et cliquez sur "Soumettre"
```

### ✅ Résultat
- Affichage du score (ex: 85/100)
- Indication "Réussi" ou "Échoué" selon le seuil (70%)
- Mise à jour de la progression du cours
- Possibilité de retenter (seul le meilleur score est conservé)

### 🔗 URLs Auto-Générées
- Liste des cours : `http://localhost:3000/dashboard/my-courses`
- Détail du cours : `http://localhost:3000/dashboard/my-courses/[courseId]`
- Leçon avec quiz : Intégré dans la page du cours

---

## 2. 📜 Certificats PDF

### 📍 Chemin de Navigation
```
1. Dashboard → Mes Cours
2. Cherchez un cours avec badge "✓ Complété à 100%"
3. Cliquez sur "Voir le cours"
4. Bouton "Télécharger mon Certificat" apparaît en haut
5. Cliquez pour générer (première fois) ou télécharger (déjà généré)
```

### ✅ Résultat
- Génération d'un certificat professionnel HTML
- Format A4 paysage avec design gradient
- Contient:
  - Nom complet de l'étudiant
  - Titre du cours
  - Nom de l'expert formateur
  - Date de complétion
  - ID unique du certificat
- **URL du certificat:** `/certificates/CERT-123-timestamp.html`

### 📝 Note Importante
- Le certificat n'est disponible que pour les cours **complétés à 100%**
- Un seul certificat par inscription (pas de régénération)
- Peut être imprimé en PDF depuis le navigateur (Ctrl+P)

---

## 3. 💰 Admin - Gestion des Payouts

### 📍 Chemin de Navigation
```
1. Connectez-vous en tant qu'Admin (admin@deepinfluent.local / password123)
2. Cliquez sur "Admin Panel" dans le menu
3. Dans la sidebar admin, cliquez sur "Payouts" (nouvelle section)
4. Vous verrez la liste de tous les payouts
```

### ✅ Fonctionnalités Disponibles

#### Filtrage par Statut
- **PENDING** : Payouts en attente de traitement
- **PROCESSING** : Payouts en cours de traitement
- **COMPLETED** : Payouts déjà traités
- **FAILED** : Payouts échoués

#### Actions Disponibles
1. **Voir les détails** : Montant brut, commission, montant net
2. **Traiter un payout** : Bouton "Traiter le payout" pour les statuts PENDING
3. **Confirmation** : Popup de confirmation avant traitement
4. **Notification automatique** : L'expert reçoit une notification après traitement

### 🔗 URL
`http://localhost:3000/admin/payouts`

### 📊 Tableau Affiché
| Expert | Période | Montant Brut | Commission | Montant Net | Statut | Actions |
|--------|---------|--------------|------------|-------------|--------|---------|
| Marc Dubois | 2026-02 | 1500.00 TND | -300.00 TND | 1200.00 TND | PENDING | [Bouton Traiter] |

---

## 4. 📅 Exceptions Horaires (Experts)

### 📍 Chemin de Navigation
```
1. Connectez-vous en tant qu'Expert (marc.dubois@email.com / password123)
2. Dashboard → Disponibilités
3. Scrollez jusqu'à la section "Exceptions Horaires" (à ajouter)
4. Cliquez sur "Ajouter une Exception"
```

### ✅ Types d'Exceptions

#### A. Jour Indisponible (UNAVAILABLE)
```json
{
  "date": "2026-03-15",
  "type": "UNAVAILABLE",
  "reason": "Conférence professionnelle"
}
```
**Effet :** Expert totalement indisponible ce jour-là

#### B. Heures Personnalisées (CUSTOM_HOURS)
```json
{
  "date": "2026-03-20",
  "type": "CUSTOM_HOURS",
  "customSlots": [
    { "start": "14:00", "end": "18:00" }
  ],
  "reason": "Disponible uniquement l'après-midi"
}
```
**Effet :** Horaires différents de l'emploi du temps habituel

### 📋 Actions Disponibles
- ➕ **Créer une exception** : Formulaire avec sélecteur de date
- 📋 **Lister les exceptions** : Vue calendrier des exceptions
- 🗑️ **Supprimer une exception** : Bouton de suppression avec confirmation
- 🔍 **Filtrer par période** : Voir les exceptions d'une plage de dates

### 🔗 URL
`http://localhost:3000/dashboard/availability`

---

## 📱 Navigation Complète dans l'Interface

### Menu Principal (Tous les Utilisateurs)
```
┌─ Accueil
├─ Experts
├─ Formations
├─ Vidéos
├─ Se connecter / Dashboard (si connecté)
└─ Commencer
```

### Dashboard Utilisateur
```
┌─ Vue d'ensemble
├─ Explorer
├─ Mes Cours ⭐ [Quiz + Certificats]
├─ Favoris
├─ Rendez-vous
├─ Messages
├─ Notifications
├─ Coins
└─ Paramètres
```

### Dashboard Expert (en plus des options Utilisateur)
```
┌─ Mes Formations
├─ Mes Vidéos
├─ Disponibilités ⭐ [Exceptions Horaires]
├─ Mes Rendez-vous
├─ Vérification KYC
└─ Statistiques
```

### Admin Panel
```
┌─ Vue d'ensemble
├─ Utilisateurs
├─ Experts
├─ Payouts ⭐ [NOUVEAU]
├─ Contenu (Vidéos, Formations)
├─ Rendez-vous
├─ Transactions
├─ Avis
├─ Notifications
├─ Logs
└─ Paramètres
```

---

## 🚀 Raccourcis Clavier (Bonus)

```
Alt + D  → Dashboard
Alt + A  → Admin (si admin)
Alt + C  → Mes Cours
Alt + N  → Notifications
Ctrl + K → Recherche globale
```

---

## 🧪 Test Rapide - Checklist

### ✅ Tester les Quiz
- [ ] S'inscrire à un cours gratuit
- [ ] Ouvrir une leçon avec quiz
- [ ] Soumettre le quiz avec des réponses
- [ ] Vérifier le score affiché
- [ ] Confirmer la mise à jour de progression

### ✅ Tester les Certificats
- [ ] Compléter un cours à 100%
- [ ] Voir le badge "Complété"
- [ ] Cliquer sur "Télécharger Certificat"
- [ ] Ouvrir le certificat HTML généré
- [ ] Vérifier toutes les informations
- [ ] Tester l'impression (Ctrl+P)

### ✅ Tester les Payouts (Admin)
- [ ] Se connecter en admin
- [ ] Aller dans Admin → Payouts
- [ ] Filtrer par PENDING
- [ ] Cliquer sur "Traiter le payout"
- [ ] Confirmer le traitement
- [ ] Vérifier le changement de statut
- [ ] Vérifier la notification à l'expert

### ✅ Tester les Exceptions (Expert)
- [ ] Se connecter en expert
- [ ] Aller dans Disponibilités
- [ ] Créer une exception UNAVAILABLE
- [ ] Créer une exception CUSTOM_HOURS
- [ ] Lister toutes les exceptions
- [ ] Supprimer une exception
- [ ] Vérifier l'impact sur le calendrier de réservation

---

## 🎯 Comptes de Test

### Admin
```
Email: admin@deepinfluent.local
Mot de passe: password123
Accès: Toutes les fonctionnalités admin
```

### Expert (Marc Dubois)
```
Email: marc.dubois@email.com
Mot de passe: password123
Accès: Dashboard expert + exceptions horaires
```

### Utilisateur
```
Email: user1@email.com
Mot de passe: password123
Accès: Dashboard utilisateur + mes cours + quiz + certificats
```

---

## ⚠️ Notes Importantes

1. **Prisma Client** : Si vous voyez des erreurs `verificationStatus`, exécutez :
   ```bash
   cd backend
   rm -rf node_modules/.prisma
   npx prisma generate
   ```

2. **Ports** :
   - Frontend : http://localhost:3000
   - Backend : http://localhost:3001

3. **Base de données** : Les données de test sont déjà seedées

4. **Certificats** : Générés dans `/backend/public/certificates/`

5. **Notifications** : Activées en temps réel via Socket.io

---

## 📚 Documentation Complète

- **Backend Routes :** `backend/PHASE2_FINAL_FEATURES.md`
- **API Examples :** Inclus dans le fichier ci-dessus
- **Schema Prisma :** `backend/prisma/schema.prisma`

---

**✨ Toutes les fonctionnalités sont maintenant accessibles depuis l'interface !**

**Bonne exploration ! 🚀**
