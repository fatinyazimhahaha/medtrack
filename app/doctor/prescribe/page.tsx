import { getProfile, getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import PrescribeForm from "./PrescribeForm";

export default async function PrescribePage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = getSupabaseAdmin();

  // Fetch patients assigned to this doctor
  const { data: links } = await supabase
    .from("patient_doctor")
    .select("patient_id")
    .eq("doctor_id", user.id);

  const patientIds = (links ?? []).map((l) => l.patient_id);

  let assignedPatients: { id: string; full_name: string; mrn: string | null }[] = [];
  if (patientIds.length > 0) {
    const { data: patients } = await supabase
      .from("profiles")
      .select("id, full_name, mrn")
      .in("id", patientIds)
      .order("full_name");
    assignedPatients = patients ?? [];
  }

  return (
    <div className="max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4 sm:px-0">
      <div className="mb-6 sm:mb-8">
        <a
          href="/doctor"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          &larr; Back to Dashboard
        </a>
        <h1 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
          Prescribe Medications
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Doctor: {profile.full_name}
          &nbsp;&middot;&nbsp;
          Select a patient assigned to you and add their medications below.
        </p>
      </div>

      {assignedPatients.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="text-gray-500">
            No patients assigned to you yet. Ask admin or front desk to assign patients.
          </p>
          <a href="/doctor" className="btn-primary inline-block mt-4">
            Back to Dashboard
          </a>
        </div>
      ) : (
        <PrescribeForm patients={assignedPatients} />
      )}
    </div>
  );
}
