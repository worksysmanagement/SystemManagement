import { NextRequest, NextResponse } from "next/server";
import { requireTenantUser, handleApiError } from "@/lib/auth/guard";
import { getBranchById, updateBranch, deleteBranch } from "@/lib/services/branches";
import { branchSchema } from "@/lib/validation/schemas";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await requireTenantUser();
    const { id } = await params;

    const branch = await getBranchById(organizationId, id);
    if (!branch) {
      return NextResponse.json({ error: "Succursale introuvable" }, { status: 404 });
    }

    return NextResponse.json({ branch });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await requireTenantUser();
    const { id } = await params;
    const body = await req.json();

    const parseResult = branchSchema.partial().safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Données de la succursale invalides", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const updated = await updateBranch(organizationId, id, parseResult.data);
    return NextResponse.json({ success: true, branch: updated });
  } catch (err) {
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

    await deleteBranch(organizationId, id);
    return NextResponse.json({ success: true, message: "Succursale supprimée avec succès" });
  } catch (err) {
    return handleApiError(err);
  }
}
