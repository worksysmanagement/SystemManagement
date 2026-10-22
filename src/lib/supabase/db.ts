import { getSupabaseAdminClient } from "./server";
import { Organization, User, Employee, LeaveRequest, AuditLog, Branch, OrganizationRole } from "@/db/schema";
import { CreateOrganizationInput, CreateOrgUserInput, EmployeeInput } from "@/lib/validation/schemas";
import { hashPassword } from "@/lib/auth/password";
import { generateRequestNumber, hashToken } from "@/lib/security/tokens";
import { sendEmail } from "@/lib/notifications/email";

// ==========================================
// MAPPERS: Supabase snake_case <-> TypeScript
// ==========================================

export function mapOrg(row: any): Organization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    address: row.address ?? null,
    status: row.status,
    matriculeFormat: row.matricule_format || "INITIALS_BRANCH_SEQ",
    matriculePrefix: row.matricule_prefix ?? null,
    primaryCurrency: row.primary_currency || "HTG",
    dateFormat: row.date_format || "DD/MM/YYYY",
    language: row.language || "fr",
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

export function mapUser(row: any): User {
  return {
    id: row.id,
    organizationId: row.organization_id ?? null,
    branchId: row.branch_id ?? null,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    status: row.status,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

export function mapEmployee(row: any): Employee {
  return {
    id: row.id,
    organizationId: row.organization_id,
    branchId: row.branch_id ?? null,
    employeeNumber: row.employee_number,
    firstName: row.first_name,
    lastName: row.last_name,
    department: row.department ?? null,
    position: row.position ?? null,
    phone: row.phone,
    email: row.email ?? null,
    birthDate: row.birth_date ?? null,
    studyDomain: row.study_domain ?? null,
    bloodGroup: row.blood_group ?? null,
    medicalNotes: row.medical_notes ?? null,
    emergencyContactName: row.emergency_contact_name ?? null,
    emergencyContactRelation: row.emergency_contact_relation ?? null,
    emergencyContactPhone: row.emergency_contact_phone ?? null,
    status: row.status,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

export function mapLeaveRequest(row: any): LeaveRequest & {
  signatureUrl?: string | null;
  signerName?: string | null;
  signerRole?: string | null;
  organizationName?: string | null;
} {
  return {
    id: row.id,
    organizationId: row.organization_id,
    branchId: row.branch_id ?? null,
    employeeId: row.employee_id ?? null,
    requestNumber: row.request_number,
    firstName: row.first_name,
    lastName: row.last_name,
    employeeNumber: row.employee_number,
    department: row.department,
    position: row.position,
    leaveType: row.leave_type,
    leaveTypeOther: row.leave_type_other ?? null,
    startDate: row.start_date,
    endDate: row.end_date,
    requestedDays: Number(row.requested_days),
    replacementName: row.replacement_name ?? null,
    contactPhone: row.contact_phone ?? null,
    contactEmail: row.contact_email ?? null,
    status: row.status,
    employeeAccessTokenHash: row.employee_access_token_hash,
    ipAddress: row.ip_address ?? null,
    userAgent: row.user_agent ?? null,
    submittedAt: Number(row.submitted_at),
    decidedAt: row.decided_at ? Number(row.decided_at) : null,
    decidedBy: row.decided_by ?? null,
    rejectionReason: row.rejection_reason ?? null,
    decisionComment: row.decision_comment ?? null,
    signatureUrl: row.signature_url ?? row.signatureUrl ?? null,
    signerName: row.signer_name ?? row.signerName ?? null,
    signerRole: row.signer_role ?? row.signerRole ?? null,
    organizationName: row.organization_name ?? row.organizationName ?? null,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

export function mapAuditLog(row: any): AuditLog {
  return {
    id: row.id,
    organizationId: row.organization_id ?? null,
    userId: row.user_id ?? null,
    leaveRequestId: row.leave_request_id ?? null,
    action: row.action,
    oldStatus: row.old_status ?? null,
    newStatus: row.new_status ?? null,
    metadata: row.metadata ?? null,
    createdAt: Number(row.created_at),
  };
}

export function mapBranch(row: any): Branch {
  return {
    id: row.id,
    organizationId: row.organization_id,
    code: row.code,
    name: row.name,
    city: row.city,
    address: row.address ?? null,
    managerName: row.manager_name ?? null,
    phone: row.phone ?? null,
    status: row.status,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

export function mapRole(row: any): OrganizationRole {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    description: row.description ?? null,
    hierarchyLevel: row.hierarchy_level,
    isSystem: Boolean(row.is_system),
    permissions: typeof row.permissions === "string" ? row.permissions : JSON.stringify(row.permissions || {}),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

// ==========================================
// SUPABASE DATABASE OPERATIONS
// ==========================================

export const supabaseDb = {
  // ----------------------------------------
  // ORGANIZATIONS
  // ----------------------------------------
  organizations: {
    async listActive(): Promise<{ id: string; name: string; slug: string; logoUrl: string | null }[]> {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, slug, logo_url")
        .eq("status", "ACTIVE")
        .order("name", { ascending: true });

      if (error) throw new Error(`Supabase error: ${error.message}`);
      return (data || []).map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        logoUrl: row.logo_url ?? null,
      }));
    },

    async listAllForSuperAdmin(): Promise<any[]> {
      const supabase = getSupabaseAdminClient();
      const { data: orgs, error } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw new Error(`Supabase error: ${error.message}`);

      // Augment each org with counts and admin user
      const results = await Promise.all(
        (orgs || []).map(async (row) => {
          const org = mapOrg(row);

          // Count total requests
          const { count: reqCount } = await supabase
            .from("leave_requests")
            .select("*", { count: "exact", head: true })
            .eq("organization_id", org.id);

          // Count pending requests
          const { count: pendingCount } = await supabase
            .from("leave_requests")
            .select("*", { count: "exact", head: true })
            .eq("organization_id", org.id)
            .eq("status", "PENDING");

          // Find org admin
          const { data: adminData } = await supabase
            .from("users")
            .select("email, name")
            .eq("organization_id", org.id)
            .eq("role", "ORGANIZATION_ADMIN")
            .limit(1)
            .maybeSingle();

          return {
            ...org,
            adminEmail: adminData?.email || org.email,
            adminName: adminData?.name || "Administrateur",
            requestCount: reqCount ?? 0,
            pendingCount: pendingCount ?? 0,
          };
        })
      );

      return results;
    },

    async listPendingOnboarding(): Promise<any[]> {
      const supabase = getSupabaseAdminClient();
      const { data: disabledOrgs, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("status", "DISABLED")
        .order("created_at", { ascending: false });

      if (error) throw new Error(`Supabase error: ${error.message}`);

      const results = await Promise.all(
        (disabledOrgs || []).map(async (row) => {
          const org = mapOrg(row);

          const { data: admin } = await supabase
            .from("users")
            .select("*")
            .eq("organization_id", org.id)
            .limit(1)
            .maybeSingle();

          const { data: audit } = await supabase
            .from("audit_logs")
            .select("*")
            .eq("organization_id", org.id)
            .eq("action", "SUBMITTED")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          let meta: any = {};
          if (audit?.metadata) {
            try {
              meta = JSON.parse(audit.metadata);
            } catch (_) {}
          }

          return {
            id: org.id,
            companyName: org.name,
            companyEmail: org.email || admin?.email || "",
            slug: org.slug,
            phone: org.phone || meta.phone || "",
            address: org.address || meta.address || "",
            employeeRange: meta.employeeRange || "Non précisé",
            applicantName: meta.applicantName || admin?.name || "Non précisé",
            applicantRole: meta.applicantRole || "Responsable",
            submittedAt: audit?.created_at ? Number(audit.created_at) : org.createdAt,
            emailVerified: Boolean(meta.emailVerified),
            passwordSet: Boolean(meta.passwordSet),
            hasPassword: Boolean(admin?.password_hash && admin?.password_hash !== "NO_PASSWORD_SET"),
            verifiedAt: meta.verifiedAt || null,
            verificationToken: meta.verificationToken || null,
            status: org.status,
          };
        })
      );

      return results;
    },

    async getBySlug(slug: string): Promise<Organization | null> {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("slug", slug.toLowerCase())
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;
      return mapOrg(data);
    },

    async getById(id: string): Promise<Organization | null> {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", id)
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;
      return mapOrg(data);
    },

    async updateStatus(id: string, status: "ACTIVE" | "DISABLED"): Promise<void> {
      const supabase = getSupabaseAdminClient();
      const { error } = await supabase
        .from("organizations")
        .update({ status, updated_at: Date.now() })
        .eq("id", id);

      if (error) throw new Error(`Supabase error: ${error.message}`);
    },

    async updatePreferences(
      id: string,
      preferences: {
        name?: string;
        matriculeFormat?: string;
        matriculePrefix?: string | null;
        primaryCurrency?: string;
        dateFormat?: string;
        language?: string;
      }
    ): Promise<Organization> {
      const supabase = getSupabaseAdminClient();
      const updateData: any = { updated_at: Date.now() };
      if (preferences.name !== undefined) updateData.name = preferences.name;
      if (preferences.matriculeFormat !== undefined) updateData.matricule_format = preferences.matriculeFormat;
      if (preferences.matriculePrefix !== undefined) updateData.matricule_prefix = preferences.matriculePrefix;
      if (preferences.primaryCurrency !== undefined) updateData.primary_currency = preferences.primaryCurrency;
      if (preferences.dateFormat !== undefined) updateData.date_format = preferences.dateFormat;
      if (preferences.language !== undefined) updateData.language = preferences.language;

      const { data, error } = await supabase
        .from("organizations")
        .update(updateData)
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw new Error(`Supabase error: ${error.message}`);
      return mapOrg(data);
    },

    async createWithAdmin(input: CreateOrganizationInput): Promise<{ organization: Organization; adminUser: User }> {
      const supabase = getSupabaseAdminClient();
      const now = Date.now();

      // Check unique slug
      const { data: existingSlug } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", input.slug.toLowerCase())
        .maybeSingle();

      if (existingSlug) {
        throw new Error("Une organisation avec cet identifiant (slug) existe déjà");
      }

      // Check unique user email
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", input.adminEmail.toLowerCase())
        .maybeSingle();

      if (existingUser) {
        throw new Error("Un utilisateur avec cette adresse email existe déjà");
      }

      const orgId = `org-${crypto.randomUUID()}`;
      const userId = `usr-${crypto.randomUUID()}`;
      const passwordHash = await hashPassword(input.adminPassword);

      const orgPayload = {
        id: orgId,
        name: input.name,
        slug: input.slug.toLowerCase(),
        logo_url: input.logoUrl || null,
        email: input.email || null,
        phone: input.phone || null,
        address: input.address || null,
        status: "ACTIVE",
        created_at: now,
        updated_at: now,
      };

      const userPayload = {
        id: userId,
        organization_id: orgId,
        name: input.adminName,
        email: input.adminEmail.toLowerCase(),
        password_hash: passwordHash,
        role: "ORGANIZATION_ADMIN",
        status: "ACTIVE",
        created_at: now,
        updated_at: now,
      };

      const { error: orgErr } = await supabase.from("organizations").insert(orgPayload);
      if (orgErr) throw new Error(`Error creating organization: ${orgErr.message}`);

      const { error: userErr } = await supabase.from("users").insert(userPayload);
      if (userErr) throw new Error(`Error creating admin user: ${userErr.message}`);

      return {
        organization: mapOrg(orgPayload),
        adminUser: mapUser(userPayload),
      };
    },

    async approveOnboarding(orgId: string): Promise<any> {
      const supabase = getSupabaseAdminClient();
      const now = Date.now();

      const { data: orgData } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", orgId)
        .maybeSingle();

      if (!orgData) throw new Error("Organisation introuvable");
      const org = mapOrg(orgData);

      const { data: adminData } = await supabase
        .from("users")
        .select("*")
        .eq("organization_id", orgId)
        .limit(1)
        .maybeSingle();

      if (!adminData) throw new Error("Administrateur introuvable pour cette entreprise");
      const admin = mapUser(adminData);

      const { data: auditData } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("organization_id", orgId)
        .eq("action", "SUBMITTED")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let meta: any = {};
      if (auditData?.metadata) {
        try {
          meta = JSON.parse(auditData.metadata);
        } catch (_) {}
      }

      const tempPassword = meta.tempPassword || `Pass@${Math.random().toString(36).slice(-6)}!`;
      const passwordHash = await hashPassword(tempPassword);

      // Activate organization
      await supabase
        .from("organizations")
        .update({ status: "ACTIVE", updated_at: now })
        .eq("id", orgId);

      // Activate user & set password
      await supabase
        .from("users")
        .update({ status: "ACTIVE", password_hash: passwordHash, updated_at: now })
        .eq("id", admin.id);

      // Insert approval audit log
      await supabase.from("audit_logs").insert({
        id: `audit-${now}`,
        organization_id: orgId,
        user_id: null,
        action: "APPROVED_ONBOARDING",
        old_status: "DISABLED",
        new_status: "ACTIVE",
        metadata: JSON.stringify({ approvedAt: now }),
        created_at: now,
      });

      // Send official welcome email
      const host = process.env.APP_URL || "http://localhost:3000";
      const loginUrl = `${host}/login`;
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
            </style>
          </head>
          <body style="background-color: #ffffff; padding: 24px; margin: 0; color: #263445;">
            <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden;">
              <div style="padding: 36px 32px; line-height: 1.6; background: #ffffff;">
                <h2 style="color: #062653; margin-top: 0; font-size: 19px; font-weight: 700;">Félicitations ! Votre espace est activé</h2>
                <p style="margin: 12px 0; color: #334155; font-size: 14px;">Votre entreprise <strong>${org.name}</strong> a été validée avec succès sur <strong>RKonekte</strong>.</p>
                <div style="margin: 20px 0; background: transparent;">
                  <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #062653;">
                    <span style="color: #FF7900; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Important (N.B.) —</span> Vos identifiants
                  </p>
                  <p style="margin: 0 0 6px 0; font-size: 13px; color: #334155;">Identifiant (Email) : <strong>${admin.email}</strong></p>
                  <p style="margin: 0; font-size: 13px; color: #334155;">Mot de passe temporaire : <strong style="font-family: monospace; color: #062653;">${tempPassword}</strong></p>
                </div>
                <div style="text-align: center;">
                  <a href="${loginUrl}" style="display: inline-block; background-color: #FF7900; color: #ffffff !important; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; box-shadow: 0 2px 6px rgba(255,121,0,0.25);">Se connecter à mon espace →</a>
                </div>
              </div>
              <div style="background: #ffffff; padding: 24px; text-align: center; font-size: 11px; color: #94A3B8; border-top: 1px solid #F1F5F9;">
                © 2026 RKonekte. Tous droits réservés.
              </div>
            </div>
          </body>
        </html>
      `;

      try {
        await sendEmail({
          to: admin.email,
          subject: `[Accès Officiel] Bienvenue sur RKonekte — ${org.name}`,
          html: emailHtml,
        });
      } catch (err) {
        console.error("Failed to send welcome email:", err);
      }

      return {
        success: true,
        message: `L'entreprise ${org.name} a été approuvée et activée avec succès.`,
        credentials: {
          email: admin.email,
          temporaryPassword: tempPassword,
        },
      };
    },

    async rejectOnboarding(orgId: string, reason?: string): Promise<any> {
      const supabase = getSupabaseAdminClient();
      const now = Date.now();

      const { data: orgData } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", orgId)
        .maybeSingle();

      if (!orgData) throw new Error("Organisation introuvable");
      const org = mapOrg(orgData);

      await supabase
        .from("organizations")
        .update({ status: "DISABLED", updated_at: now })
        .eq("id", orgId);

      await supabase.from("audit_logs").insert({
        id: `audit-${now}`,
        organization_id: orgId,
        user_id: null,
        action: "REJECTED_ONBOARDING",
        old_status: "DISABLED",
        new_status: "REJECTED",
        metadata: JSON.stringify({ reason: reason || "Non précisé", rejectedAt: now }),
        created_at: now,
      });

      return {
        success: true,
        message: `La demande d'inscription pour ${org.name} a été refusée.`,
      };
    },

    async getSuperAdminStats(): Promise<any> {
      const supabase = getSupabaseAdminClient();

      const { count: totalOrgs } = await supabase
        .from("organizations")
        .select("*", { count: "exact", head: true });

      const { count: activeOrgs } = await supabase
        .from("organizations")
        .select("*", { count: "exact", head: true })
        .eq("status", "ACTIVE");

      const { count: disabledOrgs } = await supabase
        .from("organizations")
        .select("*", { count: "exact", head: true })
        .eq("status", "DISABLED");

      const { count: approvedRequests } = await supabase
        .from("leave_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "APPROVED");

      const { count: totalRequests } = await supabase
        .from("leave_requests")
        .select("*", { count: "exact", head: true });

      // 5 most recent requests
      const { data: recentReqData } = await supabase
        .from("leave_requests")
        .select("id, request_number, status, submitted_at, organization_id")
        .order("submitted_at", { ascending: false })
        .limit(5);

      const recentRequests = await Promise.all(
        (recentReqData || []).map(async (r: any) => {
          const { data: o } = await supabase
            .from("organizations")
            .select("name")
            .eq("id", r.organization_id)
            .maybeSingle();
          return {
            id: r.id,
            requestNumber: r.request_number,
            status: r.status,
            submittedAt: Number(r.submitted_at),
            organizationName: o?.name || "Entreprise",
          };
        })
      );

      return {
        totalOrganizations: totalOrgs ?? 0,
        activeOrganizations: activeOrgs ?? 0,
        disabledOrganizations: disabledOrgs ?? 0,
        approvedRequests: approvedRequests ?? 0,
        totalRequests: totalRequests ?? 0,
        recentRequests,
      };
    },
  },

  // ----------------------------------------
  // USERS
  // ----------------------------------------
  users: {
    async listByOrg(organizationId: string): Promise<Omit<User, "passwordHash">[]> {
      const supabase = getSupabaseAdminClient();
      let res: any = await supabase
        .from("users")
        .select("id, organization_id, branch_id, name, email, role, status, created_at, updated_at")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (res.error) {
        res = await supabase
          .from("users")
          .select("id, organization_id, name, email, role, status, created_at, updated_at")
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false });
      }

      if (res.error) throw new Error(`Supabase error: ${res.error.message}`);
      return (res.data || []).map((row: any) => ({
        id: row.id,
        organizationId: row.organization_id,
        branchId: row.branch_id ?? null,
        name: row.name,
        email: row.email,
        role: row.role,
        status: row.status,
        createdAt: Number(row.created_at),
        updatedAt: Number(row.updated_at),
      }));
    },

    async getByEmail(email: string): Promise<User | null> {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email.toLowerCase().trim())
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;
      return mapUser(data);
    },

    async getById(id: string): Promise<User | null> {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;
      return mapUser(data);
    },

    async createOrgUser(
      organizationId: string,
      input: CreateOrgUserInput
    ): Promise<Omit<User, "passwordHash">> {
      const supabase = getSupabaseAdminClient();

      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("email", input.email.toLowerCase().trim())
        .maybeSingle();

      if (existing) {
        throw new Error("Cette adresse email est déjà utilisée");
      }

      const now = Date.now();
      const newId = `usr-${crypto.randomUUID()}`;
      const passwordHash = await hashPassword(input.password);

      const userPayload = {
        id: newId,
        organization_id: organizationId,
        name: input.name,
        email: input.email.toLowerCase().trim(),
        password_hash: passwordHash,
        role: input.role,
        status: "ACTIVE",
        created_at: now,
        updated_at: now,
      };

      let insertError: any = null;
      if (input.branchId) {
        const { error } = await supabase.from("users").insert({
          ...userPayload,
          branch_id: input.branchId,
        });
        insertError = error;
      }
      if (!input.branchId || insertError) {
        const { error } = await supabase.from("users").insert(userPayload);
        if (error) throw new Error(`Supabase error: ${error.message}`);
      }

      return {
        id: newId,
        organizationId,
        branchId: input.branchId || null,
        name: input.name,
        email: input.email.toLowerCase().trim(),
        role: input.role,
        status: "ACTIVE",
        createdAt: now,
        updatedAt: now,
      };
    },

    async updateStatus(id: string, status: "ACTIVE" | "DISABLED"): Promise<void> {
      const supabase = getSupabaseAdminClient();
      const { error } = await supabase
        .from("users")
        .update({ status, updated_at: Date.now() })
        .eq("id", id);

      if (error) throw new Error(`Supabase error: ${error.message}`);
    },
  },

  // ----------------------------------------
  // EMPLOYEES
  // ----------------------------------------
  employees: {
    async list(
      organizationId: string,
      search?: string,
      statusFilter?: string,
      branchId?: string
    ): Promise<Employee[]> {
      const supabase = getSupabaseAdminClient();
      let query = supabase
        .from("employees")
        .select("*")
        .eq("organization_id", organizationId);

      if (statusFilter && (statusFilter === "ACTIVE" || statusFilter === "INACTIVE")) {
        query = query.eq("status", statusFilter);
      }

      if (branchId && branchId !== "ALL") {
        query = query.eq("branch_id", branchId);
      }

      if (search && search.trim().length > 0) {
        const s = search.trim();
        query = query.or(
          `first_name.ilike.%${s}%,last_name.ilike.%${s}%,employee_number.ilike.%${s}%,department.ilike.%${s}%,position.ilike.%${s}%`
        );
      }

      let { data, error } = await query.order("created_at", { ascending: false });
      if (error && error.message.includes("branch_id")) {
        // Fallback if branch_id column not yet migrated
        let fallbackQuery = supabase
          .from("employees")
          .select("*")
          .eq("organization_id", organizationId);
        if (statusFilter && (statusFilter === "ACTIVE" || statusFilter === "INACTIVE")) {
          fallbackQuery = fallbackQuery.eq("status", statusFilter);
        }
        const res = await fallbackQuery.order("created_at", { ascending: false });
        data = res.data;
        error = res.error;
      }
      if (error) throw new Error(`Supabase error: ${error.message}`);
      return (data || []).map(mapEmployee);
    },

    async getById(id: string, organizationId: string): Promise<Employee | null> {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("id", id)
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (error || !data) return null;
      return mapEmployee(data);
    },

    async getByNumber(employeeNumber: string, organizationId: string): Promise<Employee | null> {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("employee_number", employeeNumber)
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (error || !data) return null;
      return mapEmployee(data);
    },

    async create(organizationId: string, input: EmployeeInput): Promise<Employee> {
      const supabase = getSupabaseAdminClient();

      const { data: existing } = await supabase
        .from("employees")
        .select("id")
        .eq("employee_number", input.employeeNumber)
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (existing) {
        throw new Error(`Le matricule « ${input.employeeNumber} » est déjà attribué dans cette entreprise. Deux employés ne peuvent pas avoir le même matricule.`);
      }

      const now = Date.now();
      const id = `emp-${crypto.randomUUID()}`;
      const payload: any = {
        id,
        organization_id: organizationId,
        employee_number: input.employeeNumber,
        first_name: input.firstName,
        last_name: input.lastName,
        department: input.department?.trim() || null,
        position: input.position?.trim() || null,
        phone: input.phone,
        email: input.email ? input.email.toLowerCase().trim() : null,
        birth_date: input.birthDate?.trim() || null,
        study_domain: input.studyDomain?.trim() || null,
        blood_group: input.bloodGroup?.trim() || null,
        medical_notes: input.medicalNotes?.trim() || null,
        emergency_contact_name: input.emergencyContactName?.trim() || null,
        emergency_contact_relation: input.emergencyContactRelation?.trim() || null,
        emergency_contact_phone: input.emergencyContactPhone?.trim() || null,
        status: input.status || "ACTIVE",
        created_at: now,
        updated_at: now,
      };

      if (input.branchId) {
        payload.branch_id = input.branchId;
      }

      let { data, error } = await supabase.from("employees").insert(payload).select().single();
      if (error && error.message.includes("branch_id")) {
        delete payload.branch_id;
        const res = await supabase.from("employees").insert(payload).select().single();
        data = res.data;
        error = res.error;
      }
      if (error && (error.message.includes("schema cache") || (error as any).code === "PGRST204")) {
        // Fallback: If any newly added column is not yet synced in PostgREST cache, insert core payload
        const corePayload: any = {
          id: payload.id,
          organization_id: payload.organization_id,
          employee_number: payload.employee_number,
          first_name: payload.first_name,
          last_name: payload.last_name,
          department: payload.department,
          position: payload.position,
          phone: payload.phone,
          email: payload.email,
          status: payload.status,
          created_at: payload.created_at,
          updated_at: payload.updated_at,
        };
        if (payload.branch_id) corePayload.branch_id = payload.branch_id;
        const fallbackRes = await supabase.from("employees").insert(corePayload).select().single();
        if (!fallbackRes.error) {
          data = fallbackRes.data;
          error = null;
        } else {
          error = fallbackRes.error;
        }
      }
      if (error) throw new Error(`Supabase error: ${error.message}`);
      return mapEmployee(data || payload);
    },

    async update(id: string, organizationId: string, input: EmployeeInput): Promise<Employee> {
      const supabase = getSupabaseAdminClient();

      // Check duplicate number on other employee
      const { data: duplicate } = await supabase
        .from("employees")
        .select("id")
        .eq("employee_number", input.employeeNumber)
        .eq("organization_id", organizationId)
        .neq("id", id)
        .maybeSingle();

      if (duplicate) {
        throw new Error("Un autre employé possède déjà ce matricule");
      }

      const now = Date.now();
      const updatePayload: any = {
        employee_number: input.employeeNumber,
        first_name: input.firstName,
        last_name: input.lastName,
        department: input.department !== undefined ? (input.department ? input.department.trim() : null) : undefined,
        position: input.position !== undefined ? (input.position ? input.position.trim() : null) : undefined,
        phone: input.phone,
        email: input.email ? input.email.toLowerCase().trim() : null,
        birth_date: input.birthDate !== undefined ? (input.birthDate ? input.birthDate.trim() : null) : undefined,
        study_domain: input.studyDomain !== undefined ? (input.studyDomain ? input.studyDomain.trim() : null) : undefined,
        blood_group: input.bloodGroup !== undefined ? (input.bloodGroup ? input.bloodGroup.trim() : null) : undefined,
        medical_notes: input.medicalNotes !== undefined ? (input.medicalNotes ? input.medicalNotes.trim() : null) : undefined,
        emergency_contact_name: input.emergencyContactName !== undefined ? (input.emergencyContactName ? input.emergencyContactName.trim() : null) : undefined,
        emergency_contact_relation: input.emergencyContactRelation !== undefined ? (input.emergencyContactRelation ? input.emergencyContactRelation.trim() : null) : undefined,
        emergency_contact_phone: input.emergencyContactPhone !== undefined ? (input.emergencyContactPhone ? input.emergencyContactPhone.trim() : null) : undefined,
        status: input.status,
        updated_at: now,
      };

      if (input.branchId !== undefined) {
        updatePayload.branch_id = input.branchId || null;
      }

      let { data, error } = await supabase
        .from("employees")
        .update(updatePayload)
        .eq("id", id)
        .eq("organization_id", organizationId)
        .select()
        .single();

      if (error && error.message.includes("branch_id")) {
        delete updatePayload.branch_id;
        const res = await supabase
          .from("employees")
          .update(updatePayload)
          .eq("id", id)
          .eq("organization_id", organizationId)
          .select()
          .single();
        data = res.data;
        error = res.error;
      }

      if (error && (error.message.includes("schema cache") || (error as any).code === "PGRST204")) {
        const coreUpdate: any = {
          employee_number: input.employeeNumber,
          first_name: input.firstName,
          last_name: input.lastName,
          department: input.department,
          position: input.position,
          phone: input.phone,
          email: input.email ? input.email.toLowerCase().trim() : null,
          status: input.status,
          updated_at: now,
        };
        if (input.branchId !== undefined) coreUpdate.branch_id = input.branchId || null;
        const res = await supabase
          .from("employees")
          .update(coreUpdate)
          .eq("id", id)
          .eq("organization_id", organizationId)
          .select()
          .single();
        if (!res.error) {
          data = res.data;
          error = null;
        } else {
          error = res.error;
        }
      }

      if (error) throw new Error(`Supabase error: ${error.message}`);
      return mapEmployee(data);
    },

    async delete(id: string, organizationId: string): Promise<void> {
      const supabase = getSupabaseAdminClient();

      // Fetch employee info first to check their email
      const { data: emp } = await supabase
        .from("employees")
        .select("id, email, organization_id")
        .eq("id", id)
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (!emp) return;

      // 1. Unlink any leave requests pointing to this employee
      await supabase
        .from("leave_requests")
        .update({ employee_id: null })
        .eq("employee_id", id);

      // 2. Perform definitive permanent deletion
      const { error } = await supabase
        .from("employees")
        .delete()
        .eq("id", id)
        .eq("organization_id", organizationId);

      if (error) throw new Error(`Supabase error: ${error.message}`);

      // 3. Clean up associated user account if it is only an EMPLOYEE and no other employee uses this email
      if (emp.email) {
        const normEmail = emp.email.toLowerCase().trim();
        const { data: remaining } = await supabase
          .from("employees")
          .select("id")
          .eq("organization_id", organizationId)
          .ilike("email", normEmail);

        if (!remaining || remaining.length === 0) {
          const { data: userAcc } = await supabase
            .from("users")
            .select("id, role")
            .eq("organization_id", organizationId)
            .ilike("email", normEmail)
            .maybeSingle();

          if (userAcc && (userAcc.role === "EMPLOYEE" || userAcc.role === "COLLABORATEUR")) {
            await supabase.from("users").delete().eq("id", userAcc.id);
          }
        }
      }
    },
  },

  // ----------------------------------------
  // LEAVE REQUESTS
  // ----------------------------------------
  leaveRequests: {
    async create(input: any, meta?: { ip?: string; userAgent?: string }): Promise<any> {
      const supabase = getSupabaseAdminClient();
      const now = Date.now();

      // 1. Check organization active
      const { data: orgData } = await supabase
        .from("organizations")
        .select("id, name, status")
        .eq("id", input.organizationId)
        .eq("status", "ACTIVE")
        .maybeSingle();

      if (!orgData) throw new Error("Organisation introuvable ou inactive");

      // 2. Count total requests to generate request number
      const { count: totalReqCount } = await supabase
        .from("leave_requests")
        .select("*", { count: "exact", head: true });

      let sequence = (totalReqCount ?? 0) + 1;
      let requestNumber = generateRequestNumber(sequence);

      // Verify unique request number
      let { data: existingNum } = await supabase
        .from("leave_requests")
        .select("id")
        .eq("request_number", requestNumber)
        .maybeSingle();

      while (existingNum) {
        sequence += 1;
        requestNumber = generateRequestNumber(sequence);
        const res = await supabase
          .from("leave_requests")
          .select("id")
          .eq("request_number", requestNumber)
          .maybeSingle();
        existingNum = res.data;
      }

      const id = `req-${crypto.randomUUID()}`;
      const rawAccessToken = crypto.randomUUID();
      const tokenHash = await hashToken(rawAccessToken);

      const payload = {
        id,
        organization_id: input.organizationId,
        employee_id: input.employeeId ?? null,
        request_number: requestNumber,
        first_name: input.firstName,
        last_name: input.lastName,
        employee_number: input.employeeNumber,
        department: input.department,
        position: input.position,
        leave_type: input.leaveType,
        leave_type_other: input.leaveTypeOther ?? null,
        start_date: input.startDate,
        end_date: input.endDate,
        requested_days: input.requestedDays,
        replacement_name: input.replacementName ?? null,
        contact_phone: input.contactPhone ?? null,
        contact_email: input.contactEmail ?? null,
        status: "PENDING",
        employee_access_token_hash: tokenHash,
        ip_address: meta?.ip ?? null,
        user_agent: meta?.userAgent ?? null,
        submitted_at: now,
        created_at: now,
        updated_at: now,
      };

      const { error: insertErr } = await supabase.from("leave_requests").insert(payload);
      if (insertErr) throw new Error(`Supabase error: ${insertErr.message}`);

      // Insert audit log
      await supabase.from("audit_logs").insert({
        id: `audit-${now}`,
        organization_id: input.organizationId,
        user_id: null,
        leave_request_id: id,
        action: "SUBMITTED",
        old_status: null,
        new_status: "PENDING",
        metadata: JSON.stringify({ ip: meta?.ip, employeeNumber: input.employeeNumber }),
        created_at: now,
      });

      const leaveRequest = mapLeaveRequest(payload);
      return { leaveRequest, rawAccessToken };
    },

    async getById(id: string): Promise<(LeaveRequest & { signatureUrl?: string | null; signerName?: string | null; signerRole?: string | null }) | null> {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("leave_requests")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) return null;

      if (data.status === "APPROVED") {
        const { data: auditData } = await supabase
          .from("audit_logs")
          .select("metadata")
          .eq("leave_request_id", data.id)
          .eq("action", "APPROVED")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (auditData?.metadata) {
          try {
            const meta = JSON.parse(auditData.metadata);
            (data as any).signature_url = meta.signatureUrl;
            (data as any).signer_name = meta.signerName;
            (data as any).signer_role = meta.signerRole;
          } catch (_) {}
        }
      }

      return mapLeaveRequest(data);
    },

    async getByToken(token: string): Promise<(LeaveRequest & { signatureUrl?: string | null; signerName?: string | null; signerRole?: string | null; organizationName?: string | null }) | null> {
      const supabase = getSupabaseAdminClient();
      const tokenHash = await hashToken(token);

      let { data, error } = await supabase
        .from("leave_requests")
        .select("*")
        .eq("employee_access_token_hash", tokenHash)
        .maybeSingle();

      if (!data) {
        const fallback = await supabase
          .from("leave_requests")
          .select("*")
          .eq("employee_access_token_hash", token)
          .maybeSingle();
        data = fallback.data;
      }

      if (error || !data) return null;

      if (data.status === "APPROVED") {
        const { data: auditData } = await supabase
          .from("audit_logs")
          .select("metadata")
          .eq("leave_request_id", data.id)
          .eq("action", "APPROVED")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (auditData?.metadata) {
          try {
            const meta = JSON.parse(auditData.metadata);
            (data as any).signature_url = meta.signatureUrl;
            (data as any).signer_name = meta.signerName;
            (data as any).signer_role = meta.signerRole;
          } catch (_) {}
        }
      }

      if (data.organization_id) {
        const { data: orgData } = await supabase
          .from("organizations")
          .select("name")
          .eq("id", data.organization_id)
          .maybeSingle();
        if (orgData?.name) {
          (data as any).organization_name = orgData.name;
        }
      }

      return mapLeaveRequest(data);
    },

    async list(organizationId: string, filters?: any): Promise<LeaveRequest[]> {
      const supabase = getSupabaseAdminClient();
      let query = supabase
        .from("leave_requests")
        .select("*")
        .eq("organization_id", organizationId);

      if (filters?.status && filters.status !== "ALL") {
        query = query.eq("status", filters.status);
      }
      if (filters?.employeeNumber) {
        query = query.eq("employee_number", filters.employeeNumber);
      }
      if (filters?.contactEmail) {
        query = query.ilike("contact_email", filters.contactEmail);
      }
      if (filters?.department) {
        query = query.eq("department", filters.department);
      }
      if (filters?.leaveType) {
        query = query.eq("leave_type", filters.leaveType);
      }
      if (filters?.search && filters.search.trim().length > 0) {
        const s = filters.search.trim();
        query = query.or(
          `first_name.ilike.%${s}%,last_name.ilike.%${s}%,employee_number.ilike.%${s}%,request_number.ilike.%${s}%`
        );
      }

      const { data, error } = await query.order("submitted_at", { ascending: false });
      if (error) throw new Error(`Supabase error: ${error.message}`);
      return (data || []).map(mapLeaveRequest);
    },

    async approve(
      id: string,
      organizationId: string,
      decidedBy: string,
      decisionComment?: string,
      signatureMeta?: {
        signatureUrl?: string;
        signerName?: string;
        signerRole?: string;
      }
    ): Promise<LeaveRequest> {
      const supabase = getSupabaseAdminClient();
      const now = Date.now();

      const { data: current } = await supabase
        .from("leave_requests")
        .select("*")
        .eq("id", id)
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (!current) throw new Error("Demande introuvable pour cette organisation");
      if (current.status !== "PENDING") {
        throw new Error(`La demande a déjà été traitée (Statut actuel: ${current.status})`);
      }

      const updatePayload = {
        status: "APPROVED",
        decided_at: now,
        decided_by: decidedBy,
        decision_comment: decisionComment ?? null,
        updated_at: now,
      };

      const { data, error } = await supabase
        .from("leave_requests")
        .update(updatePayload)
        .eq("id", id)
        .eq("organization_id", organizationId)
        .select()
        .single();

      if (error) throw new Error(`Supabase error: ${error.message}`);

      await supabase.from("audit_logs").insert({
        id: `audit-${now}`,
        organization_id: organizationId,
        user_id: decidedBy,
        leave_request_id: id,
        action: "APPROVED",
        old_status: "PENDING",
        new_status: "APPROVED",
        metadata: JSON.stringify({
          decisionComment,
          signatureUrl: signatureMeta?.signatureUrl,
          signerName: signatureMeta?.signerName,
          signerRole: signatureMeta?.signerRole,
        }),
        created_at: now,
      });

      return mapLeaveRequest(data);
    },

    async reject(
      id: string,
      organizationId: string,
      decidedBy: string,
      rejectionReason: string,
      decisionComment?: string
    ): Promise<LeaveRequest> {
      if (!rejectionReason || !rejectionReason.trim()) {
        throw new Error("Le motif du refus est obligatoire");
      }

      const supabase = getSupabaseAdminClient();
      const now = Date.now();

      const { data: current } = await supabase
        .from("leave_requests")
        .select("*")
        .eq("id", id)
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (!current) throw new Error("Demande introuvable pour cette organisation");
      if (current.status !== "PENDING") {
        throw new Error(`La demande a déjà été traitée (Statut actuel: ${current.status})`);
      }

      const updatePayload = {
        status: "REJECTED",
        decided_at: now,
        decided_by: decidedBy,
        rejection_reason: rejectionReason.trim(),
        decision_comment: decisionComment ?? null,
        updated_at: now,
      };

      const { data, error } = await supabase
        .from("leave_requests")
        .update(updatePayload)
        .eq("id", id)
        .eq("organization_id", organizationId)
        .select()
        .single();

      if (error) throw new Error(`Supabase error: ${error.message}`);

      await supabase.from("audit_logs").insert({
        id: `audit-${now}`,
        organization_id: organizationId,
        user_id: decidedBy,
        leave_request_id: id,
        action: "REJECTED",
        old_status: "PENDING",
        new_status: "REJECTED",
        metadata: JSON.stringify({ rejectionReason, decisionComment }),
        created_at: now,
      });

      return mapLeaveRequest(data);
    },

    async delete(id: string, organizationId: string): Promise<void> {
      const supabase = getSupabaseAdminClient();

      try {
        await supabase
          .from("audit_logs")
          .delete()
          .eq("leave_request_id", id)
          .eq("organization_id", organizationId);
      } catch (_) {}

      const { error } = await supabase
        .from("leave_requests")
        .delete()
        .eq("id", id)
        .eq("organization_id", organizationId);

      if (error) throw new Error(`Supabase error: ${error.message}`);
    },
  },

  // ----------------------------------------
  // AUDIT LOGS
  // ----------------------------------------
  auditLogs: {
    async list(organizationId: string): Promise<AuditLog[]> {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) throw new Error(`Supabase error: ${error.message}`);
      return (data || []).map(mapAuditLog);
    },

    async create(input: {
      organizationId?: string | null;
      userId?: string | null;
      leaveRequestId?: string | null;
      action: string;
      oldStatus?: string | null;
      newStatus?: string | null;
      metadata?: string | null;
    }): Promise<void> {
      const supabase = getSupabaseAdminClient();
      const now = Date.now();
      await supabase.from("audit_logs").insert({
        id: `audit-${now}-${Math.random().toString(36).slice(-4)}`,
        organization_id: input.organizationId ?? null,
        user_id: input.userId ?? null,
        leave_request_id: input.leaveRequestId ?? null,
        action: input.action,
        old_status: input.oldStatus ?? null,
        new_status: input.newStatus ?? null,
        metadata: input.metadata ?? null,
        created_at: now,
      });
    },
  },

  // ----------------------------------------
  // BRANCHES
  // ----------------------------------------
  branches: {
    async list(organizationId: string): Promise<Branch[]> {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: true });

      if (error) {
        return [];
      }
      return (data || []).map(mapBranch);
    },

    async getById(id: string, organizationId: string): Promise<Branch | null> {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .eq("id", id)
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (error || !data) return null;
      return mapBranch(data);
    },

    async create(organizationId: string, input: Partial<Branch>): Promise<Branch> {
      const supabase = getSupabaseAdminClient();
      const now = Date.now();
      const id = input.id || `br-${now}-${Math.random().toString(36).slice(-4)}`;
      const newRow = {
        id,
        organization_id: organizationId,
        code: (input.code || "BR").toUpperCase().trim(),
        name: (input.name || "Succursale").trim(),
        city: (input.city || "Port-au-Prince").trim(),
        address: input.address ? input.address.trim() : null,
        manager_name: input.managerName ? input.managerName.trim() : null,
        phone: input.phone ? input.phone.trim() : null,
        status: input.status || "ACTIVE",
        created_at: now,
        updated_at: now,
      };
      const { data, error } = await supabase
        .from("branches")
        .insert(newRow)
        .select()
        .single();

      if (error) throw new Error(`Supabase error: ${error.message}`);
      return mapBranch(data);
    },

    async update(id: string, organizationId: string, input: Partial<Branch>): Promise<Branch> {
      const supabase = getSupabaseAdminClient();
      const now = Date.now();
      const updateRow: any = {
        updated_at: now,
      };
      if (input.code !== undefined) updateRow.code = input.code.toUpperCase().trim();
      if (input.name !== undefined) updateRow.name = input.name.trim();
      if (input.city !== undefined) updateRow.city = input.city.trim();
      if (input.address !== undefined) updateRow.address = input.address ? input.address.trim() : null;
      if (input.managerName !== undefined) updateRow.manager_name = input.managerName ? input.managerName.trim() : null;
      if (input.phone !== undefined) updateRow.phone = input.phone ? input.phone.trim() : null;
      if (input.status !== undefined) updateRow.status = input.status;

      const { data, error } = await supabase
        .from("branches")
        .update(updateRow)
        .eq("id", id)
        .eq("organization_id", organizationId)
        .select()
        .single();

      if (error) throw new Error(`Supabase error: ${error.message}`);
      return mapBranch(data);
    },

    async delete(id: string, organizationId: string): Promise<void> {
      const supabase = getSupabaseAdminClient();
      const { error } = await supabase
        .from("branches")
        .delete()
        .eq("id", id)
        .eq("organization_id", organizationId);

      if (error) throw new Error(`Supabase error: ${error.message}`);
    },
  },

  // ----------------------------------------
  // ORGANIZATION ROLES (Matrice des droits)
  // ----------------------------------------
  roles: {
    async list(organizationId: string): Promise<OrganizationRole[]> {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("organization_roles")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) {
        return [];
      }
      return (data || []).map(mapRole);
    },

    async getById(id: string, organizationId: string): Promise<OrganizationRole | null> {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from("organization_roles")
        .select("*")
        .eq("id", id)
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (error || !data) return null;
      return mapRole(data);
    },

    async create(
      organizationId: string,
      input: {
        id?: string;
        organizationId?: string;
        name: string;
        description?: string | null;
        hierarchyLevel?: string;
        isSystem?: boolean;
        permissions: string;
        createdAt?: number;
        updatedAt?: number;
      }
    ): Promise<OrganizationRole> {
      const supabase = getSupabaseAdminClient();
      const now = Date.now();
      const id = input.id || `role-${crypto.randomUUID()}`;
      const newRow = {
        id,
        organization_id: organizationId,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        hierarchy_level: input.hierarchyLevel || "OPERATIONAL",
        is_system: input.isSystem || false,
        permissions: input.permissions,
        created_at: input.createdAt || now,
        updated_at: input.updatedAt || now,
      };

      const { data, error } = await supabase
        .from("organization_roles")
        .insert(newRow)
        .select()
        .single();

      if (error) throw new Error(`Supabase error: ${error.message}`);
      return mapRole(data);
    },

    async update(
      id: string,
      organizationId: string,
      input: {
        name?: string;
        description?: string | null;
        hierarchyLevel?: string;
        permissions?: string;
      }
    ): Promise<OrganizationRole> {
      const supabase = getSupabaseAdminClient();
      const now = Date.now();
      const updateRow: any = { updated_at: now };
      if (input.name !== undefined) updateRow.name = input.name.trim();
      if (input.description !== undefined) updateRow.description = input.description?.trim() || null;
      if (input.hierarchyLevel !== undefined) updateRow.hierarchy_level = input.hierarchyLevel;
      if (input.permissions !== undefined) updateRow.permissions = input.permissions;

      const { data, error } = await supabase
        .from("organization_roles")
        .update(updateRow)
        .eq("id", id)
        .eq("organization_id", organizationId)
        .select()
        .single();

      if (error) throw new Error(`Supabase error: ${error.message}`);
      return mapRole(data);
    },

    async delete(id: string, organizationId: string): Promise<void> {
      const supabase = getSupabaseAdminClient();
      const { error } = await supabase
        .from("organization_roles")
        .delete()
        .eq("id", id)
        .eq("organization_id", organizationId);

      if (error) throw new Error(`Supabase error: ${error.message}`);
    },
  },
};

