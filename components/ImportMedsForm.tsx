"use client";

import { useState, useTransition } from "react";

const EXAMPLE_JSON = JSON.stringify(
  {
    patient: {
      full_name: "NOOR ZULHILMI",
      mrn: "M00044439",
      phone: "+60123456789",
      dob: "1975-04-25",
    },
    plan: { start_date: "2026-02-11", end_date: null },
    meds: [
      {
        med_name: "ATOZET 10/40MG TAB",
        dose: "1 tab",
        route: "PO",
        times: ["22:00"],
        freq: "QHS",
        critical: false,
      },
      {
        med_name: "CARDIPRIN 100MG TAB",
        dose: "1 tab",
        route: "PO",
        times: ["08:00"],
        freq: "OD",
        critical: true,
      },
      {
        med_name: "PLAVIX 75MG TAB",
        dose: "75 mg",
        route: "PO",
        times: ["08:00"],
        freq: "OD",
        critical: true,
      },
    ],
  },
  null,
  2
);

interface ImportMedsFormProps {
  importAction: (jsonStr: string) => Promise<{ success: boolean; message: string }>;
}

export default function ImportMedsForm({ importAction }: ImportMedsFormProps) {
  const [json, setJson] = useState(EXAMPLE_JSON);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setResult(null);
    startTransition(async () => {
      try {
        JSON.parse(json); // validate JSON
        const res = await importAction(json);
        setResult(res);
      } catch {
        setResult({ success: false, message: "Invalid JSON format." });
      }
    });
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setJson(ev.target?.result as string);
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Upload JSON file
        </label>
        <input
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Or paste JSON below
        </label>
        <textarea
          rows={18}
          value={json}
          onChange={(e) => setJson(e.target.value)}
          className="w-full rounded-xl border border-gray-300 p-4 font-mono text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          spellCheck={false}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="btn-primary w-full"
      >
        {isPending ? "Importing..." : "Import Discharge Meds"}
      </button>

      {result && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            result.success
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-red-300 bg-red-50 text-red-800"
          }`}
        >
          {result.message}
        </div>
      )}
    </div>
  );
}
