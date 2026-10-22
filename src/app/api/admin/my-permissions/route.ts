import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { listOrgRoles } from "@/lib/services/roles";
import { ALL_ALLOWED_PERMS, TabPermission, ModuleKey } from "@/lib/types/roles";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  // Super Admin and Organization Admin have full permissions by design
  if (session.role === "SUPER_ADMIN" || session.role === "ORGANIZATION_ADMIN") {
    return NextResponse.json({
      role: session.role,
      roleName: session.role === "SUPER_ADMIN" ? "Super Administrateur" : "PDG / Propriétaire",
      permissions: ALL_ALLOWED_PERMS,
    });
  }

  // If organization user, find their configured role permissions from DB
  if (session.organizationId) {
    try {
      const roles = await listOrgRoles(session.organizationId);
      const userRole = (session.role || "").toUpperCase();

      const matched = roles.find((r) => {
        const rName = r.name.toUpperCase();
        const rId = r.id.toUpperCase();
        if (userRole === "EMPLOYEE" || userRole === "COLLABORATEUR") {
          return (
            rId === "ROLE-EMPLOYEE" ||
            rName.includes("COLLABORATEUR") ||
            rName.includes("EMPLOYÉ") ||
            rName.includes("EMPLOYE")
          );
        }
        if (userRole === "SECRETARY") {
          return (
            rId === "ROLE-SECRETARY" ||
            rName.includes("SECRÉTAIRE") ||
            rName.includes("SECRETAIRE")
          );
        }
        if (userRole === "FINANCIAL_MANAGER") {
          return (
            rId === "ROLE-FINANCE" ||
            rName.includes("FINANCIER") ||
            rName.includes("COMPTABLE")
          );
        }
        if (userRole === "BRANCH_MANAGER") {
          return rId === "ROLE-BRANCH-MGR" || rName.includes("SUCCURSALE");
        }
        return (
          r.id.toLowerCase() === session.role.toLowerCase() ||
          r.name.toLowerCase() === session.role.toLowerCase()
        );
      });

      if (matched && matched.permissions) {
        return NextResponse.json({
          role: session.role,
          roleId: matched.id,
          roleName: matched.name,
          permissions: matched.permissions,
        });
      }
    } catch (_) {}
  }

  // Default permissions for EMPLOYEE when no custom override is set
  const defaultEmployeePermissions: Record<ModuleKey, TabPermission> = {
    dashboard: { view: false, create: false, edit: false, delete: false },
    requests: { view: true, create: true, edit: true, delete: false },
    employees: { view: false, create: false, edit: false, delete: false },
    branches: { view: false, create: false, edit: false, delete: false },
    financial_ops: { view: false, create: false, edit: false, delete: false },
    financial_reports: { view: false, create: false, edit: false, delete: false },
    events: { view: true, create: false, edit: false, delete: false },
    customer_space: { view: false, create: false, edit: false, delete: false },
    users: { view: false, create: false, edit: false, delete: false },
    notifications: { view: true, create: false, edit: false, delete: false },
    configuration: { view: true, create: false, edit: true, delete: false },
  };

  return NextResponse.json({
    role: session.role,
    roleName: session.role === "EMPLOYEE" ? "Collaborateur / Employé" : session.role,
    permissions: session.role === "EMPLOYEE" ? defaultEmployeePermissions : null,
  });
}
