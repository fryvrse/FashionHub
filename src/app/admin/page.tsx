import { redirect } from "next/navigation";

export default function AdminLegacyRedirect() {
  redirect("/superadmin/dashboard");
}
