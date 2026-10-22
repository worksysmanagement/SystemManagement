import { NextRequest, NextResponse } from "next/server";
import { requireTenantUser, handleApiError } from "@/lib/auth/guard";
import { listOrgRoles, createOrgRole } from "@/lib/services/roles";

export async function GET() {
  try {
    const { organizationId } = await requireTenantUser();
    const roles = await listOrgRoles(organizationId);
    return NextResponse.json({ roles });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { organizationId } = await requireTenantUser();
    const body = await req.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: "Le nom du rôle est obligatoire." },
        { status: 400 }
      );
    }

    if (!body.permissions || typeof body.permissions !== "object") {
      return NextResponse.json(
        { error: "La matrice des permissions est obligatoire." },
        { status: 400 }
      );
    }

    const createdRole = await createOrgRole(organizationId, {
      name: body.name,
      description: body.description,
      hierarchyLevel: body.hierarchyLevel || "OPERATIONAL",
      permissions: body.permissions,
    });

    return NextResponse.json({ success: true, role: createdRole });
  } catch (err) {
    return handleApiError(err);
  }
}
