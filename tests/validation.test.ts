import { describe, it, expect } from "vitest";
import {
  submitLeaveRequestSchema,
  createOrganizationSchema,
  loginSchema,
  rejectLeaveRequestSchema,
} from "../src/lib/validation/schemas";
import {
  getNextMatriculeSequence,
  generateEmployeeMatricule,
} from "../src/lib/utils/matricule";

describe("Zod Validation Schemas Test Suite", () => {
  it("Validates successful leave request input", () => {
    const valid = {
      organizationId: "org-1",
      firstName: "Jean",
      lastName: "Dupont",
      employeeNumber: "EMP-042",
      department: "Informatique",
      position: "Ingénieur",
      leaveType: "ANNUAL",
      startDate: "2026-10-10",
      endDate: "2026-10-15",
      requestedDays: 6,
      contactPhone: "+225 0700000000",
      contactEmail: "jean@example.com",
    };

    const res = submitLeaveRequestSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it("Rejects leave request when endDate is before startDate", () => {
    const invalid = {
      organizationId: "org-1",
      firstName: "Jean",
      lastName: "Dupont",
      employeeNumber: "EMP-042",
      department: "Informatique",
      position: "Ingénieur",
      leaveType: "ANNUAL",
      startDate: "2026-10-15",
      endDate: "2026-10-10", // Invalid!
      requestedDays: 1,
      contactPhone: "+225 0700000000",
    };

    const res = submitLeaveRequestSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it("Requires leaveTypeOther when leaveType is OTHER", () => {
    const missingOther = {
      organizationId: "org-1",
      firstName: "Jean",
      lastName: "Dupont",
      employeeNumber: "EMP-042",
      department: "Informatique",
      position: "Ingénieur",
      leaveType: "OTHER",
      leaveTypeOther: "", // Empty!
      startDate: "2026-10-10",
      endDate: "2026-10-15",
      requestedDays: 6,
      contactPhone: "+225 0700000000",
    };

    const res = submitLeaveRequestSchema.safeParse(missingOther);
    expect(res.success).toBe(false);

    const withOther = {
      ...missingOther,
      leaveTypeOther: "Formation professionnelle",
    };
    expect(submitLeaveRequestSchema.safeParse(withOther).success).toBe(true);
  });

  it("Validates rejection requires reason with minimum length", () => {
    expect(rejectLeaveRequestSchema.safeParse({ rejectionReason: "" }).success).toBe(false);
    expect(rejectLeaveRequestSchema.safeParse({ rejectionReason: "No" }).success).toBe(false);
    expect(
      rejectLeaveRequestSchema.safeParse({
        rejectionReason: "Effectif insuffisant sur la période demandée",
      }).success
    ).toBe(true);
  });

  it("Validates organization creation and slug formatting", () => {
    const valid = {
      name: "Entreprise Alpha",
      slug: "entreprise-alpha",
      adminName: "Admin User",
      adminEmail: "admin@alpha.com",
      adminPassword: "Password123!",
    };

    expect(createOrganizationSchema.safeParse(valid).success).toBe(true);

    const invalidSlug = {
      ...valid,
      slug: "ENTREPRISE ALPHA!!", // Spaces and uppercase not allowed
    };
    expect(createOrganizationSchema.safeParse(invalidSlug).success).toBe(false);
  });

  it("Increments employee matricule sequentially and prevents duplicates", () => {
    // 1. Initial state: starts at 001
    expect(getNextMatriculeSequence([])).toBe("001");
    expect(generateEmployeeMatricule("e-biznis", "SIEGE", getNextMatriculeSequence([]))).toBe("EB-SIEGE-001");

    // 2. Increment: 001 exists -> 002
    expect(getNextMatriculeSequence(["EB-SIEGE-001"])).toBe("002");
    expect(generateEmployeeMatricule("e-biznis", "SIEGE", getNextMatriculeSequence(["EB-SIEGE-001"]))).toBe("EB-SIEGE-002");

    // 3. Multi-increment: 001, 002 exist -> 003
    expect(getNextMatriculeSequence(["EB-SIEGE-001", "EB-SIEGE-002"])).toBe("003");

    // 4. Safe against legacy random matricules: with EB-SIEGE-884, allocates 001
    expect(getNextMatriculeSequence(["EB-SIEGE-884"])).toBe("001");

    // 5. When 001 and legacy 884 exist, allocates 002 without collision
    expect(getNextMatriculeSequence(["EB-SIEGE-001", "EB-SIEGE-884"])).toBe("002");
  });
});
