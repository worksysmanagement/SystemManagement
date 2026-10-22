import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "SUPER_ADMIN") {
    redirect("/admin/dashboard");
  }

  const orgName = session.organizationName || "Super Administration";

  return (
    <AdminShell
      role="SUPER_ADMIN"
      organizationName={orgName}
      userName={session.name}
      userEmail={session.email}
    >
      {children}
    </AdminShell>
  );
}
