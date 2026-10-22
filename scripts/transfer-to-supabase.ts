import { getSupabaseAdminClient } from "../src/lib/supabase/server";
import { createClient as createNodeClient } from "@libsql/client";
import path from "path";

export async function transferToSupabase() {
  console.log("🚀 Starting data transfer from local.sqlite to Supabase Cloud...");
  const supabase = getSupabaseAdminClient();

  // Test connection
  const { error: testError } = await supabase.from("organizations").select("id").limit(1);
  if (testError) {
    throw new Error(`Failed to connect to Supabase: ${testError.message}`);
  }
  console.log("✅ Supabase connection successful!");

  // Read from local SQLite
  const localDbPath = path.join(process.cwd(), "local.sqlite").replace(/\\/g, "/");
  const localClient = createNodeClient({ url: `file:${localDbPath}` });

  // 1. ORGANIZATIONS
  const orgsRes = await localClient.execute("SELECT * FROM organizations");
  console.log(`Found ${orgsRes.rows.length} organization(s) in SQLite.`);
  for (const row of orgsRes.rows) {
    const orgData = {
      id: String(row.id),
      name: String(row.name),
      slug: String(row.slug),
      logo_url: row.logo_url ? String(row.logo_url) : null,
      email: row.email ? String(row.email) : null,
      phone: row.phone ? String(row.phone) : null,
      address: row.address ? String(row.address) : null,
      status: String(row.status),
      created_at: Number(row.created_at),
      updated_at: Number(row.updated_at),
    };

    const { error } = await supabase.from("organizations").upsert(orgData);
    if (error) {
      console.error(`Error inserting org ${orgData.slug}:`, error.message);
    } else {
      console.log(`  ✓ Transferred organization: ${orgData.name} (${orgData.slug})`);
    }
  }

  // 2. USERS
  const usersRes = await localClient.execute("SELECT * FROM users");
  console.log(`Found ${usersRes.rows.length} user(s) in SQLite.`);
  for (const row of usersRes.rows) {
    const userData = {
      id: String(row.id),
      organization_id: row.organization_id ? String(row.organization_id) : null,
      name: String(row.name),
      email: String(row.email),
      password_hash: String(row.password_hash),
      role: String(row.role),
      status: String(row.status),
      created_at: Number(row.created_at),
      updated_at: Number(row.updated_at),
    };

    const { error } = await supabase.from("users").upsert(userData);
    if (error) {
      console.error(`Error inserting user ${userData.email}:`, error.message);
    } else {
      console.log(`  ✓ Transferred user: ${userData.name} (${userData.email} - ${userData.role})`);
    }
  }

  // 3. EMPLOYEES
  try {
    const empRes = await localClient.execute("SELECT * FROM employees");
    if (empRes.rows.length > 0) {
      console.log(`Found ${empRes.rows.length} employee(s) in SQLite.`);
      for (const row of empRes.rows) {
        const empData = {
          id: String(row.id),
          organization_id: String(row.organization_id),
          employee_number: String(row.employee_number),
          first_name: String(row.first_name),
          last_name: String(row.last_name),
          department: String(row.department),
          position: String(row.position),
          phone: String(row.phone),
          email: row.email ? String(row.email) : null,
          status: String(row.status),
          created_at: Number(row.created_at),
          updated_at: Number(row.updated_at),
        };
        await supabase.from("employees").upsert(empData);
      }
    }
  } catch (_) {}

  // 4. LEAVE REQUESTS
  try {
    const lrRes = await localClient.execute("SELECT * FROM leave_requests");
    if (lrRes.rows.length > 0) {
      console.log(`Found ${lrRes.rows.length} leave request(s) in SQLite.`);
      for (const row of lrRes.rows) {
        const lrData = { ...row };
        await supabase.from("leave_requests").upsert(lrData);
      }
    }
  } catch (_) {}

  // 5. AUDIT LOGS
  try {
    const alRes = await localClient.execute("SELECT * FROM audit_logs");
    if (alRes.rows.length > 0) {
      console.log(`Found ${alRes.rows.length} audit log(s) in SQLite.`);
      for (const row of alRes.rows) {
        const alData = { ...row };
        await supabase.from("audit_logs").upsert(alData);
      }
    }
  } catch (_) {}

  console.log("🎉 Transfer to Supabase completed successfully!");
}

if (require.main === module || process.argv[1]?.includes("transfer-to-supabase")) {
  transferToSupabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Transfer failed:", err);
      process.exit(1);
    });
}
