import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { auditLogs, organizations, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";

/**
 * GET: Verifies if the token is valid and returns registration info for the set-password form.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Jeton de validation manquant ou invalide." },
        { status: 400 }
      );
    }

    let matchedLog: any = null;
    let matchedMetadata: any = null;

    // 1. Try Supabase first
    try {
      const supabase = (await import("@/lib/supabase/server")).getSupabaseAdminClient();
      const { data: supaLogs } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("action", "SUBMITTED")
        .order("created_at", { ascending: false });

      for (const log of (supaLogs || [])) {
        try {
          if (log.metadata) {
            const meta = typeof log.metadata === "string" ? JSON.parse(log.metadata) : log.metadata;
            if (meta.verificationToken === token) {
              matchedLog = log;
              matchedMetadata = meta;
              break;
            }
          }
        } catch (_) {}
      }
    } catch (_) {}

    // 2. Fallback to local db if not found
    if (!matchedLog) {
      const db = getDb();
      const logs = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.action, "SUBMITTED"))
        .orderBy(desc(auditLogs.createdAt));

      for (const log of logs) {
        try {
          if (log.metadata) {
            const meta = typeof log.metadata === "string" ? JSON.parse(log.metadata) : log.metadata;
            if (meta.verificationToken === token) {
              matchedLog = log;
              matchedMetadata = meta;
              break;
            }
          }
        } catch (_) {}
      }
    }

    if (!matchedLog || !matchedMetadata) {
      return NextResponse.json(
        { error: "Ce lien de validation est expiré ou n'existe pas." },
        { status: 404 }
      );
    }

    if (matchedMetadata.isRevoked) {
      return NextResponse.json(
        {
          error: "Ce lien d'activation a été révoqué suite à une nouvelle demande. Veuillez utiliser le lien présent dans le dernier e-mail reçu.",
          isRevoked: true,
        },
        { status: 410 }
      );
    }

    return NextResponse.json({
      valid: true,
      alreadyActivated: Boolean(matchedMetadata.passwordSet),
      companyName: matchedMetadata.companyName,
      companyEmail: matchedMetadata.companyEmail,
      applicantName: matchedMetadata.applicantName,
      applicantRole: matchedMetadata.applicantRole,
    });
  } catch (err: any) {
    console.error("Verify company GET error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la vérification du lien." },
      { status: 500 }
    );
  }
}

/**
 * POST: Sets the company administrator password, activates both user and organization,
 * establishes session cookie, and provides full access to the company space.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Jeton d'activation manquant." },
        { status: 400 }
      );
    }

    const { validateStrongPassword } = await import("@/lib/validation/password");
    const val = validateStrongPassword(password || "");
    if (!val.isValid) {
      return NextResponse.json(
        { error: `Mot de passe invalide : ${val.errors.join(", ")}` },
        { status: 400 }
      );
    }

    let matchedLog: any = null;
    let matchedMetadata: any = null;
    let sourceIsSupabase = false;

    // 1. Try Supabase first
    try {
      const supabase = (await import("@/lib/supabase/server")).getSupabaseAdminClient();
      const { data: supaLogs } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("action", "SUBMITTED")
        .order("created_at", { ascending: false });

      for (const log of (supaLogs || [])) {
        try {
          if (log.metadata) {
            const meta = typeof log.metadata === "string" ? JSON.parse(log.metadata) : log.metadata;
            if (meta.verificationToken === token) {
              matchedLog = log;
              matchedMetadata = meta;
              sourceIsSupabase = true;
              break;
            }
          }
        } catch (_) {}
      }
    } catch (_) {}

    // 2. Fallback to local db if not found
    if (!matchedLog) {
      const db = getDb();
      const logs = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.action, "SUBMITTED"))
        .orderBy(desc(auditLogs.createdAt));

      for (const log of logs) {
        try {
          if (log.metadata) {
            const meta = typeof log.metadata === "string" ? JSON.parse(log.metadata) : log.metadata;
            if (meta.verificationToken === token) {
              matchedLog = log;
              matchedMetadata = meta;
              break;
            }
          }
        } catch (_) {}
      }
    }

    if (!matchedLog || !matchedMetadata) {
      return NextResponse.json(
        { error: "Lien d'activation introuvable ou expiré." },
        { status: 404 }
      );
    }

    if (matchedMetadata.isRevoked) {
      return NextResponse.json(
        { error: "Ce lien d'activation a été révoqué suite à une nouvelle demande. Veuillez utiliser le dernier lien reçu par e-mail." },
        { status: 410 }
      );
    }

    if (matchedMetadata.passwordSet) {
      return NextResponse.json(
        { error: "Ce compte a déjà été activé. Vous pouvez vous connecter directement sur la page de connexion." },
        { status: 400 }
      );
    }

    const orgId = matchedLog.organization_id;
    const now = Date.now();
    const passwordHash = await hashPassword(password);

    let activatedUser: any = null;
    let activatedOrg: any = null;

    // Update in Supabase
    if (sourceIsSupabase || true) {
      try {
        const supabase = (await import("@/lib/supabase/server")).getSupabaseAdminClient();

        // 1. Activate organization
        const { data: orgData } = await supabase
          .from("organizations")
          .update({ status: "ACTIVE", updated_at: now })
          .eq("id", orgId)
          .select()
          .maybeSingle();

        activatedOrg = orgData;

        // 2. Activate user & set password
        const { data: userData } = await supabase
          .from("users")
          .update({
            password_hash: passwordHash,
            status: "ACTIVE",
            role: "ORGANIZATION_ADMIN",
            updated_at: now,
          })
          .eq("organization_id", orgId)
          .select()
          .maybeSingle();

        activatedUser = userData;

        // 3. Update audit log metadata
        matchedMetadata.emailVerified = true;
        matchedMetadata.passwordSet = true;
        matchedMetadata.activatedAt = now;

        await supabase
          .from("audit_logs")
          .update({
            metadata: JSON.stringify(matchedMetadata),
            new_status: "ACTIVE",
          })
          .eq("id", matchedLog.id);

        // 4. Insert activation log
        await supabase.from("audit_logs").insert({
          id: `audit-act-${now}`,
          organization_id: orgId,
          user_id: userData?.id || null,
          action: "ACTIVATED_BY_OWNER",
          old_status: "DISABLED",
          new_status: "ACTIVE",
          metadata: JSON.stringify({ activatedAt: now }),
          created_at: now,
        });
      } catch (supaErr) {
        console.error("Error activating in Supabase:", supaErr);
      }
    }

    // Mirror to local SQLite if available (non-blocking)
    try {
      const db = getDb();
      await db
        .update(organizations)
        .set({ status: "ACTIVE", updatedAt: now })
        .where(eq(organizations.id, orgId));

      await db
        .update(users)
        .set({
          passwordHash,
          status: "ACTIVE",
          role: "ORGANIZATION_ADMIN",
          updatedAt: now,
        })
        .where(eq(users.organizationId, orgId));

      await db
        .update(auditLogs)
        .set({
          metadata: JSON.stringify(matchedMetadata),
          newStatus: "ACTIVE",
        })
        .where(eq(auditLogs.id, matchedLog.id));
    } catch (_) {}

    // Fallbacks if not retrieved from Supabase select
    const orgName = activatedOrg?.name || matchedMetadata.companyName;
    const orgSlug = activatedOrg?.slug || matchedMetadata.companyName.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const userName = activatedUser?.name || matchedMetadata.applicantName;
    const userEmail = activatedUser?.email || matchedMetadata.companyEmail;
    const userId = activatedUser?.id || `usr-${now.toString().slice(-6)}`;

    // Automatically establish session cookie so user lands directly in /admin/dashboard
    try {
      await setSessionCookie({
        id: userId,
        name: userName,
        email: userEmail,
        role: "ORGANIZATION_ADMIN",
        organizationId: orgId,
        organizationName: orgName,
        organizationSlug: orgSlug,
      });
    } catch (sessionErr) {
      console.error("Failed to set session cookie on activation:", sessionErr);
    }

    return NextResponse.json({
      success: true,
      message: "Votre compte a été activé avec succès !",
      redirectUrl: "/admin/dashboard",
      companyName: orgName,
      userEmail,
    });
  } catch (err: any) {
    console.error("Verify company POST error:", err);
    return NextResponse.json(
      { error: `Erreur lors de la configuration du mot de passe: ${err?.message || "Veuillez réessayer"}` },
      { status: 500 }
    );
  }
}
