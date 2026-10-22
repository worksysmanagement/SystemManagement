import { redirect } from "next/navigation";

export default function RegisterCompanyPage() {
  redirect("/login?mode=register");
}
