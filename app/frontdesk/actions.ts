"use server";

import { getUser, getProfile } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Helper to verify caller is frontdesk
async function verifyFrontdesk() {
  const caller = await getUser();
  if (!caller) return { error: "Not authenticated", caller: null };
  const profile = await getProfile();
  if (!profile || profile.role !== "frontdesk") return { error: "Unauthorized", caller: null };
  return { error: null, caller };
}

// ── Register a new patient (Frontdesk) ──────────────────────
export async function registerPatient(formData: FormData) {
  const { error: authError, caller } = await verifyFrontdesk();
  if (authError || !caller) return { error: authError || "Unauthorized" };

  const fullName = (formData.get("full_name") as string)?.trim();
  const mrn = (formData.get("mrn") as string)?.trim() || null;
  const phone = (formData.get("phone") as string)?.trim() || null;
  const dob = (formData.get("dob") as string)?.trim() || null;
  const username = (formData.get("username") as string)?.trim();
  const password = (formData.get("password") as string)?.trim() || "medtrack123";
  const doctorId = (formData.get("doctor_id") as string)?.trim() || null;

  if (!fullName) return { error: "Patient name is required" };
  if (!username) return { error: "Username is required" };

  const admin = getSupabaseAdmin();

  // Construct email from username
  const email = `${username}@medtrack.local`;

  // Check if user already exists by email
  const { data: existingUsers } = await admin.auth.admin.listUsers();
  const existing = existingUsers?.users?.find((u) => u.email === email);

  let patientId: string;

  if (existing) {
    // User exists — check if role is patient
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", existing.id)
      .single();
    if (existingProfile?.role !== "patient") {
      return { error: `User with username ${username} exists but is not a patient (role: ${existingProfile?.role})` };
    }
    patientId = existing.id;

    // Update profile fields if provided
    await admin
      .from("profiles")
      .update({
        full_name: fullName,
        ...(mrn && { mrn }),
        ...(phone && { phone }),
        ...(dob && { dob }),
      })
      .eq("id", patientId);
  } else {
    // Create new auth user
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: "patient",
      },
    });

    if (createErr) {
      return { error: `Failed to create patient: ${createErr.message}` };
    }
    patientId = created.user.id;

    // Update profile with extra data
    await admin
      .from("profiles")
      .update({
        full_name: fullName,
        ...(mrn && { mrn }),
        ...(phone && { phone }),
        ...(dob && { dob }),
      })
      .eq("id", patientId);
  }

  // If doctor_id provided, link patient to doctor
  if (doctorId) {
    const { data: existingLink } = await admin
      .from("patient_doctor")
      .select("id")
      .eq("patient_id", patientId)
      .eq("doctor_id", doctorId)
      .single();

    if (!existingLink) {
      await admin.from("patient_doctor").insert({
        patient_id: patientId,
        doctor_id: doctorId,
      });
    }
  }

  return {
    success: true,
    patientId,
    message: existing
      ? `Patient "${fullName}" updated and linked.`
      : `Patient "${fullName}" registered (username: ${username}, password: ${password}).`,
  };
}

// ── Link patient to doctor ──────────────────────────────────
export async function linkPatientToDoctor(formData: FormData) {
  const { error: authError, caller } = await verifyFrontdesk();
  if (authError || !caller) return { error: authError || "Unauthorized" };

  const patientId = (formData.get("patient_id") as string)?.trim();
  const doctorId = (formData.get("doctor_id") as string)?.trim();

  if (!patientId || !doctorId) return { error: "Both patient and doctor are required" };

  const admin = getSupabaseAdmin();

  // Verify patient exists and is a patient
  const { data: patient } = await admin
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", patientId)
    .single();
  if (!patient) return { error: "Patient not found" };
  if (patient.role !== "patient") return { error: `${patient.full_name} is not a patient (role: ${patient.role})` };

  // Verify doctor exists and is doctor
  const { data: doctor } = await admin
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", doctorId)
    .single();
  if (!doctor) return { error: "Doctor not found" };
  if (doctor.role !== "doctor") {
    return { error: `${doctor.full_name} is not a doctor (role: ${doctor.role})` };
  }

  // Check existing link
  const { data: existingLink } = await admin
    .from("patient_doctor")
    .select("id")
    .eq("patient_id", patientId)
    .eq("doctor_id", doctorId)
    .single();

  if (existingLink) {
    return { error: `${patient.full_name} is already linked to ${doctor.full_name}` };
  }

  const { error: insertErr } = await admin.from("patient_doctor").insert({
    patient_id: patientId,
    doctor_id: doctorId,
  });

  if (insertErr) {
    return { error: `Failed to link: ${insertErr.message}` };
  }

  return {
    success: true,
    message: `${patient.full_name} is now linked to ${doctor.full_name}.`,
  };
}

// ── Unlink patient from doctor ──────────────────────────────
export async function unlinkPatientFromDoctor(formData: FormData) {
  const { error: authError, caller } = await verifyFrontdesk();
  if (authError || !caller) return { error: authError || "Unauthorized" };

  const linkId = (formData.get("link_id") as string)?.trim();
  if (!linkId) return { error: "Link ID is required" };

  const admin = getSupabaseAdmin();

  const { error } = await admin
    .from("patient_doctor")
    .delete()
    .eq("id", linkId);

  if (error) {
    return { error: `Failed to unlink: ${error.message}` };
  }

  return { success: true, message: "Link removed successfully." };
}
