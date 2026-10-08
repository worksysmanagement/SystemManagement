# System Management — Plateforme de Gestion des Congés & Employés

Plateforme SaaS moderne et multi-entreprises pour la gestion des demandes de congés, le suivi des employés, les approbations administratives et les notifications automatisées (Email & WhatsApp).

## 🚀 Fonctionnalités Clés

- **Multi-Tenant / Multi-Entreprises** : Isolation stricte des données entre organisations avec codes uniques par entreprise.
- **Formulaire de Demande Public** : Dépôt de congés avec calcul automatique des jours ouvrés et validation en temps réel.
- **Portail Suivi Salarié Sécurisé** : Consultation du statut de la demande via token hashé (sans mot de passe).
- **Tableau de Bord Administrateur** : Validation / Rejet avec motif, statistiques des congés et gestion des employés.
- **Espace Super-Admin** : Gestion globale des organisations et métriques transversales.
- **Notifications Multicanales** : Alertes automatiques par Email (Resend) et liens WhatsApp directs.
- **Base de Données Performante** : SQLite local avec Drizzle ORM et compatibilité Cloudflare D1 en production.

---

## 🛠️ Stack Technique

- **Framework** : Next.js 16 (App Router, Turbopack, React 19)
- **Base de Données & ORM** : SQLite / Cloudflare D1 avec Drizzle ORM
- **Styling** : Tailwind CSS, Lucide Icons
- **Validation** : Zod
- **Tests** : Vitest (19 tests d'intégration et unitaires)

---

## 📦 Installation & Démarrage

`ash
# 1. Installer les dépendances
npm install

# 2. Configurer les variables d'environnement
# Créez un fichier .env basé sur vos besoins

# 3. Initialiser et migrer la base de données
npm run db:migrate
npm run db:seed

# 4. Lancer le serveur de développement
npm run dev
`

L'application sera accessible sur http://localhost:3000.

---

## 🧪 Tests

Pour exécuter la suite de tests automatisés :

`ash
npm test
`
