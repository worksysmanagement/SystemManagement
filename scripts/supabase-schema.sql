-- ====================================================
-- SUPABASE POSTGRESQL SCHEMA — SYSTEM MANAGEMENT
-- ====================================================

-- 1. Table: Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- 2. Table: Users
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- 3. Table: Employees
CREATE TABLE IF NOT EXISTS public.employees (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_number TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- 4. Table: Leave Requests
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id TEXT REFERENCES public.employees(id) ON DELETE SET NULL,
  request_number TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  employee_number TEXT NOT NULL,
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  leave_type TEXT NOT NULL,
  leave_type_other TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  requested_days INTEGER NOT NULL,
  replacement_name TEXT,
  contact_phone TEXT NOT NULL,
  contact_email TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  employee_access_token_hash TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  submitted_at BIGINT NOT NULL,
  decided_at BIGINT,
  decided_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  decision_comment TEXT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- 5. Table: Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id TEXT,
  leave_request_id TEXT REFERENCES public.leave_requests(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  metadata TEXT,
  created_at BIGINT NOT NULL
);

-- 6. Table: Notification Logs
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  leave_request_id TEXT REFERENCES public.leave_requests(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  recipient TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  status TEXT NOT NULL,
  provider_message_id TEXT,
  error_message TEXT,
  sent_at BIGINT,
  created_at BIGINT NOT NULL
);

-- ====================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ====================================================

CREATE UNIQUE INDEX IF NOT EXISTS org_slug_idx ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS org_status_idx ON public.organizations(status);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON public.users(email);
CREATE INDEX IF NOT EXISTS users_org_idx ON public.users(organization_id);
CREATE INDEX IF NOT EXISTS users_role_idx ON public.users(role);
CREATE INDEX IF NOT EXISTS emp_org_idx ON public.employees(organization_id);
CREATE INDEX IF NOT EXISTS emp_org_num_idx ON public.employees(organization_id, employee_number);
CREATE UNIQUE INDEX IF NOT EXISTS leave_req_num_idx ON public.leave_requests(request_number);
CREATE UNIQUE INDEX IF NOT EXISTS leave_token_hash_idx ON public.leave_requests(employee_access_token_hash);
CREATE INDEX IF NOT EXISTS leave_org_idx ON public.leave_requests(organization_id);
CREATE INDEX IF NOT EXISTS leave_org_status_idx ON public.leave_requests(organization_id, status);
CREATE INDEX IF NOT EXISTS audit_org_idx ON public.audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS audit_req_idx ON public.audit_logs(leave_request_id);
CREATE INDEX IF NOT EXISTS notif_org_idx ON public.notification_logs(organization_id);
CREATE INDEX IF NOT EXISTS notif_req_idx ON public.notification_logs(leave_request_id);
