import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/notifications/email";
import { getDb } from "@/lib/db/client";
import { users, organizations, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || "").toString().trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Veuillez fournir une adresse e-mail valide." },
        { status: 400 }
      );
    }

    const rawAppUrl = process.env.APP_URL;
    const origin = (rawAppUrl && !rawAppUrl.includes("localhost"))
      ? rawAppUrl.replace(/\/+$/, "")
      : `${req.headers.get("host")?.includes("localhost") ? "http" : "https"}://${req.headers.get("host") || "localhost:3000"}`;
    const now = Date.now();

    let matchedUser: any = null;
    let matchedOrg: any = null;
    let isSupabase = false;

    // 1. Search in Supabase
    try {
      const supabase = getSupabaseAdminClient();
      const { data: supaUser } = await supabase
        .from("users")
        .select("*")
        .ilike("email", email)
        .maybeSingle();

      if (supaUser) {
        matchedUser = supaUser;
        isSupabase = true;

        if (supaUser.organization_id) {
          const { data: supaOrg } = await supabase
            .from("organizations")
            .select("*")
            .eq("id", supaUser.organization_id)
            .maybeSingle();
          matchedOrg = supaOrg;
        }
      }
    } catch (e) {
      console.warn("Supabase lookup in forgot-password failed, trying SQLite fallback:", e);
    }

    // 2. Fallback to local SQLite if not found
    if (!matchedUser) {
      try {
        const db = getDb();
        const [localUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (localUser) {
          matchedUser = {
            id: localUser.id,
            email: localUser.email,
            name: localUser.name,
            role: localUser.role,
            status: localUser.status,
            organization_id: localUser.organizationId,
            password_hash: localUser.passwordHash,
          };

          if (localUser.organizationId) {
            const [localOrg] = await db
              .select()
              .from(organizations)
              .where(eq(organizations.id, localUser.organizationId))
              .limit(1);
            matchedOrg = localOrg;
          }
        }
      } catch (_) {}
    }

    // Security practice: always return a friendly success message even if email not found
    if (!matchedUser) {
      return NextResponse.json({
        success: true,
        message:
          "Si cette adresse e-mail correspond à un compte inscrit, vous recevrez un lien de réinitialisation sous peu.",
      });
    }

    // Case A: The user was created during registration but has never set a password yet
    if (matchedUser.password_hash === "NO_PASSWORD_SET") {
      const newToken = crypto.randomUUID();
      const orgId = matchedUser.organization_id || "org-unknown";

      // Save/update audit token
      try {
        if (isSupabase) {
          const supabase = getSupabaseAdminClient();
          await supabase.from("audit_logs").insert({
            id: `audit-setpass-${now}`,
            organization_id: orgId,
            user_id: matchedUser.id,
            action: "SUBMITTED",
            old_status: "DISABLED",
            new_status: "DISABLED",
            metadata: JSON.stringify({
              verificationToken: newToken,
              tokenCreatedAt: now,
              isRevoked: false,
              passwordSet: false,
              companyName: matchedOrg?.name || "Votre entreprise",
              companyEmail: matchedUser.email,
              applicantName: matchedUser.name,
              reason: "forgot_password_redirect_to_activation",
            }),
            created_at: now,
          });
        }
      } catch (err) {
        console.error("Failed to store activation token:", err);
      }

      const activationLink = `${origin}/verify-company?token=${newToken}`;
      const emailSubject = `[RKonekte] Définition de votre mot de passe`;
      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
              body, table, td, p, a, h1, h2, h3, span { font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important; }
              body { background-color: #ffffff; margin: 0; padding: 20px; color: #263445; }
              .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; }
              .content { padding: 36px 32px; line-height: 1.6; background: #ffffff; }
              .badge { display: inline-block; color: #FF7900; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
              .nb-section { margin: 20px 0; background: transparent; }
              .btn { display: inline-block; background-color: #FF7900; color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 15px; padding: 14px 28px; border-radius: 10px; margin: 22px 0; text-align: center; box-shadow: 0 2px 6px rgba(255,121,0,0.25); }
              .footer { background: #ffffff; padding: 24px; text-align: center; font-size: 11px; color: #94A3B8; border-top: 1px solid #F1F5F9; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="content">
                <span class="badge">Activation de compte</span>
                <h2 style="color: #062653; margin-top: 0; font-size: 19px; font-weight: 700;">Bonjour ${matchedUser.name},</h2>
                <p style="margin: 12px 0; color: #334155; font-size: 14px;">Vous avez demandé la réinitialisation de votre mot de passe, mais votre compte n'a pas encore de mot de passe configuré.</p>
                
                <div class="nb-section">
                  <p style="margin: 0; font-size: 13px; line-height: 1.55; color: #334155;">
                    <strong style="color: #FF7900; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px;">Important (N.B.) —</strong> Veuillez définir votre mot de passe pour finaliser l'accès à votre espace entreprise sécurisé.
                  </p>
                </div>

                <p style="margin: 18px 0 10px 0; font-size: 14px; color: #334155;">Cliquez sur le bouton ci-dessous pour choisir votre mot de passe fort et finaliser l'accès à votre espace :</p>
                
                <div style="text-align: center;">
                  <a href="${activationLink}" class="btn" target="_blank">Définir mon mot de passe →</a>
                </div>

                <p style="font-size: 11px; color: #64748B; margin-top: 20px;">
                  Si le bouton ne fonctionne pas :<br/>
                  <a href="${activationLink}" style="color: #062653; word-break: break-all;">${activationLink}</a>
                </p>
              </div>
              <div class="footer">
                © 2026 RKonekte. Tous droits réservés.
              </div>
            </div>
          </body>
        </html>
      `;

      await sendEmail({
        to: matchedUser.email,
        subject: emailSubject,
        html: emailHtml,
      });

      return NextResponse.json({
        success: true,
        message:
          "Un lien pour configurer votre mot de passe a été envoyé à votre adresse e-mail.",
      });
    }

    // Case B: The user has an existing password -> Standard password reset
    const resetToken = crypto.randomUUID();
    const expiresAt = now + 60 * 60 * 1000; // 1 hour validity
    const orgId = matchedUser.organization_id || "org-unknown";

    try {
      if (isSupabase) {
        const supabase = getSupabaseAdminClient();
        await supabase.from("audit_logs").insert({
          id: `audit-reset-${now}`,
          organization_id: orgId,
          user_id: matchedUser.id,
          action: "PASSWORD_RESET_REQUESTED",
          old_status: matchedUser.status || "ACTIVE",
          new_status: matchedUser.status || "ACTIVE",
          metadata: JSON.stringify({
            resetToken,
            userId: matchedUser.id,
            email: matchedUser.email,
            userName: matchedUser.name,
            expiresAt,
            isUsed: false,
            isRevoked: false,
            createdAt: now,
          }),
          created_at: now,
        });
      }
    } catch (auditErr) {
      console.error("Failed to store reset audit log in Supabase:", auditErr);
    }

    // Mirror to local SQLite if available
    try {
      const db = getDb();
      await db.insert(auditLogs).values({
        id: `audit-reset-${now}`,
        organizationId: orgId,
        userId: matchedUser.id,
        action: "PASSWORD_RESET_REQUESTED" as any,
        oldStatus: matchedUser.status || "ACTIVE",
        newStatus: matchedUser.status || "ACTIVE",
        metadata: JSON.stringify({
          resetToken,
          userId: matchedUser.id,
          email: matchedUser.email,
          userName: matchedUser.name,
          expiresAt,
          isUsed: false,
          isRevoked: false,
          createdAt: now,
        }),
        createdAt: now,
      });
    } catch (_) {}

    const resetLink = `${origin}/reset-password?token=${resetToken}`;
    const emailSubject = `Réinitialisation de votre accès — RKonekte`;
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
            body, table, td, p, a, h1, h2, h3, span { font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important; }
            body { background-color: #ffffff; margin: 0; padding: 20px; color: #263445; }
            .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; }
            .content { padding: 36px 32px; line-height: 1.6; background: #ffffff; }
            .badge { display: inline-block; color: #FF7900; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
            .nb-section { margin: 20px 0; background: transparent; }
            .btn { display: inline-block; background-color: #FF7900; color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 15px; padding: 14px 28px; border-radius: 10px; margin: 22px 0; text-align: center; box-shadow: 0 2px 6px rgba(255,121,0,0.25); }
            .footer { background: #ffffff; padding: 24px; text-align: center; font-size: 11px; color: #94A3B8; border-top: 1px solid #F1F5F9; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">
              <span class="badge">Sécurité du Compte</span>
              <h2 style="color: #062653; margin-top: 0; font-size: 19px; font-weight: 700;">Bonjour ${matchedUser.name},</h2>
              <p style="margin: 12px 0; color: #334155; font-size: 14px;">Une demande de réinitialisation de mot de passe a été effectuée pour votre compte <strong>${matchedUser.email}</strong>.</p>
              
              <div class="nb-section">
                <p style="margin: 0; font-size: 13px; line-height: 1.55; color: #334155;">
                  <strong style="color: #FF7900; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px;">Important (N.B.) —</strong> Ce lien de réinitialisation est valable pendant <strong>1 heure</strong>. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.
                </p>
              </div>

              <p style="margin: 18px 0 10px 0; font-size: 14px; color: #334155;">Pour choisir votre nouveau mot de passe fort, cliquez sur le bouton ci-dessous :</p>
              
              <div style="text-align: center;">
                <a href="${resetLink}" class="btn" target="_blank">Réinitialiser mon mot de passe →</a>
              </div>

              <p style="font-size: 11px; color: #64748B; margin-top: 20px;">
                Si le bouton ne fonctionne pas, copiez ce lien :<br/>
                <a href="${resetLink}" style="color: #062653; word-break: break-all;">${resetLink}</a>
              </p>
            </div>
            <div class="footer">
              © 2026 RKonekte. Tous droits réservés.
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail({
      to: matchedUser.email,
      subject: emailSubject,
      html: emailHtml,
    });

    return NextResponse.json({
      success: true,
      message:
        "Si cette adresse e-mail correspond à un compte inscrit, vous recevrez un lien de réinitialisation sous peu.",
    });
  } catch (err: any) {
    console.error("Forgot password route error:", err);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la demande. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
