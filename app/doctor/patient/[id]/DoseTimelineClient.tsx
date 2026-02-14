"use client";

import { useState, useMemo } from "react";
import { formatDateMY, formatTimeMY } from "@/lib/time";
import { getStatusLabel } from "@/lib/statusLabel";

type DoseItem = {
  id: string;
  med_name: string;
  scheduled_at: string;
  status: string;
  critical: boolean;
  note: string | null;
};

type DayDoses = [string, DoseItem[]];

type FilterOption = "missed-skipped" | "all" | "pending" | "taken" | "missed" | "skipped";

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: "missed-skipped", label: "Missed & Skipped" },
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "taken", label: "Taken" },
  { value: "missed", label: "Missed" },
  { value: "skipped", label: "Skipped" },
];

function matchesFilter(status: string, filter: FilterOption): boolean {
  if (filter === "all") return true;
  if (filter === "missed-skipped") return status === "missed" || status === "skipped";
  return status === filter;
}

interface Props {
  sortedDates: DayDoses[];
}

export default function DoseTimelineClient({ sortedDates }: Props) {
  const [filter, setFilter] = useState<FilterOption>("missed-skipped");

  const filteredDates = useMemo(() => {
    return sortedDates
      .map(([date, dayDoses]) => {
        const filtered = dayDoses.filter((d) => matchesFilter(d.status, filter));
        return [date, filtered] as DayDoses;
      })
      .filter(([, doses]) => doses.length > 0);
  }, [sortedDates, filter]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-gray-700">
          7-Day Dose Timeline
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === opt.value
                  ? "bg-[var(--accent)] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {filteredDates.length === 0 ? (
        <div className="card py-8 text-center text-gray-400">
          No doses match the selected filter ({FILTER_OPTIONS.find((o) => o.value === filter)?.label}).
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDates.map(([date, dayDoses]) => (
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
                      className={`ml-auto rounded px-2 py-0.5 text-xs font-semibold ${
                        d.status === "taken"
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
  );
}
