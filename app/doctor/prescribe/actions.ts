"use server";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getUser, getProfile } from "@/lib/auth";
import { myDatetime, todayMY } from "@/lib/time";

export interface PrescribeFormData {
  // Patient
  patient_id: string;
  // Medications (each with its own schedule)
  medications: {
    med_name: string;
    dose: string;
    route: string;
    freq: string;
    times: string[];
    critical: boolean;
    start_date: string;
    start_time: string;
    end_date: string;
    end_time: string;
  }[];
}

/** Generate a unique prescription number: RX-YYYYMMDD-XXXX */
function generatePresNo(): string {
  const today = todayMY().replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000); // 4-digit random
  return `RX-${today}-${rand}`;
}

export async function prescribeMeds(
  data: PrescribeFormData
): Promise<{ success: boolean; message: string; pres_no?: string }> {
  try {
    const user = await getUser();
    if (!user) return { success: false, message: "Not authenticated." };

    const profile = await getProfile();
    if (!profile || profile.role !== "doctor") {
      return { success: false, message: "Only doctors can prescribe." };
    }

    // Validate
    if (!data.patient_id) {
      return { success: false, message: "Please select a patient." };
    }
    if (data.medications.length === 0) {
      return { success: false, message: "At least one medication is required." };
    }
    for (const med of data.medications) {
      if (!med.med_name.trim()) {
        return { success: false, message: "All medications must have a name." };
      }
      if (med.times.length === 0) {
        return { success: false, message: `Select at least one time for ${med.med_name}.` };
      }
      if (!med.start_date || !med.end_date) {
        return { success: false, message: `Set start and end date for ${med.med_name}.` };
      }
      if (new Date(med.end_date) < new Date(med.start_date)) {
        return { success: false, message: `End date must be after start date for ${med.med_name}.` };
      }
    }

    const admin = getSupabaseAdmin();
    const patientId = data.patient_id;

    // Verify the patient exists and is assigned to this doctor
    const { data: link } = await admin
      .from("patient_doctor")
      .select("id")
      .eq("patient_id", patientId)
      .eq("doctor_id", user.id)
      .single();

    if (!link) {
      return { success: false, message: "This patient is not assigned to you." };
    }

    // Get patient name for the success message
    const { data: patientProfile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", patientId)
      .single();

    const patientName = patientProfile?.full_name || "Patient";

    // Generate unique pres_no (retry if collision)
    let presNo = generatePresNo();
    let retries = 0;
    while (retries < 5) {
      const { data: existing } = await admin
        .from("medication_plans")
        .select("id")
        .eq("pres_no", presNo)
        .maybeSingle();
      if (!existing) break;
      presNo = generatePresNo();
      retries++;
    }

    // Compute overall plan dates from medications
    const allStartDates = data.medications.map((m) => m.start_date).sort();
    const allEndDates = data.medications.map((m) => m.end_date).sort();
    const planStartDate = allStartDates[0] || todayMY();
    const planEndDate = allEndDates[allEndDates.length - 1] || null;

    // Create medication plan (parent) with pres_no
    const { data: plan, error: planErr } = await admin
      .from("medication_plans")
      .insert({
        patient_id: patientId,
        pres_no: presNo,
        start_date: planStartDate,
        end_date: planEndDate,
      })
      .select()
      .single();

    if (planErr || !plan) {
      return { success: false, message: `Failed to create plan: ${planErr?.message}` };
    }

    // Create medications (children) with per-medication dates
    const medRows = data.medications.map((m) => ({
      plan_id: plan.id,
      med_name: m.med_name.toUpperCase(),
      dose: m.dose,
      route: m.route,
      times: m.times,
      freq: m.freq,
      critical: m.critical,
      start_date: m.start_date,
      end_date: m.end_date,
    }));

    const { data: insertedMeds, error: medsErr } = await admin
      .from("medications")
      .insert(medRows)
      .select();

    if (medsErr || !insertedMeds) {
      return { success: false, message: `Failed to create medications: ${medsErr?.message}` };
    }

    // Generate scheduled doses for each medication based on its own date range
    const doseRows: Array<{
      medication_id: string;
      patient_id: string;
      scheduled_at: string;
      status: string;
    }> = [];

    for (const med of insertedMeds) {
      const medData = data.medications.find(
        (m) => m.med_name.toUpperCase() === med.med_name
      );
      if (!medData) continue;

      const base = new Date(medData.start_date);
      const end = new Date(medData.end_date);

      // Calculate days between start and end
      const diffMs = end.getTime() - base.getTime();
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;

      for (let day = 0; day < days; day++) {
        const d = new Date(base);
        d.setDate(d.getDate() + day);
        const dateStr = d.toISOString().split("T")[0];

        for (const timeStr of med.times) {
          doseRows.push({
            medication_id: med.id,
            patient_id: patientId,
            scheduled_at: myDatetime(dateStr, timeStr),
            status: "pending",
          });
        }
      }
    }

    if (doseRows.length > 0) {
      const { error: doseErr } = await admin
        .from("scheduled_doses")
        .insert(doseRows);
      if (doseErr) {
        return { success: false, message: `Failed to create doses: ${doseErr.message}` };
      }
    }

    return {
      success: true,
      pres_no: presNo,
      message: `Prescription ${presNo}\nPrescribed ${insertedMeds.length} medication(s) for ${patientName}.\nGenerated ${doseRows.length} doses.`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, message: `Prescription failed: ${msg}` };
  }
}
