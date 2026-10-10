-- ====================================================
-- SUPABASE POSTGRESQL SEED DATA
-- ====================================================

-- 1. Nettoyage ordonne des tables
DELETE FROM public.notification_logs;
DELETE FROM public.audit_logs;
DELETE FROM public.leave_requests;
DELETE FROM public.employees;
DELETE FROM public.users;
DELETE FROM public.organizations;

-- 2. Insertion des Organisations Initiales
INSERT INTO public.organizations (id, name, slug, email, phone, address, status, created_at, updated_at)
VALUES
  ('org-welj', 'Welj Express Services', 'welj', 'support@welj-ht.com', '+225 0501020304', 'Plateau, Avenue Nogues, Abidjan', 'ACTIVE', 1710000000000, 1710000000000),
  ('org-technozi', 'Technozi', 'technozi', 'sales@technozi-ht.com', '+225 0701020304', 'Zone 4, Boulevard de Marseille, Abidjan', 'ACTIVE', 1710000000000, 1710000000000);

-- 3. Insertion des Administrateurs
-- Super Admin Principal: pitonrodjy@gmail.com / pitonrp8
-- Super Admin Backup: SuperAdmin2026!
-- Welj Admin: Adminwelj@2026
-- Technozi Admin: Technozi@Haiti1234
INSERT INTO public.users (id, organization_id, name, email, password_hash, role, status, created_at, updated_at)
VALUES
  ('usr-piton-super-admin', NULL, 'Rodjy Piton', 'pitonrodjy@gmail.com', 'pbkdf2:100000:f91a1b3c42b08d61ad0811468d187f55:0f55f7ad0dbda1bf266fa7f35014e01cead67d9237660360065dd7f95847da9c', 'SUPER_ADMIN', 'ACTIVE', 1710000000000, 1710000000000),
  ('usr-super-admin', NULL, 'Super Administrateur Plateforme', 'superadmin@platform.local', 'pbkdf2:100000:33bf93707d8145ca6547e30c8acd25e3:596d8add1c5a818924ff86fb13a0ffa3ad24c159b2bdab9c91e8dffe148c6daf', 'SUPER_ADMIN', 'ACTIVE', 1710000000000, 1710000000000),
  ('usr-welj-admin', 'org-welj', 'Direction Welj Express Services', 'support@welj-ht.com', 'pbkdf2:100000:49192bc6b76f1b551a66d4996946f70a:5628416c51dcfb421d5eab2c24467844afae85665a97f0da36f37e96d2fee69e', 'ORGANIZATION_ADMIN', 'ACTIVE', 1710000000000, 1710000000000),
  ('usr-technozi-admin', 'org-technozi', 'Direction Technozi', 'sales@technozi-ht.com', 'pbkdf2:100000:f31dcf7ca8a87f122836619961be9f52:565edc0194a1df0e3c0b3896adf52237e623079bc816eabd1fc53d8b0a8fbe72', 'ORGANIZATION_ADMIN', 'ACTIVE', 1710000000000, 1710000000000);

-- 4. Insertion des Employes Demo
INSERT INTO public.employees (id, organization_id, employee_number, first_name, last_name, department, position, phone, email, status, created_at, updated_at)
VALUES
  ('emp-w1', 'org-welj', 'WES-001', 'Jean', 'Kouassi', 'Logistique', 'Chauffeur Livreur', '+22501020304', 'j.kouassi@welj.demo', 'ACTIVE', 1710000000000, 1710000000000),
  ('emp-w2', 'org-welj', 'WES-002', 'Awa', 'Traore', 'Comptabilite', 'Comptable', '+22505060708', 'a.traore@welj.demo', 'ACTIVE', 1710000000000, 1710000000000),
  ('emp-t1', 'org-technozi', 'TEC-001', 'Alice', 'Smith', 'Developpement', 'Ingenieure Logiciel', '+22501020304', 'a.smith@technozi.demo', 'ACTIVE', 1710000000000, 1710000000000),
  ('emp-t2', 'org-technozi', 'TEC-002', 'Marc', 'Bamba', 'Support Client', 'Charge de Support', '+22507080910', 'm.bamba@technozi.demo', 'ACTIVE', 1710000000000, 1710000000000);
