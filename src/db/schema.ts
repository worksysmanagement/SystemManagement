import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ----------------------------------------------------
// ORGANIZATIONS (Tenants)
// ----------------------------------------------------
export const organizations = sqliteTable(
  "organizations",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logoUrl: text("logo_url"),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    status: text("status", { enum: ["ACTIVE", "DISABLED"] }).notNull().default("ACTIVE"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("org_slug_idx").on(table.slug),
    index("org_status_idx").on(table.status),
  ]
);

// ----------------------------------------------------
// USERS (SUPER_ADMIN, ORGANIZATION_ADMIN, SECRETARY)
// ----------------------------------------------------
export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").references(() => organizations.id),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: text("role", { enum: ["SUPER_ADMIN", "ORGANIZATION_ADMIN", "SECRETARY"] }).notNull(),
    status: text("status", { enum: ["ACTIVE", "DISABLED"] }).notNull().default("ACTIVE"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("users_email_idx").on(table.email),
    index("users_org_idx").on(table.organizationId),
    index("users_role_idx").on(table.role),
  ]
);

// ----------------------------------------------------
// EMPLOYEES
// ----------------------------------------------------
export const employees = sqliteTable(
  "employees",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id),
    employeeNumber: text("employee_number").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    department: text("department").notNull(),
    position: text("position").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    status: text("status", { enum: ["ACTIVE", "INACTIVE"] }).notNull().default("ACTIVE"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("emp_org_idx").on(table.organizationId),
    index("emp_org_num_idx").on(table.organizationId, table.employeeNumber),
  ]
);

// ----------------------------------------------------
// LEAVE REQUESTS (All employee & leave details captured directly)
// ----------------------------------------------------
export const leaveRequests = sqliteTable(
  "leave_requests",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id),
    employeeId: text("employee_id").references(() => employees.id),
    requestNumber: text("request_number").notNull().unique(), // e.g. CONG-2026-0001
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    employeeNumber: text("employee_number").notNull(),
    department: text("department").notNull(),
    position: text("position").notNull(),
    leaveType: text("leave_type", {
      enum: ["ANNUAL", "SICK", "UNPAID", "MATERNITY_PATERNITY", "OTHER"],
    }).notNull(),
    leaveTypeOther: text("leave_type_other"),
    startDate: text("start_date").notNull(), // ISO YYYY-MM-DD
    endDate: text("end_date").notNull(),     // ISO YYYY-MM-DD
    requestedDays: integer("requested_days").notNull(),
    replacementName: text("replacement_name"),
    contactPhone: text("contact_phone").notNull(),
    contactEmail: text("contact_email"),
    status: text("status", {
      enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"],
    })
      .notNull()
      .default("PENDING"),
    employeeAccessTokenHash: text("employee_access_token_hash").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    submittedAt: integer("submitted_at").notNull(),
    decidedAt: integer("decided_at"),
    decidedBy: text("decided_by").references(() => users.id),
    rejectionReason: text("rejection_reason"),
    decisionComment: text("decision_comment"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("leave_req_num_idx").on(table.requestNumber),
    uniqueIndex("leave_token_hash_idx").on(table.employeeAccessTokenHash),
    index("leave_org_idx").on(table.organizationId),
    index("leave_org_status_idx").on(table.organizationId, table.status),
    index("leave_created_idx").on(table.createdAt),
  ]
);

// ----------------------------------------------------
// AUDIT LOGS
// ----------------------------------------------------
export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id),
    userId: text("user_id"), // null if public action / system
    leaveRequestId: text("leave_request_id").references(() => leaveRequests.id),
    action: text("action", {
      enum: [
        "SUBMITTED",
        "VIEWED",
        "APPROVED",
        "REJECTED",
        "CANCELLED",
        "NOTIFICATION_SENT",
        "NOTIFICATION_FAILED",
      ],
    }).notNull(),
    oldStatus: text("old_status"),
    newStatus: text("new_status"),
    metadata: text("metadata"), // JSON stringified
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    index("audit_org_idx").on(table.organizationId),
    index("audit_req_idx").on(table.leaveRequestId),
    index("audit_created_idx").on(table.createdAt),
  ]
);

// ----------------------------------------------------
// NOTIFICATION LOGS
// ----------------------------------------------------
export const notificationLogs = sqliteTable(
  "notification_logs",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id),
    leaveRequestId: text("leave_request_id").references(() => leaveRequests.id),
    channel: text("channel", { enum: ["EMAIL", "WHATSAPP"] }).notNull(),
    recipient: text("recipient").notNull(),
    notificationType: text("notification_type", {
      enum: ["NEW_REQUEST", "REQUEST_APPROVED", "REQUEST_REJECTED"],
    }).notNull(),
    status: text("status", { enum: ["SENT", "FAILED"] }).notNull(),
    providerMessageId: text("provider_message_id"),
    errorMessage: text("error_message"),
    sentAt: integer("sent_at"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    index("notif_org_idx").on(table.organizationId),
    index("notif_req_idx").on(table.leaveRequestId),
    index("notif_status_idx").on(table.status),
    index("notif_created_idx").on(table.createdAt),
  ]
);

// ----------------------------------------------------
// RELATIONS
// ----------------------------------------------------
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  employees: many(employees),
  leaveRequests: many(leaveRequests),
  auditLogs: many(auditLogs),
  notificationLogs: many(notificationLogs),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [employees.organizationId],
    references: [organizations.id],
  }),
  leaveRequests: many(leaveRequests),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  decisions: many(leaveRequests),
}));

export const leaveRequestsRelations = relations(leaveRequests, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [leaveRequests.organizationId],
    references: [organizations.id],
  }),
  employee: one(employees, {
    fields: [leaveRequests.employeeId],
    references: [employees.id],
  }),
  decidedByUser: one(users, {
    fields: [leaveRequests.decidedBy],
    references: [users.id],
  }),
  auditLogs: many(auditLogs),
  notificationLogs: many(notificationLogs),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [auditLogs.organizationId],
    references: [organizations.id],
  }),
  leaveRequest: one(leaveRequests, {
    fields: [auditLogs.leaveRequestId],
    references: [leaveRequests.id],
  }),
}));

export const notificationLogsRelations = relations(notificationLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [notificationLogs.organizationId],
    references: [organizations.id],
  }),
  leaveRequest: one(leaveRequests, {
    fields: [notificationLogs.leaveRequestId],
    references: [leaveRequests.id],
  }),
}));

// Export types
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = typeof leaveRequests.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

export type NotificationLog = typeof notificationLogs.$inferSelect;
export type InsertNotificationLog = typeof notificationLogs.$inferInsert;
