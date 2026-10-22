"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  LayoutDashboard,
  FileText,
  Users,
  User,
  Building,
  DollarSign,
  TrendingUp,
  Calendar,
  Shield,
  Bell,
  Settings,
  Mail,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  Send,
  Loader2,
} from "lucide-react";

interface TabManual {
  id: string;
  name: string;
  href?: string;
  icon: any;
  category: "Général" | "Opérations" | "Finances" | "Système";
  summary: string;
  targetRoles: string[];
  features: {
    title: string;
    description: string;
    steps?: string[];
  }[];
  tips: string[];
  rules: string[];
}

const ADMIN_MODULES_MANUAL: TabManual[] = [
  {
    id: "dashboard",
    name: "Tableau de bord",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    category: "Général",
    summary:
      "Cockpit central offrant une vision en temps réel des indicateurs clés (KPIs) de performance, des requêtes en cours et de la masse salariale.",
    targetRoles: [
      "Président Directeur Général (PDG)",
      "Administrateur d'Entreprise",
      "Responsable Financier",
      "Secrétaire / RH",
      "Responsable de Succursale",
    ],
    features: [
      {
        title: "Cartes d'indicateurs clés (KPIs)",
        description:
          "Visualisez instantanément 7 indicateurs fondamentaux : Total des demandes, Demandes approuvées, Demandes en attente, Demandes refusées, Effectif total d'employés, Succursales actives et Utilisateurs système enregistrés.",
        steps: [
          "Consultez les cartes colorées en haut de page dès votre connexion.",
          "Survolez les compteurs pour voir les pourcentages d'évolution.",
        ],
      },
      {
        title: "Graphiques et répartition analytique",
        description:
          "Consultez la répartition des demandes par type (Congés annuels, Maladie, Maternité/Paternité, Sans solde) et l'historique chronologique de l'activité.",
      },
      {
        title: "Raccourcis d'actions rapides",
        description:
          "Accédez en un clic à l'approbation des requêtes urgentes, à l'ajout d'un nouvel employé ou au centre de notifications.",
      },
    ],
    tips: [
      "Vérifiez le compteur des 'Demandes en attente' dès le matin pour éviter tout retard administratif.",
      "Le tableau de bord s'actualise automatiquement à chaque nouvelle action effectuée dans l'entreprise.",
    ],
    rules: [
      "Les responsables de succursale voient uniquement les statistiques de leur propre agence.",
      "Le PDG et l'Administrateur ont une vue globale consolidée sur toute l'organisation.",
    ],
  },
  {
    id: "requests",
    name: "Requêtes & Demandes",
    href: "/admin/requests",
    icon: FileText,
    category: "Opérations",
    summary:
      "Module de traitement des demandes de congés, d'augmentations salariales et des autorisations de signature numérique.",
    targetRoles: [
      "PDG",
      "Administrateur",
      "Secrétaire / RH",
      "Responsable de Succursale",
    ],
    features: [
      {
        title: "Traitement d'une demande de congé",
        description:
          "Examinez les détails soumis par l'employé (période, motif, remplaçant proposé, contact WhatsApp) et prenez une décision formelle.",
        steps: [
          "Cliquez sur une demande dans la liste pour ouvrir le panneau d'inspection.",
          "Pour approuver : cliquez sur 'Approuver', saisissez éventuellement un commentaire de direction, puis confirmez.",
          "Pour refuser : cliquez sur 'Refuser' et indiquez obligatoirement le motif du refus (minimum 3 caractères).",
          "Un e-mail de notification officiel avec reçu certifié est immédiatement expédié à l'employé.",
        ],
      },
      {
        title: "Demandes d'augmentation de salaire",
        description:
          "Suivi des requêtes d'ajustement salarial avec montant actuel, montant demandé et justification managériale.",
      },
      {
        title: "Autorisations de signature numérique",
        description:
          "Validation des actes officiels nécessitant le contreseing d'un signataire habilité.",
      },
    ],
    tips: [
      "Utilisez les filtres par statut ('En attente', 'Approuvée', 'Refusée') pour trier les dossiers prioritaires.",
      "Tout refus exige une justification claire afin de respecter la législation du travail et la traçabilité RH.",
    ],
    rules: [
      "Une demande validée ou refusée ne peut plus être modifiée afin de garantir l'intégrité de la piste d'audit.",
      "Chaque décision est signée électroniquement avec horodatage certifié.",
    ],
  },
  {
    id: "employees",
    name: "Gestion des Employés",
    href: "/admin/employees",
    icon: Users,
    category: "Opérations",
    summary:
      "Registre centralisé du personnel, gestion des dossiers individuels, des coordonnées d'urgence et des rattachements hiérarchiques.",
    targetRoles: [
      "PDG",
      "Administrateur",
      "Ressources Humaines (RH)",
      "Secrétaire",
    ],
    features: [
      {
        title: "Créer une fiche employé",
        description:
          "Enregistrez un nouveau collaborateur avec ses informations complètes pour l'intégrer au système.",
        steps: [
          "Allez dans 'Employés' puis cliquez sur 'Ajouter un employé' (ou '/admin/employees/new').",
          "Renseignez le prénom, nom, matricule d'employé, département et poste.",
          "Indiquez le numéro de téléphone (utilisé pour les alertes WhatsApp) et l'adresse e-mail.",
          "Assignez l'employé à sa succursale d'affectation.",
          "Validez l'enregistrement.",
        ],
      },
      {
        title: "Recherche et filtres multicritères",
        description:
          "Recherchez instantanément par nom, prénom, numéro d'employé, département ou succursale.",
      },
      {
        title: "Historique et statut du personnel",
        description:
          "Basculez le statut d'un employé entre 'Actif' et 'Inactif' lors d'un départ ou d'une fin de contrat.",
      },
    ],
    tips: [
      "Assurez-vous que le numéro de téléphone de l'employé est au format valide (ex: +509 XXXX-XXXX) pour garantir la réception des reçus de congés.",
      "Le matricule d'employé doit être unique au sein de votre entreprise.",
    ],
    rules: [
      "La suppression définitive d'un employé est restreinte pour préserver l'historique comptable et les audits passés.",
    ],
  },
  {
    id: "branches",
    name: "Gestion des Succursales",
    href: "/admin/branches",
    icon: Building,
    category: "Opérations",
    summary:
      "Cartographie des agences, magasins et bureaux régionaux de votre entreprise avec désignation des gestionnaires locaux.",
    targetRoles: ["PDG", "Administrateur d'Entreprise"],
    features: [
      {
        title: "Ajout d'une succursale",
        description:
          "Créez une nouvelle implantation physique pour répartir vos effectifs et vos opérations.",
        steps: [
          "Dans l'onglet 'Succursales', cliquez sur 'Nouvelle succursale'.",
          "Saisissez le code agence (ex: SUC-002), le nom et la ville (ex: Cap-Haïtien, Pétion-Ville).",
          "Indiquez l'adresse physique, le responsable d'agence et le numéro de téléphone.",
          "Enregistrez pour activer immédiatement l'agence.",
        ],
      },
      {
        title: "Suivi des effectifs par agence",
        description:
          "Consultez en un coup d'œil le nombre total d'employés et de requêtes rattachés à chaque succursale.",
      },
    ],
    tips: [
      "Attribuez des codes courts et standardisés à vos succursales (ex: CAP-01, PAP-HQ) pour faciliter les rapprochements comptables.",
    ],
    rules: [
      "Une succursale ne peut pas être supprimée si elle contient encore des employés actifs. Réaffectez les employés avant toute fermeture d'agence.",
    ],
  },
  {
    id: "financial-operations",
    name: "Opérations Financières",
    href: "/admin/financial-operations",
    icon: DollarSign,
    category: "Finances",
    summary:
      "Journal des encaissements, décaissements de caisse, avances sur salaire et gestion multi-devises (HTG et USD).",
    targetRoles: [
      "PDG",
      "Administrateur",
      "Responsable Financier / Comptable",
    ],
    features: [
      {
        title: "Enregistrer une opération de caisse",
        description:
          "Tracez chaque entrée ou sortie d'argent de l'entreprise avec référence de justificatif.",
        steps: [
          "Cliquez sur 'Nouvelle opération'.",
          "Choisissez la nature : 'Dépôt / Entrée' ou 'Retrait / Décaissement'.",
          "Sélectionnez la devise (Gourdes HTG ou Dollars USD) et saisissez le montant.",
          "Indiquez la succursale, le tiers concerné et le motif de l'opération.",
          "Validez pour impacter le solde de caisse.",
        ],
      },
      {
        title: "Plafonds financiers et autorisations",
        description:
          "Vérification automatique des plafonds de décaissement selon les prérogatives du gestionnaire connecté.",
      },
    ],
    tips: [
      "Conservez toujours le numéro de pièce comptable ou de facture dans le champ 'Référence' pour faciliter les audits de fin de mois.",
    ],
    rules: [
      "Toute écriture financière validée est irréversible. Les corrections doivent être enregistrées sous forme d'écriture de contre-passation.",
    ],
  },
  {
    id: "financial-reports",
    name: "Rapports Financiers",
    href: "/admin/financial-reports",
    icon: TrendingUp,
    category: "Finances",
    summary:
      "Bilans analytiques périodiques (mensuels et annuels), états de trésorerie consolidés et exports pour l'administration fiscale et la direction.",
    targetRoles: [
      "PDG",
      "Administrateur",
      "Responsable Financier / Comptable",
    ],
    features: [
      {
        title: "Génération du rapport mensuel",
        description:
          "Synthèse complète des entrées, sorties, salaires versés et soldes nets pour le mois sélectionné.",
        steps: [
          "Accédez à 'Rapports financiers' puis sélectionnez la période souhaitée (Mensuel ou Annuel).",
          "Basculez entre l'onglet 'Gourdes (HTG)' et 'Dollars (USD)'.",
          "Consultez les totaux consolidés et la ventilation par succursale.",
          "Cliquez sur 'Imprimer / Exporter' pour obtenir le document officiel prêt pour la direction.",
        ],
      },
      {
        title: "Bilan annuel comparatif",
        description:
          "Analyse de l'évolution financière annuelle avec graphiques de performance et courbes de trésorerie.",
      },
    ],
    tips: [
      "Exportez vos rapports mensuels au format PDF avant le 5 de chaque mois pour vos archives administratives.",
    ],
    rules: [
      "Seuls les comptes ayant les permissions financières peuvent consulter les bilans et états bancaires de l'entreprise.",
    ],
  },
  {
    id: "events",
    name: "Événements & Calendrier",
    href: "/admin/events",
    icon: Calendar,
    category: "Opérations",
    summary:
      "Planning d'entreprise interactif permettant de programmer des réunions, formations ou congés collectifs et de diffuser des alertes ciblées.",
    targetRoles: [
      "PDG",
      "Administrateur",
      "Secrétaire / RH",
      "Responsables de succursale",
    ],
    features: [
      {
        title: "Programmer un événement avec alerte",
        description:
          "Créez une activité sur le calendrier et diffusez une notification instantanée aux employés concernés.",
        steps: [
          "Dans 'Événements', cliquez sur 'Programmer un événement' ou sur un jour du calendrier.",
          "Renseignez le titre (ex: Réunion générale trimestrielle), la date et l'horaire.",
          "Choisissez le type : Réunion, Formation, Férié / Congé collectif, Atelier ou Annonce.",
          "Définissez l'audience ciblée : 'Tous les employés du système', 'Par département', 'Par succursale' ou 'Employés spécifiques'.",
          "Cochez l'option d'alerte immédiate et de rappel automatique 24h avant.",
          "Enregistrez : les employés ciblés reçoivent l'alerte dans leur centre de notifications.",
        ],
      },
      {
        title: "Vue Calendrier Mensuel interactif",
        description:
          "Naviguez entre les mois, visualisez les pastilles d'événements par code couleur et cliquez sur une date pour afficher ses détails.",
      },
    ],
    tips: [
      "Utilisez le filtre par audience pour afficher uniquement les événements qui concernent votre département ou succursale.",
      "Programmez les jours fériés et fermetures collectives au moins 2 semaines à l'avance.",
    ],
    rules: [
      "Les alertes générales d'entreprise sont réservées à la Direction et aux Ressources Humaines.",
    ],
  },
  {
    id: "users",
    name: "Gestion des Accès & Sécurité",
    href: "/admin/users",
    icon: Shield,
    category: "Système",
    summary:
      "Gouvernance des comptes utilisateurs, organigramme hiérarchique, rôles personnalisés et attribution des droits de signature légale.",
    targetRoles: ["PDG (Propriétaire)", "Administrateur d'Entreprise"],
    features: [
      {
        title: "Création d'un compte utilisateur",
        description:
          "Donnez accès à un collaborateur en lui attribuant son identifiant, son mot de passe et son rôle hiérarchique.",
        steps: [
          "Dans l'onglet 'Gestion des accès', cliquez sur 'Ajouter un utilisateur'.",
          "Renseignez le nom complet et l'adresse e-mail professionnelle.",
          "Définissez un mot de passe sécurisé (minimum 8 caractères).",
          "Sélectionnez le rôle hiérarchique dans la liste déroulante.",
          "Enregistrez : l'utilisateur peut désormais se connecter au système.",
        ],
      },
      {
        title: "Matrice des Rôles & Permissions par Onglet",
        description:
          "Le PDG ou l'Administrateur peut créer des rôles personnalisés (ex: Directeur des Opérations, Contrôleur, Superviseur) et choisir pour chaque onglet s'il peut Consulter, Créer, Modifier ou Supprimer.",
      },
      {
        title: "Habilitation des signataires numériques",
        description:
          "Délégation de signature officielle pour la validation des congés, des augmentations et des bons financiers avec définition de plafonds.",
      },
    ],
    tips: [
      "Appliquez le principe du moindre privilège : n'accordez les droits de 'Suppression' qu'aux cadres de confiance.",
      "Le compte du PDG (créateur) est le seul compte souverain qui ne peut pas être supprimé par les autres administrateurs.",
    ],
    rules: [
      "Un utilisateur avec le statut 'Désactivé' ne peut plus se connecter ni accéder aux données de l'entreprise.",
      "Les mots de passe sont hachés de manière irréversible selon les standards cryptographiques.",
    ],
  },
  {
    id: "notifications",
    name: "Centre de Notifications",
    href: "/admin/notifications",
    icon: Bell,
    category: "Système",
    summary:
      "Flux d'alertes en temps réel signalant les nouvelles requêtes de congés, les approbations, les événements planifiés et les alertes système.",
    targetRoles: ["Tous les utilisateurs du système"],
    features: [
      {
        title: "Consultation et traitement des alertes",
        description:
          "Suivez l'activité de votre entreprise et accédez directement aux éléments nécessitant votre intervention.",
        steps: [
          "Cliquez sur la cloche dans l'en-tête ou sur 'Centre de notifications' dans le menu latéral.",
          "Les notifications non lues apparaissent avec un indicateur coloré.",
          "Cliquez sur une notification pour ouvrir directement la demande ou la fiche concernée.",
          "Utilisez 'Tout marquer comme lu' pour nettoyer votre boîte de réception.",
        ],
      },
      {
        title: "Filtres par catégorie",
        description:
          "Filtrez vos alertes par Congés, Finances, Signatures ou Système.",
      },
    ],
    tips: [
      "Consultez régulièrement le centre de notifications pour répondre sans délai aux requêtes soumises par vos équipes.",
    ],
    rules: [
      "Chaque utilisateur ne reçoit que les notifications correspondant à son rôle et à son périmètre d'autorisation.",
    ],
  },
  {
    id: "configuration",
    name: "Configurations & Paramètres",
    href: "/admin/configuration",
    icon: Settings,
    category: "Système",
    summary:
      "Paramétrage de l'identité de l'entreprise, coordonnées légales, création du sceau et signature numérique, et règles de sécurité.",
    targetRoles: ["PDG", "Administrateur d'Entreprise"],
    features: [
      {
        title: "Préférences générales de l'entreprise",
        description:
          "Mettez à jour le nom officiel, le logo, l'adresse du siège, le téléphone et l'adresse e-mail de l'organisation.",
      },
      {
        title: "Création et gestion du sceau de signature",
        description:
          "Déposez ou dessinez la signature électronique officielle et le cachet de l'entreprise pour authentifier automatiquement les reçus et attestations.",
      },
      {
        title: "Paramètres de notification et de sécurité",
        description:
          "Configurez les alertes automatiques par e-mail et WhatsApp et définissez les politiques de renouvellement de mot de passe.",
      },
    ],
    tips: [
      "Téléversez un logo en haute résolution (PNG avec fond transparent) pour un rendu professionnel sur tous les documents émis.",
    ],
    rules: [
      "Toute modification des paramètres d'entreprise est consignée dans les journaux d'audit de sécurité.",
    ],
  },
];

const EMPLOYEE_MODULES_MANUAL: TabManual[] = [
  {
    id: "requests",
    name: "Requêtes & Demandes",
    href: "/admin/requests",
    icon: FileText,
    category: "Opérations",
    summary:
      "Espace personnel pour soumettre et suivre en direct l'avancement de vos demandes de congés, d'augmentations salariales et d'autorisations de signature.",
    targetRoles: ["Collaborateur / Employé", "Tous les collaborateurs"],
    features: [
      {
        title: "Soumettre une demande de congé officielle en 5 étapes",
        description:
          "Remplissez le formulaire officiel conforme : vérification de vos informations d'employé, choix du type d'absence (Annuel, Maladie, Maternité/Paternité, Sans solde, Autre), sélection des dates, indication d'un remplaçant et signature électronique certifiée.",
        steps: [
          "Accédez à l'onglet 'Requêtes' puis cliquez sur '+ Nouvelle demande'.",
          "Vérifiez vos données d'employé pré-remplies (matricule, nom, département, poste).",
          "Sélectionnez le type de congé et indiquez les dates calendaires (la durée est calculée automatiquement).",
          "Renseignez un collègue remplaçant éventuel et votre numéro de téléphone d'urgence.",
          "Apposez votre signature : téléversez votre photo/scan de signature (le fond blanc est automatiquement détouré en transparence) ou écrivez votre nom avec la police calligraphique WindSong.",
          "Cochez l'attestation sur l'honneur et confirmez la transmission de la demande.",
        ],
      },
      {
        title: "Demande d'augmentation de salaire",
        description:
          "Formulez une requête d'ajustement salarial en renseignant votre rémunération actuelle, le nouveau montant souhaité (HTG ou USD) et votre justification managériale.",
      },
      {
        title: "Demande d'autorisation de signature",
        description:
          "Soumettez une demande formelle nécessitant le visa ou contreseing d'un responsable habilité.",
      },
      {
        title: "Suivi en direct & Reçu officiel certifié",
        description:
          "Consultez à tout moment l'état d'instruction de vos dossiers dans 'Mes demandes' grâce aux pastilles de statuts pleines (Jaune abricot pour 'En attente', Vert émeraude pour 'Approuvée' et Rouge plein pour 'Refusée' avec motif). Dès l'approbation, téléchargez votre reçu officiel certifié.",
      },
    ],
    tips: [
      "Privilégiez le mode 'Uploader une image' pour votre signature : notre algorithme élimine automatiquement le fond blanc du papier pour apposer un spécimen transparent sur votre reçu officiel.",
      "Conservez précieusement le lien de suivi sécurisé unique envoyé par e-mail et WhatsApp pour vérifier votre demande à tout moment.",
    ],
    rules: [
      "Tous les champs obligatoires du formulaire doivent être complétés pour pouvoir soumettre votre dossier.",
      "Une demande transmise ne peut plus être modifiée pendant son examen par la direction.",
    ],
  },
  {
    id: "events",
    name: "Événements & Calendrier",
    href: "/admin/events",
    icon: Calendar,
    category: "Opérations",
    summary:
      "Calendrier interactif d'entreprise permettant de consulter les réunions, formations et jours fériés, et de planifier vos événements personnels confidentiels.",
    targetRoles: ["Collaborateur / Employé", "Tous les collaborateurs"],
    features: [
      {
        title: "Planifier un événement personnel confidentiel",
        description:
          "Ajoutez vos propres mémos, rendez-vous ou échéances de travail sur votre calendrier individuel.",
        steps: [
          "Cliquez sur 'Événements' dans la barre latérale.",
          "Sélectionnez le jour de votre choix sur le calendrier mensuel.",
          "Dans l'encadré 'Journée sélectionnée' ou sur la cellule active, cliquez sur 'Planifier un événement perso'.",
          "Renseignez le titre, les horaires et votre mémo, puis validez.",
        ],
      },
      {
        title: "Consulter le planning officiel de l'entreprise",
        description:
          "Visualisez les annonces de direction, réunions d'équipes et fermetures collectives qui concernent votre établissement ou succursale.",
      },
      {
        title: "Alertes et rappels automatiques",
        description:
          "Recevez des alertes automatiques 24h avant la tenue d'un événement officiel dans votre centre de notifications.",
      },
    ],
    tips: [
      "Vos événements personnels sont strictement confidentiels et ne sont visibles que par votre propre compte pour vous aider à organiser votre travail.",
    ],
    rules: [
      "Les publications d'événements généraux d'entreprise sont émises exclusivement par la Direction et les RH.",
    ],
  },
  {
    id: "notifications",
    name: "Centre de Notifications",
    href: "/admin/notifications",
    icon: Bell,
    category: "Système",
    summary:
      "Boîte de réception des alertes officielles, notes de service, décisions RH et validations de demandes émises par l'administration.",
    targetRoles: ["Collaborateur / Employé", "Tous les collaborateurs"],
    features: [
      {
        title: "Réception instantanée des décisions de requêtes",
        description:
          "Soyez alerté en direct dès qu'un responsable approuve ou refuse votre demande de congé ou d'augmentation salariale.",
      },
      {
        title: "Communications et notes de service officielles",
        description:
          "Accédez aux annonces d'entreprise, changements d'horaires et consignes transmises par la Direction générale.",
      },
      {
        title: "Gestion de la boîte de réception",
        description:
          "Consultez vos alertes et marquez-les comme lues pour conserver un espace propre et ordonné.",
      },
    ],
    tips: [
      "Votre centre de notifications collaborateur est épuré sans filtres superflus pour vous permettre de lire vos messages immédiatement.",
    ],
    rules: [
      "Vous recevez uniquement les notifications qui vous concernent directement ou qui ciblent votre département/succursale.",
    ],
  },
  {
    id: "profile",
    name: "Mon Dossier Personnel",
    href: "/admin/configuration/profile",
    icon: User,
    category: "Système",
    summary:
      "Consultation de votre affectation professionnelle (matricule, succursale, poste) et mise à jour de vos coordonnées, groupe sanguin et contacts d'urgence.",
    targetRoles: ["Collaborateur / Employé", "Tous les profils"],
    features: [
      {
        title: "Fiche d'affectation professionnelle",
        description:
          "Consultez votre matricule officiel (ex: EB-SIEGE-001), votre succursale de rattachement, votre poste et votre département.",
      },
      {
        title: "Coordonnées de contact personnel",
        description:
          "Mettez à jour votre numéro de téléphone (utilisé pour les alertes WhatsApp) et votre adresse e-mail personnelle.",
        steps: [
          "Accédez à 'Configurations' > 'Mon dossier personnel'.",
          "Mettez à jour votre numéro de téléphone ou votre adresse e-mail.",
          "Cliquez sur 'Enregistrer mes informations' (bouton vert émeraude).",
        ],
      },
      {
        title: "Informations d'urgence et médicales",
        description:
          "Renseignez votre groupe sanguin ainsi que le nom et le numéro de téléphone de la personne à prévenir en cas d'urgence médicale.",
      },
    ],
    tips: [
      "Maintenez vos contacts d'urgence à jour afin que l'entreprise dispose des coordonnées requises en cas d'accident ou d'imprévu.",
    ],
    rules: [
      "Le matricule, le poste et la succursale d'affectation sont administrés par le service des Ressources Humaines.",
    ],
  },
  {
    id: "security",
    name: "Sécurité du Compte",
    href: "/admin/configuration/security",
    icon: Lock,
    category: "Système",
    summary:
      "Espace personnel pour la modification sécurisée du mot de passe de votre compte d'accès collaborateur.",
    targetRoles: ["Collaborateur / Employé", "Tous les profils"],
    features: [
      {
        title: "Renouvellement sécurisé du mot de passe",
        description:
          "Modifiez votre mot de passe d'accès en toute simplicité et en toute autonomie.",
        steps: [
          "Accédez à 'Configurations' > 'Sécurité du compte'.",
          "Saisissez votre mot de passe actuel pour validation de sécurité.",
          "Entrez votre nouveau mot de passe (minimum 8 caractères) et confirmez-le.",
          "Cliquez sur 'Mettre à jour le mot de passe' (bouton vert émeraude).",
        ],
      },
      {
        title: "Sécurité cryptographique renforcée",
        description:
          "Votre mot de passe est chiffré par un condensat sécurisé (PBKDF2) pour garantir la stricte confidentialité de vos accès.",
      },
    ],
    tips: [
      "Utilisez une combinaison d'au moins 8 caractères avec majuscules, minuscules et chiffres pour un mot de passe robuste.",
      "Ne transmettez jamais votre mot de passe à qui que ce soit.",
    ],
    rules: [
      "Votre compte collaborateur est nominatif et strictement personnel.",
    ],
  },
];

const FAQS = [
  {
    q: "Comment un employé peut-il soumettre une demande sans créer de compte ?",
    a: "L'employé peut se rendre sur la page publique de soumission (`/submit`) de votre entreprise. Il renseigne son matricule, ses coordonnées et son motif. Le système retrouve son dossier et transmet la requête aux gestionnaires habilités.",
  },
  {
    q: "Comment un employé vérifie-t-il l'état de sa demande de congé ?",
    a: "Lors de la soumission de sa demande, un lien de suivi sécurisé et unique est généré. L'employé reçoit également un e-mail officiel lui indiquant en temps réel si sa demande est 'En attente', 'Approuvée' ou 'Refusée'.",
  },
  {
    q: "Que faire en cas d'oubli de mot de passe d'un utilisateur ?",
    a: "L'utilisateur peut utiliser le lien 'Mot de passe oublié' sur la page de connexion, ou le PDG / Administrateur peut aller dans 'Gestion des accès', ouvrir la fiche de l'utilisateur et lui réinitialiser son mot de passe directement.",
  },
  {
    q: "Les reçus et attestations de congés sont-ils légalement valables ?",
    a: "Oui. Chaque attestation émise par RKonekte comporte un numéro de certificat unique, la signature numérique de l'administrateur, le cachet officiel de l'entreprise et un horodatage cryptographique infalsifiable.",
  },
  {
    q: "Comment contacter l'équipe d'assistance technique de RKonekte ?",
    a: "Vous pouvez écrire directement à l'adresse officielle rkonekte509@gmail.com. Notre équipe technique est disponible pour toute question de configuration, d'intégration ou d'assistance opérationnelle.",
  },
];

const EMPLOYEE_FAQS = [
  {
    q: "Comment suivre l'état de ma demande de congé ou d'augmentation ?",
    a: "Rendez-vous dans l'onglet 'Requêtes', puis sous l'onglet 'Mes demandes'. Vous visualiserez en direct l'avancement avec les pastilles de statuts pleines : Jaune abricot (En attente), Vert émeraude (Approuvée avec reçu téléchargeable) ou Rouge corail (Refusée avec motif).",
  },
  {
    q: "Comment obtenir mon attestation officielle après approbation ?",
    a: "Dès que votre demande est approuvée par un responsable, un bouton 'Consulter mon attestation' apparaît dans votre espace requêtes et un lien sécurisé vous est expédié par e-mail et WhatsApp.",
  },
  {
    q: "Comment changer mon mot de passe de connexion ?",
    a: "Allez dans 'Configurations' > 'Sécurité du compte'. Renseignez votre mot de passe actuel puis saisissez votre nouveau mot de passe d'au moins 8 caractères et enregistrez.",
  },
  {
    q: "Mes événements personnels sont-ils visibles par la direction ou mes collègues ?",
    a: "Non. Les événements personnels que vous programmez dans votre calendrier sont strictement privés et réservés à votre consultation personnelle.",
  },
  {
    q: "Comment contacter l'équipe d'assistance technique de RKonekte ?",
    a: "Vous pouvez utiliser le formulaire de contact en bas de cette page ou écrire directement à rkonekte509@gmail.com.",
  },
];

export default function AdminSupportPage() {
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.role) {
          setCurrentUserRole(data.user.role);
        }
      })
      .catch(() => {});
  }, []);

  const isEmployee =
    currentUserRole === "EMPLOYEE" ||
    currentUserRole === "COLLABORATEUR" ||
    (typeof currentUserRole === "string" &&
      (currentUserRole.toLowerCase().includes("employ") ||
        currentUserRole.toLowerCase().includes("collab")));

  const activeModulesList = useMemo(() => {
    return isEmployee ? EMPLOYEE_MODULES_MANUAL : ADMIN_MODULES_MANUAL;
  }, [isEmployee]);

  const [selectedModuleId, setSelectedModuleId] = useState<string>("dashboard");

  // If employee, default active module to 'requests' (first available tab for employee)
  useEffect(() => {
    if (isEmployee) {
      if (selectedModuleId === "dashboard" || !EMPLOYEE_MODULES_MANUAL.some((m) => m.id === selectedModuleId)) {
        setSelectedModuleId("requests");
      }
    }
  }, [isEmployee, selectedModuleId]);

  const [searchQuery, setSearchQuery] = useState("");
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("TOUS");

  // Available categories depending on role
  const availableCategories = useMemo(() => {
    return isEmployee
      ? ["TOUS", "Opérations", "Système"]
      : ["TOUS", "Général", "Opérations", "Finances", "Système"];
  }, [isEmployee]);

  // Reset category if not in availableCategories
  useEffect(() => {
    if (selectedCategory !== "TOUS" && !availableCategories.includes(selectedCategory)) {
      setSelectedCategory("TOUS");
    }
  }, [availableCategories, selectedCategory]);

  const supportEmail = "rkonekte509@gmail.com";

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(supportEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  // Direct Message to Support Form State
  const [contactCategory, setContactCategory] = useState("Assistance Technique");
  const [contactModule, setContactModule] = useState("Général");
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError(null);
    setSendSuccess(null);
    if (!contactSubject.trim() || !contactMessage.trim()) {
      setSendError("Veuillez renseigner le sujet et votre message.");
      return;
    }

    setSendingMessage(true);
    try {
      const res = await fetch("/api/admin/support/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: contactCategory,
          moduleName: contactModule,
          subject: contactSubject,
          message: contactMessage,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSendError(data.error || "Impossible d'expédier votre message.");
        return;
      }

      setSendSuccess("Votre message a été transmis avec succès à l'équipe support RKonekte (rkonekte509@gmail.com). Nous vous répondrons dans les plus brefs délais.");
      setContactSubject("");
      setContactMessage("");
    } catch (err) {
      setSendError("Erreur réseau. Veuillez réessayer ou contacter directement rkonekte509@gmail.com.");
    } finally {
      setSendingMessage(false);
    }
  };

  // Filtered modules by search or category
  const filteredModules = useMemo(() => {
    return activeModulesList.filter((m) => {
      const matchCategory =
        selectedCategory === "TOUS" || m.category === selectedCategory;
      const matchSearch =
        searchQuery.trim() === "" ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.features.some(
          (f) =>
            f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return matchCategory && matchSearch;
    });
  }, [activeModulesList, searchQuery, selectedCategory]);

  const activeModule = useMemo(() => {
    return (
      activeModulesList.find((m) => m.id === selectedModuleId) ||
      activeModulesList[0] ||
      ADMIN_MODULES_MANUAL[0]
    );
  }, [activeModulesList, selectedModuleId]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* 1. HERO HEADER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#031B3A] via-[#062653] to-[#114C5A] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/15 text-xs font-semibold text-slate-200">
              <BookOpen className="w-3.5 h-3.5 text-[#FF7900]" />
              {isEmployee
                ? "Espace Collaborateur — Centre d'Aide & Manuel d'Utilisation"
                : "Centre d'Aide & Documentation Officielle"}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {isEmployee
                ? "Manuel d'Utilisation Collaborateur"
                : "Manuel d'Utilisation RKonekte"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isEmployee
                ? `Retrouvez le fonctionnement détaillé, les procédures pas-à-pas et les bonnes pratiques pour chacun des ${activeModulesList.length} onglets de votre espace collaborateur.`
                : `Retrouvez le fonctionnement détaillé, les procédures pas-à-pas et les bonnes pratiques pour chacun des ${activeModulesList.length} onglets de gestion de votre entreprise.`}
            </p>
          </div>

          {/* Quick Support Contact Badge */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 shrink-0 flex flex-col sm:items-end gap-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Mail className="w-4 h-4 text-[#FF7900]" />
              <span>Assistance Technique Directe</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-white bg-black/25 px-2.5 py-1 rounded-lg">
                {supportEmail}
              </span>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[#031B3A] text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                title="Copier l'email de support"
              >
                {copiedEmail ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copié</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar inside Hero */}
        <div className="relative z-10 mt-6 max-w-xl">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher une procédure (ex: congé, rapport, rôle, employé, dépense...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-white/95 text-slate-900 placeholder-slate-400 text-xs sm:text-sm rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF7900] shadow-md transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. CATEGORY PILLS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] mr-1 shrink-0">
          Filtrer par domaine :
        </span>
        {availableCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-all cursor-pointer ${
              selectedCategory === cat
                ? "bg-[#031B3A] text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {cat === "TOUS" ? `Tous les onglets (${activeModulesList.length})` : cat}
          </button>
        ))}
      </div>

      {/* 3. MAIN INTERFACE: SIDEBAR OF TABS + DETAILS PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: List of Tabs (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-3 space-y-1.5">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
            <span>Sommaire des modules</span>
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">
              {filteredModules.length} disponible(s)
            </span>
          </div>

          <div className="space-y-1 max-h-[650px] overflow-y-auto pr-1">
            {filteredModules.map((mod) => {
              const Icon = mod.icon;
              const isSelected = mod.id === selectedModuleId;
              return (
                <button
                  key={mod.id}
                  onClick={() => setSelectedModuleId(mod.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer group ${
                    isSelected
                      ? "bg-[#031B3A] text-white shadow-sm font-bold"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-white/15 text-white"
                          : "bg-slate-100 text-[#031B3A] group-hover:bg-slate-200"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">
                        {mod.name}
                      </div>
                      <div
                        className={`text-[10px] truncate ${
                          isSelected ? "text-slate-300" : "text-slate-400"
                        }`}
                      >
                        {mod.category}
                      </div>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected
                        ? "text-white translate-x-0.5"
                        : "text-slate-300 group-hover:text-slate-500"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right column: Active Tab Detailed Manual (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Header of Active Module */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#031B3A] text-white flex items-center justify-center shadow-md shrink-0">
                {React.createElement(activeModule.icon, { className: "w-6 h-6" })}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-[#031B3A]">
                    {activeModule.name}
                  </h2>
                  <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-[#114C5A]/10 text-[#114C5A]">
                    {activeModule.category}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  {activeModule.summary}
                </p>
              </div>
            </div>

            <Link
              href={
                activeModule.href ||
                (activeModule.id === "dashboard"
                  ? "/admin/dashboard"
                  : `/admin/${activeModule.id}`)
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-[#031B3A] text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 self-start"
            >
              <span>Accéder à l'onglet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Habilitations & Rôles concernés */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#031B3A]">
              <Lock className="w-4 h-4 text-[#FF7900]" />
              <span>Profils et Rôles autorisés pour cet onglet :</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {activeModule.targetRoles.map((role, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg shadow-2xs"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          {/* Fonctionnalités & Procédures pas-à-pas */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#031B3A] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#114C5A]" />
              Fonctionnalités & Procédures d'utilisation
            </h3>

            <div className="space-y-4">
              {activeModule.features.map((feat, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200/90 hover:border-[#114C5A]/30 bg-white hover:shadow-xs transition-all space-y-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#031B3A] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <h4 className="text-sm font-bold text-slate-800">
                      {feat.title}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-7">
                    {feat.description}
                  </p>

                  {feat.steps && feat.steps.length > 0 && (
                    <div className="mt-2 pl-7 pt-2 border-t border-slate-100 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Étapes à suivre :
                      </span>
                      <ol className="space-y-1 text-xs text-slate-700">
                        {feat.steps.map((st, sIdx) => (
                          <li key={sIdx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{st}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Conseils & Règles d'or */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Conseils */}
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Conseils & Astuces :</span>
              </div>
              <ul className="space-y-1 text-xs text-amber-950/90">
                {activeModule.tips.map((t, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Règles de sécurité */}
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Règles de conformité & Sécurité :</span>
              </div>
              <ul className="space-y-1 text-xs text-blue-950/90">
                {activeModule.rules.map((r, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 4. FOIRE AUX QUESTIONS (FAQ) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-[#FF7900]/15 text-[#FF7900] flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#031B3A]">
              Foire Aux Questions Fréquentes (FAQ)
            </h3>
            <p className="text-xs text-slate-500">
              Réponses aux interrogations courantes sur le fonctionnement de RKonekte.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(isEmployee ? EMPLOYEE_FAQS : FAQS).map((faq, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2"
            >
              <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex items-start gap-2">
                <span className="text-[#FF7900] font-black shrink-0">Q.</span>
                <span>{faq.q}</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed pl-5">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. FORMULAIRE DE CONTACT DIRECT AU SUPPORT */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-[#031B3A] text-white flex items-center justify-center shadow-xs">
            <Mail className="w-5 h-5 text-[#FF7900]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#031B3A]">
              Envoyer un message à l'équipe Support (rkonekte509@gmail.com)
            </h3>
            <p className="text-xs text-slate-500">
              Une question spécifique ou un incident sur un onglet ? Remplissez ce formulaire pour envoyer un e-mail direct à notre équipe.
            </p>
          </div>
        </div>

        {/* Feedback Banners */}
        {sendSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-start gap-3 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm font-medium flex-1">
              {sendSuccess}
            </div>
            <button
              onClick={() => setSendSuccess(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold p-1"
            >
              ✕
            </button>
          </div>
        )}

        {sendError && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl flex items-start gap-3 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm font-medium flex-1">
              {sendError}
            </div>
            <button
              onClick={() => setSendError(null)}
              className="text-rose-700 hover:text-rose-900 text-xs font-bold p-1"
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Catégorie */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Catégorie de la demande <span className="text-rose-500">*</span>
              </label>
              <select
                value={contactCategory}
                onChange={(e) => setContactCategory(e.target.value)}
                className="w-full h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#031B3A] cursor-pointer"
              >
                <option value="Assistance Technique">🛠️ Assistance Technique / Incident</option>
                <option value="Question d'utilisation">❓ Question d'utilisation sur un onglet</option>
                <option value="Demande d'évolution">🚀 Suggestion d'amélioration / Nouvelle fonctionnalité</option>
                <option value="Sécurité & Accès">🔐 Sécurité & Gestion des accès</option>
                <option value="Autre requête administrative">📝 Autre requête administrative</option>
              </select>
            </div>

            {/* Onglet concerné */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Onglet concerné
              </label>
              <select
                value={contactModule}
                onChange={(e) => setContactModule(e.target.value)}
                className="w-full h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#031B3A] cursor-pointer"
              >
                <option value="Général">Général / Multi-onglets</option>
                {activeModulesList.map((mod) => (
                  <option key={mod.id} value={mod.name}>
                    {mod.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sujet */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Sujet de votre message <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={
                isEmployee
                  ? "Ex: Question sur ma demande de congé, mise à jour de mes coordonnées..."
                  : "Ex: Difficulté pour approuver une demande de congé, question sur les plafonds..."
              }
              value={contactSubject}
              onChange={(e) => setContactSubject(e.target.value)}
              className="w-full h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#031B3A]"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Message détaillé <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Expliquez en détail votre demande, la situation rencontrée ou la question que vous vous posez..."
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#031B3A]"
            />
          </div>

          {/* Submit Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <p className="text-[11px] text-slate-500 italic">
              Destinataire officiel : <strong>rkonekte509@gmail.com</strong> (réponse sous 24h ouvrées).
            </p>

            <button
              type="submit"
              disabled={sendingMessage}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#031B3A] hover:bg-[#042854] disabled:opacity-60 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer shrink-0"
            >
              {sendingMessage ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#FF7900]" />
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-[#FF7900]" />
                  <span>Envoyer à rkonekte509@gmail.com</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 6. DIRECT HUMAN SUPPORT ASSISTANCE CARD */}
      <div className="bg-[#031B3A] text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10">
        <div className="space-y-1.5 max-w-xl text-center md:text-left">
          <h3 className="text-lg font-bold">
            Vous avez une question particulière ou un cas spécifique ?
          </h3>
          <p className="text-xs text-slate-300">
            Notre équipe d'ingénieurs et de support client est disponible pour assister votre entreprise du lundi au samedi.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCopyEmail}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            {copiedEmail ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedEmail ? "E-mail copié !" : "Copier l'adresse de support"}</span>
          </button>

          <a
            href={`mailto:${supportEmail}?subject=Demande%20d'assistance%20RKonekte&body=Bonjour%20l'%C3%A9quipe%20support%20RKonekte,%0A%0AEntreprise%20:%0ADescription%20de%20ma%20demande%20:%0A`}
            className="px-5 py-2.5 bg-[#FF7900] hover:bg-[#E06A00] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            <span>Envoyer un e-mail</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
