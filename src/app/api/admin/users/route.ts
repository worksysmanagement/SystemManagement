import { NextRequest, NextResponse } from "next/server";
import { requireOrgAdmin, requireTenantUser, handleApiError } from "@/lib/auth/guard";
import { listOrgUsers, createOrgUser } from "@/lib/services/users";
import { createOrgUserSchema } from "@/lib/validation/schemas";

export async function GET() {
  try {
    const { organizationId } = await requireTenantUser();
    const usersList = await listOrgUsers(organizationId);
    return NextResponse.json({ users: usersList });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { organizationId } = await requireOrgAdmin();
    const body = await req.json();

    const parseResult = createOrgUserSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Données de l'utilisateur invalides", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const newUser = await createOrgUser(organizationId, parseResult.data);
    return NextResponse.json({ success: true, user: newUser });
  } catch (err: any) {
    if (err?.message?.includes("déjà utilisée")) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return handleApiError(err);
  }
}
