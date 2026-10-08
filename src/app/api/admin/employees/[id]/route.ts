import { NextRequest, NextResponse } from "next/server";
import { requireTenantUser, handleApiError } from "@/lib/auth/guard";
import { updateEmployee, deleteEmployee, getEmployeeById } from "@/lib/services/employees";
import { employeeSchema } from "@/lib/validation/schemas";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await requireTenantUser();
    const { id } = await params;

    const emp = await getEmployeeById(organizationId, id);
    if (!emp) {
      return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });
    }

    return NextResponse.json({ employee: emp });
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

    const parseResult = employeeSchema.partial().safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Données de mise à jour invalides", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const updated = await updateEmployee(organizationId, id, parseResult.data);
    return NextResponse.json({ success: true, employee: updated });
  } catch (err: any) {
    if (err?.message?.includes("déjà utilisé")) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return handleApiError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await requireTenantUser();
    const { id } = await params;

    await deleteEmployee(organizationId, id);
    return NextResponse.json({ success: true, message: "Employé supprimé avec succès" });
  } catch (err) {
    return handleApiError(err);
  }
}
