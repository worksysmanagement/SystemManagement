import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { organizations, users, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth/password";
import { sendEmail } from "@/lib/notifications/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      companyName,
      companyEmail,
      phone,
      address,
      employeeRange,
      applicantName,
      applicantRole,
      // Anti-robot / Anti-hacking Honeypot Fields
      hp_website,
      hp_phone_trap,
      formLoadTime,
    } = body;

    // 1. Anti-Bot / Anti-Hacking Check
    if (hp_website || hp_phone_trap) {
      console.warn("[ANTI-BOT TRIGGERED] Honeypot field filled by bot.");
      return NextResponse.json(
        { error: "Requête refusée par la protection anti-robot." },
        { status: 400 }
      );
    }

    if (formLoadTime && typeof formLoadTime === "number") {
      const elapsedMs = Date.now() - formLoadTime;
      if (elapsedMs < 1200) {
        console.warn(`[ANTI-BOT TRIGGERED] Submission too fast (${elapsedMs}ms). Automated bot detected.`);
        return NextResponse.json(
          { error: "Soumission automatique suspecte détectée." },
          { status: 400 }
        );
      }
    }

    // 2. Validate Required Fields
    if (
      !companyName?.trim() ||
      !companyEmail?.trim() ||
      !phone?.trim() ||
      !address?.trim() ||
      !employeeRange?.trim() ||
      !applicantName?.trim() ||
      !applicantRole?.trim()
    ) {
      return NextResponse.json(
        { error: "Veuillez renseigner tous les champs obligatoires du formulaire." },
        { status: 400 }
      );
    }

    // Generate clean slug from company name
    const generatedSlug = companyName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const normalizedSlug = generatedSlug || `org-${Date.now().toString().slice(-6)}`;
    const normalizedCompanyEmail = companyEmail.toLowerCase().trim();

    const supabase = (await import("@/lib/supabase/server")).getSupabaseAdminClient();

    // Check if organization slug or email already registered
    const { data: existingOrg } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", normalizedSlug)
      .maybeSingle();

    if (existingOrg) {
      return NextResponse.json(
        { error: "Une entreprise avec ce nom ou identifiant est déjà enregistrée." },
        { status: 409 }
      );
    }

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedCompanyEmail)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: "Cette adresse email d'entreprise est déjà enregistrée sur la plateforme." },
        { status: 409 }
      );
    }

    const now = Date.now();
    const orgId = `org-${normalizedSlug}-${now.toString().slice(-4)}`;

    // Secure email verification token
    const verificationToken = crypto.randomUUID();

    // Insert Organization in Supabase (Status DISABLED until verified and activated)
    await supabase.from("organizations").insert({
      id: orgId,
      name: companyName.trim(),
      slug: normalizedSlug,
      email: normalizedCompanyEmail,
      phone: phone.trim(),
      address: address.trim(),
      status: "DISABLED",
      created_at: now,
      updated_at: now,
    });

    // Create Initial Admin User in Supabase (Status DISABLED, no password set yet)
    const userId = `usr-${now.toString().slice(-6)}`;
    await supabase.from("users").insert({
      id: userId,
      organization_id: orgId,
      name: applicantName.trim(),
      email: normalizedCompanyEmail,
      password_hash: "NO_PASSWORD_SET",
      role: "ORGANIZATION_ADMIN",
      status: "DISABLED",
      created_at: now,
      updated_at: now,
    });

    // Store Submission Audit Log in Supabase with Complete Metadata & Token tracking
    const auditMeta = {
      companyName: companyName.trim(),
      companyEmail: normalizedCompanyEmail,
      phone: phone.trim(),
      address: address.trim(),
      employeeRange: employeeRange.trim(),
      applicantName: applicantName.trim(),
      applicantRole: applicantRole.trim(),
      verificationToken,
      tokenCreatedAt: now,
      isRevoked: false,
      emailVerified: false,
      passwordSet: false,
      submittedAt: now,
    };

    await supabase.from("audit_logs").insert({
      id: `audit-${now}`,
      organization_id: orgId,
      user_id: null,
      action: "SUBMITTED",
      old_status: null,
      new_status: "PENDING_VERIFICATION",
      metadata: JSON.stringify(auditMeta),
      created_at: now,
    });

    // Also mirror to local db if available (non-blocking)
    try {
      const db = getDb();
      await db.insert(organizations).values({
        id: orgId,
        name: companyName.trim(),
        slug: normalizedSlug,
        email: normalizedCompanyEmail,
        phone: phone.trim(),
        address: address.trim(),
        status: "DISABLED",
        createdAt: now,
        updatedAt: now,
      });
      await db.insert(users).values({
        id: userId,
        organizationId: orgId,
        name: applicantName.trim(),
        email: normalizedCompanyEmail,
        passwordHash: "NO_PASSWORD_SET",
        role: "ORGANIZATION_ADMIN",
        status: "DISABLED",
        createdAt: now,
        updatedAt: now,
      });
      await db.insert(auditLogs).values({
        id: `audit-${now}`,
        organizationId: orgId,
        userId: null,
        action: "SUBMITTED",
        oldStatus: null,
        newStatus: "PENDING_VERIFICATION",
        metadata: JSON.stringify(auditMeta),
        createdAt: now,
      });
    } catch (_) {}

    // Deduce Origin for Email Validation Link
    const rawAppUrl = process.env.APP_URL;
    const origin = (rawAppUrl && !rawAppUrl.includes("localhost"))
      ? rawAppUrl.replace(/\/+$/, "")
      : `${req.headers.get("host")?.includes("localhost") ? "http" : "https"}://${req.headers.get("host") || "localhost:3000"}`;
    const verificationLink = `${origin}/verify-company?token=${verificationToken}`;

    // Send Activation Email Directly to the Company Email
    const emailSubject = `Bienvenue sur RKonekte — Finalisation de l'accès pour ${companyName}`;
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
              <span class="badge">Activation de votre compte</span>
              <h2 style="color: #062653; margin-top: 0; font-size: 19px; font-weight: 700;">Bonjour ${applicantName},</h2>
              <p style="margin: 12px 0; color: #334155; font-size: 14px;">Votre entreprise <strong>${companyName}</strong> a été enregistrée avec succès sur la plateforme <strong>RKonekte</strong>.</p>
              
              <div class="nb-section">
                <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #062653;">
                  <span style="color: #FF7900; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Important (N.B.) —</span> Compte Administrateur Officiel
                </p>
                <p style="margin: 0 0 6px 0; color: #334155; font-size: 13px;">
                  Identifiant (Email) : <strong>${normalizedCompanyEmail}</strong>
                </p>
                <p style="margin: 0; color: #64748B; font-size: 12px; line-height: 1.55;">
                  <strong>N.B. :</strong> Ce compte disposera de <strong>tous les accès et privilèges d'administration</strong> pour votre entreprise (gestion des collaborateurs, approbation des demandes, gestion des accès et paramètres).
                </p>
              </div>

              <p style="margin: 18px 0 10px 0; font-size: 14px; color: #334155;">Pour activer définitivement votre espace et choisir votre mot de passe, cliquez sur le bouton ci-dessous :</p>
              
              <div style="text-align: center;">
                <a href="${verificationLink}" class="btn" target="_blank">Définir mon mot de passe et activer mon compte →</a>
              </div>

              <p style="font-size: 11px; color: #64748B; margin-top: 20px;">
                Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br/>
                <a href="${verificationLink}" style="color: #062653; word-break: break-all;">${verificationLink}</a>
              </p>
            </div>
            <div class="footer">
              © 2026 RKonekte. Tous droits réservés.<br/>
              Si vous n'êtes pas à l'origine de cette démarche, vous pouvez ignorer cet e-mail.
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail({
      to: normalizedCompanyEmail,
      subject: emailSubject,
      html: emailHtml,
    });

    return NextResponse.json({
      success: true,
      message: `Votre compte a été enregistré. Un email pour définir votre mot de passe a été envoyé à ${normalizedCompanyEmail}.`,
      companyName,
      companyEmail: normalizedCompanyEmail,
      verificationLink,
      organizationId: orgId,
    });
  } catch (err: any) {
    console.error("Register company error:", err);
    return NextResponse.json(
      { error: `Erreur lors de l'enregistrement: ${err?.message || "Veuillez réessayer"}` },
      { status: 500 }
    );
  }
}
