-- ====================================================
-- CLOUDFLARE D1 SQL SCHEMA
-- ====================================================

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  matricule_format TEXT DEFAULT 'INITIALS_BRANCH_SEQ',
  matricule_prefix TEXT,
  primary_currency TEXT DEFAULT 'HTG',
  date_format TEXT DEFAULT 'DD/MM/YYYY',
  language TEXT DEFAULT 'fr',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  employee_number TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  employee_id TEXT REFERENCES employees(id),
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
  submitted_at INTEGER NOT NULL,
  decided_at INTEGER,
  decided_by TEXT REFERENCES users(id),
  rejection_reason TEXT,
  decision_comment TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  user_id TEXT,
  leave_request_id TEXT REFERENCES leave_requests(id),
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  metadata TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS notification_logs (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  leave_request_id TEXT REFERENCES leave_requests(id),
  channel TEXT NOT NULL,
  recipient TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  status TEXT NOT NULL,
  provider_message_id TEXT,
  error_message TEXT,
  sent_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS org_slug_idx ON organizations(slug);
CREATE INDEX IF NOT EXISTS org_status_idx ON organizations(status);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_org_idx ON users(organization_id);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
CREATE INDEX IF NOT EXISTS emp_org_idx ON employees(organization_id);
CREATE INDEX IF NOT EXISTS emp_org_num_idx ON employees(organization_id, employee_number);
CREATE UNIQUE INDEX IF NOT EXISTS leave_req_num_idx ON leave_requests(request_number);
CREATE UNIQUE INDEX IF NOT EXISTS leave_token_hash_idx ON leave_requests(employee_access_token_hash);
CREATE INDEX IF NOT EXISTS leave_org_idx ON leave_requests(organization_id);
CREATE INDEX IF NOT EXISTS leave_org_status_idx ON leave_requests(organization_id, status);
CREATE INDEX IF NOT EXISTS audit_org_idx ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS audit_req_idx ON audit_logs(leave_request_id);
CREATE INDEX IF NOT EXISTS notif_org_idx ON notification_logs(organization_id);
CREATE INDEX IF NOT EXISTS notif_req_idx ON notification_logs(leave_request_id);
