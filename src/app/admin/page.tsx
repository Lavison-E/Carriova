import { redirect } from "next/navigation";

/** /admin has no page of its own: send the team to the CRM (login is enforced there). */
export default function AdminIndex() {
  redirect("/admin/crm");
}
