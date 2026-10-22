import { NextRequest, NextResponse } from "next/server";
import { requireTenantUser, handleApiError } from "@/lib/auth/guard";
import { getEmployeeById } from "@/lib/services/employees";
import { sendEmployeeInvitation } from "@/lib/services/employee-invitations";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { organizationId } = await requireTenantUser();
    const { id } = await context.params;

    const employee = await getEmployeeById(organizationId, id);
    if (!employee) {
      return NextResponse.json(
        { error: "Employé introuvable dans votre entreprise." },
        { status: 404 }
      );
    }

    const body = await req.json().catch(() => ({}));
    let targetEmail = (body.email || employee.email || "").trim().toLowerCase();

    if (!targetEmail || !targetEmail.includes("@")) {
      return NextResponse.json(
        { error: "Une adresse e-mail valide est requise pour créer le compte et envoyer l'invitation." },
        { status: 400 }
      );
    }

    // If the employee didn't have an email in DB or it changed, update it
    if (employee.email !== targetEmail) {
      const { updateEmployee } = await import("@/lib/services/employees");
      await updateEmployee(organizationId, id, { email: targetEmail });
      employee.email = targetEmail;
    }

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const origin = `${protocol}://${host}`;

    const inviteResult = await sendEmployeeInvitation({
      organizationId,
      role: body.role,
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        employeeNumber: employee.employeeNumber,
        branchId: employee.branchId,
        department: employee.department,
        position: employee.position,
        phone: employee.phone,
        email: targetEmail,
      },
      origin,
    });

    if (!inviteResult.success) {
      return NextResponse.json(
        { error: inviteResult.error || "Impossible de générer le lien d'invitation." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: inviteResult.emailSent
        ? `L'invitation a été envoyée avec succès à ${employee.email}.`
        : `Lien généré. Note : l'e-mail n'a pas pu partir immédiatement, veuillez copier le lien direct pour le partager.`,
      inviteLink: inviteResult.inviteLink,
      emailSent: inviteResult.emailSent,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
