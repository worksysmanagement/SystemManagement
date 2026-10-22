import { getDb } from "@/lib/db/client";
import { auditLogs, notificationLogs, users, leaveRequests } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function getAuditLogsForRequest(
  leaveRequestId: string,
  organizationId: string,
  dbInstance?: any
) {
  if (!dbInstance) {
    const supabase = getSupabaseAdminClient();
    const { data: logs } = await supabase
      .from("audit_logs")
      .select("id, action, old_status, new_status, metadata, created_at, user_id")
      .eq("leave_request_id", leaveRequestId)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    const augmentedLogs = await Promise.all(
      (logs || []).map(async (l) => {
        let userName = null;
        if (l.user_id) {
          const { data: u } = await supabase.from("users").select("name").eq("id", l.user_id).maybeSingle();
          userName = u?.name || null;
        }
        return {
          id: l.id,
          action: l.action,
          oldStatus: l.old_status,
          newStatus: l.new_status,
          metadata: l.metadata,
          createdAt: Number(l.created_at),
          userName,
        };
      })
    );

    const { data: notifs } = await supabase
      .from("notification_logs")
      .select("*")
      .eq("leave_request_id", leaveRequestId)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    return {
      auditLogs: augmentedLogs,
      notifications: notifs || [],
    };
  }

  const db = dbInstance || getDb();

  const logs = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      oldStatus: auditLogs.oldStatus,
      newStatus: auditLogs.newStatus,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
      userName: users.name,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(
      and(
        eq(auditLogs.leaveRequestId, leaveRequestId),
        eq(auditLogs.organizationId, organizationId)
      )
    )
    .orderBy(desc(auditLogs.createdAt));

  const notifs = await db
    .select()
    .from(notificationLogs)
    .where(
      and(
        eq(notificationLogs.leaveRequestId, leaveRequestId),
        eq(notificationLogs.organizationId, organizationId)
      )
    )
    .orderBy(desc(notificationLogs.createdAt));

  return {
    auditLogs: logs,
    notifications: notifs,
  };
}

export async function getTenantDashboardMetrics(organizationId: string, dbInstance?: any) {
  if (!dbInstance) {
    const supabase = getSupabaseAdminClient();
    const { count: total } = await supabase
      .from("leave_requests")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId);

    const { count: pending } = await supabase
      .from("leave_requests")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "PENDING");

    const { count: approved } = await supabase
      .from("leave_requests")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "APPROVED");

    const { count: rejected } = await supabase
      .from("leave_requests")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "REJECTED");

    return {
      total: total ?? 0,
      pending: pending ?? 0,
      approved: approved ?? 0,
      rejected: rejected ?? 0,
    };
  }

  const db = dbInstance || getDb();

  const [totalRes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(leaveRequests)
    .where(eq(leaveRequests.organizationId, organizationId));

  const [pendingRes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(leaveRequests)
    .where(
      and(
        eq(leaveRequests.organizationId, organizationId),
        eq(leaveRequests.status, "PENDING")
      )
    );

  const [approvedRes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(leaveRequests)
    .where(
      and(
        eq(leaveRequests.organizationId, organizationId),
        eq(leaveRequests.status, "APPROVED")
      )
    );

  const [rejectedRes] = await db
    .select({ count: sql<number>`count(*)` })
    .from(leaveRequests)
    .where(
      and(
        eq(leaveRequests.organizationId, organizationId),
        eq(leaveRequests.status, "REJECTED")
      )
    );

  return {
    total: totalRes?.count || 0,
    pending: pendingRes?.count || 0,
    approved: approvedRes?.count || 0,
    rejected: rejectedRes?.count || 0,
  };
}
