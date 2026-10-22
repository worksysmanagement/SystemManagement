import { getDb } from "@/lib/db/client";
import { branches, Branch, InsertBranch } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { supabaseDb } from "@/lib/supabase/db";
import { APP_CONFIG } from "@/config/app";

export async function listBranches(
  organizationId: string,
  dbInstance?: any
): Promise<Branch[]> {
  try {
    if (!dbInstance) {
      const remoteList = await supabaseDb.branches.list(organizationId);
      if (remoteList && remoteList.length > 0) {
        return remoteList;
      }
      
      // If organization has no branch in Supabase, auto-create a default "Siège Principal"
      const defaultBranch = await supabaseDb.branches.create(organizationId, {
        id: `br-${organizationId}-siege`,
        organizationId,
        code: "SIEGE",
        name: "Siège Principal",
        city: "Port-au-Prince",
        address: "Avenue Charles Sumner, Port-au-Prince",
        managerName: "Direction Générale",
        phone: "+509 2811-0001",
        status: "ACTIVE",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return [defaultBranch];
    }
  } catch (_) {}

  // Fallback to local SQLite / Drizzle
  try {
    const db = dbInstance || getDb();
    const rows = await db
      .select()
      .from(branches)
      .where(eq(branches.organizationId, organizationId));

    if (rows && rows.length > 0) {
      return rows;
    }
  } catch (_) {}

  // Default seed branches from APP_CONFIG for immediate preview if db fails
  const now = Date.now();
  return APP_CONFIG.defaultBranches.map((def, idx) => ({
    id: def.id,
    organizationId,
    code: def.code,
    name: def.name,
    city: def.city,
    address: `${def.name}, ${def.city}`,
    managerName: idx === 0 ? "Directeur Général" : "Responsable d'agence",
    phone: `+509 2811-000${idx + 1}`,
    status: "ACTIVE" as const,
    createdAt: now,
    updatedAt: now,
  }));
}

export async function getBranchById(
  organizationId: string,
  id: string,
  dbInstance?: any
): Promise<Branch | null> {
  try {
    if (!dbInstance) {
      return await supabaseDb.branches.getById(id, organizationId);
    }
  } catch (_) {}

  const db = dbInstance || getDb();
  const [b] = await db
    .select()
    .from(branches)
    .where(and(eq(branches.id, id), eq(branches.organizationId, organizationId)))
    .limit(1);

  return b || null;
}

export async function createBranch(
  organizationId: string,
  input: {
    code: string;
    name: string;
    city: string;
    address?: string | null;
    managerName?: string | null;
    phone?: string | null;
    status?: "ACTIVE" | "INACTIVE";
  },
  dbInstance?: any
): Promise<Branch> {
  const now = Date.now();
  const branchId = `br-${now}-${Math.random().toString(36).slice(-4)}`;

  try {
    if (!dbInstance) {
      return await supabaseDb.branches.create(organizationId, {
        id: branchId,
        organizationId,
        code: input.code,
        name: input.name,
        city: input.city,
        address: input.address || null,
        managerName: input.managerName || null,
        phone: input.phone || null,
        status: input.status || "ACTIVE",
        createdAt: now,
        updatedAt: now,
      });
    }
  } catch (_) {}

  const db = dbInstance || getDb();
  const newRecord: InsertBranch = {
    id: branchId,
    organizationId,
    code: input.code,
    name: input.name,
    city: input.city,
    address: input.address || null,
    managerName: input.managerName || null,
    phone: input.phone || null,
    status: input.status || "ACTIVE",
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(branches).values(newRecord);
  return newRecord as Branch;
}

export async function updateBranch(
  organizationId: string,
  id: string,
  input: {
    code?: string;
    name?: string;
    city?: string;
    address?: string | null;
    managerName?: string | null;
    phone?: string | null;
    status?: "ACTIVE" | "INACTIVE";
  },
  dbInstance?: any
): Promise<Branch> {
  const now = Date.now();

  try {
    if (!dbInstance) {
      return await supabaseDb.branches.update(id, organizationId, {
        code: input.code,
        name: input.name,
        city: input.city,
        address: input.address,
        managerName: input.managerName,
        phone: input.phone,
        status: input.status,
      });
    }
  } catch (_) {}

  const db = dbInstance || getDb();
  const updateData: Partial<InsertBranch> = {
    updatedAt: now,
  };

  if (input.code !== undefined) updateData.code = input.code;
  if (input.name !== undefined) updateData.name = input.name;
  if (input.city !== undefined) updateData.city = input.city;
  if (input.address !== undefined) updateData.address = input.address;
  if (input.managerName !== undefined) updateData.managerName = input.managerName;
  if (input.phone !== undefined) updateData.phone = input.phone;
  if (input.status !== undefined) updateData.status = input.status;

  await db
    .update(branches)
    .set(updateData)
    .where(and(eq(branches.id, id), eq(branches.organizationId, organizationId)));

  const [updated] = await db
    .select()
    .from(branches)
    .where(eq(branches.id, id))
    .limit(1);

  return updated;
}

export async function deleteBranch(
  organizationId: string,
  id: string,
  dbInstance?: any
): Promise<void> {
  try {
    if (!dbInstance) {
      await supabaseDb.branches.delete(id, organizationId);
      return;
    }
  } catch (_) {}

  const db = dbInstance || getDb();
  await db
    .delete(branches)
    .where(and(eq(branches.id, id), eq(branches.organizationId, organizationId)));
}
