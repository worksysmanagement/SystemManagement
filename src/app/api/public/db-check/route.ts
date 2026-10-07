import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { organizations, users } from "@/db/schema";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const db = getDb();
    const orgList = await db.select().from(organizations);
    const userList = await db.select({ id: users.id, email: users.email, role: users.role }).from(users);

    return NextResponse.json({
      status: "SUCCESS",
      connected: true,
      message: "Connexion à la base de données Turso Cloud opérationnelle !",
      environment: {
        hasTursoUrl: Boolean(process.env.TURSO_DATABASE_URL || process.env.STORAGE_URL),
        hasTursoToken: Boolean(process.env.TURSO_AUTH_TOKEN || process.env.STORAGE_AUTH_TOKEN),
      },
      organizationsCount: orgList.length,
      organizations: orgList.map((o) => ({ id: o.id, name: o.name, slug: o.slug })),
      usersCount: userList.length,
      users: userList,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "ERROR",
        connected: false,
        error: err?.message || String(err),
        stack: err?.stack,
        environment: {
          hasTursoUrl: Boolean(process.env.TURSO_DATABASE_URL || process.env.STORAGE_URL),
          hasTursoToken: Boolean(process.env.TURSO_AUTH_TOKEN || process.env.STORAGE_AUTH_TOKEN),
        },
      },
      { status: 500 }
    );
  }
}
