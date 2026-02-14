interface DayData {
  label: string; // e.g. "Mon", "14 Feb"
  percentage: number; // 0-100
  total: number;
  taken: number;
}

interface AdherenceChartProps {
  data: DayData[];
}

export default function AdherenceChart({ data }: AdherenceChartProps) {
  const maxBarHeight = 120;

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center text-gray-400">
        No data available yet. Start logging your doses!
      </div>
    );
  }

  return (
    <div className="flex min-h-[140px] items-end justify-between gap-1 sm:gap-2 px-0 sm:px-2 overflow-x-auto">
      {data.map((day, i) => {
        const barH = Math.max(4, (day.percentage / 100) * maxBarHeight);
        const color =
          day.percentage >= 80
            ? "bg-emerald-500"
            : day.percentage >= 50
            ? "bg-yellow-500"
            : "bg-red-500";

        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-xs font-semibold text-gray-700">
              {day.percentage}%
            </span>
            <div
              className={`w-full max-w-[40px] rounded-t-lg ${color} transition-all`}
              style={{ height: `${barH}px` }}
              title={`${day.taken}/${day.total} doses complete`}
            />
            <span className="text-[10px] text-gray-500">{day.label}</span>
          </div>
        );
      })}
    </div>
  );
}
