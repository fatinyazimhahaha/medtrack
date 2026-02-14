import { getProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import FrontdeskDashboardClient from "./FrontdeskDashboardClient";

export default async function FrontdeskDashboardPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "frontdesk") redirect("/");

  const admin = getSupabaseAdmin();

  // Fetch all profiles and links
  const [profilesRes, linksRes] = await Promise.all([
    admin.from("profiles").select("*").order("created_at", { ascending: false }),
    admin.from("patient_doctor").select("*"),
  ]);

  const profiles = profilesRes.data ?? [];
  const links = linksRes.data ?? [];

  const patients = profiles.filter((p) => p.role === "patient");
  const doctors = profiles.filter((p) => p.role === "doctor");

  return (
    <FrontdeskDashboardClient
      profiles={profiles}
      links={links}
      patients={patients}
      doctors={doctors}
    />
  );
}
