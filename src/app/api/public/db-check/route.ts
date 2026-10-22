import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasSupabaseKeys = Boolean(supabaseUrl && process.env.SUPABASE_SERVICE_ROLE_KEY);

  let supabaseStatus = {
    configured: hasSupabaseKeys,
    connected: false,
    error: null as string | null,
  };

  try {
    const supabase = getSupabaseAdminClient();
    const { data: orgs, error: orgErr } = await supabase
      .from("organizations")
      .select("id, name, slug, status")
      .order("name", { ascending: true });

    if (orgErr) {
      supabaseStatus.error = orgErr.message;
      throw new Error(orgErr.message);
    }

    const { data: userList, error: userErr } = await supabase
      .from("users")
      .select("id, email, role, status")
      .order("email", { ascending: true });

    if (userErr) {
      supabaseStatus.error = userErr.message;
      throw new Error(userErr.message);
    }

    supabaseStatus.connected = true;

    return NextResponse.json({
      status: "SUCCESS",
      connected: true,
      database: "SUPABASE CLOUD",
      message: "Connexion directe à la base de données Supabase opérationnelle !",
      supabase: supabaseStatus,
      organizationsCount: orgs?.length || 0,
      organizations: orgs || [],
      usersCount: userList?.length || 0,
      users: userList || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "ERROR",
        connected: false,
        database: "SUPABASE CLOUD",
        supabase: supabaseStatus,
        error: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}

