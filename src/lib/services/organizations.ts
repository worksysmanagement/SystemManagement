import { getDb } from "@/lib/db/client";
import { organizations, users, leaveRequests, auditLogs, Organization, User } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { CreateOrganizationInput } from "@/lib/validation/schemas";
import { hashPassword } from "@/lib/auth/password";
import { sendEmail } from "@/lib/notifications/email";
import { supabaseDb } from "@/lib/supabase/db";

export async function listActiveOrganizations(dbInstance?: any) {
  if (!dbInstance) {
    return await supabaseDb.organizations.listActive();
  }
  const db = dbInstance || getDb();
  return await db
    .select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      logoUrl: organizations.logoUrl,
    })
    .from(organizations)
    .where(eq(organizations.status, "ACTIVE"))
    .orderBy(organizations.name);
}

export async function listAllOrganizationsForSuperAdmin(dbInstance?: any) {
  if (!dbInstance) {
    return await supabaseDb.organizations.listAllForSuperAdmin();
  }
  const db = dbInstance || getDb();
  const orgs = await db.select().from(organizations).orderBy(desc(organizations.createdAt));

  // Augment with request counts
  const results = await Promise.all(
    orgs.map(async (org: Organization) => {
      const [reqCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(leaveRequests)
        .where(eq(leaveRequests.organizationId, org.id));

      const [pendingCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(leaveRequests)
        .where(
          and(
            eq(leaveRequests.organizationId, org.id),
            eq(leaveRequests.status, "PENDING")
          )
        );

      const [admin] = await db
        .select({ email: users.email, name: users.name })
        .from(users)
        .where(and(eq(users.organizationId, org.id), eq(users.role, "ORGANIZATION_ADMIN")))
        .limit(1);

      return {
        ...org,
        adminEmail: admin?.email || org.email,
        adminName: admin?.name || "Administrateur",
        requestCount: reqCount?.count || 0,
        pendingCount: pendingCount?.count || 0,
      };
    })
  );

  return results;
}

export async function listPendingOnboardingRequests(dbInstance?: any) {
  if (!dbInstance) {
    return await supabaseDb.organizations.listPendingOnboarding();
  }
  const db = dbInstance || getDb();
  const disabledOrgs = await db
    .select()
    .from(organizations)
    .where(eq(organizations.status, "DISABLED"))
    .orderBy(desc(organizations.createdAt));

  const results = await Promise.all(
    disabledOrgs.map(async (org: any) => {
      const [admin] = await db
        .select()
        .from(users)
        .where(eq(users.organizationId, org.id))
        .limit(1);

      const [audit] = await db
        .select()
        .from(auditLogs)
        .where(and(eq(auditLogs.organizationId, org.id), eq(auditLogs.action, "SUBMITTED")))
        .limit(1);

      let metadata: any = {};
      try {
        if (audit?.metadata) metadata = JSON.parse(audit.metadata);
      } catch (_) {}

      return {
        id: org.id,
        companyName: org.name,
        slug: org.slug,
        email: org.email,
        phone: org.phone,
        address: org.address,
        adminName: admin?.name || metadata.adminName || metadata.applicantName || "Responsable",
        adminEmail: admin?.email || metadata.adminEmail || metadata.companyEmail || org.email,
        applicantRole: metadata.applicantRole || "Responsable",
        employeeRange: metadata.employeeRange || metadata.estimatedEmployees || "Non spécifié",
        emailVerified: !!metadata.emailVerified,
        tempPassword: metadata.tempPassword || null,
        city: metadata.city || "Haïti",
        message: metadata.message || "",
        submittedAt: org.createdAt,
      };
    })
  );

  return results;
}

export async function approveOnboardingRequest(orgId: string, origin?: string, dbInstance?: any) {
  if (!dbInstance) {
    return await supabaseDb.organizations.approveOnboarding(orgId);
  }
  const db = dbInstance || getDb();
  const now = Date.now();

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  const [admin] = await db
    .select()
    .from(users)
    .where(eq(users.organizationId, orgId))
    .limit(1);

  const [audit] = await db
    .select()
    .from(auditLogs)
    .where(and(eq(auditLogs.organizationId, orgId), eq(auditLogs.action, "SUBMITTED")))
    .limit(1);

  let metadata: any = {};
  try {
    if (audit?.metadata) metadata = JSON.parse(audit.metadata);
  } catch (_) {}

  // Activate organization
  await db
    .update(organizations)
    .set({ status: "ACTIVE", updatedAt: now })
    .where(eq(organizations.id, orgId));

  // Activate organization admin users
  await db
    .update(users)
    .set({ status: "ACTIVE", updatedAt: now })
    .where(eq(users.organizationId, orgId));

  // Log approval
  await db.insert(auditLogs).values({
    id: `audit-${now}`,
    organizationId: orgId,
    userId: null,
    action: "APPROVED",
    oldStatus: "DISABLED",
    newStatus: "ACTIVE",
    metadata: JSON.stringify({ approvedBy: "SUPER_ADMIN", approvedAt: now }),
    createdAt: now,
  });

  const recipientEmail = admin?.email || org?.email || metadata.companyEmail;
  const tempPassword = metadata.tempPassword;
  const loginUrl = origin ? `${origin}/login` : "/login";

  if (recipientEmail && tempPassword) {
    try {
      await sendEmail({
        to: recipientEmail,
        subject: `[Compte activé] Vos accès à la plateforme RKonekte — ${org?.name || "Entreprise"}`,
        html: `
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
                .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; }
                .content { padding: 36px 32px; line-height: 1.6; background: #ffffff; }
                .badge { display: inline-block; color: #047857; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
                .nb-section { margin: 20px 0; background: transparent; }
                .btn { display: inline-block; background-color: #FF7900; color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 14px; padding: 14px 28px; border-radius: 10px; margin: 20px 0; text-align: center; box-shadow: 0 2px 6px rgba(255,121,0,0.25); }
                .footer { background: #ffffff; padding: 24px; text-align: center; font-size: 11px; color: #94A3B8; border-top: 1px solid #F1F5F9; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="content">
                  <span class="badge">Espace Entreprise Activé</span>
                  <h2 style="color: #062653; margin-top: 0; font-size: 19px; font-weight: 700;">Bonjour ${admin?.name || "Responsable"},</h2>
                  <p style="margin: 12px 0; color: #334155; font-size: 14px;">L'inscription de votre entreprise <strong>${org?.name}</strong> a été officiellement approuvée par l'administration RKonekte.</p>
                  
                  <div class="nb-section">
                    <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #062653;">
                      <span style="color: #FF7900; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Important (N.B.) —</span> Vos paramètres de connexion administrateur
                    </p>
                    <p style="margin: 0 0 6px 0; color: #334155; font-size: 13px;">
                      Identifiant (Email) : <strong>${recipientEmail}</strong>
                    </p>
                    <p style="margin: 0; color: #334155; font-size: 13px;">
                      Mot de passe temporaire : <strong style="font-family: monospace; color: #062653;">${tempPassword}</strong>
                    </p>
                  </div>

                  <p>Vous pouvez dès à présent vous connecter pour configurer vos équipes et gérer les opérations :</p>

                  <div style="text-align: center;">
                    <a href="${loginUrl}" class="btn" target="_blank">Se connecter à mon espace entreprise →</a>
                  </div>
                </div>
                <div class="footer">
                  © 2026 RKonekte. Tous droits réservés.
                </div>
              </div>
            </body>
          </html>
        `,
      });
    } catch (e) {
      console.error("Failed to send activation email:", e);
    }
  }

  return {
    success: true,
    credentials: {
      companyName: org?.name || "Entreprise",
      email: recipientEmail,
      tempPassword: tempPassword || null,
    },
  };
}

export async function rejectOnboardingRequest(orgId: string, reason: string, dbInstance?: any) {
  if (!dbInstance) {
    return await supabaseDb.organizations.rejectOnboarding(orgId, reason);
  }
  const db = dbInstance || getDb();
  const now = Date.now();

  // Log rejection
  await db.insert(auditLogs).values({
    id: `audit-${now}`,
    organizationId: orgId,
    userId: null,
    action: "REJECTED",
    oldStatus: "DISABLED",
    newStatus: "REJECTED",
    metadata: JSON.stringify({ rejectedBy: "SUPER_ADMIN", reason, rejectedAt: now }),
    createdAt: now,
  });

  // Delete disabled organization and users
  await db.delete(users).where(eq(users.organizationId, orgId));
  await db.delete(organizations).where(eq(organizations.id, orgId));

  return { success: true };
}

export async function getSuperAdminPlatformStats(dbInstance?: any) {
  if (!dbInstance) {
    return await supabaseDb.organizations.getSuperAdminStats();
  }
  const db = dbInstance || getDb();

  const [totalOrgsRes] = await db.select({ count: sql<number>`count(*)` }).from(organizations);
  const [activeOrgsRes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(organizations)
    .where(eq(organizations.status, "ACTIVE"));
  const [disabledOrgsRes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(organizations)
    .where(eq(organizations.status, "DISABLED"));
  const [approvedRequestsRes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(leaveRequests)
    .where(eq(leaveRequests.status, "APPROVED"));
  const [totalRequestsRes] = await db.select({ count: sql<number>`count(*)` }).from(leaveRequests);

  const recentRequests = await db
    .select({
      id: leaveRequests.id,
      requestNumber: leaveRequests.requestNumber,
      status: leaveRequests.status,
      submittedAt: leaveRequests.submittedAt,
      organizationName: organizations.name,
    })
    .from(leaveRequests)
    .innerJoin(organizations, eq(leaveRequests.organizationId, organizations.id))
    .orderBy(desc(leaveRequests.submittedAt))
    .limit(5);

  return {
    totalOrganizations: totalOrgsRes?.count || 0,
    activeOrganizations: activeOrgsRes?.count || 0,
    disabledOrganizations: disabledOrgsRes?.count || 0,
    approvedRequests: approvedRequestsRes?.count || 0,
    totalRequests: totalRequestsRes?.count || 0,
    recentRequests,
  };
}

export async function createOrganizationWithAdmin(
  input: CreateOrganizationInput,
  dbInstance?: any
): Promise<{ organization: Organization; adminUser: User }> {
  if (!dbInstance) {
    return await supabaseDb.organizations.createWithAdmin(input);
  }
  const db = dbInstance || getDb();
  const now = Date.now();

  const [existingSlug] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, input.slug))
    .limit(1);

  if (existingSlug) {
    throw new Error("Une entreprise avec ce slug existe déjà");
  }

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, input.adminEmail.toLowerCase()))
    .limit(1);

  if (existingUser) {
    throw new Error("Un utilisateur avec cette adresse email existe déjà");
  }

  const orgId = `org-${crypto.randomUUID()}`;
  const userId = `usr-${crypto.randomUUID()}`;
  const passwordHash = await hashPassword(input.adminPassword);

  await db.insert(organizations).values({
    id: orgId,
    name: input.name,
    slug: input.slug.toLowerCase(),
    logoUrl: input.logoUrl || null,
    email: input.email || null,
    phone: input.phone || null,
    address: input.address || null,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(users).values({
    id: userId,
    organizationId: orgId,
    name: input.adminName,
    email: input.adminEmail.toLowerCase(),
    passwordHash,
    role: "ORGANIZATION_ADMIN",
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  });

  const [organization] = await db.select().from(organizations).where(eq(organizations.id, orgId));
  const [adminUser] = await db.select().from(users).where(eq(users.id, userId));

  return { organization, adminUser };
}

export async function updateOrganizationStatus(
  id: string,
  status: "ACTIVE" | "DISABLED",
  dbInstance?: any
) {
  if (!dbInstance) {
    return await supabaseDb.organizations.updateStatus(id, status);
  }
  const db = dbInstance || getDb();
  await db
    .update(organizations)
    .set({ status, updatedAt: Date.now() })
    .where(eq(organizations.id, id));
}

export async function updateOrganizationPreferences(
  id: string,
  preferences: {
    name?: string;
    matriculeFormat?: string;
    matriculePrefix?: string | null;
    primaryCurrency?: string;
    dateFormat?: string;
    language?: string;
  },
  dbInstance?: any
): Promise<Organization> {
  if (!dbInstance) {
    return await supabaseDb.organizations.updatePreferences(id, preferences);
  }
  const db = dbInstance || getDb();
  const updatePayload: any = { updatedAt: Date.now() };
  if (preferences.name !== undefined) updatePayload.name = preferences.name;
  if (preferences.matriculeFormat !== undefined) updatePayload.matriculeFormat = preferences.matriculeFormat;
  if (preferences.matriculePrefix !== undefined) updatePayload.matriculePrefix = preferences.matriculePrefix;
  if (preferences.primaryCurrency !== undefined) updatePayload.primaryCurrency = preferences.primaryCurrency;
  if (preferences.dateFormat !== undefined) updatePayload.dateFormat = preferences.dateFormat;
  if (preferences.language !== undefined) updatePayload.language = preferences.language;

  await db
    .update(organizations)
    .set(updatePayload)
    .where(eq(organizations.id, id));

  const updated = await getOrganizationById(id, dbInstance);
  if (!updated) throw new Error("Organisation introuvable.");
  return updated;
}

export async function getOrganizationById(id: string, dbInstance?: any): Promise<Organization | null> {
  if (!dbInstance) {
    return await supabaseDb.organizations.getById(id);
  }
  const db = dbInstance || getDb();
  const [org] = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
  return org || null;
}

export async function getOrganizationBySlug(slug: string, dbInstance?: any): Promise<Organization | null> {
  if (!dbInstance) {
    return await supabaseDb.organizations.getBySlug(slug);
  }
  const db = dbInstance || getDb();
  const [org] = await db.select().from(organizations).where(eq(organizations.slug, slug.toLowerCase())).limit(1);
  return org || null;
}
