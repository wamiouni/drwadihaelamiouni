import { isAuthed } from "@/lib/auth";
import { getAllItems } from "@/lib/queries";
import { LoginForm } from "@/components/admin/login-form";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAuthed())) return <LoginForm />;
  const items = await getAllItems();
  return <AdminDashboard items={items} />;
}
