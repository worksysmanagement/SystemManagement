import { NextRequest, NextResponse } from "next/server";
import { requireTenantUser, handleApiError } from "@/lib/auth/guard";
import { listBranches, createBranch } from "@/lib/services/branches";
import { getOrganizationById } from "@/lib/services/organizations";

export async function GET(req: NextRequest) {
  try {
    const { organizationId } = await requireTenantUser();
    const [branchesList, org] = await Promise.all([
      listBranches(organizationId),
      getOrganizationById(organizationId),
    ]);
    return NextResponse.json({
      branches: branchesList,
      organization: org
        ? {
            id: org.id,
            name: org.name,
            phone: org.phone,
            address: org.address,
            email: org.email,
          }
        : null,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { organizationId } = await requireTenantUser();
    const body = await req.json();

    if (!body.code || !body.name || !body.city) {
      return NextResponse.json(
        { error: "Le code, le nom et la ville sont obligatoires." },
        { status: 400 }
      );
    }

    const newBranch = await createBranch(organizationId, body);
    return NextResponse.json({ success: true, branch: newBranch });
  } catch (err) {
    return handleApiError(err);
  }
}
