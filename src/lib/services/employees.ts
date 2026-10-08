import { getDb } from "@/lib/db/client";
import { employees, Employee, InsertEmployee } from "@/db/schema";
import { eq, and, desc, sql, or, like } from "drizzle-orm";
import { EmployeeInput } from "@/lib/validation/schemas";

export async function listEmployees(
  organizationId: string,
  search?: string,
  statusFilter?: string,
  dbInstance?: any
): Promise<Employee[]> {
  const db = dbInstance || getDb();

  // Ensure employees table exists
  try {
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL REFERENCES organizations(id),
        employee_number TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        department TEXT NOT NULL,
        position TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);
  } catch (_) {}

  const conditions = [eq(employees.organizationId, organizationId)];

  if (statusFilter && (statusFilter === "ACTIVE" || statusFilter === "INACTIVE")) {
    conditions.push(eq(employees.status, statusFilter));
  }

  if (search && search.trim().length > 0) {
    const s = `%${search.trim().toLowerCase()}%`;
    conditions.push(
      or(
        like(sql`lower(${employees.firstName})`, s),
        like(sql`lower(${employees.lastName})`, s),
        like(sql`lower(${employees.employeeNumber})`, s),
        like(sql`lower(${employees.department})`, s),
        like(sql`lower(${employees.position})`, s)
      )!
    );
  }

  return await db
    .select()
    .from(employees)
    .where(and(...conditions))
    .orderBy(desc(employees.createdAt));
}

export async function getEmployeeById(
  organizationId: string,
  id: string,
  dbInstance?: any
): Promise<Employee | null> {
  const db = dbInstance || getDb();
  const [emp] = await db
    .select()
    .from(employees)
    .where(and(eq(employees.id, id), eq(employees.organizationId, organizationId)))
    .limit(1);

  return emp || null;
}

export async function createEmployee(
  organizationId: string,
  input: EmployeeInput,
  dbInstance?: any
): Promise<Employee> {
  const db = dbInstance || getDb();

  // Ensure employees table exists in Turso
  try {
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL REFERENCES organizations(id),
        employee_number TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        department TEXT NOT NULL,
        position TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);
  } catch (_) {}

  // Check duplicate employee number within the same organization
  const [existing] = await db
    .select()
    .from(employees)
    .where(
      and(
        eq(employees.organizationId, organizationId),
        eq(employees.employeeNumber, input.employeeNumber.trim())
      )
    )
    .limit(1);

  if (existing) {
    throw new Error(`Le matricule / N° d'employé "${input.employeeNumber}" est déjà attribué dans cette entreprise.`);
  }

  const now = Date.now();
  const newId = `emp-${crypto.randomUUID()}`;

  const insertData: InsertEmployee = {
    id: newId,
    organizationId,
    employeeNumber: input.employeeNumber.trim(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    department: input.department.trim(),
    position: input.position.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || null,
    status: input.status || "ACTIVE",
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(employees).values(insertData);

  const [created] = await db
    .select()
    .from(employees)
    .where(eq(employees.id, newId))
    .limit(1);

  return created;
}

export async function updateEmployee(
  organizationId: string,
  id: string,
  input: Partial<EmployeeInput>,
  dbInstance?: any
): Promise<Employee> {
  const db = dbInstance || getDb();

  const [current] = await db
    .select()
    .from(employees)
    .where(and(eq(employees.id, id), eq(employees.organizationId, organizationId)))
    .limit(1);

  if (!current) {
    throw new Error("Employé introuvable");
  }

  // Check unique employee number if updated
  if (input.employeeNumber && input.employeeNumber.trim() !== current.employeeNumber) {
    const [existing] = await db
      .select()
      .from(employees)
      .where(
        and(
          eq(employees.organizationId, organizationId),
          eq(employees.employeeNumber, input.employeeNumber.trim())
        )
      )
      .limit(1);

    if (existing && existing.id !== id) {
      throw new Error(`Le matricule "${input.employeeNumber}" est déjà utilisé.`);
    }
  }

  const now = Date.now();
  const updateData: Partial<InsertEmployee> = {
    updatedAt: now,
  };

  if (input.employeeNumber !== undefined) updateData.employeeNumber = input.employeeNumber.trim();
  if (input.firstName !== undefined) updateData.firstName = input.firstName.trim();
  if (input.lastName !== undefined) updateData.lastName = input.lastName.trim();
  if (input.department !== undefined) updateData.department = input.department.trim();
  if (input.position !== undefined) updateData.position = input.position.trim();
  if (input.phone !== undefined) updateData.phone = input.phone.trim();
  if (input.email !== undefined) updateData.email = input.email ? input.email.trim() : null;
  if (input.status !== undefined) updateData.status = input.status;

  await db
    .update(employees)
    .set(updateData)
    .where(and(eq(employees.id, id), eq(employees.organizationId, organizationId)));

  const [updated] = await db
    .select()
    .from(employees)
    .where(eq(employees.id, id))
    .limit(1);

  return updated;
}

export async function deleteEmployee(
  organizationId: string,
  id: string,
  dbInstance?: any
): Promise<void> {
  const db = dbInstance || getDb();
  await db
    .delete(employees)
    .where(and(eq(employees.id, id), eq(employees.organizationId, organizationId)));
}
