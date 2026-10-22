import { getDb } from "@/lib/db/client";
import { organizationRoles, OrganizationRole } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { supabaseDb } from "@/lib/supabase/db";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export * from "@/lib/types/roles";
import {
  RoleModel,
  ModuleKey,
  HierarchyLevel,
  TabPermission,
  ALL_ALLOWED_PERMS,
} from "@/lib/types/roles";

// Initial system roles for any enterprise
export function getDefaultSystemRoles(organizationId: string): RoleModel[] {
  const now = Date.now();
  return [
    {
      id: "role-pdg",
      organizationId,
      name: "Président Directeur Général (PDG) / Propriétaire",
      description: "Compte maître souverain de l'entreprise. Accès intégral, validation suprême et pouvoir de gouvernance sur tous les modules.",
      hierarchyLevel: "DIRECTION",
      isSystem: true,
      isDefaultOwner: true,
      permissions: { ...ALL_ALLOWED_PERMS },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "role-admin",
      organizationId,
      name: "Administrateur",
      description: "Gestion opérationnelle et technique de la plateforme, gestion des accès déléguée par le PDG.",
      hierarchyLevel: "DIRECTION",
      isSystem: true,
      permissions: {
        dashboard: { view: true, create: true, edit: true, delete: false },
        requests: { view: true, create: true, edit: true, delete: true },
        employees: { view: true, create: true, edit: true, delete: true },
        branches: { view: true, create: true, edit: true, delete: true },
        financial_ops: { view: true, create: true, edit: true, delete: false },
        financial_reports: { view: true, create: true, edit: true, delete: false },
        events: { view: true, create: true, edit: true, delete: true },
        customer_space: { view: true, create: true, edit: true, delete: true },
        users: { view: true, create: true, edit: true, delete: false },
        notifications: { view: true, create: true, edit: true, delete: true },
        configuration: { view: true, create: true, edit: true, delete: false },
      },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "role-rh",
      organizationId,
      name: "Ressources Humaines (RH)",
      description: "Gestion des dossiers du personnel, suivi des congés et des évaluations.",
      hierarchyLevel: "MANAGEMENT",
      isSystem: true,
      permissions: {
        dashboard: { view: true, create: false, edit: false, delete: false },
        requests: { view: true, create: true, edit: true, delete: false },
        employees: { view: true, create: true, edit: true, delete: false },
        branches: { view: true, create: false, edit: false, delete: false },
        financial_ops: { view: false, create: false, edit: false, delete: false },
        financial_reports: { view: false, create: false, edit: false, delete: false },
        events: { view: true, create: true, edit: true, delete: false },
        customer_space: { view: false, create: false, edit: false, delete: false },
        users: { view: false, create: false, edit: false, delete: false },
        notifications: { view: true, create: false, edit: false, delete: false },
        configuration: { view: false, create: false, edit: false, delete: false },
      },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "role-secretary",
      organizationId,
      name: "Secrétaire",
      description: "Réception des requêtes, gestion du planning et diffusion des communications.",
      hierarchyLevel: "OPERATIONAL",
      isSystem: true,
      permissions: {
        dashboard: { view: true, create: false, edit: false, delete: false },
        requests: { view: true, create: true, edit: true, delete: false },
        employees: { view: true, create: false, edit: false, delete: false },
        branches: { view: true, create: false, edit: false, delete: false },
        financial_ops: { view: false, create: false, edit: false, delete: false },
        financial_reports: { view: false, create: false, edit: false, delete: false },
        events: { view: true, create: true, edit: false, delete: false },
        customer_space: { view: true, create: false, edit: false, delete: false },
        users: { view: false, create: false, edit: false, delete: false },
        notifications: { view: true, create: false, edit: false, delete: false },
        configuration: { view: false, create: false, edit: false, delete: false },
      },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "role-branch-mgr",
      organizationId,
      name: "Responsable de Succursale",
      description: "Direction locale des opérations et encadrement des effectifs d'une agence.",
      hierarchyLevel: "MANAGEMENT",
      isSystem: true,
      permissions: {
        dashboard: { view: true, create: false, edit: false, delete: false },
        requests: { view: true, create: true, edit: true, delete: false },
        employees: { view: true, create: true, edit: true, delete: false },
        branches: { view: true, create: false, edit: true, delete: false },
        financial_ops: { view: false, create: false, edit: false, delete: false },
        financial_reports: { view: false, create: false, edit: false, delete: false },
        events: { view: true, create: true, edit: true, delete: false },
        customer_space: { view: true, create: true, edit: true, delete: false },
        users: { view: false, create: false, edit: false, delete: false },
        notifications: { view: true, create: false, edit: false, delete: false },
        configuration: { view: false, create: false, edit: false, delete: false },
      },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "role-finance",
      organizationId,
      name: "Responsable Financier / Comptable",
      description: "Contrôle des flux de caisse, écritures de recettes/dépenses et états financiers consolidés.",
      hierarchyLevel: "MANAGEMENT",
      isSystem: true,
      permissions: {
        dashboard: { view: true, create: false, edit: false, delete: false },
        requests: { view: true, create: false, edit: true, delete: false },
        employees: { view: true, create: false, edit: false, delete: false },
        branches: { view: true, create: false, edit: false, delete: false },
        financial_ops: { view: true, create: true, edit: true, delete: false },
        financial_reports: { view: true, create: true, edit: true, delete: false },
        events: { view: true, create: false, edit: false, delete: false },
        customer_space: { view: false, create: false, edit: false, delete: false },
        users: { view: false, create: false, edit: false, delete: false },
        notifications: { view: true, create: false, edit: false, delete: false },
        configuration: { view: false, create: false, edit: false, delete: false },
      },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "role-employee",
      organizationId,
      name: "Collaborateur / Employé",
      description: "Compte collaborateur standard : accès à ses requêtes (congés, augmentations, signatures), événements d'entreprise et outils système.",
      hierarchyLevel: "OPERATIONAL",
      isSystem: true,
      permissions: {
        dashboard: { view: false, create: false, edit: false, delete: false },
        requests: { view: true, create: true, edit: true, delete: false },
        employees: { view: false, create: false, edit: false, delete: false },
        branches: { view: false, create: false, edit: false, delete: false },
        financial_ops: { view: false, create: false, edit: false, delete: false },
        financial_reports: { view: false, create: false, edit: false, delete: false },
        events: { view: true, create: false, edit: false, delete: false },
        customer_space: { view: false, create: false, edit: false, delete: false },
        users: { view: false, create: false, edit: false, delete: false },
        notifications: { view: true, create: false, edit: false, delete: false },
        configuration: { view: true, create: false, edit: true, delete: false },
      },
      createdAt: now,
      updatedAt: now,
    },
  ];
}

// In-memory fallback cache for custom roles per organization to ensure immediate operationality
const CUSTOM_ROLES_STORE: Record<string, RoleModel[]> = {};

export async function listOrgRoles(organizationId: string): Promise<RoleModel[]> {
  const defaults = getDefaultSystemRoles(organizationId);

  // Retrieve stored roles from DB or cache
  let storedRoles: RoleModel[] = [];

  // 1. Try Supabase DB retrieval
  try {
    const supabase = getSupabaseAdminClient();
    const { data: rows, error } = await supabase
      .from("organization_roles")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (!error && rows && rows.length > 0) {
      storedRoles = rows.map((r: any) => {
        let parsedPerms: Record<ModuleKey, TabPermission> = {} as any;
        try {
          parsedPerms = typeof r.permissions === "string" ? JSON.parse(r.permissions) : r.permissions;
        } catch (_) {}
        return {
          id: r.id,
          organizationId: r.organization_id,
          name: r.name,
          description: r.description || "",
          hierarchyLevel: (r.hierarchy_level as HierarchyLevel) || "OPERATIONAL",
          isSystem: Boolean(r.is_system),
          permissions: parsedPerms,
          createdAt: Number(r.created_at),
          updatedAt: Number(r.updated_at),
        };
      });
    }
  } catch (_) {}

  // 1b. Fallback SQLite retrieval if Supabase had no rows
  if (storedRoles.length === 0) {
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(organizationRoles)
        .where(eq(organizationRoles.organizationId, organizationId))
        .orderBy(desc(organizationRoles.createdAt));

      storedRoles = rows.map((r) => {
        let parsedPerms = {};
        try {
          parsedPerms = JSON.parse(r.permissions);
        } catch (_) {}
        return {
          id: r.id,
          organizationId: r.organizationId,
          name: r.name,
          description: r.description || "",
          hierarchyLevel: (r.hierarchyLevel as HierarchyLevel) || "OPERATIONAL",
          isSystem: !!r.isSystem,
          permissions: parsedPerms as Record<ModuleKey, TabPermission>,
          createdAt: Number(r.createdAt),
          updatedAt: Number(r.updatedAt),
        };
      });
    } catch (_) {}
  }

  // 2. In-memory cache overrides
  const cached = CUSTOM_ROLES_STORE[organizationId] || [];
  const combinedOverrides = [...cached];
  storedRoles.forEach((sr) => {
    if (!combinedOverrides.some((c) => c.id === sr.id)) {
      combinedOverrides.push(sr);
    }
  });

  // 3. Merge defaults with overrides: an override replaces the default if matching by id or name
  const merged: RoleModel[] = defaults.map((d) => {
    const override = combinedOverrides.find(
      (o) => o.id === d.id || o.name.toLowerCase() === d.name.toLowerCase()
    );
    if (override) {
      return {
        ...d,
        ...override,
        isSystem: true,
        permissions: override.permissions || d.permissions,
      };
    }
    return d;
  });

  // 4. Add custom created roles
  combinedOverrides.forEach((co) => {
    if (!merged.some((m) => m.id === co.id || m.name.toLowerCase() === co.name.toLowerCase())) {
      merged.push(co);
    }
  });

  return merged;
}

export async function createOrgRole(
  organizationId: string,
  input: {
    name: string;
    description?: string;
    hierarchyLevel: HierarchyLevel;
    permissions: Record<ModuleKey, TabPermission>;
  }
): Promise<RoleModel> {
  const now = Date.now();
  const roleId = `role-${crypto.randomUUID()}`;
  const newRole: RoleModel = {
    id: roleId,
    organizationId,
    name: input.name.trim(),
    description: input.description?.trim() || "",
    hierarchyLevel: input.hierarchyLevel || "OPERATIONAL",
    isSystem: false,
    permissions: input.permissions,
    createdAt: now,
    updatedAt: now,
  };

  // 1. Persist to Supabase DB
  try {
    const supabase = getSupabaseAdminClient();
    await supabase.from("organization_roles").insert({
      id: newRole.id,
      organization_id: newRole.organizationId,
      name: newRole.name,
      description: newRole.description,
      hierarchy_level: newRole.hierarchyLevel,
      is_system: false,
      permissions: JSON.stringify(newRole.permissions),
      created_at: now,
      updated_at: now,
    });
  } catch (err) {
    console.error("Supabase insert role error:", err);
  }

  // 2. Try insert into SQLite DB
  try {
    const db = getDb();
    await db.insert(organizationRoles).values({
      id: newRole.id,
      organizationId: newRole.organizationId,
      name: newRole.name,
      description: newRole.description,
      hierarchyLevel: newRole.hierarchyLevel,
      isSystem: false,
      permissions: JSON.stringify(newRole.permissions),
      createdAt: now,
      updatedAt: now,
    });
  } catch (_) {}

  // 3. Persist in memory store
  if (!CUSTOM_ROLES_STORE[organizationId]) {
    CUSTOM_ROLES_STORE[organizationId] = [];
  }
  CUSTOM_ROLES_STORE[organizationId].unshift(newRole);

  return newRole;
}

export async function updateOrgRole(
  organizationId: string,
  roleId: string,
  input: {
    name?: string;
    description?: string;
    hierarchyLevel?: HierarchyLevel;
    permissions?: Record<ModuleKey, TabPermission>;
  }
): Promise<RoleModel> {
  const now = Date.now();
  const all = await listOrgRoles(organizationId);
  const target = all.find((r) => r.id === roleId);
  if (!target) throw new Error("Rôle introuvable");

  const updatedRole: RoleModel = {
    ...target,
    name: input.name ? input.name.trim() : target.name,
    description: input.description !== undefined ? input.description.trim() : target.description,
    hierarchyLevel: input.hierarchyLevel || target.hierarchyLevel,
    permissions: input.permissions || target.permissions,
    updatedAt: now,
  };

  // 1. Persist to Supabase DB
  try {
    const supabase = getSupabaseAdminClient();
    await supabase.from("organization_roles").upsert({
      id: roleId,
      organization_id: organizationId,
      name: updatedRole.name,
      description: updatedRole.description,
      hierarchy_level: updatedRole.hierarchyLevel,
      is_system: target.isSystem,
      permissions: JSON.stringify(updatedRole.permissions),
      created_at: target.createdAt || now,
      updated_at: now,
    });
  } catch (err) {
    console.error("Supabase upsert role error:", err);
  }

  // 2. Try DB upsert in SQLite
  try {
    const db = getDb();
    const [existing] = await db
      .select()
      .from(organizationRoles)
      .where(
        and(
          eq(organizationRoles.id, roleId),
          eq(organizationRoles.organizationId, organizationId)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(organizationRoles)
        .set({
          name: updatedRole.name,
          description: updatedRole.description,
          hierarchyLevel: updatedRole.hierarchyLevel,
          permissions: JSON.stringify(updatedRole.permissions),
          updatedAt: now,
        })
        .where(
          and(
            eq(organizationRoles.id, roleId),
            eq(organizationRoles.organizationId, organizationId)
          )
        );
    } else {
      await db.insert(organizationRoles).values({
        id: roleId,
        organizationId,
        name: updatedRole.name,
        description: updatedRole.description,
        hierarchyLevel: updatedRole.hierarchyLevel,
        isSystem: target.isSystem,
        permissions: JSON.stringify(updatedRole.permissions),
        createdAt: target.createdAt || now,
        updatedAt: now,
      });
    }
  } catch (_) {}

  // 3. Update memory store
  if (!CUSTOM_ROLES_STORE[organizationId]) {
    CUSTOM_ROLES_STORE[organizationId] = [];
  }
  const idx = CUSTOM_ROLES_STORE[organizationId].findIndex((r) => r.id === roleId);
  if (idx !== -1) {
    CUSTOM_ROLES_STORE[organizationId][idx] = updatedRole;
  } else {
    CUSTOM_ROLES_STORE[organizationId].unshift(updatedRole);
  }

  return updatedRole;
}

export async function deleteOrgRole(
  organizationId: string,
  roleId: string
): Promise<void> {
  // Check if it's a protected system role
  if (
    roleId.startsWith("role-pdg") ||
    roleId.startsWith("role-admin") ||
    roleId.startsWith("role-rh") ||
    roleId.startsWith("role-secretary") ||
    roleId.startsWith("role-branch") ||
    roleId.startsWith("role-finance") ||
    roleId.startsWith("role-employee")
  ) {
    throw new Error("Impossible de supprimer un rôle système par défaut de l'organisation.");
  }

  // 1. Try Supabase delete
  try {
    const supabase = getSupabaseAdminClient();
    await supabase
      .from("organization_roles")
      .delete()
      .eq("id", roleId)
      .eq("organization_id", organizationId);
  } catch (_) {}

  // 2. Try SQLite delete
  try {
    const db = getDb();
    await db
      .delete(organizationRoles)
      .where(
        and(
          eq(organizationRoles.id, roleId),
          eq(organizationRoles.organizationId, organizationId)
        )
      );
  } catch (_) {}

  // 3. Delete from memory store
  if (CUSTOM_ROLES_STORE[organizationId]) {
    CUSTOM_ROLES_STORE[organizationId] = CUSTOM_ROLES_STORE[organizationId].filter(
      (r) => r.id !== roleId
    );
  }
}
