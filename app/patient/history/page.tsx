import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatDateMY } from "@/lib/time";
import AdherenceChart from "@/components/AdherenceChart";
import StreakBadge from "@/components/StreakBadge";

export default async function PatientHistoryPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = getSupabaseAdmin();

  // Get doses from the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: doses } = await supabase
    .from("scheduled_doses")
    .select("*")
    .eq("patient_id", user.id)
    .gte("scheduled_at", sevenDaysAgo.toISOString())
    .order("scheduled_at", { ascending: true });

  const allDoses = doses ?? [];

  // Group by date
  const byDate: Record<string, { taken: number; total: number }> = {};
  for (const d of allDoses) {
    const dateKey = new Date(d.scheduled_at).toISOString().split("T")[0];
    if (!byDate[dateKey]) byDate[dateKey] = { taken: 0, total: 0 };
    byDate[dateKey].total++;
    if (d.status === "taken") byDate[dateKey].taken++;
  }

  // Build chart data for last 7 days
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const day = byDate[key] ?? { taken: 0, total: 0 };
    chartData.push({
      label: formatDateMY(d),
      percentage: day.total > 0 ? Math.round((day.taken / day.total) * 100) : 0,
      total: day.total,
      taken: day.taken,
    });
  }

  // Calculate streak (consecutive days with 100% adherence going backwards)
  let streak = 0;
  for (let i = chartData.length - 1; i >= 0; i--) {
    if (chartData[i].total > 0 && chartData[i].percentage === 100) {
      streak++;
    } else if (chartData[i].total > 0) {
      break;
    }
    // skip days with no doses
  }

  // Overall adherence
  const totalDoses = allDoses.length;
  const takenDoses = allDoses.filter((d) => d.status === "taken").length;
  const adherencePercent =
    totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

  const missedDoses = allDoses.filter((d) => d.status === "missed").length;
  const skippedDoses = allDoses.filter((d) => d.status === "skipped").length;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Weekly Adherence
      </h1>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card text-center">
          <p className="text-3xl font-extrabold text-blue-600">
            {adherencePercent}%
          </p>
          <p className="text-sm text-gray-500">Adherence Rate</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-extrabold text-emerald-600">
            {takenDoses}
          </p>
          <p className="text-sm text-gray-500">Complete</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-extrabold text-red-600">{missedDoses}</p>
          <p className="text-sm text-gray-500">Missed</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-extrabold text-orange-600">
            {skippedDoses}
          </p>
          <p className="text-sm text-gray-500">Skipped</p>
        </div>
      </div>

      {/* Streak */}
      <div className="mb-8">
        <StreakBadge streak={streak} />
      </div>

      {/* Chart */}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-gray-700">
          Last 7 Days
        </h2>
        <AdherenceChart data={chartData} />
      </div>
    </div>
  );
}
