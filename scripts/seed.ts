import { getDb } from "../src/lib/db/client";
import { runMigrations } from "./migrate";
import {
  organizations,
  users,
  leaveRequests,
  auditLogs,
  notificationLogs,
} from "../src/db/schema";
import { hashPassword } from "../src/lib/auth/password";
import { sql } from "drizzle-orm";

export async function seedDatabase(dbInstance?: any) {
  const db = dbInstance || getDb();
  await runMigrations(db);

  console.log("Cleaning and seeding database (organizations & admins only)...");
  const now = Date.now();

  // Clear existing tables in reverse FK order
  await db.run(sql`DELETE FROM notification_logs`);
  await db.run(sql`DELETE FROM audit_logs`);
  await db.run(sql`DELETE FROM leave_requests`);
  await db.run(sql`DELETE FROM users`);
  await db.run(sql`DELETE FROM organizations`);

  // 1. ORGANIZATIONS
  const orgWelj = {
    id: "org-welj",
    name: "Welj Express Services",
    slug: "welj",
    logoUrl: null,
    email: "support@welj-ht.com",
    phone: "+225 0501020304",
    address: "Plateau, Avenue Nogues, Abidjan",
    status: "ACTIVE" as const,
    createdAt: now,
    updatedAt: now,
  };

  const orgTechnozi = {
    id: "org-technozi",
    name: "Technozi",
    slug: "technozi",
    logoUrl: null,
    email: "sales@technozi-ht.com",
    phone: "+225 0701020304",
    address: "Zone 4, Boulevard de Marseille, Abidjan",
    status: "ACTIVE" as const,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(organizations).values([orgWelj, orgTechnozi]);

  // 2. USERS
  const pitonAdminPass = await hashPassword("pitonrp8");
  const superAdminPass = await hashPassword("SuperAdmin2026!");
  const weljAdminPass = await hashPassword("Adminwelj@2026");
  const technoziPass = await hashPassword("Technozi@Haiti1234");

  const initialUsers = [
    // Primary Super Admin
    {
      id: "usr-piton-super-admin",
      organizationId: null,
      name: "Rodjy Piton",
      email: "pitonrodjy@gmail.com",
      passwordHash: pitonAdminPass,
      role: "SUPER_ADMIN" as const,
      status: "ACTIVE" as const,
      createdAt: now,
      updatedAt: now,
    },
    // Welj Admin
    {
      id: "usr-welj-admin",
      organizationId: orgWelj.id,
      name: "Direction Welj Express Services",
      email: "support@welj-ht.com",
      passwordHash: weljAdminPass,
      role: "ORGANIZATION_ADMIN" as const,
      status: "ACTIVE" as const,
      createdAt: now,
      updatedAt: now,
    },
    // Technozi Admin
    {
      id: "usr-technozi-admin",
      organizationId: orgTechnozi.id,
      name: "Direction Technozi",
      email: "sales@technozi-ht.com",
      passwordHash: technoziPass,
      role: "ORGANIZATION_ADMIN" as const,
      status: "ACTIVE" as const,
      createdAt: now,
      updatedAt: now,
    },
    // Global Super Admin (Backup)
    {
      id: "usr-super-admin",
      organizationId: null,
      name: "Super Administrateur Plateforme",
      email: "superadmin@platform.local",
      passwordHash: superAdminPass,
      role: "SUPER_ADMIN" as const,
      status: "ACTIVE" as const,
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const u of initialUsers) {
    await db.insert(users).values(u);
  }

  console.log("Database seeded successfully with organizations and admin accounts.");
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seed error:", err);
      process.exit(1);
    });
}
