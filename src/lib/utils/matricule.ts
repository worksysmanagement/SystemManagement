/**
 * Utilitaire de gestion des formats et séquences de matricules d'entreprise.
 */

/**
 * Calcule l'acronyme officiel (initiales) d'une entreprise à partir de son nom ou de son slug.
 * Exemples :
 * - "e-biznis" -> "EB"
 * - "Technozi" -> "TECH"
 * - "Welj Express" -> "WE"
 * - "Cabinet Expert Comptable" -> "CEC"
 */
export function getOrganizationAcronym(name?: string | null, slug?: string | null): string {
  const text = (name || slug || "").trim();
  if (!text) return "EMP";

  const parts = text.split(/[\s\-_.]+/).filter((p) => p.length > 0);

  if (parts.length >= 2) {
    const initials = parts.map((p) => p[0]).join("").toUpperCase();
    if (initials.length >= 2 && initials.length <= 4) {
      return initials;
    }
  }

  const clean = text.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (clean.length <= 4) return clean || "EMP";
  return clean.slice(0, 4) || "EMP";
}

/**
 * Calcule le code trigramme ou code court (3-4 lettres) à partir du nom d'entreprise.
 * Exemples :
 * - "e-biznis" -> "EBIZ"
 * - "Technozi" -> "TECH"
 * - "Welj Express" -> "WELJ"
 */
export function getOrganizationTrigram(name?: string | null, slug?: string | null): string {
  const text = (name || slug || "").trim();
  if (!text) return "EMP";

  const parts = text.split(/[\s\-_.]+/).filter((p) => p.length > 0);
  if (parts.length >= 2 && parts[0].length === 1 && parts[1]) {
    // Cas spécial comme e-biznis -> EBIZ
    const combined = (parts[0] + parts[1]).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    return combined.slice(0, 4);
  }

  const clean = text.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return clean.slice(0, 4) || "EMP";
}

/**
 * Calcule la dénomination nettoyée (majuscules, tirets) pour un matricule avec nom complet.
 * Exemples :
 * - "e-biznis" -> "E-BIZNIS"
 * - "Technozi" -> "TECHNOZI"
 */
export function getOrganizationCleanName(name?: string | null, slug?: string | null): string {
  const text = (name || slug || "").trim();
  if (!text) return "ENTREPRISE";
  return text
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 12);
}

export interface MatriculeFormatOption {
  id: string;
  label: string;
  preview: string;
  description: string;
}

/**
 * Génère dynamiquement la liste des formats de matricules possibles selon le nom de l'entreprise.
 */
export function getMatriculeFormatOptions(
  companyName?: string | null,
  sampleBranch = "SIEGE",
  sampleSeq = "001"
): MatriculeFormatOption[] {
  const initials = getOrganizationAcronym(companyName);
  const trigram = getOrganizationTrigram(companyName);
  const cleanName = getOrganizationCleanName(companyName);
  const currentYear = new Date().getFullYear();

  return [
    {
      id: "INITIALS_BRANCH_SEQ",
      label: `Initiales + Succursale + N° séquentiel (Recommandé)`,
      preview: `${initials}-${sampleBranch}-${sampleSeq}`,
      description: `Composé des initiales de l'entreprise (${initials}), du code succursale et du numéro séquentiel unique.`,
    },
    {
      id: "INITIALS_SEQ",
      label: `Initiales + N° séquentiel direct (Format court)`,
      preview: `${initials}-${sampleSeq}`,
      description: `Format simplifié sans mention de succursale, idéal pour les structures centralisées.`,
    },
    {
      id: "TRIGRAM_BRANCH_SEQ",
      label: `Code abrégé (${trigram}) + Succursale + N° séquentiel`,
      preview: `${trigram}-${sampleBranch}-${sampleSeq}`,
      description: `Utilise les 4 premières lettres de l'organisation (${trigram}) combinées à la succursale.`,
    },
    {
      id: "TRIGRAM_SEQ",
      label: `Code abrégé (${trigram}) + N° séquentiel`,
      preview: `${trigram}-${sampleSeq}`,
      description: `Code abrégé court et compact sans code de succursale.`,
    },
    {
      id: "FULLNAME_BRANCH_SEQ",
      label: `Nom complet de l'entreprise + Succursale + N°`,
      preview: `${cleanName}-${sampleBranch}-${sampleSeq}`,
      description: `Affiche la dénomination complète de l'entreprise (${cleanName}) dans chaque matricule.`,
    },
    {
      id: "INITIALS_YEAR_SEQ",
      label: `Initiales + Année (${currentYear}) + N° séquentiel`,
      preview: `${initials}-${currentYear}-${sampleSeq}`,
      description: `Intègre le millésime annuel pour un archivage chronologique immédiat.`,
    },
    {
      id: "CUSTOM",
      label: `Préfixe personnalisé libre`,
      preview: `VOTRECODE-${sampleBranch}-${sampleSeq}`,
      description: `Définissez un préfixe sur-mesure propre à la charte de votre organisation.`,
    },
  ];
}

/**
 * Calcule le prochain numéro séquentiel disponible pour une entreprise.
 * Analyse les matricules existants et retourne le prochain entier incrémentiel (ex: 1 -> "001", 2 -> "002").
 * Garantit qu'aucun doublon ne sera proposé au sein de la même organisation.
 */
export function getNextMatriculeSequence(
  existingMatricules: Array<string | null | undefined>
): string {
  const usedNumbers = new Set<number>();
  let maxSequential = 0;

  for (const m of existingMatricules) {
    if (!m) continue;
    const match = m.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > 0) {
        usedNumbers.add(num);
        if (num > maxSequential) {
          maxSequential = num;
        }
      }
    }
  }

  // Si des numéros séquentiels ordonnés existent (ex: 1, 2, 3...)
  // on continue après le max (ex: max + 1)
  if (maxSequential > 0 && maxSequential < 500 && usedNumbers.has(1)) {
    let nextSeq = maxSequential + 1;
    while (usedNumbers.has(nextSeq)) {
      nextSeq++;
    }
    return String(nextSeq).padStart(3, "0");
  }

  // Sinon, premier entier disponible >= 1 non encore utilisé
  let nextSeq = 1;
  while (usedNumbers.has(nextSeq)) {
    nextSeq++;
  }

  return String(nextSeq).padStart(3, "0");
}

/**
 * Génère le matricule officiel en respectant le format sélectionné par l'entreprise :
 */
export function generateEmployeeMatricule(
  orgNameOrSlug?: string | null,
  branchCode?: string | null,
  digits?: string | number | null,
  format?: string | null,
  customPrefix?: string | null
): string {
  const initials = getOrganizationAcronym(orgNameOrSlug);
  const trigram = getOrganizationTrigram(orgNameOrSlug);
  const cleanName = getOrganizationCleanName(orgNameOrSlug);
  const branch = (branchCode || "SIEGE").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  const numPart =
    digits !== undefined && digits !== null && String(digits).trim() !== ""
      ? String(digits).padStart(3, "0")
      : "001";

  const selectedFormat = format || "INITIALS_BRANCH_SEQ";

  switch (selectedFormat) {
    case "INITIALS_SEQ":
      return `${initials}-${numPart}`;
    case "TRIGRAM_BRANCH_SEQ":
      return `${trigram}-${branch}-${numPart}`;
    case "TRIGRAM_SEQ":
      return `${trigram}-${numPart}`;
    case "FULLNAME_BRANCH_SEQ":
      return `${cleanName}-${branch}-${numPart}`;
    case "FULLNAME_SEQ":
      return `${cleanName}-${numPart}`;
    case "INITIALS_YEAR_SEQ":
      return `${initials}-${new Date().getFullYear()}-${numPart}`;
    case "CUSTOM": {
      const pfx = (customPrefix || initials).replace(/[^a-zA-Z0-9_-]/g, "").toUpperCase() || initials;
      return `${pfx}-${branch}-${numPart}`;
    }
    case "INITIALS_BRANCH_SEQ":
    default:
      return `${initials}-${branch}-${numPart}`;
  }
}

/**
 * Met à jour un matricule existant lorsque l'utilisateur change de succursale
 * tout en conservant le format configuré pour l'entreprise.
 */
export function updateMatriculeBranch(
  currentMatricule: string,
  newBranchCode: string,
  orgNameOrSlug?: string | null,
  format?: string | null,
  customPrefix?: string | null
): string {
  const cleanBranch = (newBranchCode || "SIEGE").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  // Si le format est un format sans succursale (ex: EB-001 ou EBIZ-001)
  if (format === "INITIALS_SEQ" || format === "TRIGRAM_SEQ" || format === "FULLNAME_SEQ") {
    return currentMatricule;
  }

  // Extraire les chiffres finaux s'ils existent
  const digitsMatch = currentMatricule.match(/\d+$/);
  const digits = digitsMatch ? digitsMatch[0] : "001";

  return generateEmployeeMatricule(orgNameOrSlug, cleanBranch, digits, format, customPrefix);
}
