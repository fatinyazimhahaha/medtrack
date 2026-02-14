import { requireRole } from "@/lib/auth";

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("patient");
  return <>{children}</>;
}
