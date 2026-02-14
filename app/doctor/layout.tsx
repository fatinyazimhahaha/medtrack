import { requireRole } from "@/lib/auth";

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Doctor can access /doctor routes
  await requireRole("staff");
  return <>{children}</>;
}
