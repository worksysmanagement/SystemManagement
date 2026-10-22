export interface TabPermission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export type ModuleKey =
  | "dashboard"
  | "requests"
  | "employees"
  | "branches"
  | "financial_ops"
  | "financial_reports"
  | "events"
  | "customer_space"
  | "users"
  | "notifications"
  | "configuration";

export type HierarchyLevel =
  | "DIRECTION"
  | "MANAGEMENT"
  | "SUPERVISOR"
  | "OPERATIONAL";

export interface RoleModel {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  hierarchyLevel: HierarchyLevel;
  isSystem: boolean;
  isDefaultOwner?: boolean;
  permissions: Record<ModuleKey, TabPermission>;
  createdAt: number;
  updatedAt: number;
}

export const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard: "Tableau de bord",
  requests: "Requêtes & Demandes",
  employees: "Gestion des Employés",
  branches: "Gestion des Succursales",
  financial_ops: "Opérations Financières",
  financial_reports: "Rapports Financiers",
  events: "Événements & Calendrier",
  customer_space: "Espace Client",
  users: "Gestion des Accès & Sécurité",
  notifications: "Centre de Notifications",
  configuration: "Configurations & Paramètres",
};

export const HIERARCHY_LABELS: Record<HierarchyLevel, { label: string; badge: string; color: string }> = {
  DIRECTION: {
    label: "Direction & Propriétaire (Niveau 1)",
    badge: "Direction",
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  MANAGEMENT: {
    label: "Management & Cadres (Niveau 2)",
    badge: "Management",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  SUPERVISOR: {
    label: "Superviseurs & Chefs d'équipe (Niveau 3)",
    badge: "Superviseur",
    color: "bg-amber-100 text-amber-800 border-amber-200",
  },
  OPERATIONAL: {
    label: "Opérationnels & Collaborateurs (Niveau 4)",
    badge: "Opérationnel",
    color: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

export const ALL_ALLOWED_PERMS: Record<ModuleKey, TabPermission> = {
  dashboard: { view: true, create: true, edit: true, delete: true },
  requests: { view: true, create: true, edit: true, delete: true },
  employees: { view: true, create: true, edit: true, delete: true },
  branches: { view: true, create: true, edit: true, delete: true },
  financial_ops: { view: true, create: true, edit: true, delete: true },
  financial_reports: { view: true, create: true, edit: true, delete: true },
  events: { view: true, create: true, edit: true, delete: true },
  customer_space: { view: true, create: true, edit: true, delete: true },
  users: { view: true, create: true, edit: true, delete: true },
  notifications: { view: true, create: true, edit: true, delete: true },
  configuration: { view: true, create: true, edit: true, delete: true },
};
