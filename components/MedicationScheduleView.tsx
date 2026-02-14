"use client";

import { useState } from "react";
import MedicationScheduleGrid from "./MedicationScheduleGrid";
import type { DoseWithMedication, Medication } from "@/lib/types";
import { formatDateMY, formatFullDateMY, todayMY } from "@/lib/time";

type ViewMode = "daily" | "weekly" | "monthly";

interface MedicationScheduleViewProps {
  medications: Medication[];
  doses: DoseWithMedication[];
}

/** Build dose lookup: medId-dateKey -> dose */
function buildDoseMap(doses: DoseWithMedication[]) {
  const map = new Map<string, DoseWithMedication[]>();
  for (const d of doses) {
    const dateKey = new Date(d.scheduled_at).toISOString().split("T")[0];
    const key = `${d.medication_id}-${dateKey}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(d);
  }
  return map;
}

/** Get last 7 days as YYYY-MM-DD */
function getWeekDates(): string[] {
  const today = todayMY();
  const out: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().split("T")[0] ?? today);
  }
  return out;
}

/** Get days in current month as YYYY-MM-DD */
function getMonthDates(): string[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const out: string[] = [];
  for (let d = 1; d <= last.getDate(); d++) {
    const date = new Date(year, month, d);
    out.push(date.toISOString().split("T")[0] ?? "");
  }
  return out.filter(Boolean);
}

export default function MedicationScheduleView({
  medications,
  doses,
}: MedicationScheduleViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const today = todayMY();
  const dayStart = new Date(`${today}T00:00:00+08:00`).toISOString();
  const dayEnd = new Date(`${today}T23:59:59.999+08:00`).toISOString();
  const todayDoses = doses.filter(
    (d) => d.scheduled_at >= dayStart && d.scheduled_at <= dayEnd
  );

  const doseMap = buildDoseMap(doses);

  const tabs: { key: ViewMode; label: string }[] = [
    { key: "daily", label: "Daily" },
    { key: "weekly", label: "Weekly" },
    { key: "monthly", label: "Monthly" },
  ];

  return (
    <div className="space-y-4">
      {/* View selector */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setViewMode(tab.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === tab.key
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Daily: medications x hours */}
      {viewMode === "daily" && (
        <MedicationScheduleGrid
          medications={medications}
          doses={todayDoses}
          date={formatFullDateMY(today)}
        />
      )}

      {/* Weekly: medications x 7 days */}
      {viewMode === "weekly" && (
        <WeeklyScheduleGrid
          medications={medications}
          doseMap={doseMap}
          dates={getWeekDates()}
        />
      )}

      {/* Monthly: calendar with adherence per day */}
      {viewMode === "monthly" && (
        <MonthlyCalendarView doses={doses} dates={getMonthDates()} today={today} />
      )}
    </div>
  );
}

function WeeklyScheduleGrid({
  medications,
  doseMap,
  dates,
}: {
  medications: Medication[];
  doseMap: Map<string, DoseWithMedication[]>;
  dates: string[];
}) {
  const legend = (
    <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
      <span><span className="font-semibold text-emerald-600">✓</span> Complete</span>
      <span><span className="font-semibold text-orange-600">⏭</span> Skipped</span>
      <span><span className="font-semibold text-red-600">✗</span> Missed</span>
      <span><span className="font-semibold text-gray-400">○</span> Pending</span>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
        <h3 className="font-semibold text-gray-900">Medication Schedule (7 Days)</h3>
        {legend}
      </div>
      <div className="overflow-x-auto overscroll-x-contain" style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
        <table className="w-full min-w-[600px] border-collapse text-left text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500">
              <th className="sticky left-0 z-10 w-52 min-w-[180px] border-b border-r border-gray-200 bg-gray-50 px-4 py-2 font-medium">
                Medication
              </th>
              {dates.map((d) => (
                <th key={d} className="min-w-[72px] border-b border-gray-200 px-2 py-2 text-center font-medium">
                  {formatDateMY(d)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {medications.map((med) => (
              <tr key={med.id} className="hover:bg-gray-50">
                <td className="sticky left-0 z-10 border-r border-gray-100 bg-white px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900 line-clamp-1">{med.med_name}</span>
                    <span className="text-xs text-gray-500">{med.dose} · {med.freq}</span>
                  </div>
                </td>
                {dates.map((dateKey) => {
                  const dayDoses = doseMap.get(`${med.id}-${dateKey}`) ?? [];
                  // Worst status: missed > skipped > pending > taken
                  const status = dayDoses.length > 0
                    ? dayDoses.some((d) => d.status === "missed")
                      ? "missed"
                      : dayDoses.some((d) => d.status === "skipped")
                      ? "skipped"
                      : dayDoses.some((d) => d.status === "pending")
                      ? "pending"
                      : "taken"
                    : null;
                  return (
                    <td key={dateKey} className="border-r border-gray-50 px-2 py-3 text-center align-middle">
                      {status ? (
                        <span
                          className={`inline-block font-semibold ${
                            status === "taken" ? "text-emerald-600" :
                            status === "skipped" ? "text-orange-600" :
                            status === "missed" ? "text-red-600" : "text-gray-400"
                          }`}
                        >
                          {status === "taken" ? "✓" : status === "skipped" ? "⏭" : status === "missed" ? "✗" : "○"}
                        </span>
                      ) : (
                        <span className="text-gray-200">·</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {medications.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No active medications.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MonthlyCalendarView({
  doses,
  dates,
  today,
}: {
  doses: DoseWithMedication[];
  dates: string[];
  today: string;
}) {
  const now = new Date();
  const monthLabel = now.toLocaleDateString("en-MY", { month: "long", year: "numeric" });

  // First day of month - weekday (0=Sun, 1=Mon, ...)
  const firstDay = new Date(dates[0] ?? today).getDay();
  const leadingEmpty = firstDay; // padding before day 1

  const byDate: Record<string, { taken: number; skipped: number; missed: number; pending: number }> = {};
  for (const d of doses) {
    const dateKey = new Date(d.scheduled_at).toISOString().split("T")[0];
    if (!byDate[dateKey]) byDate[dateKey] = { taken: 0, skipped: 0, missed: 0, pending: 0 };
    if (d.status === "taken") byDate[dateKey].taken++;
    else if (d.status === "skipped") byDate[dateKey].skipped++;
    else if (d.status === "missed") byDate[dateKey].missed++;
    else byDate[dateKey].pending++;
  }

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
        <h3 className="font-semibold text-gray-900 capitalize">{monthLabel}</h3>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
          <span><span className="font-semibold text-emerald-600">●</span> Complete</span>
          <span><span className="font-semibold text-orange-600">●</span> Skipped</span>
          <span><span className="font-semibold text-red-600">●</span> Missed</span>
        </div>
      </div>
      <div className="p-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 mb-2">
          {weekdays.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 text-sm">
          {Array.from({ length: leadingEmpty }, (_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {dates.map((dateKey) => {
            const stats = byDate[dateKey] ?? { taken: 0, skipped: 0, missed: 0, pending: 0 };
            const total = stats.taken + stats.skipped + stats.missed + stats.pending;
            const isToday = dateKey === today;
            return (
              <div
                key={dateKey}
                className={`aspect-square flex flex-col items-center justify-center rounded-lg border transition-colors ${
                  isToday ? "border-blue-500 bg-blue-50" : "border-gray-100 hover:bg-gray-50"
                }`}
              >
                <span className={`text-xs font-medium ${isToday ? "text-blue-700" : "text-gray-700"}`}>
                  {new Date(dateKey + "T12:00:00").getDate()}
                </span>
                {total > 0 && (
                  <div className="mt-0.5 flex gap-0.5 text-[10px]">
                    {stats.taken > 0 && <span className="text-emerald-600">✓{stats.taken}</span>}
                    {stats.skipped > 0 && <span className="text-orange-600">⏭{stats.skipped}</span>}
                    {stats.missed > 0 && <span className="text-red-600">✗{stats.missed}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
