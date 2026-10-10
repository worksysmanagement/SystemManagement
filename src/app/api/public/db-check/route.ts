import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { organizations, users } from "@/db/schema";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasSupabaseKeys = Boolean(supabaseUrl && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  let supabaseStatus = {
    configured: hasSupabaseKeys,
    connected: false,
    error: null as string | null,
  };

  if (hasSupabaseKeys) {
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("organizations").select("id").limit(1);
      if (error) {
        supabaseStatus.error = error.message;
      } else {
        supabaseStatus.connected = true;
      }
    } catch (err: any) {
      supabaseStatus.error = err?.message || String(err);
    }
  }

  try {
    const db = getDb();
    const orgList = await db.select().from(organizations);
    const userList = await db.select({ id: users.id, email: users.email, role: users.role }).from(users);

    return NextResponse.json({
      status: "SUCCESS",
      connected: true,
      message: "Connexion à la base de données opérationnelle !",
      supabase: supabaseStatus,
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
        supabase: supabaseStatus,
        error: err?.message || String(err),
        stack: err?.stack,
      },
      { status: 500 }
    );
  }
}

