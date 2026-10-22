import { NextRequest, NextResponse } from "next/server";
import { requireTenantUser, handleApiError } from "@/lib/auth/guard";
import { listEmployees, createEmployee } from "@/lib/services/employees";
import { employeeSchema } from "@/lib/validation/schemas";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { sendEmployeeInvitation } from "@/lib/services/employee-invitations";

export async function GET(req: NextRequest) {
  try {
    const { organizationId } = await requireTenantUser();
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const branchId = url.searchParams.get("branchId") || undefined;

    const employeesList = await listEmployees(organizationId, search, status, branchId);

    // Fetch user accounts to cross-reference connection status (CONNECTE vs NON_CONNECTE)
    let userStatusMap = new Map<string, "CONNECTE" | "NON_CONNECTE">();
    try {
      const supabase = getSupabaseAdminClient();
      const { data: orgUsers } = await supabase
        .from("users")
        .select("email, password_hash")
        .eq("organization_id", organizationId);

      for (const u of orgUsers || []) {
        if (u.email) {
          const isConnected = !!(u.password_hash && u.password_hash !== "NO_PASSWORD_SET");
          userStatusMap.set(u.email.toLowerCase().trim(), isConnected ? "CONNECTE" : "NON_CONNECTE");
        }
      }
    } catch (e) {
      console.warn("Could not fetch user connection statuses:", e);
    }

    const enrichedEmployees = employeesList.map((emp) => {
      const normEmail = emp.email ? emp.email.toLowerCase().trim() : "";
      const connectionStatus = normEmail ? (userStatusMap.get(normEmail) || "SANS_COMPTE") : "SANS_COMPTE";
      return {
        ...emp,
        connectionStatus,
      };
    });

    return NextResponse.json({ employees: enrichedEmployees });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { organizationId } = await requireTenantUser();
    const body = await req.json();

    const parseResult = employeeSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Données de l'employé invalides", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    // 1. Create employee in database
    const newEmp = await createEmployee(organizationId, parseResult.data);

    // 2. Automatically generate invitation link & send email ONLY IF createAccount is requested
    const shouldCreateAccount = body.createAccount !== false && Boolean(newEmp.email && newEmp.email.trim());
    let inviteLink = "";
    let emailSent = false;
    if (shouldCreateAccount) {
      const host = req.headers.get("host") || "localhost:3000";
      const protocol = host.includes("localhost") ? "http" : "https";
      const origin = `${protocol}://${host}`;

      const inviteResult = await sendEmployeeInvitation({
        organizationId,
        role: body.role,
        employee: {
          ...newEmp,
          email: newEmp.email!,
        },
        origin,
      });

      inviteLink = inviteResult.inviteLink;
      emailSent = inviteResult.emailSent;
    }

    return NextResponse.json({
      success: true,
      employee: {
        ...newEmp,
        connectionStatus: shouldCreateAccount ? "NON_CONNECTE" : "SANS_COMPTE",
      },
      inviteLink,
      emailSent,
    });
  } catch (err: any) {
    console.error("Error creating employee:", err);
    if (
      err?.message?.includes("déjà attribué") ||
      err?.message?.includes("déjà utilisé") ||
      err?.message?.includes("existe déjà")
    ) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err?.message && !err?.message?.includes("Supabase error")) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return handleApiError(err);
  }
}
