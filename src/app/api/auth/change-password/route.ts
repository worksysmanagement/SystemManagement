import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, hashPassword } from "@/lib/auth/password";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json(
        { error: "Session non authentifiée. Veuillez vous reconnecter." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Veuillez renseigner le mot de passe actuel et le nouveau mot de passe." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Le nouveau mot de passe doit comporter au moins 8 caractères." },
        { status: 400 }
      );
    }

    // 1. Fetch user from Supabase or local SQLite
    let userRecord: any = null;
    try {
      const supabase = (await import("@/lib/supabase/server")).getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.id)
        .maybeSingle();

      if (!error && data) {
        const { mapUser } = await import("@/lib/supabase/db");
        userRecord = mapUser(data);
      }
    } catch (_) {}

    if (!userRecord) {
      const db = getDb();
      const rows = await db.select().from(users).where(eq(users.id, session.id)).limit(1);
      if (rows && rows.length > 0) {
        userRecord = rows[0];
      }
    }

    if (!userRecord) {
      return NextResponse.json(
        { error: "Compte utilisateur introuvable." },
        { status: 404 }
      );
    }

    // 2. Verify current password
    const isCurrentValid = await verifyPassword(currentPassword, userRecord.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: "Le mot de passe actuel est incorrect." },
        { status: 400 }
      );
    }

    // 3. Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // 4. Update in Supabase
    try {
      const supabase = (await import("@/lib/supabase/server")).getSupabaseAdminClient();
      await supabase
        .from("users")
        .update({
          password_hash: newPasswordHash,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.id);
    } catch (_) {}

    // 5. Update in local SQLite DB
    try {
      const db = getDb();
      await db
        .update(users)
        .set({
          passwordHash: newPasswordHash,
          updatedAt: Date.now(),
        })
        .where(eq(users.id, session.id));
    } catch (_) {}

    return NextResponse.json({
      success: true,
      message: "Mot de passe mis à jour avec succès.",
    });
  } catch (err: any) {
    console.error("Change password error:", err);
    return NextResponse.json(
      { error: "Erreur serveur lors de la mise à jour du mot de passe." },
      { status: 500 }
    );
  }
}
