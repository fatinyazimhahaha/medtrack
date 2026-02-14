import { getSupabaseServer } from "./supabaseServer";
import { redirect } from "next/navigation";
import type { Profile, UserRole } from "./types";

/** Get the currently authenticated user or null */
export async function getUser() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Get the profile for the current user or null */
export async function getProfile(): Promise<Profile | null> {
  const user = await getUser();
  if (!user) return null;

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // If RLS blocks the query, construct profile from user metadata
  if (error || !data) {
    const role = user.user_metadata?.role || "patient";
    const fullName = user.user_metadata?.full_name || "";
    return {
      id: user.id,
      full_name: fullName,
      role: role as UserRole,
      mrn: null,
      phone: null,
      dob: null,
      created_at: user.created_at,
    };
  }

  return data as Profile | null;
}

/** Get the role string for current user */
export async function getRole(): Promise<string | null> {
  const profile = await getProfile();
  return profile?.role ?? null;
}

/** Staff roles that share the /doctor routes */
const STAFF_ROLES: UserRole[] = ["doctor"];

/** Require a specific role – redirects if not matched */
export async function requireRole(role: UserRole | "staff") {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  if (role === "staff") {
    // Allow any staff role (doctor)
    if (!STAFF_ROLES.includes(profile.role)) {
      if (profile.role === "admin") redirect("/admin");
      if (profile.role === "frontdesk") redirect("/frontdesk");
      redirect(profile.role === "patient" ? "/patient" : "/");
    }
  } else if (role === "admin") {
    if (profile.role !== "admin") {
      if (STAFF_ROLES.includes(profile.role)) redirect("/doctor");
      if (profile.role === "frontdesk") redirect("/frontdesk");
      if (profile.role === "patient") redirect("/patient");
      redirect("/");
    }
  } else if (role === "frontdesk") {
    if (profile.role !== "frontdesk") {
      if (profile.role === "admin") redirect("/admin");
      if (STAFF_ROLES.includes(profile.role)) redirect("/doctor");
      if (profile.role === "patient") redirect("/patient");
      redirect("/");
    }
  } else if (profile.role !== role) {
    // Exact role match
    if (profile.role === "admin") {
      redirect("/admin");
    } else if (profile.role === "frontdesk") {
      redirect("/frontdesk");
    } else if (STAFF_ROLES.includes(profile.role)) {
      redirect("/doctor");
    } else if (profile.role === "patient") {
      redirect("/patient");
    } else {
      redirect("/");
    }
  }
  return profile;
}

/** Check if a role is a staff role */
export function isStaffRole(role: string | null): boolean {
  return STAFF_ROLES.includes(role as UserRole);
}

/** Check if a role is admin */
export function isAdminRole(role: string | null): boolean {
  return role === "admin";
}
