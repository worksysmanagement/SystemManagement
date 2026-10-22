import { Client } from "pg";
import fs from "fs";
import path from "path";

// Simple .env parser without external dependencies
function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const [key, ...rest] = trimmed.split("=");
        if (key && rest.length > 0) {
          process.env[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
        }
      }
    }
  } catch (_) {}
}

loadEnv();

const SQL_MIGRATION = `
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS birth_date TEXT,
ADD COLUMN IF NOT EXISTS study_domain TEXT,
ADD COLUMN IF NOT EXISTS blood_group TEXT,
ADD COLUMN IF NOT EXISTS medical_notes TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_relation TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS emp_org_num_unique_idx ON public.employees(organization_id, LOWER(employee_number));
`;

async function run() {
  console.log("🔄 Tentative de mise à jour des colonnes dans Supabase PostgreSQL...");

  const hosts = [
    "db.ldpravbrnpwwdurlqdyq.supabase.co",
    "aws-0-us-east-1.pooler.supabase.com",
    "aws-0-us-west-1.pooler.supabase.com",
    "aws-0-eu-central-1.pooler.supabase.com",
    "aws-0-sa-east-1.pooler.supabase.com",
  ];

  let applied = false;

  for (const host of hosts) {
    const isPooler = host.includes("pooler");
    const port = isPooler ? 6543 : 5432;
    const user = isPooler ? "postgres.ldpravbrnpwwdurlqdyq" : "postgres";
    console.log(`🔌 Essai sur ${host}:${port}...`);

    const client = new Client({
      host,
      port,
      database: "postgres",
      user,
      password: process.env.SUPABASE_DB_PASSWORD || "SysAdmin2026Y",
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });

    try {
      await client.connect();
      console.log("✅ Connecté avec succès ! Application de la migration SQL...");
      await client.query(SQL_MIGRATION);
      console.log("🎉 Colonnes ajoutées avec succès dans la table employees sur Supabase !");
      await client.end();
      applied = true;
      break;
    } catch (e: any) {
      console.log(`  ⚠️ Échec sur ${host}: ${e.message}`);
    }
  }

  if (!applied) {
    console.log(`
--------------------------------------------------------------------------------
💡 Note : Si la connexion directe TCP est bloquée par votre pare-feu / réseau, copiez-collez
simplement cette instruction dans le 'SQL Editor' de votre tableau de bord Supabase :

ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS birth_date TEXT,
ADD COLUMN IF NOT EXISTS study_domain TEXT,
ADD COLUMN IF NOT EXISTS blood_group TEXT,
ADD COLUMN IF NOT EXISTS medical_notes TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
--------------------------------------------------------------------------------`);
  }
}

run();
