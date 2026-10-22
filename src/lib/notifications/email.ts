/**
 * Email notifications service supporting direct SMTP (Nodemailer) and Resend API.
 */
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";

export interface EmailAttachment {
  filename: string;
  path?: string;
  content?: Buffer | string;
  cid?: string;
  contentType?: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  smtpConfig?: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from?: string;
  };
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "$2 ($1)")
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "• $1\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function formatSender(
  fromValue?: string,
  fallbackUser = "rkonekte509@gmail.com"
): { name: string; address: string } {
  const defaultName = "RKonekte";
  const defaultAddress = fallbackUser || "rkonekte509@gmail.com";

  if (!fromValue || !fromValue.trim()) {
    return { name: defaultName, address: defaultAddress };
  }

  const clean = fromValue
    .trim()
    .replace(/^["'\\]+|["'\\]+$/g, "")
    .replace(/\\"/g, '"');

  // Format 1: "Name" <email@domain.com> or Name <email@domain.com>
  const angleMatch = clean.match(/^(?:["']?([^"']+)["']?\s*)?<([^>]+)>$/);
  if (angleMatch) {
    let name = (angleMatch[1] || "").replace(/["'\\]/g, "").trim() || defaultName;
    if (name.toLowerCase() === "rkonekte") name = "RKonekte";
    return {
      name,
      address: angleMatch[2]?.trim() || defaultAddress,
    };
  }

  // Format 2: email address only (e.g. sales@technozi-ht.com)
  if (clean.includes("@")) {
    const orgName = clean.includes("technozi")
      ? "Technozi"
      : clean.includes("welj")
      ? "WELJ Express"
      : defaultName;
    return { name: orgName, address: clean };
  }

  // Format 3: name only (e.g. "Rkonekte" or "RKonekte")
  let name = clean || defaultName;
  if (name.toLowerCase() === "rkonekte") name = "RKonekte";
  return { name, address: defaultAddress };
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  attachments,
  smtpConfig,
}: SendEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  // 1. Check if specific SMTP credentials are provided or deduce from recipient
  const cleanPass = (p?: string) => (p ? p.replace(/^["']|["']$/g, "").trim() : "");

  let host = smtpConfig?.host || process.env.SMTP_HOST || "smtp.gmail.com";
  let port = smtpConfig?.port || parseInt(process.env.SMTP_PORT || "465", 10);
  let user = smtpConfig?.user || process.env.SMTP_USER || "rkonekte509@gmail.com";
  let pass = cleanPass(smtpConfig?.pass || process.env.SMTP_PASS || "ggkh mkbl dxei hhms");
  let fromRaw = smtpConfig?.from || process.env.EMAIL_FROM;

  // Organization-specific routing if explicitly configured or recipient is on internal company domain:
  if (
    (smtpConfig?.user?.includes("technozi") || to.endsWith("@technozi-ht.com") || to === process.env.TECHNOZI_EMAIL_TO) &&
    process.env.TECHNOZI_SMTP_USER &&
    process.env.TECHNOZI_SMTP_PASS
  ) {
    host = process.env.TECHNOZI_SMTP_HOST || "mail.technozi-ht.com";
    port = parseInt(process.env.TECHNOZI_SMTP_PORT || "465", 10);
    user = process.env.TECHNOZI_SMTP_USER;
    pass = cleanPass(process.env.TECHNOZI_SMTP_PASS);
    fromRaw = process.env.TECHNOZI_EMAIL_FROM || user;
  } else if (
    (smtpConfig?.user?.includes("welj") || to.endsWith("@welj-ht.com") || to === process.env.WELJ_EMAIL_TO) &&
    process.env.WELJ_SMTP_USER &&
    process.env.WELJ_SMTP_PASS
  ) {
    host = process.env.WELJ_SMTP_HOST || "smtp.gmail.com";
    port = parseInt(process.env.WELJ_SMTP_PORT || "465", 10);
    user = process.env.WELJ_SMTP_USER;
    pass = cleanPass(process.env.WELJ_SMTP_PASS);
    fromRaw = process.env.WELJ_EMAIL_FROM || user;
  }

  const sender = formatSender(fromRaw, user);

  // In automated test suites, avoid hammering Gmail SMTP with dummy @example.com addresses
  if ((process.env.NODE_ENV === "test" || process.env.VITEST) && (to.includes("@example.com") || to.includes("@test.com"))) {
    return { success: true, id: `test-mock-${Date.now()}` };
  }

  // Prepare attachments (including auto-attaching rkonekte-logo if referenced via cid:rkonekte-logo)
  const emailAttachments = [...(attachments || [])];
  if (html.includes("cid:rkonekte-logo") && !emailAttachments.some((a) => a.cid === "rkonekte-logo")) {
    const logoPath = path.join(process.cwd(), "public", "logo-rkonekte.png");
    if (fs.existsSync(logoPath)) {
      emailAttachments.push({
        filename: "logo-rkonekte.png",
        path: logoPath,
        cid: "rkonekte-logo",
        contentType: "image/png",
      });
    }
  }

  // 1. Send via direct SMTP if credentials exist
  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // SSL on 465
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      const plainText = text || htmlToPlainText(html);
      const info = await transporter.sendMail({
        from: sender,
        to,
        replyTo: user,
        subject,
        text: plainText,
        html,
        attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
      });

      console.log(`[SMTP EMAIL SENT] From: "${sender.name}" <${sender.address}> -> To: ${to} | ID: ${info.messageId}`);
      return { success: true, id: info.messageId };
    } catch (smtpErr: any) {
      console.error("[SMTP ERROR]", smtpErr);

      // Automatic fallback to official RKonekte Gmail SMTP if not already using it
      const fallbackUser = process.env.SMTP_USER || "rkonekte509@gmail.com";
      const fallbackPass = cleanPass(process.env.SMTP_PASS || "ggkh mkbl dxei hhms");
      if (user !== fallbackUser && fallbackUser && fallbackPass) {
        try {
          console.log("[SMTP FALLBACK] Retrying with official RKonekte Gmail SMTP...");
          const fbTransporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: parseInt(process.env.SMTP_PORT || "465", 10),
            secure: true,
            auth: { user: fallbackUser, pass: fallbackPass },
            tls: { rejectUnauthorized: false },
          });
          const fbSender = formatSender(process.env.EMAIL_FROM, fallbackUser);
          const plainText = text || htmlToPlainText(html);
          const fbInfo = await fbTransporter.sendMail({
            from: fbSender,
            to,
            replyTo: fallbackUser,
            subject,
            text: plainText,
            html,
            attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
          });
          console.log(`[SMTP FALLBACK SUCCESS] From: "${fbSender.name}" <${fbSender.address}> -> To: ${to} | ID: ${fbInfo.messageId}`);
          return { success: true, id: fbInfo.messageId };
        } catch (fbErr: any) {
          console.error("[SMTP FALLBACK ERROR]", fbErr);
        }
      }

      return { success: false, error: smtpErr?.message || "Erreur d'envoi SMTP" };
    }
  }

  // 2. Fallback to Resend API if API Key is configured
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey && apiKey !== "dummy-resend-key-for-dev") {
    try {
      const plainText = text || htmlToPlainText(html);
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `"${sender.name}" <${sender.address}>`,
          to: [to],
          subject,
          html,
          text: plainText,
        }),
      });

      const data = (await res.json()) as any;
      if (!res.ok) {
        return { success: false, error: data?.message || "Erreur d'envoi Resend" };
      }

      return { success: true, id: data.id };
    } catch (err: any) {
      return { success: false, error: err?.message || "Erreur réseau Resend" };
    }
  }

  // 3. Fallback: Simulation mode for local dev without credentials
  console.log(`[EMAIL SIMULATION] To: ${to} | Subject: "${subject}"`);
  return { success: true, id: `mock-email-${Date.now()}` };
}

export function generateNewRequestSecretaryEmail(params: {
  requestNumber: string;
  employeeName: string;
  department: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  requestedDays: number;
  submittedAt: string;
  reviewUrl: string;
}): { subject: string; html: string } {
  const subject = `[Nouvelle Demande] ${params.requestNumber} — ${params.employeeName} (${params.requestedDays} j)`;
  
  // Format leave type to French readable string
  let leaveTypeFr = params.leaveType;
  if (params.leaveType === "ANNUAL") leaveTypeFr = "Congé Annuel";
  else if (params.leaveType === "SICK") leaveTypeFr = "Congé Maladie";
  else if (params.leaveType === "UNPAID") leaveTypeFr = "Congé Sans Solde";
  else if (params.leaveType === "MATERNITY_PATERNITY") leaveTypeFr = "Maternité / Paternité";

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 30px 10px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
        
        <!-- HEADER -->
        <tr>
          <td style="background-color: #0d9488; padding: 24px 32px; text-align: left;">
            <table width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.2px;">Nouvelle demande de congé</h1>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- BODY CONTENT -->
        <tr>
          <td style="padding: 32px;">
            <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
              Une nouvelle demande de congé vient d'être enregistrée. Vous pouvez consulter les détails ci-dessous et statuer directement sur la demande.
            </p>

            <!-- REQUEST SUMMARY CARD -->
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
              <tr>
                <td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                  <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; display: block; margin-bottom: 2px;">Numéro de dossier</span>
                  <span style="font-size: 18px; font-weight: 800; color: #047857; font-family: monospace;">${params.requestNumber}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 16px 20px;">
                  <table width="100%" border="0" cellpadding="6" cellspacing="0" style="font-size: 13px;">
                    <tr>
                      <td style="color: #64748b; width: 38%; padding: 6px 0;">Employé :</td>
                      <td style="font-weight: 700; color: #0f172a; padding: 6px 0;">${params.employeeName}</td>
                    </tr>
                    <tr>
                      <td style="color: #64748b; padding: 6px 0;">Département :</td>
                      <td style="color: #334155; font-weight: 600; padding: 6px 0;">${params.department}</td>
                    </tr>
                    <tr>
                      <td style="color: #64748b; padding: 6px 0;">Type de congé :</td>
                      <td style="color: #0f172a; font-weight: 700; padding: 6px 0;">
                        ${leaveTypeFr}
                      </td>
                    </tr>
                    <tr>
                      <td style="color: #64748b; padding: 6px 0;">Période :</td>
                      <td style="color: #0f172a; font-weight: 700; padding: 6px 0;">
                        Du ${params.startDate} au ${params.endDate}
                      </td>
                    </tr>
                    <tr>
                      <td style="color: #64748b; padding: 6px 0;">Durée calculée :</td>
                      <td style="color: #047857; font-weight: 800; font-size: 14px; padding: 6px 0;">
                        ${params.requestedDays} jour(s)
                      </td>
                    </tr>
                    <tr>
                      <td style="color: #64748b; padding: 6px 0;">Date de soumission :</td>
                      <td style="color: #475569; padding: 6px 0;">${params.submittedAt}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- ACTION BUTTON -->
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0 12px 0;">
              <tr>
                <td align="center">
                  <a href="${params.reviewUrl}" target="_blank" style="background-color: #059669; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.2);">
                    Consulter et Traiter la Demande →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin: 20px 0 0 0; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.5;">
              La validation ou le refus s'effectue en un clic de manière sécurisée via votre espace d'administration.
            </p>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background-color: #f8fafc; padding: 18px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="margin: 0; font-size: 11px; color: #94a3b8;">
              Système Automatisé de Gestion des Congés • Notification confidentielle
            </p>
          </td>
        </tr>

      </table>
    </body>
    </html>
  `;
  return { subject, html };
}

export function generateDecisionEmployeeEmail(params: {
  requestNumber: string;
  employeeName: string;
  status: "APPROVED" | "REJECTED";
  startDate: string;
  endDate: string;
  rejectionReason?: string;
  viewUrl: string;
}): { subject: string; html: string } {
  const isApproved = params.status === "APPROVED";
  const subject = `[${isApproved ? "VALIDÉE" : "REFUSÉE"}] Demande de congé ${params.requestNumber}`;
  
  const headerBg = isApproved ? "#0d9488" : "#991b1b";
  const statusColor = isApproved ? "#0d9488" : "#dc2626";
  const statusTitle = isApproved ? "Demande Approuvée" : "Demande Refusée";

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 30px 10px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
        
        <!-- HEADER -->
        <tr>
          <td style="background-color: ${headerBg}; padding: 24px 32px; text-align: left;">
            <table width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.2px;">${statusTitle}</h1>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- BODY CONTENT -->
        <tr>
          <td style="padding: 32px;">
            <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #334155;">
              Bonjour <strong>${params.employeeName}</strong>,
            </p>
            <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
              Votre demande de congé <strong>${params.requestNumber}</strong> a été officiellement traitée par la direction.
            </p>

            <!-- SUMMARY CARD -->
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
              <tr>
                <td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                  <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; display: block; margin-bottom: 2px;">Statut officiel</span>
                  <span style="font-size: 16px; font-weight: 800; color: ${statusColor};">${isApproved ? "Accordée" : "Refusée"}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 16px 20px;">
                  <table width="100%" border="0" cellpadding="6" cellspacing="0" style="font-size: 13px;">
                    <tr>
                      <td style="color: #64748b; width: 38%; padding: 6px 0;">Période :</td>
                      <td style="color: #0f172a; font-weight: 700; padding: 6px 0;">Du ${params.startDate} au ${params.endDate}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            ${!isApproved && params.rejectionReason ? `
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <strong style="color: #9f1239; font-size: 13px; display: block; margin-bottom: 4px;">Motif de refus :</strong>
                    <p style="margin: 0; font-size: 13px; color: #881337; line-height: 1.5;">${params.rejectionReason}</p>
                  </td>
                </tr>
              </table>
            ` : ""}

            <!-- ACTION BUTTON -->
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0 12px 0;">
              <tr>
                <td align="center">
                  <a href="${params.viewUrl}" target="_blank" style="background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block;">
                    Consulter votre dossier sécurisé →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background-color: #f8fafc; padding: 18px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="margin: 0; font-size: 11px; color: #94a3b8;">
              Système Automatisé de Gestion des Congés • Notification confidentielle
            </p>
          </td>
        </tr>

      </table>
    </body>
    </html>
  `;
  return { subject, html };
}
