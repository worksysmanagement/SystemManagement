import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin, handleApiError } from "@/lib/auth/guard";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/notifications/email";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id: orgId } = await context.params;

    const supabase = getSupabaseAdminClient();

    // 1. Fetch organization
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", orgId)
      .maybeSingle();

    if (orgErr || !org) {
      return NextResponse.json(
        { error: "Organisation introuvable." },
        { status: 404 }
      );
    }

    // 2. Fetch admin user
    const { data: user, error: userErr } = await supabase
      .from("users")
      .select("*")
      .eq("organization_id", orgId)
      .eq("role", "ORGANIZATION_ADMIN")
      .maybeSingle();

    if (userErr || !user) {
      return NextResponse.json(
        { error: "Administrateur introuvable pour cette entreprise." },
        { status: 404 }
      );
    }

    // If already active with a real password, no need to resend initial activation
    if (org.status === "ACTIVE" && user.password_hash !== "NO_PASSWORD_SET") {
      return NextResponse.json(
        { error: "Cette entreprise est déjà active avec un mot de passe configuré." },
        { status: 400 }
      );
    }

    // 3. Find and revoke previous submission audit logs
    const { data: auditLogs } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    let latestMeta: any = {};
    let targetLogId: string | null = null;

    for (const log of (auditLogs || [])) {
      if (log.metadata) {
        try {
          const meta = typeof log.metadata === "string" ? JSON.parse(log.metadata) : log.metadata;
          if (meta.verificationToken) {
            targetLogId = log.id;
            latestMeta = meta;
            break;
          }
        } catch (_) {}
      }
    }

    const now = Date.now();
    const newToken = crypto.randomUUID();

    // Invalidate old token and set new token in metadata
    const updatedMeta = {
      ...latestMeta,
      previousTokensRevokedAt: now,
      oldTokenRevoked: latestMeta.verificationToken || null,
      verificationToken: newToken,
      tokenCreatedAt: now,
      isRevoked: false,
      passwordSet: false,
    };

    if (targetLogId) {
      await supabase
        .from("audit_logs")
        .update({
          metadata: JSON.stringify(updatedMeta),
        })
        .eq("id", targetLogId);
    }

    // Insert an audit log record for the resend action
    await supabase.from("audit_logs").insert({
      id: `audit-resend-${now}`,
      organization_id: orgId,
      user_id: null,
      action: "RESEND_ACTIVATION_EMAIL",
      old_status: org.status,
      new_status: org.status,
      metadata: JSON.stringify({
        revokedOldToken: true,
        sentAt: now,
      }),
      created_at: now,
    });

    // 4. Send official email from rkonekte509@gmail.com
    const rawAppUrl = process.env.APP_URL;
    const origin = (rawAppUrl && !rawAppUrl.includes("localhost"))
      ? rawAppUrl.replace(/\/+$/, "")
      : `${req.headers.get("host")?.includes("localhost") ? "http" : "https"}://${req.headers.get("host") || "localhost:3000"}`;
    const verificationLink = `${origin}/verify-company?token=${newToken}`;

    const emailSubject = `Lien d'accès à votre espace RKonekte — ${org.name}`;
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
              <span class="badge">Nouveau Lien d'Activation</span>
              <h2 style="color: #062653; margin-top: 0; font-size: 19px; font-weight: 700;">Bonjour ${user.name},</h2>
              <p style="margin: 12px 0; color: #334155; font-size: 14px;">Un nouveau lien d'activation a été généré pour votre entreprise <strong>${org.name}</strong> par l'administrateur de la plateforme RKonekte.</p>
              
              <div class="nb-section">
                <p style="margin: 0; font-size: 13px; line-height: 1.55; color: #334155;">
                  <strong style="color: #FF7900; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px;">Important (N.B.) —</strong> Tout lien envoyé précédemment a été immédiatement révoqué et désactivé pour des raisons de sécurité. Veuillez utiliser uniquement le bouton ci-dessous pour finaliser votre accès.
                </p>
              </div>

              <p style="margin: 18px 0 10px 0; font-size: 14px; color: #334155;">Cliquez sur le bouton ci-dessous pour choisir votre mot de passe fort et activer définitivement votre espace de gestion :</p>
              
              <div style="text-align: center;">
                <a href="${verificationLink}" class="btn" target="_blank">Définir mon mot de passe et activer mon compte →</a>
              </div>

              <p style="font-size: 11px; color: #64748B; margin-top: 20px;">
                Si le bouton ne fonctionne pas, copiez-collez ce lien :<br/>
                <a href="${verificationLink}" style="color: #062653; word-break: break-all;">${verificationLink}</a>
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
      to: user.email,
      subject: emailSubject,
      html: emailHtml,
    });

    return NextResponse.json({
      success: true,
      message: `Un nouveau lien a été envoyé à ${user.email}. L'ancien lien a été révoqué.`,
      companyName: org.name,
      email: user.email,
    });
  } catch (err: any) {
    return handleApiError(err);
  }
}
