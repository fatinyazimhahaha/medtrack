"use client";

import { useState } from "react";
import type { DoseWithMedication, Medication } from "@/lib/types";
import { extractTimeMY } from "@/lib/time";
import { getStatusLabel } from "@/lib/statusLabel";

interface MedicationScheduleGridProps {
    medications: Medication[];
    doses: DoseWithMedication[];
    date: string; // YYYY-MM-DD
}

export default function MedicationScheduleGrid({
    medications,
    doses,
    date,
}: MedicationScheduleGridProps) {
    // Hours 0-23
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Group doses by medication ID and hour
    const doseMap = new Map<string, DoseWithMedication>();
    doses.forEach((d) => {
        const time = extractTimeMY(d.scheduled_at); // HH:mm
        const hour = parseInt(time.split(":")[0], 10);
        // Key: medId-hour
        // If multiple doses in same hour, this simple map might overwrite,
        // but for this grid view we assume ~1 dose per hour per med max.
        // If needed we could store array.
        doseMap.set(`${d.medication_id}-${hour}`, d);
    });

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                <h3 className="font-semibold text-gray-900">Medication Schedule (Today)</h3>
                <p className="text-xs text-gray-500">{date}</p>
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                    <span><span className="font-semibold text-emerald-600">✓</span> Complete</span>
                    <span><span className="font-semibold text-orange-600">⏭</span> Skipped</span>
                    <span><span className="font-semibold text-red-600">✗</span> Missed</span>
                    <span><span className="font-semibold text-gray-400">○</span> Pending</span>
                </div>
            </div>

            <div className="overflow-x-auto overscroll-x-contain" style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
                <table className="w-full min-w-[800px] border-collapse text-left text-sm">
                    <thead>
                        <tr className="bg-gray-50 text-xs text-gray-500">
                            <th className="sticky left-0 z-10 w-64 min-w-[200px] border-b border-r border-gray-200 bg-gray-50 px-4 py-2 font-medium">
                                Medication
                            </th>
                            {hours.map((h) => (
                                <th
                                    key={h}
                                    className="w-10 min-w-[40px] border-b border-gray-200 px-1 py-2 text-center font-medium"
                                >
                                    {h.toString().padStart(2, "0")}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {medications.map((med) => (
                            <tr key={med.id} className="hover:bg-gray-50">
                                <td className="sticky left-0 z-10 border-r border-gray-100 bg-white px-4 py-3">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-900 line-clamp-1" title={med.med_name}>
                                            {med.med_name}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {med.dose} • {med.freq}
                                        </span>
                                        {med.critical && (
                                            <span className="mt-1 inline-flex w-fit items-center rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                                                CRITICAL
                                            </span>
                                        )}
                                    </div>
                                </td>
                                {hours.map((h) => {
                                    const dose = doseMap.get(`${med.id}-${h}`);
                                    return (
                                        <td key={h} className="border-r border-gray-50 px-1 py-2 text-center align-middle">
                                            {dose ? (
                                                <div className="flex flex-col items-center justify-center gap-0.5">
                                                    <span
                                                        title={`${getStatusLabel(dose.status)} at ${extractTimeMY(dose.scheduled_at)}`}
                                                        className={`font-semibold ${
                                                            dose.status === "taken"
                                                                ? "text-emerald-600"
                                                                : dose.status === "skipped"
                                                                ? "text-orange-600"
                                                                : dose.status === "missed"
                                                                ? "text-red-600"
                                                                : "text-gray-400"
                                                        }`}
                                                    >
                                                        {dose.status === "taken"
                                                            ? "✓"
                                                            : dose.status === "skipped"
                                                                ? "⏭"
                                                                : dose.status === "missed"
                                                                    ? "✗"
                                                                    : "○"}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-mono">
                                                        {extractTimeMY(dose.scheduled_at).split(":")[1]}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-100">·</span>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                        {medications.length === 0 && (
                            <tr>
                                <td colSpan={25} className="px-4 py-8 text-center text-gray-500">
                                    No active medications found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
