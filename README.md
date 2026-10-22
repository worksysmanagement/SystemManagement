# Système de Gestion d'Entreprise — RKonekte

Documentation technique et guide d'exploitation de la plateforme logicielle de gestion d'entreprise, administration des ressources humaines, opérations financières et gouvernance multi-sociétés.

---

## 1. Description du Projet

Le Système de Gestion d'Entreprise RKonekte est une solution logicielle d'entreprise SaaS multi-sociétés et multi-succursales, conçue pour centraliser les processus administratifs, humains et financiers au sein d'une organisation unique ou d'un réseau multi-sites :
$$\text{Plateforme SaaS} \longrightarrow \text{Organisations (Entreprises)} \longrightarrow \text{Succursales (Sites)} \longrightarrow \text{Données Métier (Employés, Utilisateurs, Requêtes, Finances)}$$

La plateforme intègre :
- Une séparation stricte des données par entreprise (architecture multi-tenant avec `organization_id`).
- Une gestion multi-succursales avec filtrage dynamique et vue consolidée par entreprise.
- L'enrôlement rapide des collaborateurs avec génération automatique de matricule par succursale et expédition instantanée d'invitation par email (avec récapitulatif des données et lien sécurisé de définition de mot de passe).
- Le suivi en temps réel du statut de connexion des employés (**Connecté** vs **Non connecté**) et la réexpédition d'invitation par Email / WhatsApp.
- Des flux d'approbation hiérarchiques avec signature électronique certifiée.
- Un tableau de bord de supervision globale pour le super-administrateur.

---

## 2. Charte Graphique et Principes d'Interface

L'interface utilisateur respecte les normes ergonomiques et visuelles suivantes :

- Bleu Marine Principal : #062653
- Bleu Marine Sombre : #031B3A
- Orange Principal : #FF7900
- Blanc : #FFFFFF
- Fond d'écran : #F4F6F9
- Ardoise foncé (textes principaux) : #263445
- Gris ardoise (textes secondaires) : #64748B
- Bordures : #DCE2EA

### Règle de Navigation dans le Panneau Latéral (Sidebar)
- La navigation latérale est strictement textuelle. Aucune icône n'est tolérée dans le menu de navigation.
- L'élément actif est mis en évidence par une bordure gauche orange (#FF7900) et un arrière-plan bleu marine sombre (#031B3A).
- L'en-tête du panneau latéral présente le nom de l'entreprise connectée.
- Le pied du panneau latéral intègre de manière fixe le logo officiel RKonekte sur fond blanc.

### Standardisation des Badges et Indicateurs de Statut
Pour assurer une parfaite cohérence visuelle à travers l'ensemble des tableaux de requêtes (congés, révisions salariales, signatures d'autorisation) :
- **Demande Approuvée / Autorisée** : Puce circulaire à fond plein vert émeraude (`#10B981`) avec coche blanche centrée, pour une identification instantanée et harmonieuse avec les autres statuts.
- **Demande en Attente** : Puce circulaire à fond plein ambre (`#F59E0B`) avec horloge blanche.
- **Demande Refusée** : Puce circulaire à fond plein rouge (`#EF4444`) avec croix blanche.

---

## 3. Matrice des Rôles et Niveaux d'Accès

Le système repose sur un modèle RBAC clair combinant **4 niveaux hiérarchiques** et **7 rôles métiers officiels** :

### 3.1. Les Niveaux Hiérarchiques
- **DIRECTION (Niveau 1)** : Souveraineté stratégique, approbation finale et gouvernance globale.
- **MANAGEMENT (Niveau 2)** : Encadrement des pôles métier (RH, Finance, Succursales).
- **SUPERVISEUR (Niveau 3)** : Supervision intermédiaire des équipes et validation de premier niveau.
- **OPÉRATIONNEL (Niveau 4)** : Exécution des tâches métier et soumission des requêtes.

### 3.2. Les 7 Rôles Métier Officiels
1. **Super Administrateur (`SUPER_ADMIN`) — Plateforme**
   - Accès exclusif à la supervision transversale multi-entreprises (`/super-admin`).
   - Validation et activation des demandes d'adhésion en ligne des organisations clientes.
   - Création, suspension et métriques globales de la plateforme SaaS.

2. **Président Directeur Général (PDG) / Propriétaire — Direction (`ORGANIZATION_ADMIN`)**
   - Compte souverain de l'entreprise avec pleins pouvoirs d'accès et d'arbitrage (`/admin`).
   - Habilitation des signataires, plafonds financiers et validation suprême de tous les flux.
   - Paramétrage de la configuration d'entreprise et de la signature officielle.

3. **Administrateur — Direction (`ADMINISTRATEUR`)**
   - Administration opérationnelle et supervision technique déléguée par la Direction.
   - Gestion des accès, des succursales et suivi transversal des opérations.

4. **Ressources Humaines (RH) — Management (`RH` / `SECRETARY`)**
   - Tenue du registre du personnel, des contrats et des dossiers médicaux.
   - Instruction et traitement des demandes d'absence et de congés.

5. **Secrétaire — Opérationnel (`SECRETARY`)**
   - Accueil, secrétariat général, enregistrement des courriers et requêtes collaborateurs.

6. **Responsable de Succursale — Management (`BRANCH_MANAGER`)**
   - Supervision des effectifs et des opérations propres à son agence ou succursale physique.
   - Consultation des demandes locales et transmission des besoins.

7. **Responsable Financier / Comptable — Management (`FINANCIAL_MANAGER`)**
   - Gestion des flux de trésorerie (dépôts, retraits, dépenses de fonctionnement).
   - Suivi des soldes multi-comptes et multi-devises (HTG, USD).
   - Validation des bons de commande, dépenses et édition des rapports comptables.

8. **Collaborateur / Employé — Opérationnel (`EMPLOYEE`)**
   - Accès individuel pour soumettre des demandes (congés, révisions salariales, autorisations).
   - Consultation en direct du statut d'instruction de ses dossiers et accès à son attestation certifiée.

---

## 4. Architecture des Modules Fonctionnels

### 4.1. Portail Public et Adhésion
- Connexion Sécurisée (/login) : Authentification unifiée pour les administrateurs et collaborateurs.
- Demande d'Adhésion Entreprise (/register-company) : Formulaire d'inscription pour les entreprises souhaitant rejoindre le système.
- Formulaire de Dépôt de Congé (/submit) : Formulaire officiel structuré en 5 sections (Informations employé, Détails du congé, Remplaçant, Coordonnées, Signature) avec calcul automatique des jours et suivi en direct.
- Suivi Salarié Sécurisé (/request/[token]) : Page de consultation du statut en temps réel (en attente, approuvé, refusé) accessible sans mot de passe via un jeton unique chiffré.

### 4.2. Espace Super-Admin (/super-admin)
- Tableau de Bord Global (/super-admin) : Statistiques du réseau d'entreprises et journal d'activité.
- Demandes d'Adhésion (/super-admin/onboarding-requests) : File d'attente d'approbation ou de rejet en un clic des dossiers de souscription en ligne.
- Gestion des Entreprises (/super-admin/organizations) : Répertoire des organisations clientes, statut opérationnel et administration des fiches.
- Nouvelle Entreprise (/super-admin/organizations/new) : Création manuelle d'une organisation avec génération du compte administrateur initial.

### 4.3. Espace Administration d'Entreprise (/admin)
- Tableau de Bord (/admin/dashboard) : Indicateurs clés consolidés (effectif total, congés en cours, requêtes en attente, solde financier).
- Module REQUEST :
  - **Demande de Congé (`/admin/requests`) & Formulaire Officiel Salarié** :
    - Interface bi-mode : Espace collaborateur (« Nouvelle demande » avec icône Plus, « Mes demandes » avec réveil jaune abricot) et traitement administratif des absences avec filtre par statut (En attente, Approuvée, Refusée) et instruction détaillée (`/admin/requests/[id]`).
    - **Bandeau Collaborateur Épuré & Typographie Haute Lisibilité** :
      - Titre stable du module (« Mon Espace Congés », « Demande d'augmentation », « Signature d'autorisation », « Mon Espace Événements ») conservé en permanence sans afficher le nom du compte (les informations du compte étant dédiées à un espace de profil distinct), éliminant tout clignotement ou transition asynchrone au chargement.
      - Bloc matricule (sans icône superflue), établissement et poste sans conteneur de fond (suppression du background gris) avec typographie en gras (`font-bold`) et matricule orange distinctif.
    - **Conformité stricte au Formulaire Papier Entreprise en 5 sections numérotées** :
      1. *Informations sur l'Employé :* Nom, Prénom, Numéro d'Employé (pré-remplis automatiquement depuis le profil connecté `/api/admin/my-profile`), Département et Poste.
      2. *Détails de la Demande de Congé :* Type de congé officiel (Congé Annuel, Congé Maladie, Congé Sans Solde, Congé de Maternité/Paternité, Autre à préciser) en sélection Bleu Marin (`#062653`), Dates de Début et de Fin (JJ/MM/AAAA), et Nombre de Jours de Congé Demandés (calculé dynamiquement dans un encadré grisé `bg-slate-100` en lecture seule, évitant toute confusion avec un champ modifiable).
      3. *Remplaçant Proposé (si applicable) :* Nom complet du collaborateur remplaçant.
      4. *Coordonnées Pendant le Congé :* Numéro de Téléphone et Adresse Email.
      5. *Signature de l'Employé (2 Modes Exclusifs & Nettoyage Transparent)* :
         - **Uploader une image (Mode par défaut & préconisé)** : Importation directe d'une photo ou d'un scan de signature manuscrite (PNG, JPG, WEBP) avec algorithme client de détourage automatique haute précision (calcul de luminance avec lissage antialiasing des contours) qui s'appuie sur un algorithme client de **détourage automatique adaptatif haute précision** (signature.ts). Grâce à une modélisation locale du fond par grille dynamique et interpolation bilinéaire, l'algorithme cartographie les variations d'éclairage et élimine intégralement les fonds de papier ombragés, gris-bleu ou jaunis pris avec un smartphone, tout en supprimant les filigranes et le texte au verso visible par transparence. Les traits d'encre (stylo bleu, noir) sont conservés avec netteté, rehaussement subtil de contraste et antialiasing pour un rendu transparent sans aucun cadre blanc ou gris disgracieux. La mention « Arrière-plan retiré (transparent) » est sobrement affichée en texte gris pâle épuré sans fond vert ni icône parasite.
         - **Écrire mon nom (Police Calligraphique WindSong)** : Génération instantanée d'une signature calligraphique officielle et élégante utilisant la typographie manuscrite **WindSong** avec déliés raffinés, prévisualisation dynamique haute fidélité (`.font-windsong`, `text-3xl sm:text-4xl`) et pré-remplissage du nom complet.
         - Date du jour (JJ/MM/AAAA) et attestation sur l'honneur d'exactitude des renseignements.
    - **Boutons de Soumission Vert Émeraude (`bg-emerald-600`) & Contrôle Strict de Remplissage Intégral** :
      - Dans **tous les formulaires** (Demande de congé collaborateur et public, Augmentation de salaire, Signature d'autorisation, Création d'employé, Décisions RH), le bouton de soumission reste **strictement grisé et non-cliquable** (`disabled:bg-slate-300`, `disabled:text-slate-500`, `disabled:cursor-not-allowed`, `disabled:shadow-none`) tant que **la totalité des informations obligatoires** n'a pas été rigoureusement complétée (champs requis, dates valides, signature conforme téléversée ou calligraphique, et attestation sur l'honneur cochée).
    - **Charte Visuelle Bleu Marin Institutionnelle (`#062653`) & Pastilles Circulaires Pures** : Remplacement des boutons radio natifs du navigateur par des puces circulaires élégantes (100% rondes avec pastille centrale, éliminant tout rectangle ou carré de focus indésirable du navigateur), encadré de durée grisé en lecture seule et application du Bleu Marin institutionnel pour les cartes de sélection et les contours de focus des champs.
  - **Augmentation de Salaire (`/admin/requests/salary-raise`)** : Instruction des demandes d'ajustement salarial avec simulation d'impact budgétaire, bandeau collaborateur épuré, bouton de soumission vert émeraude conditionné au remplissage exhaustif (salaire actuel, sollicité, devise et justification), historique collaborateur (« Mes demandes » avec icône réveil jaune abricot) et décision formelle.
  - **Signature d'Autorisation (`/admin/requests/signature-auth`)** : Validation des bons de commande, ordres de mission et décaissements urgents avec spécimen de signature officiel, bandeau collaborateur harmonisé et bouton d'envoi vert émeraude conditionné au renseignement du document (type, référence et description).
  - **Charte Visuelle des Statuts & Navigation (Ronds Pleins)** :
    - 🟠 **En attente & Onglet « Mes demandes »** : Cercle plein jaune abricot (`#F59E0B`) avec réveil à aiguilles blanches.
    - 🟢 **Approuvée & Actif** : Cercle plein vert émeraude (`#10B981`) avec coche de succès blanche.
    - 🔴 **Refusée & Désactivé** : Cercle plein rouge corail (`#EF4444`) avec croix blanche.
- Module ÉVÉNEMENTS & CALENDRIER (/admin/events) :
  - **Planification d'Événements Personnels (Collaborateur) vs Planification de l'Administration (Admin)** :
    - *Vue Collaborateur / Non-administrative* : Bouton « + Événement perso » dans le bandeau d'en-tête, sur chaque cellule du calendrier et dans la carte « Journée sélectionnée ». Permet au collaborateur de planifier ses événements personnels privés (rendez-vous médical, rappel/mémo, tâche personnelle, démarche administrative, congé) avec heure, lieu, note et rappel. Ces événements sont strictement confidentiels et visibles uniquement par l'employé qui les a créés.
    - *Vue Administration* : La partie supérieure et les boutons d'ajout sont remplacés par la **« Planification de l'administration »** : publication officielle d'événements d'entreprise (réunions d'équipe, formations, congés collectifs, annonces) avec ciblage d'audience (général, département, succursale, sur-mesure) et alertes par notification et courriel.
  - **État initial vide par défaut** : Initialisation à zéro événement tant que l'administration n'en a pas planifié.
  - **Panneau latéral droit épuré** : Présence de la seule carte fluide « Journée sélectionnée », avec action directe de planification adaptée au rôle (perso ou administration).
- Module EMPLOYÉS :
  - **Liste des Employés (`/admin/employees`)** :
    - Recherche multicritère, filtrage dynamique par succursale ou mode consolidé d'entreprise.
    - Indicateur visuel de connexion en direct (🟢 Connecté, 🟠 Non connecté, ⚪ Sans compte).
    - Tiroir de consultation rapide et modal d'édition RH complète.
    - **Habilitation & Clé d'Accès 🔑 avec Confirmation Préalable Obligatoire** :
      - Tout clic sur l'icône Clé ouvre systématiquement une **modale de confirmation** avant tout envoi réseau.
      - Permet à l'administrateur de vérifier l'identité du collaborateur, de renseigner ou corriger son adresse e-mail professionnelle, et de désigner son rôle parmi les 7 rôles système officiels.
      - Génération instantanée d'un lien d'activation partageable par Email officiel SMTP ou directement sur WhatsApp.
  - **Fiche d'Ajout Collaborateur (`/admin/employees/new`)** :
    - Formulaire fluide en écran unique avec détection automatique du pays de l'entreprise (`PhoneCountryInput`).
    - Option de découplage **« Créer un compte d'accès utilisateur »** (activée par défaut, désactivable pour un collaborateur géré uniquement en dossier RH).
    - **Sélecteur de Rôle Attribué \*** dès la création : permet de qualifier immédiatement le profil d'accès (Direction, RH, Secrétaire, Succursale, Finance, Collaborateur).
    - **Incrémentation Automatique Séquentielle du Matricule & Unicité Stricte** : Remplacement de l'ancien tirage aléatoire par une attribution incrémentielle automatique (`001`, `002`, `003`...) calculée sur la base des collaborateurs de l'entreprise. Index d'unicité physique en base de données et contrôle applicatif empêchant formellement toute collision de matricule entre deux collaborateurs d'une même organisation.
- Module SUCCURSALES :
  - Liste des Succursales (`/admin/branches`) : Gestion complète des implantations physiques (code succursale, nom, ville, adresse, responsable désigné), calcul en temps réel de l'effectif rattaché par succursale, modification et suppression.
  - Nouvelle Succursale (`/admin/branches/new`) : Enregistrement d'un nouvel établissement avec attribution du code succursale servant de préfixe aux matricules employés.
  - Sélecteur Global de Succursale (`AdminHeader`) : Présent dans l'en-tête de toute l'administration, permettant de basculer instantanément d'une succursale à une autre ou de consulter les données en vue consolidée (« Toutes les succursales »).
- Module OPÉRATIONS FINANCIÈRES (`/admin/financial-operations`) :
  - Onglet Dépôts bancaires : Enregistrement des bordereaux de versement.
  - Onglet Retraits bancaires : Suivi des décaissements et chèques émis.
  - Onglet Dépenses : Traitement des dépenses de fonctionnement et achats au comptant.
- Module RAPPORTS FINANCIERS (`/admin/financial-reports`) :
  - Périodes d'analyse : quotidienne, hebdomadaire, mensuelle, annuelle.
  - Ventilation par compte et devise : HTG, USD, Unibank (HTG/USD), Sogebank (HTG/USD), BNC (HTG/USD), EZIPAY, WALLET.
  - Suivi des factures à crédit et états comptables imprimables.
- Module GESTION DES ACCÈS & SÉCURITÉ :
  - **Liste des Utilisateurs (`/admin/users`)** :
    - Registre épuré des comptes utilisateurs habilités.
    - Architecture cohérente : aucun utilisateur orphelin (tout utilisateur découle d'un dossier employé).
    - Bouton d'action directe **« Habiliter un employé »** dirigeant vers le registre du personnel.
    - Affichage typographique sobre des rôles système (fonds et conteneurs de badges supprimés pour une lecture claire).
  - **Rôles & Permissions (`/admin/users/roles`)** :
    - Matrice granulaire des privilèges par module (lecture, création, modification, suppression).
    - Rattachement aux 4 niveaux hiérarchiques souverains.
  - **Droits de Signature & Spécimens Transparents (`/admin/users/signatures`)** :
    - Gestion des délégations numériques enregistrées en base Supabase (`signature_delegations`).
    - Attribution des compétences de signature : congés, augmentations salariales, autorisations financières avec plafonds en Gourdes (HTG).
    - **Spécimens Transparents (PNG sans arrière-plan)** :
      - Aperçu sur damier de transparence professionnel.
      - Outil intelligent Canvas **« Enlever le fond blanc »** pour isoler les signatures tracées ou numérisées sur papier.
      - Apposition automatique du visa et de la signature transparente sur les attestations d'approbation et PDF officiels imprimables (`/request/[token]` et `/admin/requests/[id]`).
- Module SYSTÈME & CONFIGURATIONS (`/admin/configuration/*`) :
  - **Menu Parent « Configurations » avec Accordéon et Sous-onglets Horizontaux** :
    - Regroupement structuré sous un menu parent unique dans le panneau latéral avec icône officielle `/icons/sidebar/config.png` et déploiement accordéon.
    - Barre de navigation horizontale par sous-onglets (`ConfigurationLayout`) en tête de page permettant de basculer facilement d'un onglet à l'autre.
    - **Sous-onglets Administrateur (5 onglets complets)** :
      1. **Préférences Générales** (`/admin/configuration`) : Dénomination sociale, langue du système, devise comptable principale et format de date officiel (épuration des sélecteurs superflus de thème et fuseau horaire).
      2. **Création de Signature** (`/admin/configuration/signature`) : Espace dédié de traçage ou téléversement d'image scannée avec suppression automatique du fond blanc et aperçu transparent.
      3. **Mon Dossier Personnel** (`/admin/configuration/profile`) : Informations d'affectation (matricule, succursale, rôle et département en lecture seule assignés par la Direction, affichés « Non renseigné » par défaut sans injection de titre arbitraire), coordonnées de contact, état civil, groupe sanguin, contacts d'urgence (nom complet, relation/lien de parenté et numéro de téléphone d'urgence).
      4. **Sécurité du Compte** (`/admin/configuration/security`) : Modification du mot de passe, authentification à deux facteurs et sessions.
      5. **Paramètres de Notification** (`/admin/configuration/notifications`) : Définition des règles d'alerte email, WhatsApp et in-app.
    - **Sous-onglets Employé / Collaborateur (Strictement 2 onglets autorisés)** :
      - Seuls **« Mon dossier personnel »** et **« Sécurité du compte »** sont visibles et accessibles (filtrage automatique côté sidebar et barre d'onglets).
- Module NOTIFICATIONS (`/admin/notifications`) :
  - **Vue Administrateur** : Centre de triage en temps réel des requêtes entrantes avec filtrage par catégorie (Toutes, Non lues, Congés, Augmentations, Signatures), recherche textuelle et accès direct aux dossiers.
  - **Vue Employé / Collaborateur** : Flux d'alertes administratives officielles, notes de service et décisions RH émises par la Direction (initialisé à 0 alerte par défaut sans mélange avec les requêtes d'autres employés).
- Module SUPPORT & MANUEL D'UTILISATION (`/admin/support`) :
  - **Vue Administrateur** : Manuel exhaustif couvrant l'ensemble des 10 modules d'entreprise (Tableau de bord, Requêtes, Employés, Succursales, Opérations financières, Rapports financiers, Événements, Gestion des accès, Notifications, Configurations) avec guides pas-à-pas et accès direct aux onglets.
  - **Vue Employé / Collaborateur** : Manuel ciblé affichant **exclusivement les 5 onglets accessibles par le collaborateur** (*Requêtes & Demandes*, *Événements & Calendrier*, *Centre de Notifications*, *Mon Dossier Personnel*, *Sécurité du Compte*). Masquage intégral des modules d'administration pour éviter toute confusion et protéger la gouvernance interne. FAQ et formulaire de contact adaptés au collaborateur.

---

## 5. Spécifications Techniques

### Technologies Employées
- Framework Principal : Next.js 16 avec React 19 et moteur Turbopack
- Typage : TypeScript avec typage strict activé
- Feuilles de Style : Tailwind CSS
- Bibliothèque d'Icônes Contextuelles : Lucide React (usage interne aux formulaires et cartes, proscrit dans le panneau latéral)
- Moteur de Base de Données :
  - **Production / Cloud** : Supabase PostgreSQL Cloud (client REST/PostgREST haute performance et politiques RLS)
  - **Local / Fallback** : SQLite avec Drizzle ORM
- Service d'Expédition de Courriels : Nodemailer via SMTP (e-mails transactionnels d'invitation, réinitialisation de mot de passe, alertes)
- Couche ORM : Drizzle ORM avec requêtes paramétrées
- Validation des Schémas : Zod
- Suite de Tests : Vitest

### Sécurité et Isolation des Données
- Isolation Multi-Tenant : Toutes les requêtes en base de données filtrent obligatoirement sur l'identifiant organisationnel vérifié issu de la session serveur (`organizationId`).
- Isolation Multi-Succursales : Filtrage contextuel par `branch_id` ou consolidation d'entreprise.
- Gestion des Invitations Sécurisées : Les nouveaux employés sont provisionnés avec un mot de passe temporaire verrouillé (`NO_PASSWORD_SET`) et un jeton unique chiffré stocké dans `audit_logs` avec expiration.
- Chiffrement des Accès : Les mots de passe finaux sont hachés via condensats cryptographiques sécurisés.
- Protection XSS et Injections : Nettoyage systématique des entrées utilisateurs et requêtes préparées.
- Sessions : Jetons de session JWT signés et stockés dans un cookie HTTP-only sécurisé.

---

## 6. Structure des Données

La base de données repose sur les entités principales suivantes :

- organizations : Informations relatives aux entreprises clientes (identifiant, nom, slug, coordonnées, statut).
- branches : Établissements et succursales de l'entreprise (identifiant, organization_id, code, nom, ville, adresse, responsable).
- organization_roles : Profils de rôles personnalisés par entreprise avec matrice de permissions granulaires par module.
- users : Comptes d'accès (identifiant, organization_id, branch_id, nom, email, mot de passe chiffré, rôle, statut).
- employees : Personnel sous contrat (identifiant, organization_id, branch_id, matricule préfixé par la succursale, nom, prénom, département, poste, date de naissance `birth_date`, domaine d'étude `study_domain`, groupe sanguin `blood_group`, notes médicales/allergies `medical_notes`, contact d'urgence `emergency_contact_name`, téléphone d'urgence `emergency_contact_phone`, téléphone WhatsApp, courriel, statut). Synchronisation et auto-complétion instantanées sur tous les formulaires (congés, augmentations, signatures).
- leave_requests : Demandes de congé (identifiant, organization_id, branch_id, numéro formel CONG-AAAA-XXXX, type d'absence, dates, durée, remplaçant, statut de décision, jeton d'accès sécurisé).
- salary_raise_requests : Demandes d'augmentation de salaire (identifiant, organization_id, collaborateur, montant actuel, montant sollicité, motif, statut).
- signature_auth_requests : Demandes d'autorisation et décaissements (identifiant, organization_id, objet, montant, devise, signataire habilité, empreinte de signature).
- signature_delegations : Délégations de signature électronique enregistrées en base (identifiant, organization_id, user_id, can_sign_leaves, can_sign_salary_raises, can_sign_authorizations, spending_limit_htg, statut, horodatage).
- financial_transactions : Écritures de trésorerie (identifiant, organization_id, date, type d'opération, compte concerné, montant, devise, justificatif).
- audit_logs : Journal des événements, actions d'administration et tokens d'invitation d'activation de compte (`EMPLOYEE_INVITATION`).

---

## 7. Procédure d'Installation et d'Exécution

### Prérequis
- Node.js version 18 ou supérieure
- Gestionnaire de paquets npm

### Installation des Dépendances
```bash
npm install
```

### Configuration de l'Environnement
Créer un fichier `.env` à la racine du projet et renseigner les variables d'environnement requises :
```bash
SESSION_SECRET="votre-cle-secrete-de-session-d-au-moins-32-caracteres"
DATABASE_URL="sqlite.db"

# Supabase PostgreSQL Cloud
NEXT_PUBLIC_SUPABASE_URL="https://votre-projet.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="votre-anon-key"
SUPABASE_SERVICE_ROLE_KEY="votre-service-role-key"

# Configuration SMTP (Envoi des invitations et réinitialisation de mot de passe)
SMTP_HOST="smtp.exemple.com"
SMTP_PORT="465"
SMTP_USER="notifications@rkonekte.com"
SMTP_PASS="votre-mot-de-passe-smtp"
SMTP_FROM="RKonekte <notifications@rkonekte.com>"
```

### Initialisation de la Base de Données

1. **Migration Multi-Tenant Supabase (PostgreSQL Cloud)** :
   Exécutez le script SQL idempotent dans l'éditeur SQL de votre tableau de bord Supabase :
   ```bash
   scripts/multi-tenant-setup.sql
   ```
   *Ce script ajoute `branch_id`, crée la table `organization_roles`, active la sécurité RLS et provisionne automatiquement la succursale « Siège Principal » pour chaque entreprise.*

2. **Base locale SQLite (Développement local / Tests)** :
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

### Lancement du Serveur de Développement
```bash
npm run dev
```
Le système sera accessible à l'adresse : http://localhost:3000

---

## 8. Identifiants de Test Administrateur

Un compte Super Administrateur est configuré par défaut dans le jeu d'essai :

- Adresse électronique : pitonrodjy@gmail.com
- Mot de passe : pitonrp8
- Rôle attribué : Super Administrateur
- URL d'accès direct : http://localhost:3000/super-admin

---

## 9. Validation et Contrôle Qualité

### Exécution des Tests Automatisés
La suite de tests unitaires et d'intégration valide les flux d'approbation, l'étanchéité multi-tenant et la robustesse de sécurité :
```bash
npm test
```
Résultat attendu : 23 tests réussis sans erreur.

### Vérification du Typage TypeScript
```bash
npx tsc --noEmit
```
Résultat attendu : 0 erreur de typage sur l'ensemble de la base de code.

### Vérification de la Compilation de Production
Pour compiler et vérifier l'intégrité de l'ensemble des routes Next.js :
```bash
npm run build
```
Résultat attendu : Compilation réussie de l'ensemble des routes.

### Optimisation Ergonomique & Architecture des Espaces Collaborateur
- **Standardisation des Boutons d'Action Principaux (Vert Émeraude) :**
  - Harmonisation complète de tous les boutons de validation et d'enregistrement en vert émeraude institutionnel (`bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold`) :
    - *« Enregistrer les modifications »* (Préférences générales & Notifications).
    - *« Valider ce spécimen »* (Création de signature numérique).
    - *« Mettre à jour le mot de passe »* (Sécurité du compte).
    - *« Enregistrer mes informations »* (Mon dossier personnel).
- **Bouton d'Effacement Rouge Solide :**
  - Bouton *« Effacer »* du traceur de signature en rouge vif plein (`bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold`).
- **Épuration de la Page Signature :**
  - Suppression du bandeau d'avertissement orange « Spécimen Officiel de Signature Électronique » pour un accès direct et épuré au canevas de tracé et d'importation.
- **Cloisonnement Strict du Menu Collaborateur / Employé :**
  - Les collaborateurs disposent d'un accès strictement limité dans le groupe de configuration :
    - **Mon dossier personnel** (`/admin/configuration/profile`) : consultation et mise à jour des coordonnées personnelles, groupe sanguin, contacts d'urgence.
    - **Sécurité du compte** (`/admin/configuration/security`) : centré exclusivement sur la modification sécurisée du mot de passe de leur compte actif.
  - Masquage intégral et redirection automatique pour les modules administratifs hors périmètre (*« Préférences générales »*, *« Création de signature »*, *« Paramètres de notification »*).
  - Épuration de la page de sécurité collaborateur : masquage de la double authentification globale et de la gestion des sessions réseau.
  - Endpoint serveur dédié `POST /api/auth/change-password` vérifiant le mot de passe actuel avant hachage PBKDF2 et mise à jour atomique.
- **Planification d'Événements Personnels Collaborateur :**
  - Maintien du bouton **« Planifier un événement perso »** dans l'encadré « Journée sélectionnée », dans son état vide (*« Aucun événement programmé pour cette journée »*) et au survol des cellules du calendrier pour les collaborateurs.
  - En-tête supérieur du collaborateur épuré (sans bouton parasite en haut), tandis que l'administration dispose en haut du bouton officiel **« Planification de l'administration »**.
- **Épuration du Centre de Notifications Collaborateur :**
  - Suppression complète de la barre de filtrage (*« Non lues »*, *« Communications officielles »*, *« Décisions RH »*) et du champ de recherche pour les collaborateurs, pour un flux de réception direct, fluide et sans encombrement visuel.
