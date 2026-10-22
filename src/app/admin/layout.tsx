import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const orgName = session.organizationName || (session.role === "SUPER_ADMIN" ? "Super Administration" : "Mon Entreprise");

  return (
    <AdminShell
      role={session.role as any}
      organizationName={orgName}
      userName={session.name}
      userEmail={session.email}
    >
      {children}
    </AdminShell>
  );
}
