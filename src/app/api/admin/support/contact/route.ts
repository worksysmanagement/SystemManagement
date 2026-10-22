import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth/guard";
import { sendEmail } from "@/lib/notifications/email";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { category, moduleName, subject, message } = body;

    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "Veuillez renseigner le sujet et le message de votre demande." },
        { status: 400 }
      );
    }

    const orgName = session.organizationName || "Entreprise sans nom";
    const senderName = session.name || "Utilisateur";
    const senderEmail = session.email || "Non renseigné";
    const userRole = session.role || "Utilisateur";
    const targetEmail = "rkonekte509@gmail.com";

    const cleanCategory = category?.trim() || "Assistance Générale";
    const cleanModule = moduleName?.trim() || "Général";
    const nowStr = new Date().toLocaleString("fr-FR", {
      dateStyle: "full",
      timeStyle: "medium",
    });

    const emailSubject = `[Support RKonekte] ${subject.trim()} — ${orgName}`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F4F6F9; margin: 0; padding: 24px; color: #1E293B; }
          .container { max-width: 620px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: #031B3A; color: #FFFFFF; padding: 24px 32px; border-bottom: 3px solid #FF7900; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
          .header p { margin: 4px 0 0; font-size: 13px; color: #94A3B8; }
          .content { padding: 32px; }
          .meta-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 18px; margin-bottom: 24px; }
          .meta-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
          .meta-label { font-weight: 600; color: #64748B; }
          .meta-val { font-weight: 700; color: #0F172A; }
          .badge { display: inline-block; background: #FFF4EB; color: #FF7900; border: 1px solid rgba(255,121,0,0.25); font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; }
          .message-title { font-size: 14px; font-weight: 700; color: #031B3A; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.5px; }
          .message-box { background: #FFFFFF; border: 1px solid #CBD5E1; border-left: 4px solid #031B3A; border-radius: 8px; padding: 16px; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap; }
          .footer { background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 18px 32px; font-size: 12px; color: #64748B; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nouvelle Demande de Support Client</h1>
            <p>Plateforme RKonekte • Système de gestion d'entreprise</p>
          </div>
          <div class="content">
            <div class="meta-box">
              <div class="meta-row">
                <span class="meta-label">Entreprise :</span>
                <span class="meta-val">${orgName}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Expéditeur :</span>
                <span class="meta-val">${senderName} (${senderEmail})</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Rôle de l'utilisateur :</span>
                <span class="meta-val">${userRole}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Catégorie :</span>
                <span class="meta-val"><span class="badge">${cleanCategory}</span></span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Onglet concerné :</span>
                <span class="meta-val">${cleanModule}</span>
              </div>
              <div class="meta-row" style="margin-bottom: 0;">
                <span class="meta-label">Date et heure :</span>
                <span class="meta-val">${nowStr}</span>
              </div>
            </div>

            <div class="message-title">Objet : ${subject.trim()}</div>
            <div class="message-box">${message.trim()}</div>
          </div>
          <div class="footer">
            Cet e-mail a été généré automatiquement depuis le Centre de Support RKonekte par un utilisateur authentifié.<br />
            Pour répondre, écrivez directement à <strong>${senderEmail}</strong>.
          </div>
        </div>
      </body>
    </html>
    `;

    // Send the email to rkonekte509@gmail.com
    const result = await sendEmail({
      to: targetEmail,
      subject: emailSubject,
      html: htmlContent,
      text: `Nouvelle demande de support\n\nEntreprise : ${orgName}\nExpéditeur : ${senderName} (${senderEmail})\nRôle : ${userRole}\nCatégorie : ${cleanCategory}\nModule : ${cleanModule}\n\nObjet : ${subject.trim()}\n\nMessage :\n${message.trim()}`,
    });

    if (!result.success) {
      console.error("[SUPPORT CONTACT ERROR]", result.error);
      return NextResponse.json(
        {
          error:
            "Une erreur est survenue lors de l'envoi de votre message. Veuillez réessayer ou contacter directement rkonekte509@gmail.com.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Votre message a été transmis avec succès à l'équipe support RKonekte (rkonekte509@gmail.com).",
    });
  } catch (err) {
    return handleApiError(err);
  }
}
