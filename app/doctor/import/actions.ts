"use server";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getUser } from "@/lib/auth";
import { myDatetime, todayMY } from "@/lib/time";
import type { ImportPayload } from "@/lib/types";

/** Generate a unique prescription number: RX-YYYYMMDD-XXXX */
function generatePresNo(): string {
  const today = todayMY().replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RX-${today}-${rand}`;
}

export async function importDischargeMeds(
  jsonStr: string
): Promise<{ success: boolean; message: string }> {
  try {
    const user = await getUser();
    if (!user) return { success: false, message: "Not authenticated." };

    // Verify doctor role
    const supabase = getSupabaseAdmin();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "doctor") {
      return { success: false, message: "Only doctors can import medications." };
    }

    const payload: ImportPayload = JSON.parse(jsonStr);

    // Validate
    if (!payload.patient || !payload.plan || !payload.meds?.length) {
      return {
        success: false,
        message: "Invalid payload: missing patient, plan, or meds.",
      };
    }

    const admin = getSupabaseAdmin();

    // 1. Find or create patient user
    let patientId: string;

    // Check if patient with this email/mrn exists
    const { data: existingUsers } = await admin.auth.admin.listUsers();
    const patientEmail = `patient-${payload.patient.mrn.toLowerCase()}@medtrack.my`;
    const existing = existingUsers?.users?.find(
      (u) => u.email === patientEmail
    );

    if (existing) {
      patientId = existing.id;
      // Update profile
      await admin
        .from("profiles")
        .update({
          full_name: payload.patient.full_name,
          mrn: payload.patient.mrn,
          phone: payload.patient.phone,
          dob: payload.patient.dob,
        })
        .eq("id", patientId);
    } else {
      // Create new patient user
      const { data: newUser, error: createErr } =
        await admin.auth.admin.createUser({
          email: patientEmail,
          password: "patient123",
          email_confirm: true,
          user_metadata: {
            full_name: payload.patient.full_name,
            role: "patient",
          },
        });

      if (createErr) {
        return {
          success: false,
          message: `Failed to create patient: ${createErr.message}`,
        };
      }

      patientId = newUser.user.id;

      // Update profile with extra fields
      await admin
        .from("profiles")
        .update({
          mrn: payload.patient.mrn,
          phone: payload.patient.phone,
          dob: payload.patient.dob,
        })
        .eq("id", patientId);
    }

    // 2. Link doctor to patient (upsert)
    const { data: existingLink } = await admin
      .from("patient_doctor")
      .select("id")
      .eq("patient_id", patientId)
      .eq("doctor_id", user.id)
      .single();

    if (!existingLink) {
      await admin.from("patient_doctor").insert({
        patient_id: patientId,
        doctor_id: user.id,
      });
    }

    // 3. Create medication plan with pres_no
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

    const { data: plan, error: planErr } = await admin
      .from("medication_plans")
      .insert({
        patient_id: patientId,
        pres_no: presNo,
        start_date: payload.plan.start_date,
        end_date: payload.plan.end_date,
      })
      .select()
      .single();

    if (planErr || !plan) {
      return {
        success: false,
        message: `Failed to create plan: ${planErr?.message}`,
      };
    }

    // 4. Create medications
    const medRows = payload.meds.map((m) => ({
      plan_id: plan.id,
      med_name: m.med_name,
      dose: m.dose,
      route: m.route,
      times: m.times,
      freq: m.freq,
      critical: m.critical,
    }));

    const { data: insertedMeds, error: medsErr } = await admin
      .from("medications")
      .insert(medRows)
      .select();

    if (medsErr || !insertedMeds) {
      return {
        success: false,
        message: `Failed to create medications: ${medsErr?.message}`,
      };
    }

    // 5. Generate scheduled doses for next 7 days
    const doseRows: Array<{
      medication_id: string;
      patient_id: string;
      scheduled_at: string;
      status: string;
    }> = [];

    const startDate = new Date(payload.plan.start_date);
    const today = new Date();
    const baseDate = startDate > today ? startDate : today;

    for (let day = 0; day < 7; day++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + day);
      const dateStr = d.toISOString().split("T")[0];

      for (const med of insertedMeds) {
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
        return {
          success: false,
          message: `Failed to create doses: ${doseErr.message}`,
        };
      }
    }

    return {
      success: true,
      message: `Successfully imported ${insertedMeds.length} medication(s) for ${payload.patient.full_name}. Created ${doseRows.length} scheduled doses for the next 7 days.`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, message: `Import failed: ${msg}` };
  }
}
