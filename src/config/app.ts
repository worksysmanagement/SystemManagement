export const APP_CONFIG = {
  // Nom officiel de l'application / de la plateforme
  name: "RKonekte",
  brandName: "RKonekte",
  logoPath: "/logo-rkonekte.png",
  version: "1.0.0",

  // Devises prises en charge
  currencies: [
    { code: "HTG", label: "Gourde Haïtienne (HTG)", symbol: "G" },
    { code: "USD", label: "Dollar Américain (USD)", symbol: "$" },
  ],

  // Banques et moyens de paiement disponibles
  financialAccounts: [
    { id: "unibank_htg", name: "Unibank HTG", currency: "HTG" },
    { id: "unibank_usd", name: "Unibank USD", currency: "USD" },
    { id: "sogebank_htg", name: "Sogebank HTG", currency: "HTG" },
    { id: "sogebank_usd", name: "Sogebank USD", currency: "USD" },
    { id: "bnc_htg", name: "BNC HTG", currency: "HTG" },
    { id: "bnc_usd", name: "BNC USD", currency: "USD" },
    { id: "ezipay", name: "EZIPAY", currency: "HTG" },
    { id: "wallet", name: "WALLET", currency: "HTG" },
  ],

  // Rôles utilisateurs
  roles: {
    SUPER_ADMIN: { label: "Super Administrateur", description: "Accès global à toutes les organisations" },
    ORGANIZATION_ADMIN: { label: "Administrateur d'Entreprise", description: "Gestion complète de l'entreprise" },
    SECRETARY: { label: "Secrétaire / RH", description: "Gestion des employés et traitement des congés" },
    FINANCIAL_MANAGER: { label: "Responsable Financier", description: "Gestion des opérations et rapports financiers" },
    BRANCH_MANAGER: { label: "Responsable de Succursale", description: "Gestion des employés de sa succursale" },
  },

  // Succursales par défaut
  defaultBranches: [
    { id: "br-siege", code: "SIEGE", name: "Siège Principal", city: "Port-au-Prince" },
    { id: "br-delmas", code: "DELMAS", name: "Succursale Delmas", city: "Delmas" },
    { id: "br-pv", code: "PV", name: "Succursale Pétion-Ville", city: "Pétion-Ville" },
    { id: "br-cap", code: "CAP", name: "Succursale Cap-Haïtien", city: "Cap-Haïtien" },
  ],
};
