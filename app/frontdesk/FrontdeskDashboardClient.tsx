"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  registerPatient,
  linkPatientToDoctor,
  unlinkPatientFromDoctor,
} from "./actions";

interface Profile {
  id: string;
  full_name: string;
  role: string;
  mrn: string | null;
  phone: string | null;
  dob: string | null;
  created_at: string;
}

interface Link {
  id: string;
  patient_id: string;
  doctor_id: string;
  created_at: string;
}

interface Props {
  profiles: Profile[];
  links: Link[];
  patients: Profile[];
  doctors: Profile[];
}

type ActiveTab = "register-patient" | "link";

export default function FrontdeskDashboardClient({
  profiles,
  links,
  patients,
  doctors,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<ActiveTab>("register-patient");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 6000);
  }

  async function handleRegisterPatient(formData: FormData) {
    const result = await registerPatient(formData);
    if (result.error) {
      showMessage("error", result.error);
    } else {
      showMessage("success", result.message || "Patient registered!");
      startTransition(() => router.refresh());
    }
  }

  async function handleLink(formData: FormData) {
    const result = await linkPatientToDoctor(formData);
    if (result.error) {
      showMessage("error", result.error);
    } else {
      showMessage("success", result.message || "Linked!");
      startTransition(() => router.refresh());
    }
  }

  async function handleUnlink(linkId: string) {
    const fd = new FormData();
    fd.set("link_id", linkId);
    const result = await unlinkPatientFromDoctor(fd);
    if (result.error) {
      showMessage("error", result.error);
    } else {
      showMessage("success", result.message || "Unlinked!");
      startTransition(() => router.refresh());
    }
  }

  // Helper to find profile name by ID
  function profileName(id: string) {
    return profiles.find((p) => p.id === id)?.full_name || id.slice(0, 8);
  }
  function profileRole(id: string) {
    return profiles.find((p) => p.id === id)?.role || "unknown";
  }

  const tabs: { key: ActiveTab; label: string }[] = [
    { key: "register-patient", label: "Register Patient" },
    { key: "link", label: "Assign Patient to Doctor" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Front Desk Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Register patients and assign them to doctors.
        </p>
      </div>

      {/* Toast message */}
      {message && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── REGISTER PATIENT TAB ── */}
      {activeTab === "register-patient" && (
        <div className="card max-w-xl">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Register New Patient</h2>
          <p className="text-sm text-gray-500 mb-6">
            Create a patient account. They can log in with the username &amp; password you set.
          </p>
          <form action={handleRegisterPatient} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                name="full_name"
                required
                placeholder="e.g. AHMAD BIN ALI"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username <span className="text-red-400">*</span>
              </label>
              <input
                name="username"
                type="text"
                required
                placeholder="e.g. ahmad123"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                name="password"
                type="text"
                placeholder="Default: medtrack123"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">Leave empty for default password: medtrack123</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">MRN</label>
                <input
                  name="mrn"
                  placeholder="e.g. M00044439"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  name="phone"
                  placeholder="e.g. +60123456789"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input
                name="dob"
                type="date"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none"
              />
            </div>

            {/* Optional: Assign to doctor on registration */}
            {doctors.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign to Doctor (optional)
                </label>
                <select
                  name="doctor_id"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none"
                >
                  <option value="">— No assignment —</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.full_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="btn-primary w-full disabled:opacity-50"
            >
              {isPending ? "Registering..." : "Register Patient"}
            </button>
          </form>
        </div>
      )}

      {/* ── LINK TAB ── */}
      {activeTab === "link" && (
        <div className="space-y-6">
          <div className="card max-w-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Assign Patient to Doctor</h2>
            <p className="text-sm text-gray-500 mb-6">
              Link a patient to a doctor so they can prescribe medications and monitor compliance.
            </p>
            <form action={handleLink} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient <span className="text-red-400">*</span>
                </label>
                <select
                  name="patient_id"
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none"
                >
                  <option value="">Select patient...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} {p.mrn ? `(${p.mrn})` : ""}
                    </option>
                  ))}
                </select>
                {patients.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    No patients registered yet. Register a patient first.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Doctor <span className="text-red-400">*</span>
                </label>
                <select
                  name="doctor_id"
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none"
                >
                  <option value="">Select doctor...</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.full_name}
                    </option>
                  ))}
                </select>
                {doctors.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    No doctors registered yet. Contact admin.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isPending || patients.length === 0 || doctors.length === 0}
                className="btn-primary w-full disabled:opacity-50"
              >
                {isPending ? "Linking..." : "Assign Patient"}
              </button>
            </form>
          </div>

          {/* Current assignments */}
          <div className="card overflow-hidden max-w-xl">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm">
                Current Assignments ({links.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-50">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">
                      {profileName(link.patient_id)}
                    </span>
                    <span className="text-gray-400 mx-2">&rarr;</span>
                    <span className="text-gray-700">
                      {profileName(link.doctor_id)}
                    </span>
                    <span className="ml-1">
                      <RoleBadge role={profileRole(link.doctor_id)} />
                    </span>
                  </div>
                  <button
                    onClick={() => handleUnlink(link.id)}
                    disabled={isPending}
                    className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {links.length === 0 && (
                <div className="text-center text-gray-400 py-6 text-sm">
                  No assignments yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────── */

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    patient: "bg-blue-100 text-blue-700",
    doctor: "bg-green-100 text-green-700",
    frontdesk: "bg-purple-100 text-purple-700",
    admin: "bg-amber-100 text-amber-700",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
        styles[role] || "bg-gray-100 text-gray-600"
      }`}
    >
      {role}
    </span>
  );
}
