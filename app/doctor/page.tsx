import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { calculateRiskScore, getRiskLevel } from "@/lib/risk";
import { ageFromDob } from "@/lib/time";
import type { PatientWithRisk } from "@/lib/types";
import DoctorPatientTable from "@/components/DoctorPatientTable";

export default async function DoctorDashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = getSupabaseAdmin();

  // Get linked patients
  const { data: links } = await supabase
    .from("patient_doctor")
    .select("patient_id")
    .eq("doctor_id", user.id);

  const patientIds = (links ?? []).map((l) => l.patient_id);

  if (patientIds.length === 0) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">
          Doctor Dashboard
        </h1>
        <div className="card py-12 text-center">
          <span className="text-4xl">📋</span>
          <p className="mt-3 text-gray-500">
            No patients assigned to you yet.
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Ask the admin or front desk to assign patients to your account.
          </p>
        </div>
      </div>
    );
  }

  // Get patient profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("id", patientIds);

  // Get doses from last 48 hours for each patient
  const fortyEightHoursAgo = new Date(
    Date.now() - 48 * 60 * 60 * 1000
  ).toISOString();

  const { data: recentDoses } = await supabase
    .from("scheduled_doses")
    .select("*, medications(critical)")
    .in("patient_id", patientIds)
    .gte("scheduled_at", fortyEightHoursAgo);

  // Get medication plans with pres_no
  const { data: plans } = await supabase
    .from("medication_plans")
    .select("id, patient_id, pres_no")
    .in("patient_id", patientIds);

  const planIds = (plans ?? []).map((p) => p.id);

  // Get total meds count per patient
  const { data: allMeds } = await supabase
    .from("medications")
    .select("id, plan_id, medication_plans(patient_id)")
    .in("plan_id", planIds.length > 0 ? planIds : ["__none__"]);

  // Build pres_no map: patient_id -> pres_no[]
  const presNoMap: Record<string, string[]> = {};
  for (const plan of plans ?? []) {
    if (!presNoMap[plan.patient_id]) presNoMap[plan.patient_id] = [];
    if (plan.pres_no) presNoMap[plan.patient_id].push(plan.pres_no);
  }

  // Build patient risk data
  const patientsWithRisk: PatientWithRisk[] = (profiles ?? []).map((p) => {
    const patientDoses = (recentDoses ?? []).filter(
      (d) => d.patient_id === p.id
    );
    const missedLast48h = patientDoses.filter(
      (d) => d.status === "missed"
    ).length;
    const criticalMissed = patientDoses.filter(
      (d) =>
        d.status === "missed" &&
        (d.medications as unknown as { critical: boolean })?.critical
    ).length;

    // Count unique medications for this patient
    const patientMeds = (allMeds ?? []).filter(
      (m) =>
        (m.medication_plans as unknown as { patient_id: string })
          ?.patient_id === p.id
    );
    const medsCount = patientMeds.length;

    const age = p.dob ? ageFromDob(p.dob) : 0;
    const score = calculateRiskScore({
      missedLast48h,
      criticalMissed,
      medsCount,
      age,
    });

    return {
      ...p,
      risk_score: score,
      risk_level: getRiskLevel(score),
      missed_last_48h: missedLast48h,
      critical_missed: criticalMissed,
      meds_count: medsCount,
      pres_nos: presNoMap[p.id] || [],
    };
  });

  // Sort by risk score descending
  patientsWithRisk.sort((a, b) => b.risk_score - a.risk_score);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Doctor Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            {patientsWithRisk.length} patient
            {patientsWithRisk.length !== 1 ? "s" : ""} linked
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <a href="/doctor/prescribe" className="btn-primary text-center sm:flex-initial">
            Prescribe
          </a>
          <a href="/doctor/import" className="btn-secondary text-center sm:flex-initial">
            Import
          </a>
        </div>
      </div>

      <DoctorPatientTable patients={patientsWithRisk} />
    </div>
  );
}
