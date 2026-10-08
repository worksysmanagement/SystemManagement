import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { employees } from "@/db/schema";
import { eq, and, asc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const organizationId = url.searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json({ employees: [] });
    }

    const db = getDb();

    // Ensure table exists
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

    const empList = await db
      .select({
        id: employees.id,
        employeeNumber: employees.employeeNumber,
        firstName: employees.firstName,
        lastName: employees.lastName,
        department: employees.department,
        position: employees.position,
        phone: employees.phone,
        email: employees.email,
      })
      .from(employees)
      .where(
        and(
          eq(employees.organizationId, organizationId),
          eq(employees.status, "ACTIVE")
        )
      )
      .orderBy(asc(employees.lastName), asc(employees.firstName));

    return NextResponse.json({ employees: empList });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Erreur serveur" }, { status: 500 });
  }
}
