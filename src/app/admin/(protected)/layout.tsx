import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/features/football-tournaments/data";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return <AdminShell>{children}</AdminShell>;
}
