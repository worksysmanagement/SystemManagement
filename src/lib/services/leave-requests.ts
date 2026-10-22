import { getDb } from "@/lib/db/client";
import {
  leaveRequests,
  auditLogs,
  organizations,
  LeaveRequest,
  InsertLeaveRequest,
} from "@/db/schema";
import { eq, and, desc, sql, like, or } from "drizzle-orm";
import { generateSecureToken, hashToken, generateRequestNumber } from "@/lib/security/tokens";
import { SubmitLeaveRequestInput } from "@/lib/validation/schemas";
import { notifySecretaryNewRequest, notifyEmployeeDecision } from "@/lib/notifications/service";
import { supabaseDb } from "@/lib/supabase/db";

export interface CreateLeaveRequestResult {
  leaveRequest: LeaveRequest;
  rawAccessToken: string;
}

export async function createLeaveRequest(
  input: SubmitLeaveRequestInput,
  meta?: { ip?: string; userAgent?: string },
  dbInstance?: any
): Promise<CreateLeaveRequestResult> {
  if (!dbInstance) {
    const res = await supabaseDb.leaveRequests.create(input, meta);
    try {
      await notifySecretaryNewRequest(res.leaveRequest.id, res.rawAccessToken);
    } catch (_) {}
    return res;
  }
  const db = dbInstance || getDb();
  const now = Date.now();

  // 1. Verify organization is active
  const [org] = await db
    .select()
    .from(organizations)
    .where(and(eq(organizations.id, input.organizationId), eq(organizations.status, "ACTIVE")))
    .limit(1);

  if (!org) {
    throw new Error("Organisation introuvable ou inactive");
  }

  // 2. Count total global requests to generate globally unique request number
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(leaveRequests);
  let sequence = (countResult[0]?.count || 0) + 1;
  let requestNumber = generateRequestNumber(sequence);

  // Ensure unique requestNumber
  let [existing] = await db
    .select({ id: leaveRequests.id })
    .from(leaveRequests)
    .where(eq(leaveRequests.requestNumber, requestNumber))
    .limit(1);

  while (existing) {
    sequence += 1;
    requestNumber = generateRequestNumber(sequence);
    [existing] = await db
      .select({ id: leaveRequests.id })
      .from(leaveRequests)
      .where(eq(leaveRequests.requestNumber, requestNumber))
      .limit(1);
  }

  // 3. Generate random secure access token & calculate SHA-256 hash
  const rawAccessToken = generateSecureToken();
  const tokenHash = await hashToken(rawAccessToken);

  const newRequestId = `req-${crypto.randomUUID()}`;

  const insertData: InsertLeaveRequest = {
    id: newRequestId,
    organizationId: input.organizationId,
    requestNumber,
    firstName: input.firstName,
    lastName: input.lastName,
    employeeNumber: input.employeeNumber,
    department: input.department,
    position: input.position,
    leaveType: input.leaveType,
    leaveTypeOther: input.leaveTypeOther || null,
    startDate: input.startDate,
    endDate: input.endDate,
    requestedDays: input.requestedDays,
    replacementName: input.replacementName || null,
    contactPhone: input.contactPhone,
    contactEmail: input.contactEmail || null,
    status: "PENDING",
    employeeAccessTokenHash: tokenHash,
    ipAddress: meta?.ip || null,
    userAgent: meta?.userAgent || null,
    submittedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(leaveRequests).values(insertData);

  // 5. Create Audit Log
  await db.insert(auditLogs).values({
    id: `audit-${crypto.randomUUID()}`,
    organizationId: input.organizationId,
    userId: null, // Submitted by employee
    leaveRequestId: newRequestId,
    action: "SUBMITTED",
    oldStatus: null,
    newStatus: "PENDING",
    metadata: JSON.stringify({
      requestNumber,
      requestedDays: input.requestedDays,
      leaveType: input.leaveType,
    }),
    createdAt: now,
  });

  // 6. Asynchronously trigger secretary notification
  try {
    await notifySecretaryNewRequest(newRequestId, rawAccessToken, db);
  } catch (err) {
    console.error("Failed to notify secretary for request:", newRequestId, err);
  }

  const [created] = await db
    .select()
    .from(leaveRequests)
    .where(eq(leaveRequests.id, newRequestId))
    .limit(1);

  return {
    leaveRequest: created,
    rawAccessToken,
  };
}

/**
 * Public portal retrieval: finds leave request by employee raw token hash.
 * Never exposes internal tokens or secrets.
 */
export async function getLeaveRequestByToken(rawToken: string, dbInstance?: any) {
  if (!dbInstance) {
    return await supabaseDb.leaveRequests.getByToken(rawToken);
  }
  const db = dbInstance || getDb();
  const tokenHash = await hashToken(rawToken);

  const [req] = await db
    .select({
      id: leaveRequests.id,
      requestNumber: leaveRequests.requestNumber,
      firstName: leaveRequests.firstName,
      lastName: leaveRequests.lastName,
      department: leaveRequests.department,
      position: leaveRequests.position,
      leaveType: leaveRequests.leaveType,
      leaveTypeOther: leaveRequests.leaveTypeOther,
      startDate: leaveRequests.startDate,
      endDate: leaveRequests.endDate,
      requestedDays: leaveRequests.requestedDays,
      replacementName: leaveRequests.replacementName,
      status: leaveRequests.status,
      rejectionReason: leaveRequests.rejectionReason,
      submittedAt: leaveRequests.submittedAt,
      decidedAt: leaveRequests.decidedAt,
      createdAt: leaveRequests.createdAt,
      organizationName: organizations.name,
    })
    .from(leaveRequests)
    .innerJoin(organizations, eq(leaveRequests.organizationId, organizations.id))
    .where(
      or(
        eq(leaveRequests.employeeAccessTokenHash, tokenHash),
        eq(leaveRequests.employeeAccessTokenHash, rawToken)
      )
    )
    .limit(1);

  if (req && req.status === "APPROVED") {
    const [audit] = await db
      .select({ metadata: auditLogs.metadata })
      .from(auditLogs)
      .where(and(eq(auditLogs.leaveRequestId, req.id), eq(auditLogs.action, "APPROVED")))
      .orderBy(desc(auditLogs.createdAt))
      .limit(1);

    if (audit?.metadata) {
      try {
        const meta = JSON.parse(audit.metadata);
        (req as any).signatureUrl = meta.signatureUrl;
        (req as any).signerName = meta.signerName;
        (req as any).signerRole = meta.signerRole;
      } catch (_) {}
    }
  }

  return req || null;
}

/**
 * Tenant-scoped query for request details.
 */
export async function getLeaveRequestById(id: string, organizationId: string, dbInstance?: any) {
  if (!dbInstance) {
    return await supabaseDb.leaveRequests.getById(id);
  }
  const db = dbInstance || getDb();
  const [req] = await db
    .select()
    .from(leaveRequests)
    .where(and(eq(leaveRequests.id, id), eq(leaveRequests.organizationId, organizationId)))
    .limit(1);

  if (req && req.status === "APPROVED") {
    const [audit] = await db
      .select({ metadata: auditLogs.metadata })
      .from(auditLogs)
      .where(and(eq(auditLogs.leaveRequestId, req.id), eq(auditLogs.action, "APPROVED")))
      .orderBy(desc(auditLogs.createdAt))
      .limit(1);

    if (audit?.metadata) {
      try {
        const meta = JSON.parse(audit.metadata);
        (req as any).signatureUrl = meta.signatureUrl;
        (req as any).signerName = meta.signerName;
        (req as any).signerRole = meta.signerRole;
      } catch (_) {}
    }
  }

  return req || null;
}

/**
 * Tenant-scoped paginated request list with status and search filters.
 */
export async function listLeaveRequests(
  organizationId: string,
  options: {
    page?: number;
    limit?: number;
    status?: "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
    search?: string;
    employeeNumber?: string;
    contactEmail?: string;
  } = {},
  dbInstance?: any
) {
  if (!dbInstance) {
    const all = await supabaseDb.leaveRequests.list(organizationId, options);
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 10));
    const offset = (page - 1) * limit;
    const items = all.slice(offset, offset + limit);
    return {
      items,
      pagination: {
        page,
        limit,
        total: all.length,
        totalPages: Math.ceil(all.length / limit),
      },
    };
  }
  const db = dbInstance || getDb();
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 10));
  const offset = (page - 1) * limit;

  const conditions = [eq(leaveRequests.organizationId, organizationId)];

  if (options.status && options.status !== "ALL") {
    conditions.push(eq(leaveRequests.status, options.status));
  }

  if (options.employeeNumber) {
    conditions.push(eq(leaveRequests.employeeNumber, options.employeeNumber));
  }

  if (options.contactEmail) {
    conditions.push(like(leaveRequests.contactEmail, options.contactEmail));
  }

  if (options.search && options.search.trim().length > 0) {
    const q = `%${options.search.trim()}%`;
    conditions.push(
      or(
        like(leaveRequests.firstName, q),
        like(leaveRequests.lastName, q),
        like(leaveRequests.employeeNumber, q),
        like(leaveRequests.requestNumber, q),
        like(leaveRequests.department, q)
      )!
    );
  }

  const whereClause = and(...conditions);

  // Total count
  const [countRes] = await db
    .select({ total: sql<number>`count(*)` })
    .from(leaveRequests)
    .where(whereClause);
  const total = countRes?.total || 0;

  // Items
  const items = await db
    .select()
    .from(leaveRequests)
    .where(whereClause)
    .orderBy(desc(leaveRequests.submittedAt))
    .limit(limit)
    .offset(offset);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Atomic approval with double decision protection.
 */
export async function approveLeaveRequest(
  id: string,
  organizationId: string,
  userId: string,
  comment?: string,
  signatureDataOrDb?: {
    signatureUrl?: string;
    signerName?: string;
    signerRole?: string;
  } | any,
  dbInstance?: any
): Promise<{ success: boolean; leaveRequest: LeaveRequest }> {
  let signatureData: { signatureUrl?: string; signerName?: string; signerRole?: string } | undefined;
  let resolvedDb = dbInstance;

  if (signatureDataOrDb && (typeof signatureDataOrDb.select === "function" || typeof signatureDataOrDb.run === "function")) {
    resolvedDb = signatureDataOrDb;
  } else if (signatureDataOrDb) {
    signatureData = signatureDataOrDb;
  }

  if (!resolvedDb) {
    const updated = await supabaseDb.leaveRequests.approve(id, organizationId, userId, comment, signatureData);
    try {
      await notifyEmployeeDecision(id, updated.employeeAccessTokenHash);
    } catch (_) {}
    return { success: true, leaveRequest: updated };
  }
  const db = resolvedDb;
  const now = Date.now();

  // Strict atomic check: must belong to tenant AND status must be PENDING
  const updateResult = await db
    .update(leaveRequests)
    .set({
      status: "APPROVED",
      decidedAt: now,
      decidedBy: userId,
      decisionComment: comment || null,
      updatedAt: now,
    })
    .where(
      and(
        eq(leaveRequests.id, id),
        eq(leaveRequests.organizationId, organizationId),
        eq(leaveRequests.status, "PENDING")
      )
    )
    .returning();

  const updated = updateResult[0];
  if (!updated) {
    throw new Error("La demande n'est plus en attente ou n'a pas été trouvée");
  }

  // Audit log
  await db.insert(auditLogs).values({
    id: `audit-${crypto.randomUUID()}`,
    organizationId,
    userId,
    leaveRequestId: id,
    action: "APPROVED",
    oldStatus: "PENDING",
    newStatus: "APPROVED",
    metadata: JSON.stringify({
      comment,
      signatureUrl: signatureData?.signatureUrl,
      signerName: signatureData?.signerName,
      signerRole: signatureData?.signerRole,
    }),
    createdAt: now,
  });

  // Asynchronous employee notification
  try {
    await notifyEmployeeDecision(id, updated.employeeAccessTokenHash, db);
  } catch (err) {
    console.error("Notification failure after approval:", err);
  }

  return { success: true, leaveRequest: updated };
}

/**
 * Atomic rejection with mandatory reason and double decision protection.
 */
export async function rejectLeaveRequest(
  id: string,
  organizationId: string,
  userId: string,
  rejectionReason: string,
  comment?: string,
  dbInstance?: any
): Promise<{ success: boolean; leaveRequest: LeaveRequest }> {
  if (!rejectionReason || rejectionReason.trim().length < 3) {
    throw new Error("La raison du refus est obligatoire");
  }

  if (!dbInstance) {
    const updated = await supabaseDb.leaveRequests.reject(id, organizationId, userId, rejectionReason, comment);
    try {
      await notifyEmployeeDecision(id, updated.employeeAccessTokenHash);
    } catch (_) {}
    return { success: true, leaveRequest: updated };
  }

  const db = dbInstance || getDb();
  const now = Date.now();

  // Strict atomic check: must belong to tenant AND status must be PENDING
  const updateResult = await db
    .update(leaveRequests)
    .set({
      status: "REJECTED",
      rejectionReason: rejectionReason.trim(),
      decidedAt: now,
      decidedBy: userId,
      decisionComment: comment || null,
      updatedAt: now,
    })
    .where(
      and(
        eq(leaveRequests.id, id),
        eq(leaveRequests.organizationId, organizationId),
        eq(leaveRequests.status, "PENDING")
      )
    )
    .returning();

  const updated = updateResult[0];
  if (!updated) {
    throw new Error("La demande n'est plus en attente ou n'a pas été trouvée");
  }

  // Audit log
  await db.insert(auditLogs).values({
    id: `audit-${crypto.randomUUID()}`,
    organizationId,
    userId,
    leaveRequestId: id,
    action: "REJECTED",
    oldStatus: "PENDING",
    newStatus: "REJECTED",
    metadata: JSON.stringify({ rejectionReason, comment }),
    createdAt: now,
  });

  // Asynchronous employee notification
  try {
    await notifyEmployeeDecision(id, updated.employeeAccessTokenHash, db);
  } catch (err) {
    console.error("Notification failure after rejection:", err);
  }

  return { success: true, leaveRequest: updated };
}

export async function deleteLeaveRequest(id: string, organizationId: string): Promise<void> {
  const db = getDb();
  try {
    await db
      .delete(leaveRequests)
      .where(and(eq(leaveRequests.id, id), eq(leaveRequests.organizationId, organizationId)));
  } catch (_) {}
  await supabaseDb.leaveRequests.delete(id, organizationId);
}
