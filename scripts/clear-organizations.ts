import { getSupabaseAdminClient } from "../src/lib/supabase/server";

export async function clearOrganizations() {
  const supabase = getSupabaseAdminClient();
  console.log("🧹 Purging organizations and tenant data from Supabase Cloud...");

  // 1. Delete notification logs
  const { error: notifErr } = await supabase.from("notification_logs").delete().neq("id", "___nonexistent___");
  if (notifErr) console.warn("Notice: notification_logs:", notifErr.message);

  // 2. Delete audit logs
  const { error: auditErr } = await supabase.from("audit_logs").delete().neq("id", "___nonexistent___");
  if (auditErr) console.warn("Notice: audit_logs:", auditErr.message);

  // 3. Delete leave requests
  const { error: leaveErr } = await supabase.from("leave_requests").delete().neq("id", "___nonexistent___");
  if (leaveErr) console.warn("Notice: leave_requests:", leaveErr.message);

  // 4. Delete employees
  const { error: empErr } = await supabase.from("employees").delete().neq("id", "___nonexistent___");
  if (empErr) console.warn("Notice: employees:", empErr.message);

  // 5. Delete organization users (keep Super Admins who have organization_id: null)
  const { error: userErr } = await supabase.from("users").delete().not("organization_id", "is", null);
  if (userErr) console.warn("Notice: users:", userErr.message);

  // 6. Delete all organizations
  const { error: orgErr } = await supabase.from("organizations").delete().neq("id", "___nonexistent___");
  if (orgErr) console.warn("Notice: organizations:", orgErr.message);

  // Check state
  const { data: remainingOrgs } = await supabase.from("organizations").select("id, name");
  const { data: remainingUsers } = await supabase.from("users").select("id, email, role, organization_id");

  console.log("✅ Cleanup finished!");
  console.log("Remaining organizations:", remainingOrgs);
  console.log("Remaining users (Super Admins):", remainingUsers);
}

clearOrganizations().catch(console.error);
