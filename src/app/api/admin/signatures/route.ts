import { NextRequest, NextResponse } from "next/server";
import { requireTenantUser, handleApiError } from "@/lib/auth/guard";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const { organizationId } = await requireTenantUser();
    const supabase = getSupabaseAdminClient();

    // 1. Fetch users from organization
    const { data: users, error: usersErr } = await supabase
      .from("users")
      .select("id, name, email, role, status")
      .eq("organization_id", organizationId);

    if (usersErr) {
      throw usersErr;
    }

    // 2. Fetch existing signature delegations from Supabase table
    const { data: delegations, error: delegErr } = await supabase
      .from("signature_delegations")
      .select("*")
      .eq("organization_id", organizationId);

    if (delegErr) {
      console.warn("Could not query signature_delegations:", delegErr);
    }

    const delegMap = new Map<string, any>();
    for (const d of delegations || []) {
      delegMap.set(d.user_id, d);
    }

    // 3. Build enriched signers list
    const signers = (users || []).map((u) => {
      const existing = delegMap.get(u.id);
      const isPDG = u.role === "ORGANIZATION_ADMIN";
      const isSecretary = u.role === "SECRETARY" || u.role === "RH";
      const isFinance = u.role === "FINANCIAL_MANAGER";

      if (existing) {
        return {
          id: existing.id,
          userId: u.id,
          userName: u.name,
          userEmail: u.email,
          role: u.role,
          canSignLeaves: Boolean(existing.can_sign_leaves),
          canSignSalaryRaises: Boolean(existing.can_sign_salary_raises),
          canSignAuthorizations: Boolean(existing.can_sign_authorizations),
          spendingLimitHTG: Number(existing.spending_limit_htg || 0),
          status: existing.status || "ACTIVE",
        };
      }

      // Default delegations if not yet registered in table
      return {
        id: `sig-virt-${u.id}`,
        userId: u.id,
        userName: u.name,
        userEmail: u.email,
        role: u.role,
        canSignLeaves: isPDG || isSecretary,
        canSignSalaryRaises: isPDG || isFinance,
        canSignAuthorizations: isPDG || isFinance,
        spendingLimitHTG: isPDG ? 500000 : isFinance ? 250000 : 0,
        status: u.status || "ACTIVE",
      };
    });

    return NextResponse.json({ success: true, signers });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { organizationId } = await requireTenantUser();
    const body = await req.json();
    const supabase = getSupabaseAdminClient();
    const now = Date.now();

    const {
      userId,
      userEmail,
      canSignLeaves,
      canSignSalaryRaises,
      canSignAuthorizations,
      spendingLimitHTG,
      status,
    } = body;

    // Resolve user ID by email if not provided
    let targetUserId = userId;
    if (!targetUserId && userEmail) {
      const { data: u } = await supabase
        .from("users")
        .select("id")
        .eq("organization_id", organizationId)
        .ilike("email", userEmail.trim().toLowerCase())
        .maybeSingle();
      if (u) {
        targetUserId = u.id;
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Utilisateur introuvable pour cette délégation de signature." },
        { status: 400 }
      );
    }

    // Check if delegation already exists
    const { data: existing } = await supabase
      .from("signature_delegations")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("user_id", targetUserId)
      .maybeSingle();

    const delegationId = existing?.id || `sig-${crypto.randomUUID()}`;

    const payload = {
      id: delegationId,
      organization_id: organizationId,
      user_id: targetUserId,
      can_sign_leaves: Boolean(canSignLeaves),
      can_sign_salary_raises: Boolean(canSignSalaryRaises),
      can_sign_authorizations: Boolean(canSignAuthorizations),
      spending_limit_htg: Number(spendingLimitHTG || 0),
      status: status || "ACTIVE",
      updated_at: now,
    };

    if (existing) {
      await supabase
        .from("signature_delegations")
        .update(payload)
        .eq("id", delegationId);
    } else {
      await supabase
        .from("signature_delegations")
        .insert({
          ...payload,
          created_at: now,
        });
    }

    return NextResponse.json({
      success: true,
      delegation: {
        userId: targetUserId,
        ...payload,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
