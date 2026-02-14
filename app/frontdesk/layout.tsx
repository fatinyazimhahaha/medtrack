import { requireRole } from "@/lib/auth";

export default async function FrontdeskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("frontdesk");
  return <>{children}</>;
}
