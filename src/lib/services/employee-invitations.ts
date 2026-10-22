import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/notifications/email";
import { hashToken } from "@/lib/security/tokens";

export interface SendEmployeeInvitationParams {
  organizationId: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    branchId?: string | null;
    branch?: string;
    department?: string | null;
    position?: string | null;
    phone: string;
    email: string;
  };
  role?: string;
  origin?: string;
}

export async function sendEmployeeInvitation({
  organizationId,
  employee,
  role,
  origin,
}: SendEmployeeInvitationParams): Promise<{
  success: boolean;
  inviteLink: string;
  token: string;
  emailSent: boolean;
  error?: string;
}> {
  const supabase = getSupabaseAdminClient();
  const now = Date.now();
  const token = crypto.randomUUID();

  const baseUrl =
    origin ||
    process.env.APP_URL?.replace(/\/+$/, "") ||
    "http://localhost:3000";
  const inviteLink = `${baseUrl}/reset-password?token=${token}`;

  try {
    // 1. Fetch organization details
    const { data: org } = await supabase
      .from("organizations")
      .select("name, slug")
      .eq("id", organizationId)
      .maybeSingle();

    const companyName = org?.name || "Votre entreprise";

    // 2. Fetch branch name if branchId is present
    let branchName = employee.branch || "Siège";
    if (employee.branchId) {
      const { data: br } = await supabase
        .from("branches")
        .select("name")
        .eq("id", employee.branchId)
        .maybeSingle();
      if (br?.name) {
        branchName = br.name;
      }
    }

    const normalizedEmail = employee.email.toLowerCase().trim();

    // 3. Ensure user account exists in `users`
    let userId: string;
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, password_hash")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    const userRole = role || "EMPLOYEE";

    if (existingUser) {
      userId = existingUser.id;
      // If user had no organization or no branch, link them
      const updateData: Record<string, any> = {
        organization_id: organizationId,
        branch_id: employee.branchId || null,
        name: `${employee.firstName} ${employee.lastName}`.trim(),
        updated_at: now,
      };
      if (role) {
        updateData.role = role;
      }
      await supabase
        .from("users")
        .update(updateData)
        .eq("id", userId);
    } else {
      userId = `usr-${crypto.randomUUID()}`;
      await supabase.from("users").insert({
        id: userId,
        organization_id: organizationId,
        branch_id: employee.branchId || null,
        name: `${employee.firstName} ${employee.lastName}`.trim(),
        email: normalizedEmail,
        password_hash: "NO_PASSWORD_SET",
        role: userRole,
        status: "ACTIVE",
        created_at: now,
        updated_at: now,
      });
    }

    // 4. Revoke previous active invitation tokens for this email to prevent reuse
    try {
      const { data: oldLogs } = await supabase
        .from("audit_logs")
        .select("id, metadata")
        .eq("organization_id", organizationId)
        .eq("action", "PASSWORD_RESET_REQUESTED");

      for (const log of oldLogs || []) {
        if (log.metadata) {
          try {
            const meta = typeof log.metadata === "string" ? JSON.parse(log.metadata) : log.metadata;
            if (meta.email?.toLowerCase() === normalizedEmail && !meta.isUsed) {
              meta.isRevoked = true;
              await supabase
                .from("audit_logs")
                .update({ metadata: JSON.stringify(meta) })
                .eq("id", log.id);
            }
          } catch (_) {}
        }
      }
    } catch (e) {
      console.warn("Could not revoke old tokens:", e);
    }

    // 5. Store new invitation token hash in audit_logs with 7 days expiration (Never plain text!)
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days secure expiration
    const tokenHash = await hashToken(token);
    await supabase.from("audit_logs").insert({
      id: `audit-invite-${now}-${crypto.randomUUID().slice(0, 8)}`,
      organization_id: organizationId,
      user_id: userId,
      action: "PASSWORD_RESET_REQUESTED",
      old_status: "INVITED",
      new_status: "PENDING_ACTIVATION",
      metadata: JSON.stringify({
        resetTokenHash: tokenHash,
        userId: userId,
        email: normalizedEmail,
        userName: `${employee.firstName} ${employee.lastName}`.trim(),
        employeeId: employee.id,
        employeeNumber: employee.employeeNumber,
        companyName,
        isUsed: false,
        isRevoked: false,
        tokenCreatedAt: now,
        expiresAt,
        type: "EMPLOYEE_INVITATION",
      }),
      created_at: now,
    });

    // 6. Build the official RKonekte invitation email
    const emailSubject = `Invitation RKonekte - ${companyName} (${employee.firstName} ${employee.lastName})`;
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${emailSubject}</title>
          <style>
            body, table, td, p, a, h1, h2, h3, span { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important; }
            body { background-color: #F8FAFC; margin: 0; padding: 24px 12px; color: #1E293B; }
            .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #E2E8F0; overflow: hidden; }
            .content { padding: 32px 28px; }
            .badge { display: inline-block; background: #FFF4E5; color: #EA580C; font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
            .btn { display: inline-block; background-color: #FF7900; color: #ffffff !important; padding: 13px 32px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 10px; margin: 20px 0; text-align: center; }
            .footer { background: #F8FAFC; padding: 18px 24px; text-align: center; font-size: 11px; color: #94A3B8; border-top: 1px solid #E2E8F0; }
          </style>
        </head>
        <body style="background-color: #F8FAFC; margin: 0; padding: 24px 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <div class="container" style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #E2E8F0; overflow: hidden;">
            <div class="content" style="padding: 32px 28px;">
              <span class="badge" style="display: inline-block; background: #FFF4E5; color: #EA580C; font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px;">
                RKonekte • Espace Collaborateur (${companyName})
              </span>

              <h2 style="color: #0F172A; margin: 0 0 14px 0; font-size: 19px; font-weight: 700; line-height: 1.3;">
                Bonjour ${employee.firstName} ${employee.lastName},
              </h2>

              <p style="margin: 0 0 14px 0; color: #334155; font-size: 14px; line-height: 1.6;">
                La plateforme de gestion <strong>RKonekte</strong> vous transmet votre invitation officielle suite à la création de votre profil collaborateur au sein de votre entreprise <strong>${companyName}</strong>.
              </p>

              <p style="margin: 0 0 20px 0; color: #334155; font-size: 14px; line-height: 1.6;">
                Matricule officiel : <strong style="color: #FF7900; font-family: monospace; font-size: 15px;">${employee.employeeNumber}</strong>
              </p>

              <p style="margin: 20px 0 14px 0; font-size: 14px; color: #334155; line-height: 1.5;">
                Pour initialiser votre accès sécurisé et choisir votre mot de passe, cliquez sur le bouton ci-dessous :
              </p>

              <div style="text-align: center; margin: 26px 0;">
                <a href="${inviteLink}" class="btn" target="_blank" style="display: inline-block; background-color: #FF7900; color: #ffffff !important; padding: 13px 32px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 10px;">
                  Définir mon mot de passe →
                </a>
              </div>

              <p style="font-size: 12px; color: #64748B; margin-top: 24px; line-height: 1.5;">
                Si le bouton ne s'affiche pas correctement, vous pouvez copier ce lien dans votre navigateur :<br/>
                <a href="${inviteLink}" style="color: #062653; word-break: break-all; text-decoration: underline;">${inviteLink}</a>
              </p>
            </div>
            <div class="footer" style="background: #F8FAFC; padding: 18px 24px; text-align: center; font-size: 11px; color: #94A3B8; border-top: 1px solid #E2E8F0;">
              Message officiel transmis par RKonekte à ${normalizedEmail} pour l'organisation ${companyName}.<br/>
              © 2026 RKonekte. Tous droits réservés.
            </div>
          </div>
        </body>
      </html>
    `;

    const emailPlainText = `Bonjour ${employee.firstName} ${employee.lastName},

La plateforme de gestion RKonekte vous transmet votre invitation officielle suite à la création de votre profil collaborateur au sein de votre entreprise ${companyName}.

Matricule officiel : ${employee.employeeNumber}

Pour initialiser votre accès sécurisé et choisir votre mot de passe, veuillez ouvrir le lien suivant :
${inviteLink}

---
RKonekte - Service Officiel de Gestion d'Entreprise
Message transmis à ${normalizedEmail} pour ${companyName}
© 2026 RKonekte. Tous droits réservés.
`;

    // 7. Dispatch email via official RKonekte SMTP
    const emailResult = await sendEmail({
      to: normalizedEmail,
      subject: emailSubject,
      html: emailHtml,
      text: emailPlainText,
      smtpConfig: {
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "465", 10),
        user: process.env.SMTP_USER || "rkonekte509@gmail.com",
        pass: (process.env.SMTP_PASS || "ggkh mkbl dxei hhms").replace(/^["']|["']$/g, "").trim(),
        from: '"RKonekte" <rkonekte509@gmail.com>',
      },
    });

    return {
      success: true,
      inviteLink,
      token,
      emailSent: emailResult.success,
    };
  } catch (err: any) {
    console.error("sendEmployeeInvitation error:", err);
    return {
      success: false,
      inviteLink,
      token,
      emailSent: false,
      error: err?.message || "Erreur lors de la génération de l'invitation.",
    };
  }
}
