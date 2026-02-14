import { getProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminDashboardPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/");

  const admin = getSupabaseAdmin();

  // Fetch all profiles, links, and auth users (for usernames)
  const [profilesRes, linksRes, authUsersRes] = await Promise.all([
    admin.from("profiles").select("*").order("created_at", { ascending: false }),
    admin.from("patient_doctor").select("*"),
    admin.auth.admin.listUsers(),
  ]);

  const profiles = profilesRes.data ?? [];
  const links = linksRes.data ?? [];

  // Build a map of user id -> username (derived from email)
  const usernameMap: Record<string, string> = {};
  for (const u of authUsersRes.data?.users ?? []) {
    const email = u.email ?? "";
    // Strip @medtrack.local to get the username
    const username = email.replace(/@medtrack\.local$/, "");
    usernameMap[u.id] = username || email;
  }

  // Attach username and pre-format created_at to each profile
  const profilesWithUsername = profiles.map((p) => ({
    ...p,
    username: usernameMap[p.id] || "—",
    created_at_display: new Date(p.created_at).toLocaleDateString("en-MY", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  }));

  const patients = profilesWithUsername.filter((p) => p.role === "patient");
  const doctors = profilesWithUsername.filter((p) => p.role === "doctor");
  const frontdesk = profilesWithUsername.filter((p) => p.role === "frontdesk");
  const admins = profilesWithUsername.filter((p) => p.role === "admin");

  return (
    <AdminDashboardClient
      profiles={profilesWithUsername}
      links={links}
      patients={patients}
      doctors={doctors}
      frontdesk={frontdesk}
      admins={admins}
    />
  );
}
