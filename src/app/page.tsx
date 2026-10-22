import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role === "SUPER_ADMIN") {
    redirect("/super-admin");
  }

  if (session.role === "EMPLOYEE" || session.role === "COLLABORATEUR") {
    redirect("/admin/requests");
  }

  redirect("/admin/dashboard");
}
