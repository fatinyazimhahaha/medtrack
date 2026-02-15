"use client";

import { useState, useTransition, useEffect } from "react";
import { prescribeMeds, type PrescribeFormData } from "./actions";

interface AssignedPatient {
  id: string;
  full_name: string;
  mrn: string | null;
}

interface MedEntry {
  id: number;
  med_name: string;
  dose: string;
  route: string;
  freq: string;
  times: string[];
  critical: boolean;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
}

const ROUTES = ["PO", "SC", "IM", "IV", "PR", "SL", "TOP", "INH"];
const FREQS = ["OD", "BD", "TDS", "QID", "QHS", "PRN", "STAT"];
const TIME_SLOTS = [
  { value: "06:00", label: "06:00 AM" },
  { value: "08:00", label: "08:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "14:00", label: "02:00 PM" },
  { value: "18:00", label: "06:00 PM" },
  { value: "22:00", label: "10:00 PM" },
];

const COMMON_MEDS = [
  "METFORMIN 500MG TAB",
  "METFORMIN 1000MG TAB",
  "AMLODIPINE 5MG TAB",
  "AMLODIPINE 10MG TAB",
  "LOSARTAN 50MG TAB",
  "LOSARTAN 100MG TAB",
  "ASPIRIN 100MG TAB",
  "CARDIPRIN 100MG TAB",
  "CLOPIDOGREL 75MG TAB",
  "PLAVIX 75MG TAB",
  "ATORVASTATIN 20MG TAB",
  "ATORVASTATIN 40MG TAB",
  "ATOZET 10/40MG TAB",
  "WARFARIN 2MG TAB",
  "WARFARIN 5MG TAB",
  "BISOPROLOL 2.5MG TAB",
  "BISOPROLOL 5MG TAB",
  "PERINDOPRIL 4MG TAB",
  "OMEPRAZOLE 20MG CAP",
  "PANTOPRAZOLE 40MG TAB",
  "PREDNISOLONE 5MG TAB",
  "INSULIN GLARGINE 100IU/ML",
  "LEVOTHYROXINE 50MCG TAB",
  "SIMVASTATIN 20MG TAB",
  "FOLIC ACID 5MG TAB",
];

function emptyMed(id: number, defaultStart: string, defaultEnd: string): MedEntry {
  return {
    id,
    med_name: "",
    dose: "",
    route: "PO",
    freq: "OD",
    times: ["08:00"],
    critical: false,
    start_date: defaultStart,
    start_time: "08:00",
    end_date: defaultEnd,
    end_time: "22:00",
  };
}

/** Calculate days between two date strings */
function daysBetween(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  const diff = e.getTime() - s.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24))) + 1;
}

export default function PrescribeForm({ patients }: { patients: AssignedPatient[] }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string; pres_no?: string } | null>(null);

  // Patient selection
  const [selectedPatientId, setSelectedPatientId] = useState("");

  // Default dates
  const [defaultStart, setDefaultStart] = useState("");
  const [defaultEnd, setDefaultEnd] = useState("");

  useEffect(() => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 6);
    const endStr = endDate.toISOString().split("T")[0];
    setDefaultStart(todayStr);
    setDefaultEnd(endStr);
  }, []);

  // Medications
  const [meds, setMeds] = useState<MedEntry[]>([]);
  const [nextId, setNextId] = useState(2);

  // Initialize first med when defaults are ready
  useEffect(() => {
    if (defaultStart && defaultEnd && meds.length === 0) {
      setMeds([emptyMed(1, defaultStart, defaultEnd)]);
    }
  }, [defaultStart, defaultEnd, meds.length]);

  // Med suggestions
  const [activeSuggestion, setActiveSuggestion] = useState<number | null>(null);

  function addMed() {
    setMeds([...meds, emptyMed(nextId, defaultStart, defaultEnd)]);
    setNextId(nextId + 1);
  }

  function removeMed(id: number) {
    if (meds.length <= 1) return;
    setMeds(meds.filter((m) => m.id !== id));
  }

  function updateMed(id: number, field: keyof MedEntry, value: unknown) {
    setMeds(
      meds.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  }

  function toggleTime(id: number, time: string) {
    const med = meds.find((m) => m.id === id);
    if (!med) return;
    const times = med.times.includes(time)
      ? med.times.filter((t) => t !== time)
      : [...med.times, time].sort();
    updateMed(id, "times", times);
  }

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  // Total doses across all meds
  const totalDoses = meds.reduce((sum, m) => {
    const days = daysBetween(m.start_date, m.end_date);
    return sum + m.times.length * days;
  }, 0);

  function handleSubmit() {
    setResult(null);
    if (!selectedPatientId) {
      setResult({ success: false, message: "Please select a patient." });
      return;
    }
    const data: PrescribeFormData = {
      patient_id: selectedPatientId,
      medications: meds.map((m) => ({
        med_name: m.med_name,
        dose: m.dose,
        route: m.route,
        freq: m.freq,
        times: m.times,
        critical: m.critical,
        start_date: m.start_date,
        start_time: m.start_time,
        end_date: m.end_date,
        end_time: m.end_time,
      })),
    };

    startTransition(async () => {
      const res = await prescribeMeds(data);
      setResult(res);
      if (res.success) {
        // Reset form
        setSelectedPatientId("");
        setMeds([emptyMed(nextId, defaultStart, defaultEnd)]);
        setNextId(nextId + 1);
      }
    });
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Select Patient ── */}
      <section className="card p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
            1
          </div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            Select Patient
          </h2>
        </div>

        <div>
          <label className="form-label">Patient *</label>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="form-input"
          >
            <option value="">— Select a patient —</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name} {p.mrn ? `(${p.mrn})` : ""}
              </option>
            ))}
          </select>
          {selectedPatient && (
            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-sm text-blue-800">
                <strong>{selectedPatient.full_name}</strong>
                {selectedPatient.mrn && (
                  <span className="ml-2 text-blue-600">MRN: {selectedPatient.mrn}</span>
                )}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Medications ── */}
      <section className="card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-bold shrink-0">
              2
            </div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Medications
            </h2>
          </div>
          <button
            type="button"
            onClick={addMed}
            className="btn-secondary text-sm w-full sm:w-auto shrink-0"
          >
            + Add Medication
          </button>
        </div>

        <div className="space-y-6">
          {meds.map((med, idx) => (
            <div
              key={med.id}
              className="relative rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 sm:p-5"
            >
              {/* Remove button */}
              {meds.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMed(med.id)}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Remove medication"
                >
                  &times;
                </button>
              )}

              <p className="text-xs font-semibold text-[var(--text-muted)] mb-3">
                MEDICATION #{idx + 1}
              </p>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Med Name with autocomplete */}
                <div className="sm:col-span-2 lg:col-span-2 relative">
                  <label className="form-label">Medication Name *</label>
                  <input
                    type="text"
                    value={med.med_name}
                    onChange={(e) => {
                      updateMed(med.id, "med_name", e.target.value);
                      setActiveSuggestion(med.id);
                    }}
                    onFocus={() => setActiveSuggestion(med.id)}
                    onBlur={() => setTimeout(() => setActiveSuggestion(null), 200)}
                    placeholder="Type to search (e.g. Metformin, Aspirin...)"
                    className="form-input"
                    autoComplete="off"
                  />
                  {activeSuggestion === med.id && med.med_name.length >= 2 && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto rounded-lg border border-[var(--border)] bg-white shadow-lg">
                      {COMMON_MEDS.filter((m) =>
                        m.toLowerCase().includes(med.med_name.toLowerCase())
                      ).map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors"
                          onMouseDown={() => {
                            updateMed(med.id, "med_name", suggestion);
                            setActiveSuggestion(null);
                          }}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dose */}
                <div>
                  <label className="form-label">Dose *</label>
                  <input
                    type="text"
                    value={med.dose}
                    onChange={(e) => updateMed(med.id, "dose", e.target.value)}
                    placeholder="e.g. 1 tab, 500 mg"
                    className="form-input"
                  />
                </div>

                {/* Route */}
                <div>
                  <label className="form-label">Route</label>
                  <select
                    value={med.route}
                    onChange={(e) => updateMed(med.id, "route", e.target.value)}
                    className="form-input"
                  >
                    {ROUTES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Frequency */}
                <div>
                  <label className="form-label">Frequency</label>
                  <select
                    value={med.freq}
                    onChange={(e) => updateMed(med.id, "freq", e.target.value)}
                    className="form-input"
                  >
                    {FREQS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Critical toggle */}
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={med.critical}
                      onChange={(e) =>
                        updateMed(med.id, "critical", e.target.checked)
                      }
                      className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm font-medium text-red-700">
                      Critical Medication
                    </span>
                  </label>
                </div>
              </div>

              {/* Time slots */}
              <div className="mt-4">
                <label className="form-label">Scheduled Times *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot.value}
                      type="button"
                      onClick={() => toggleTime(med.id, slot.value)}
                      className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-all ${
                        med.times.includes(slot.value)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Per-medication date range */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="form-label text-blue-700 font-bold mb-3 block">
                  Schedule Period
                </label>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="form-label text-xs">Start Date</label>
                    <input
                      type="date"
                      value={med.start_date}
                      onChange={(e) => updateMed(med.id, "start_date", e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label text-xs">Start Time</label>
                    <input
                      type="time"
                      value={med.start_time}
                      onChange={(e) => updateMed(med.id, "start_time", e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label text-xs">End Date</label>
                    <input
                      type="date"
                      value={med.end_date}
                      onChange={(e) => updateMed(med.id, "end_date", e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label text-xs">End Time</label>
                    <input
                      type="time"
                      value={med.end_time}
                      onChange={(e) => updateMed(med.id, "end_time", e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {daysBetween(med.start_date, med.end_date)} day(s) &middot;{" "}
                  {med.times.length} time(s)/day &middot;{" "}
                  <strong>{med.times.length * daysBetween(med.start_date, med.end_date)} doses</strong>
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Summary + Submit ── */}
      <section className="card bg-blue-50 border-blue-200 p-4 sm:p-6">
        <h3 className="text-sm font-bold text-blue-800 mb-2">Prescription Summary</h3>
        <p className="text-sm text-blue-700">
          Patient: <strong>{selectedPatient?.full_name || "—"}</strong>
          {selectedPatient?.mrn && <span> (MRN: {selectedPatient.mrn})</span>}
          <br />
          Medications: <strong>{meds.length}</strong> &middot; Total doses:{" "}
          <strong>{totalDoses}</strong>
        </p>
        {meds.length > 0 && (
          <div className="mt-3 space-y-1">
            {meds.map((m, i) => (
              <p key={m.id} className="text-xs text-blue-600">
                {i + 1}. {m.med_name || "(unnamed)"} — {m.dose || "?"} {m.route} {m.freq}
                &nbsp;({m.start_date} → {m.end_date}, {daysBetween(m.start_date, m.end_date)} days)
              </p>
            ))}
          </div>
        )}
        <p className="text-xs text-blue-500 mt-2 italic">
          A unique Prescription No (Pres No) will be generated on save.
        </p>
      </section>

      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="btn-primary w-full py-4 text-base"
      >
        {isPending ? "Saving prescription..." : "Save Prescription & Generate Doses"}
      </button>

      {/* Result */}
      {result && (
        <div
          className={`rounded-xl border p-5 text-sm whitespace-pre-wrap ${
            result.success
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-red-300 bg-red-50 text-red-800"
          }`}
        >
          {result.pres_no && (
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-emerald-200 px-3 py-1 text-xs font-bold text-emerald-900">
                {result.pres_no}
              </span>
            </div>
          )}
          {result.message}
        </div>
      )}

      {/* Form field styles */}
      <style jsx>{`
        :global(.form-label) {
          display: block;
          margin-bottom: 0.25rem;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        :global(.form-input) {
          display: block;
          width: 100%;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg, 0.75rem);
          background: white;
          color: var(--text-primary);
          transition: border-color 0.2s;
        }
        :global(.form-input:focus) {
          outline: none;
          border-color: var(--accent, #3b82f6);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        :global(.form-input::placeholder) {
          color: var(--text-muted, #9ca3af);
        }
      `}</style>
    </div>
  );
}
