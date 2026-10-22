import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db/client";
import { users, organizations, auditLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { hashPassword } from "@/lib/auth/password";
import { hashToken } from "@/lib/security/tokens";
import { validateStrongPassword } from "@/lib/validation/password";
import { setSessionCookie } from "@/lib/auth/session";

/**
 * GET: Checks if a password reset token is valid.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Jeton de réinitialisation manquant." },
        { status: 400 }
      );
    }

    let matchedLog: any = null;
    let matchedMetadata: any = null;
    const tokenHash = await hashToken(token);

    // 1. Supabase search
    try {
      const supabase = getSupabaseAdminClient();
      const { data: logs } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("action", "PASSWORD_RESET_REQUESTED")
        .order("created_at", { ascending: false });

      for (const log of (logs || [])) {
        if (log.metadata) {
          try {
            const meta = typeof log.metadata === "string" ? JSON.parse(log.metadata) : log.metadata;
            if (meta.resetTokenHash === tokenHash || meta.resetToken === token) {
              matchedLog = log;
              matchedMetadata = meta;
              break;
            }
          } catch (_) {}
        }
      }
    } catch (e) {
      console.warn("Supabase check error in reset-password GET:", e);
    }

    // 2. Local SQLite fallback
    if (!matchedLog) {
      try {
        const db = getDb();
        const logs = await db
          .select()
          .from(auditLogs)
          .where(eq(auditLogs.action, "PASSWORD_RESET_REQUESTED" as any))
          .orderBy(desc(auditLogs.createdAt));

        for (const log of logs) {
          if (log.metadata) {
            try {
              const meta = typeof log.metadata === "string" ? JSON.parse(log.metadata) : log.metadata;
              if (meta.resetTokenHash === tokenHash || meta.resetToken === token) {
                matchedLog = log;
                matchedMetadata = meta;
                break;
              }
            } catch (_) {}
          }
        }
      } catch (_) {}
    }

    if (!matchedLog || !matchedMetadata) {
      return NextResponse.json(
        { error: "Ce lien de réinitialisation est invalide ou n'existe pas." },
        { status: 404 }
      );
    }

    if (matchedMetadata.isRevoked) {
      return NextResponse.json(
        { error: "Ce lien de réinitialisation a été révoqué." },
        { status: 410 }
      );
    }

    if (matchedMetadata.isUsed) {
      return NextResponse.json(
        { error: "Ce lien de réinitialisation a déjà été utilisé pour modifier votre mot de passe." },
        { status: 400 }
      );
    }

    if (matchedMetadata.expiresAt && Number(matchedMetadata.expiresAt) < Date.now()) {
      return NextResponse.json(
        { error: "Ce lien de réinitialisation a expiré (validité 1 heure). Veuillez effectuer une nouvelle demande." },
        { status: 410 }
      );
    }

    return NextResponse.json({
      valid: true,
      email: matchedMetadata.email,
      userName: matchedMetadata.userName,
    });
  } catch (err: any) {
    console.error("Reset password GET error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la vérification du lien." },
      { status: 500 }
    );
  }
}

/**
 * POST: Validates new strong password, updates user in Supabase/local DB,
 * marks reset token as used, and establishes session.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Jeton de réinitialisation manquant." },
        { status: 400 }
      );
    }

    const val = validateStrongPassword(password || "");
    if (!val.isValid) {
      return NextResponse.json(
        { error: `Mot de passe non conforme : ${val.errors.join(", ")}` },
        { status: 400 }
      );
    }

    let matchedLog: any = null;
    let matchedMetadata: any = null;
    const tokenHash = await hashToken(token);

    // 1. Supabase search
    try {
      const supabase = getSupabaseAdminClient();
      const { data: logs } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("action", "PASSWORD_RESET_REQUESTED")
        .order("created_at", { ascending: false });

      for (const log of (logs || [])) {
        if (log.metadata) {
          try {
            const meta = typeof log.metadata === "string" ? JSON.parse(log.metadata) : log.metadata;
            if (meta.resetTokenHash === tokenHash || meta.resetToken === token) {
              matchedLog = log;
              matchedMetadata = meta;
              break;
            }
          } catch (_) {}
        }
      }
    } catch (e) {
      console.warn("Supabase lookup error in reset-password POST:", e);
    }

    // 2. SQLite search fallback
    if (!matchedLog) {
      try {
        const db = getDb();
        const logs = await db
          .select()
          .from(auditLogs)
          .where(eq(auditLogs.action, "PASSWORD_RESET_REQUESTED" as any))
          .orderBy(desc(auditLogs.createdAt));

        for (const log of logs) {
          if (log.metadata) {
            try {
              const meta = typeof log.metadata === "string" ? JSON.parse(log.metadata) : log.metadata;
              if (meta.resetTokenHash === tokenHash || meta.resetToken === token) {
                matchedLog = log;
                matchedMetadata = meta;
                break;
              }
            } catch (_) {}
          }
        }
      } catch (_) {}
    }

    if (!matchedLog || !matchedMetadata) {
      return NextResponse.json(
        { error: "Ce lien de réinitialisation est invalide ou introuvable." },
        { status: 404 }
      );
    }

    if (matchedMetadata.isRevoked) {
      return NextResponse.json(
        { error: "Ce lien a été révoqué." },
        { status: 410 }
      );
    }

    if (matchedMetadata.isUsed) {
      return NextResponse.json(
        { error: "Ce lien a déjà été utilisé pour changer votre mot de passe." },
        { status: 400 }
      );
    }

    if (matchedMetadata.expiresAt && Number(matchedMetadata.expiresAt) < Date.now()) {
      return NextResponse.json(
        { error: "Ce lien a expiré. Veuillez refaire une demande." },
        { status: 410 }
      );
    }

    const now = Date.now();
    const passwordHash = await hashPassword(password);
    const userId = matchedMetadata.userId;
    const orgId = matchedLog.organization_id;

    let updatedUser: any = null;
    let orgData: any = null;

    // Update in Supabase
    try {
      const supabase = getSupabaseAdminClient();

      // Update user password and ensure status ACTIVE
      const { data: userRow } = await supabase
        .from("users")
        .update({
          password_hash: passwordHash,
          status: "ACTIVE",
          updated_at: now,
        })
        .eq("id", userId)
        .select()
        .maybeSingle();

      updatedUser = userRow;

      if (orgId) {
        // Ensure organization status is ACTIVE as well
        const { data: oRow } = await supabase
          .from("organizations")
          .update({ status: "ACTIVE", updated_at: now })
          .eq("id", orgId)
          .select()
          .maybeSingle();
        orgData = oRow;
      }

      // Mark reset token as used
      matchedMetadata.isUsed = true;
      matchedMetadata.usedAt = now;

      await supabase
        .from("audit_logs")
        .update({
          metadata: JSON.stringify(matchedMetadata),
        })
        .eq("id", matchedLog.id);

      // Audit log completion
      await supabase.from("audit_logs").insert({
        id: `audit-resetdone-${now}`,
        organization_id: orgId,
        user_id: userId,
        action: "PASSWORD_RESET_COMPLETED",
        old_status: "ACTIVE",
        new_status: "ACTIVE",
        metadata: JSON.stringify({ resetCompletedAt: now }),
        created_at: now,
      });
    } catch (supaErr) {
      console.error("Supabase update error during reset-password:", supaErr);
    }

    // Mirror to SQLite if present
    try {
      const db = getDb();
      await db
        .update(users)
        .set({
          passwordHash,
          status: "ACTIVE",
          updatedAt: now,
        })
        .where(eq(users.id, userId));

      if (orgId) {
        await db
          .update(organizations)
          .set({ status: "ACTIVE", updatedAt: now })
          .where(eq(organizations.id, orgId));
      }

      await db
        .update(auditLogs)
        .set({
          metadata: JSON.stringify(matchedMetadata),
        })
        .where(eq(auditLogs.id, matchedLog.id));
    } catch (_) {}

    // Establish session cookie so user is seamlessly logged in
    const finalRole = updatedUser?.role || "ORGANIZATION_ADMIN";
    const finalName = updatedUser?.name || matchedMetadata.userName || "Administrateur";
    const finalEmail = updatedUser?.email || matchedMetadata.email;
    const finalOrgName = orgData?.name || "Organisation";
    const finalOrgSlug = orgData?.slug || "org";

    try {
      await setSessionCookie({
        id: userId,
        name: finalName,
        email: finalEmail,
        role: finalRole,
        organizationId: orgId,
        organizationName: finalOrgName,
        organizationSlug: finalOrgSlug,
      });
    } catch (sessionErr) {
      console.error("Failed to set session cookie on reset password:", sessionErr);
    }

    const redirectUrl =
      finalRole === "SUPER_ADMIN"
        ? "/super-admin/dashboard"
        : finalRole === "ORGANIZATION_ADMIN"
        ? "/admin/dashboard"
        : "/admin/requests";

    return NextResponse.json({
      success: true,
      message: "Votre mot de passe a été modifié avec succès !",
      redirectUrl,
    });
  } catch (err: any) {
    console.error("Reset password POST error:", err);
    return NextResponse.json(
      { error: `Erreur lors de la réinitialisation : ${err?.message || "Veuillez réessayer"}` },
      { status: 500 }
    );
  }
}
