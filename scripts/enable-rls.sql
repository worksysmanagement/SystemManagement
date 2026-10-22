-- ====================================================
-- SUPABASE SECURITY HARDENING: ENABLE ROW LEVEL SECURITY (RLS)
-- ====================================================
-- Description:
-- Résout l'alerte critique Supabase "Table publicly accessible (rls_disabled_in_public)".
-- En activant le RLS, toute requête directe anonyme non autorisée (clé anon)
-- est bloquée. L'application Next.js utilise la clé service_role côté serveur
-- et continue de fonctionner normalement sans aucune interruption.

-- 1. Activer RLS sur la table des organisations
ALTER TABLE IF EXISTS public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Activer RLS sur la table des utilisateurs
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;

-- 3. Activer RLS sur la table des employés
ALTER TABLE IF EXISTS public.employees ENABLE ROW LEVEL SECURITY;

-- 4. Activer RLS sur la table des demandes de congé
ALTER TABLE IF EXISTS public.leave_requests ENABLE ROW LEVEL SECURITY;

-- 5. Activer RLS sur la table des journaux d'audit
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 6. Activer RLS sur la table des journaux de notifications
ALTER TABLE IF EXISTS public.notification_logs ENABLE ROW LEVEL SECURITY;
