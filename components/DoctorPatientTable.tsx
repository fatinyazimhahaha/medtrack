"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import RiskBadge from "./RiskBadge";
import type { PatientWithRisk, RiskLevel } from "@/lib/types";

interface DoctorPatientTableProps {
  patients: PatientWithRisk[];
}

export default function DoctorPatientTable({
  patients,
}: DoctorPatientTableProps) {
  const [filter, setFilter] = useState<RiskLevel | "ALL">("ALL");
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return patients.filter((p) => {
      // Risk filter
      if (filter !== "ALL" && p.risk_level !== filter) return false;
      // Critical filter
      if (criticalOnly && p.critical_missed === 0) return false;
      // Search filter (name, MRN, or pres_no)
      if (q) {
        const nameMatch = p.full_name.toLowerCase().includes(q);
        const mrnMatch = p.mrn?.toLowerCase().includes(q);
        const presMatch = p.pres_nos?.some((pn) =>
          pn.toLowerCase().includes(q)
        );
        if (!nameMatch && !mrnMatch && !presMatch) return false;
      }
      return true;
    });
  }, [patients, filter, criticalOnly, searchQuery]);

  return (
    <div>
      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by patient name, MRN, or Pres No..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-500">Filter:</span>
          {(["ALL", "RED", "YELLOW", "GREEN"] as const).map((level) => (
          <button
            key={level}
            onClick={() => setFilter(level)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              filter === level
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {level}
          </button>
        ))}
        </div>
        <label className="flex items-center gap-1.5 text-sm text-gray-600 sm:ml-2">
          <input
            type="checkbox"
            checked={criticalOnly}
            onChange={(e) => setCriticalOnly(e.target.checked)}
            className="rounded border-gray-300"
          />
          Critical meds missed
        </label>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center text-gray-400">
          {searchQuery
            ? `No patients matching "${searchQuery}".`
            : "No patients match the current filters."}
        </div>
      ) : (
        <>
          {/* Mobile: card layout */}
          <div className="sm:hidden space-y-3">
            {filtered.map((p) => (
              <Link
                key={p.id}
                href={`/doctor/patient/${p.id}`}
                className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">{p.full_name}</p>
                    <p className="text-sm text-gray-500">{p.mrn || "—"}</p>
                  </div>
                  <RiskBadge level={p.risk_level} score={p.risk_score} />
                </div>
                {p.pres_nos && p.pres_nos.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.pres_nos.map((pn) => (
                      <span
                        key={pn}
                        className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
                      >
                        {pn}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                  <span>48h missed: {p.missed_last_48h}</span>
                  <span>Critical: {p.critical_missed}</span>
                  <span>Meds: {p.meds_count}</span>
                </div>
                <p className="mt-2 text-sm font-medium text-blue-600">View →</p>
              </Link>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-200 -mx-4 sm:mx-0" style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Patient
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">MRN</th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Pres No
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">Risk</th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Missed (48h)
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Critical Missed
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Meds
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {p.full_name}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {p.mrn || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {p.pres_nos && p.pres_nos.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {p.pres_nos.map((pn) => (
                          <span
                            key={pn}
                            className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200"
                          >
                            {pn}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <RiskBadge level={p.risk_level} score={p.risk_score} />
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {p.missed_last_48h}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {p.critical_missed}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{p.meds_count}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/doctor/patient/${p.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
