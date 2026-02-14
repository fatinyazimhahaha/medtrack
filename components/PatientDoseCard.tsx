"use client";

import { useState, useTransition } from "react";
import type { DoseWithMedication } from "@/lib/types";
import { formatTimeMY } from "@/lib/time";
import { getStatusLabel } from "@/lib/statusLabel";
import {
  HourglassIcon,
  CheckIcon,
  XIcon,
  DocumentNoteIcon,
} from "@/components/icons";

interface PatientDoseCardProps {
  dose: DoseWithMedication;
  onLog: (doseId: string, status: "taken" | "skipped", note: string) => Promise<void>;
}

export default function PatientDoseCard({ dose, onLog }: PatientDoseCardProps) {
  const [note, setNote] = useState(dose.note ?? "");
  const [showNote, setShowNote] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isActed = dose.status === "taken" || dose.status === "skipped" || dose.status === "missed";

  function handleAction(status: "taken" | "skipped") {
    startTransition(async () => {
      await onLog(dose.id, status, note);
    });
  }

  const statusStyles: Record<string, string> = {
    taken: "bg-emerald-50 border-emerald-200",
    skipped: "bg-orange-50 border-orange-200",
    missed: "bg-red-50 border-red-200",
    pending: "bg-white border-gray-200 shadow-sm",
  };

  const statusIconBg: Record<string, string> = {
    taken: "bg-emerald-100 text-emerald-700",
    skipped: "bg-orange-100 text-orange-700",
    missed: "bg-red-100 text-red-700",
    pending: "bg-slate-100 text-slate-500",
  };

  return (
    <div
      className={`rounded-2xl border-2 p-4 sm:p-5 transition-all ${statusStyles[dose.status]}`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${statusIconBg[dose.status]}`}
        >
          <HourglassIcon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900">
              {dose.medications.med_name}
            </h3>
            {isActed && (
              <span
                className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold uppercase ${
                  dose.status === "taken"
                    ? "bg-emerald-200 text-emerald-800"
                    : dose.status === "skipped"
                    ? "bg-orange-200 text-orange-800"
                    : "bg-red-200 text-red-800"
                }`}
              >
                {getStatusLabel(dose.status)}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {dose.medications.dose} · {dose.medications.route} ·{" "}
            <span suppressHydrationWarning>{formatTimeMY(dose.scheduled_at)}</span>
          </p>
          {dose.medications.critical && (
            <span className="mt-2 inline-block rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700">
              Critical
            </span>
          )}
          {dose.note && (
            <p className="mt-2 text-xs italic text-gray-500">Note: {dose.note}</p>
          )}

          {/* Action buttons for pending doses */}
          {!isActed && (
            <div className="mt-4 space-y-3">
              {showNote && (
                <input
                  type="text"
                  placeholder="Optional note (e.g. nausea, forgot...)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
                />
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleAction("taken")}
                  disabled={isPending}
                  className="inline-flex flex-1 min-w-[calc(50%-6px)] sm:min-w-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-60 min-h-[44px]"
                >
                  <CheckIcon className="h-5 w-5 shrink-0" />
                  {isPending ? "..." : "Complete"}
                </button>
                <button
                  onClick={() => handleAction("skipped")}
                  disabled={isPending}
                  className="inline-flex flex-1 min-w-[calc(50%-6px)] sm:min-w-0 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-60 min-h-[44px]"
                >
                  <XIcon className="h-5 w-5 shrink-0" />
                  {isPending ? "..." : "Skipped"}
                </button>
                <button
                  onClick={() => setShowNote(!showNote)}
                  className={`inline-flex h-11 min-h-[44px] w-11 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                    showNote
                      ? "border-blue-400 bg-blue-50 text-blue-700"
                      : "border-gray-300 bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                  title="Add a note"
                >
                  <DocumentNoteIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
