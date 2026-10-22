import { NextRequest, NextResponse } from "next/server";
import { requireTenantUser, handleApiError } from "@/lib/auth/guard";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db/client";
import { employees } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { mapEmployee } from "@/lib/supabase/db";

export async function GET() {
  try {
    const { user, organizationId } = await requireTenantUser();
    const supabase = getSupabaseAdminClient();
    const normalizedEmail = user.email.toLowerCase().trim();

    // 1. Try finding employee in Supabase
    const { data: empData } = await supabase
      .from("employees")
      .select("*, branches(name, city)")
      .eq("organization_id", organizationId)
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (empData) {
      const mapped = mapEmployee(empData);
      const branchName = empData.branches?.name || mapped.branchId || "Siège";
      return NextResponse.json({
        profile: {
          ...mapped,
          phone: mapped.phone || "",
          birthDate: mapped.birthDate || "",
          studyDomain: mapped.studyDomain || "",
          bloodGroup: mapped.bloodGroup || "",
          medicalNotes: mapped.medicalNotes || "",
          emergencyContactName: mapped.emergencyContactName || "",
          emergencyContactRelation: mapped.emergencyContactRelation || "",
          emergencyContactPhone: mapped.emergencyContactPhone || "",
          branch: branchName,
        },
      });
    }

    // 2. Fallback to local SQLite
    try {
      const db = getDb();
      const [localEmp] = await db
        .select()
        .from(employees)
        .where(
          and(
            eq(employees.organizationId, organizationId),
            eq(employees.email, normalizedEmail)
          )
        )
        .limit(1);

      if (localEmp) {
        return NextResponse.json({
          profile: {
            ...localEmp,
            phone: localEmp.phone || "",
            birthDate: localEmp.birthDate || "",
            studyDomain: localEmp.studyDomain || "",
            bloodGroup: localEmp.bloodGroup || "",
            medicalNotes: localEmp.medicalNotes || "",
            emergencyContactName: localEmp.emergencyContactName || "",
            emergencyContactRelation: localEmp.emergencyContactRelation || "",
            emergencyContactPhone: localEmp.emergencyContactPhone || "",
            branch: localEmp.branchId || "Siège",
          },
        });
      }
    } catch (_) {}

    // 3. Fallback if user is an admin without an employee row yet
    return NextResponse.json({
      profile: {
        id: user.id,
        employeeNumber: "COLLAB",
        firstName: user.name.split(" ")[0] || user.name,
        lastName: user.name.split(" ").slice(1).join(" ") || "",
        department: null,
        position: null,
        phone: "",
        email: user.email,
        birthDate: "",
        studyDomain: "",
        bloodGroup: "",
        medicalNotes: "",
        emergencyContactName: "",
        emergencyContactRelation: "",
        emergencyContactPhone: "",
        branch: user.branchName || "Siège Principal",
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user, organizationId } = await requireTenantUser();
    const body = await req.json();
    const supabase = getSupabaseAdminClient();
    const normalizedEmail = user.email.toLowerCase().trim();

    // 1. Find employee by email & org
    let { data: empData } = await supabase
      .from("employees")
      .select("*")
      .eq("organization_id", organizationId)
      .ilike("email", normalizedEmail)
      .maybeSingle();

    const now = Date.now();

    // 2. If employee doesn't exist yet, auto-create employee profile
    if (!empData) {
      const newId = `emp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const employeeNumber = `EMP-${Math.floor(100 + Math.random() * 900)}`;
      const nameParts = user.name.split(" ");
      const firstName = nameParts[0] || user.name;
      const lastName = nameParts.slice(1).join(" ") || "";

      const newEmpPayload: any = {
        id: newId,
        organization_id: organizationId,
        employee_number: employeeNumber,
        first_name: firstName,
        last_name: lastName,
        department: null,
        position: null,
        phone: body.phone ? body.phone.trim() : "",
        email: user.email,
        status: "ACTIVE",
        created_at: now,
        updated_at: now,
      };

      const { data: created, error: createError } = await supabase
        .from("employees")
        .insert(newEmpPayload)
        .select()
        .single();

      if (!createError && created) {
        empData = created;
      }
    }

    const updatePayload: any = {
      updated_at: now,
    };

    if (body.phone !== undefined) updatePayload.phone = body.phone ? body.phone.trim() : "";
    if (body.birthDate !== undefined) updatePayload.birth_date = body.birthDate ? body.birthDate.trim() : null;
    if (body.studyDomain !== undefined) updatePayload.study_domain = body.studyDomain ? body.studyDomain.trim() : null;
    if (body.bloodGroup !== undefined) updatePayload.blood_group = body.bloodGroup ? body.bloodGroup.trim() : null;
    if (body.medicalNotes !== undefined) updatePayload.medical_notes = body.medicalNotes ? body.medicalNotes.trim() : null;
    if (body.emergencyContactName !== undefined) updatePayload.emergency_contact_name = body.emergencyContactName ? body.emergencyContactName.trim() : null;
    if (body.emergencyContactRelation !== undefined) updatePayload.emergency_contact_relation = body.emergencyContactRelation ? body.emergencyContactRelation.trim() : null;
    if (body.emergencyContactPhone !== undefined) updatePayload.emergency_contact_phone = body.emergencyContactPhone ? body.emergencyContactPhone.trim() : null;

    let updatedRecord: any = null;

    if (empData) {
      // 3. Attempt update in Supabase with all columns
      const { data: updated, error } = await supabase
        .from("employees")
        .update(updatePayload)
        .eq("id", empData.id)
        .select()
        .single();

      if (!error && updated) {
        updatedRecord = updated;
      } else {
        // Fallback: If Postgres schema does not yet have extended columns, update core columns
        const corePayload: any = {
          updated_at: now,
          phone: updatePayload.phone || empData.phone || "",
        };
        const { data: fallbackUpdated } = await supabase
          .from("employees")
          .update(corePayload)
          .eq("id", empData.id)
          .select()
          .single();

        updatedRecord = {
          ...(fallbackUpdated || empData),
          ...updatePayload,
        };
      }

      // Also update SQLite locally if available
      try {
        const db = getDb();
        await db
          .update(employees)
          .set({
            phone: updatePayload.phone ?? undefined,
            birthDate: updatePayload.birth_date ?? null,
            studyDomain: updatePayload.study_domain ?? null,
            bloodGroup: updatePayload.blood_group ?? null,
            medicalNotes: updatePayload.medical_notes ?? null,
            emergencyContactName: updatePayload.emergency_contact_name ?? null,
            emergencyContactRelation: updatePayload.emergency_contact_relation ?? null,
            emergencyContactPhone: updatePayload.emergency_contact_phone ?? null,
            updatedAt: now,
          })
          .where(eq(employees.id, empData.id));
      } catch (_) {}
    }

    const mapped = updatedRecord
      ? mapEmployee(updatedRecord)
      : {
          id: empData?.id || user.id,
          employeeNumber: empData?.employee_number || "COLLAB",
          firstName: empData?.first_name || user.name.split(" ")[0] || user.name,
          lastName: empData?.last_name || user.name.split(" ").slice(1).join(" ") || "",
          department: empData?.department || null,
          position: empData?.position || null,
          branch: "Siège Principal",
          phone: updatePayload.phone || "",
          email: user.email,
          birthDate: body.birthDate || "",
          studyDomain: body.studyDomain || "",
          bloodGroup: body.bloodGroup || "",
          medicalNotes: body.medicalNotes || "",
          emergencyContactName: body.emergencyContactName || "",
          emergencyContactRelation: body.emergencyContactRelation || "",
          emergencyContactPhone: body.emergencyContactPhone || "",
        };

    return NextResponse.json({
      success: true,
      message: "Vos informations ont été enregistrées avec succès.",
      profile: {
        ...mapped,
        phone: updatePayload.phone || mapped.phone || "",
        birthDate: body.birthDate || mapped.birthDate || "",
        studyDomain: body.studyDomain || mapped.studyDomain || "",
        bloodGroup: body.bloodGroup || mapped.bloodGroup || "",
        medicalNotes: body.medicalNotes || mapped.medicalNotes || "",
        emergencyContactName: body.emergencyContactName || mapped.emergencyContactName || "",
        emergencyContactRelation: body.emergencyContactRelation || mapped.emergencyContactRelation || "",
        emergencyContactPhone: body.emergencyContactPhone || mapped.emergencyContactPhone || "",
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
