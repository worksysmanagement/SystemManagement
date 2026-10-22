-- ==============================================================================
-- RKONEKTE ERP SAAS — MULTI-TENANT & MULTI-SUCCURSALES MIGRATION
-- ==============================================================================
-- 1. Rattachement Succursale sur la table des Employes
ALTER TABLE IF EXISTS public.employees 
ADD COLUMN IF NOT EXISTS branch_id TEXT REFERENCES public.branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS emp_branch_idx ON public.employees(organization_id, branch_id);

-- 2. Rattachement Succursale optionnel sur la table des Utilisateurs
ALTER TABLE IF EXISTS public.users 
ADD COLUMN IF NOT EXISTS branch_id TEXT REFERENCES public.branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS users_branch_idx ON public.users(organization_id, branch_id);

-- 3. Rattachement Succursale optionnel sur les Demandes de Conge
ALTER TABLE IF EXISTS public.leave_requests 
ADD COLUMN IF NOT EXISTS branch_id TEXT REFERENCES public.branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS leave_branch_idx ON public.leave_requests(organization_id, branch_id);

-- 4. Initialisation automatique de la succursale 'Siege Principal' pour toute entreprise sans succursale
INSERT INTO public.branches (
  id,
  organization_id,
  code,
  name,
  city,
  address,
  manager_name,
  phone,
  status,
  created_at,
  updated_at
)
SELECT 
  'br-' || id || '-siege',
  id,
  'SIEGE',
  'Siege Principal',
  COALESCE(address, 'Port-au-Prince'),
  address,
  name || ' - Direction',
  phone,
  'ACTIVE',
  CAST(extract(epoch from now()) * 1000 AS BIGINT),
  CAST(extract(epoch from now()) * 1000 AS BIGINT)
FROM public.organizations
WHERE id NOT IN (SELECT DISTINCT organization_id FROM public.branches)
ON CONFLICT (id) DO NOTHING;

-- 5. Lier les employes existants sans succursale au Siege Principal de leur entreprise
UPDATE public.employees e
SET branch_id = b.id
FROM public.branches b
WHERE e.branch_id IS NULL 
  AND e.organization_id = b.organization_id 
  AND b.code = 'SIEGE';

-- 6. Activation Row Level Security sur toutes les tables
ALTER TABLE IF EXISTS public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organization_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notification_logs ENABLE ROW LEVEL SECURITY;
