import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatDateMY, formatTimeMY, ageFromDob } from "@/lib/time";
import { getStatusLabel } from "@/lib/statusLabel";
import { calculateRiskScore, getRiskLevel } from "@/lib/risk";
import RiskBadge from "@/components/RiskBadge";
import NudgeButton from "./NudgeButton";
import MedicationScheduleView from "@/components/MedicationScheduleView";

export default async function DoctorPatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: patientId } = await params;
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = getSupabaseAdmin();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 1. Parallel fetch: Link verify, Patient Profile, Recent Doses (30d), Plans, Nudges
  const [linkRes, patientRes, dosesRes, plansRes, nudgesRes] = await Promise.all([
    supabase
      .from("patient_doctor")
      .select("id")
      .eq("patient_id", patientId)
      .eq("doctor_id", user.id)
      .single(),
    supabase.from("profiles").select("*").eq("id", patientId).single(),
    supabase
      .from("scheduled_doses")
      .select("*, medications(*)")
      .eq("patient_id", patientId)
      .gte("scheduled_at", thirtyDaysAgo.toISOString())
      .order("scheduled_at", { ascending: false }),
    supabase.from("medication_plans").select("id").eq("patient_id", patientId),
    supabase
      .from("nudge_logs")
      .select("*")
      .eq("patient_id", patientId)
      .eq("doctor_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (!linkRes.data) redirect("/doctor");
  if (!patientRes.data) redirect("/doctor");

  const patient = patientRes.data;
  const allDoses = dosesRes.data ?? [];
  const planIds = (plansRes.data ?? []).map((p) => p.id);
  const nudges = nudgesRes.data;

  // 2. Fetch medications based on plans (dependent query)
  const { data: meds } = await supabase
    .from("medications")
    .select("*")
    .in("plan_id", planIds);

  // Stats
  const totalDoses = allDoses.length;
  const takenDoses = allDoses.filter((d) => d.status === "taken").length;
  const missedDoses = allDoses.filter((d) => d.status === "missed").length;
  const adherencePercent =
    totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const recentDoses = allDoses.filter(
    (d) => new Date(d.scheduled_at) >= fortyEightHoursAgo
  );
  const missedLast48h = recentDoses.filter(
    (d) => d.status === "missed"
  ).length;
  const criticalMissed = recentDoses.filter(
    (d) =>
      d.status === "missed" &&
      (d.medications as unknown as { critical: boolean })?.critical
  ).length;

  const medsCount = meds?.length ?? 0;
  const age = patient.dob ? ageFromDob(patient.dob) : 0;
  const score = calculateRiskScore({
    missedLast48h,
    criticalMissed,
    medsCount,
    age,
  });
  const level = getRiskLevel(score);

  // Critical meds
  const criticalMeds = (meds ?? []).filter((m) => m.critical);

  // Group doses by date for timeline
  const byDate: Record<
    string,
    Array<{
      id: string;
      med_name: string;
      scheduled_at: string;
      status: string;
      critical: boolean;
      note: string | null;
    }>
  > = {};
  for (const d of allDoses) {
    const dateKey = new Date(d.scheduled_at).toISOString().split("T")[0];
    if (!byDate[dateKey]) byDate[dateKey] = [];
    const med = d.medications as unknown as {
      med_name: string;
      critical: boolean;
    };
    byDate[dateKey].push({
      id: d.id,
      med_name: med?.med_name ?? "Unknown",
      scheduled_at: d.scheduled_at,
      status: d.status,
      critical: med?.critical ?? false,
      note: d.note,
    });
  }

  const sortedDates = Object.entries(byDate).sort(([a], [b]) =>
    b.localeCompare(a)
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div>
          <a
            href="/doctor"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            ← Back to Dashboard
          </a>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            {patient.full_name}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            MRN: {patient.mrn || "N/A"} · Age: {age} · Phone:{" "}
            {patient.phone || "N/A"}
          </p>
        </div>
        <RiskBadge level={level} score={score} />
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        <div className="card text-center">
          <p className="text-3xl font-extrabold text-blue-600">
            {adherencePercent}%
          </p>
          <p className="text-sm text-gray-500">Adherence (7d)</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-extrabold text-red-600">{missedDoses}</p>
          <p className="text-sm text-gray-500">Missed (7d)</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-extrabold text-gray-700">{medsCount}</p>
          <p className="text-sm text-gray-500">Total Meds</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-extrabold text-orange-600">
            {missedLast48h}
          </p>
          <p className="text-sm text-gray-500">Missed (48h)</p>
        </div>
      </div>

      {/* Critical Meds */}
      {criticalMeds.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-gray-700">
            Critical Medications
          </h2>
          <div className="flex flex-wrap gap-2">
            {criticalMeds.map((m) => (
              <span
                key={m.id}
                className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-800"
              >
                🚨 {m.med_name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Nudge - hidden */}
      <div className="mb-8 hidden">
        <h2 className="mb-3 text-lg font-semibold text-gray-700">
          Send Nudge
        </h2>
        <NudgeButton
          patientId={patientId}
          doctorId={user.id}
          patientName={patient.full_name}
        />
        {nudges && nudges.length > 0 && (
          <div className="mt-3 space-y-1">
            <p className="text-xs font-medium text-gray-400">Recent nudges:</p>
            {nudges.map((n) => (
              <p key={n.id} className="text-xs text-gray-400">
                {new Date(n.created_at).toLocaleString()} – {n.message || "Reminder sent"}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Medication Schedule: Daily / Weekly / Monthly */}
      <div className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-gray-700">
          Medication Schedule
        </h2>
        <MedicationScheduleView
          medications={meds ?? []}
          doses={allDoses as any[]}
        />
      </div>

      {/* Timeline */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-700">
          7-Day Dose Timeline
        </h2>
        {sortedDates.length === 0 ? (
          <div className="card py-8 text-center text-gray-400">
            No dose data available.
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDates.map(([date, dayDoses]) => (
              <div key={date} className="card">
                <h3 className="mb-2 font-semibold text-gray-800">
                  {formatDateMY(date)}
                </h3>
                <div className="space-y-1">
                  {dayDoses.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm"
                    >
                      <span>
                        {d.status === "taken"
                          ? "✅"
                          : d.status === "skipped"
                            ? "⏭️"
                            : d.status === "missed"
                              ? "❌"
                              : "⏳"}
                      </span>
                      <span className="font-medium text-gray-700">
                        {d.med_name}
                      </span>
                      {d.critical && (
                        <span className="rounded bg-red-100 px-1 py-0.5 text-[10px] font-bold text-red-700">
                          CRITICAL
                        </span>
                      )}
                      <span className="text-gray-400">
                        {formatTimeMY(d.scheduled_at)}
                      </span>
                      <span
                        className={`ml-auto rounded px-2 py-0.5 text-xs font-semibold ${d.status === "taken"
                          ? "bg-emerald-100 text-emerald-700"
                          : d.status === "skipped"
                            ? "bg-orange-100 text-orange-700"
                            : d.status === "missed"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                      >
                        {getStatusLabel(d.status)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
