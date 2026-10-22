import { getDb } from "@/lib/db/client";
import { users, User, InsertUser } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { CreateOrgUserInput } from "@/lib/validation/schemas";
import { hashPassword } from "@/lib/auth/password";
import { supabaseDb } from "@/lib/supabase/db";

export async function listOrgUsers(
  organizationId: string,
  dbInstance?: any
): Promise<Omit<User, "passwordHash">[]> {
  if (!dbInstance) {
    return await supabaseDb.users.listByOrg(organizationId);
  }
  const db = dbInstance || getDb();
  return await db
    .select({
      id: users.id,
      organizationId: users.organizationId,
      branchId: users.branchId,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.organizationId, organizationId))
    .orderBy(desc(users.createdAt));
}

export async function createOrgUser(
  organizationId: string,
  input: CreateOrgUserInput,
  dbInstance?: any
): Promise<Omit<User, "passwordHash">> {
  if (!dbInstance) {
    return await supabaseDb.users.createOrgUser(organizationId, input);
  }
  const db = dbInstance || getDb();

  // Check unique email
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email.toLowerCase()))
    .limit(1);

  if (existing) {
    throw new Error("Cette adresse email est déjà utilisée");
  }

  const now = Date.now();
  const newId = `usr-${crypto.randomUUID()}`;
  const passwordHash = await hashPassword(input.password);

  const insertData: InsertUser = {
    id: newId,
    organizationId,
    branchId: input.branchId || null,
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash,
    role: input.role,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(users).values(insertData);

  const [created] = await db
    .select({
      id: users.id,
      organizationId: users.organizationId,
      branchId: users.branchId,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, newId))
    .limit(1);

  return created;
}

export async function getUserByEmail(email: string, dbInstance?: any): Promise<User | null> {
  if (!dbInstance) {
    return await supabaseDb.users.getByEmail(email);
  }
  const db = dbInstance || getDb();
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
  return user || null;
}

export async function getUserById(id: string, dbInstance?: any): Promise<User | null> {
  if (!dbInstance) {
    return await supabaseDb.users.getById(id);
  }
  const db = dbInstance || getDb();
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user || null;
}

export async function updateUserStatus(id: string, status: "ACTIVE" | "DISABLED", dbInstance?: any): Promise<void> {
  if (!dbInstance) {
    return await supabaseDb.users.updateStatus(id, status);
  }
  const db = dbInstance || getDb();
  await db.update(users).set({ status, updatedAt: Date.now() }).where(eq(users.id, id));
}
