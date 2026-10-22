import { NextRequest, NextResponse } from "next/server";
import { requireTenantUser, handleApiError } from "@/lib/auth/guard";
import { updateOrgRole, deleteOrgRole } from "@/lib/services/roles";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await requireTenantUser();
    const { id } = await params;
    const body = await req.json();

    const updated = await updateOrgRole(organizationId, id, {
      name: body.name,
      description: body.description,
      hierarchyLevel: body.hierarchyLevel,
      permissions: body.permissions,
    });

    return NextResponse.json({ success: true, role: updated });
  } catch (err: any) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await requireTenantUser();
    const { id } = await params;

    await deleteOrgRole(organizationId, id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return handleApiError(err);
  }
}
