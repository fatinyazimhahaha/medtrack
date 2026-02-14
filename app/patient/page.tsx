import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { startOfDayMY, endOfDayMY, extractTimeMY, todayMY } from "@/lib/time";
import type { DoseWithMedication } from "@/lib/types";
import PatientTodayClient from "./PatientTodayClient";

export default async function PatientTodayPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = getSupabaseAdmin();
  const today = todayMY();
  const dayStart = startOfDayMY(today).toISOString();
  const dayEnd = endOfDayMY(today).toISOString();

  const { data: doses } = await supabase
    .from("scheduled_doses")
    .select("*, medications(*)")
    .eq("patient_id", user.id)
    .gte("scheduled_at", dayStart)
    .lte("scheduled_at", dayEnd)
    .order("scheduled_at", { ascending: true });

  const typedDoses = (doses ?? []) as DoseWithMedication[];

  // Group by time slot
  const grouped: Record<string, DoseWithMedication[]> = {};
  for (const dose of typedDoses) {
    const timeKey = extractTimeMY(dose.scheduled_at);
    if (!grouped[timeKey]) grouped[timeKey] = [];
    grouped[timeKey].push(dose);
  }

  const timeSlots = Object.entries(grouped).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Today&apos;s Medications
        </h1>
        <p className="mt-1 text-sm font-medium text-gray-500">{today}</p>
      </div>

      {timeSlots.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-4xl">🎉</span>
          <p className="mt-3 text-gray-500">
            No medications scheduled for today. Enjoy your day!
          </p>
        </div>
      ) : (
        <PatientTodayClient timeSlots={timeSlots} />
      )}
    </div>
  );
}
