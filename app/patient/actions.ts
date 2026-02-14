"use server";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getUser } from "@/lib/auth";

export async function updateDoseStatus(
  doseId: string,
  status: "taken" | "skipped",
  note: string | null
): Promise<{ error?: string }> {
  try {
    const user = await getUser();
    if (!user) return { error: "Not authenticated" };

    const admin = getSupabaseAdmin();

    // Verify the dose exists and belongs to this patient
    const { data: dose, error: fetchErr } = await admin
      .from("scheduled_doses")
      .select("id, patient_id")
      .eq("id", doseId)
      .single();

    if (fetchErr || !dose) {
      return { error: "Dose not found" };
    }
    if (dose.patient_id !== user.id) {
      return { error: "Not authorized to update this dose" };
    }

    const { error: updateErr } = await admin
      .from("scheduled_doses")
      .update({
        status,
        note: note || null,
        acted_at: new Date().toISOString(),
      })
      .eq("id", doseId);

    if (updateErr) {
      return { error: updateErr.message };
    }

    return {};
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { error: msg };
  }
}
