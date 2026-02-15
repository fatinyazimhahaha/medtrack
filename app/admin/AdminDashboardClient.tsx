"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  registerPatient,
  registerStaff,
  linkPatientToDoctor,
  unlinkPatientFromDoctor,
  updateUserProfile,
} from "./actions";

interface Profile {
  id: string;
  full_name: string;
  username: string;
  role: string;
  mrn: string | null;
  phone: string | null;
  dob: string | null;
  created_at: string;
  created_at_display: string;
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
  frontdesk: Profile[];
  admins: Profile[];
}

type ActiveTab = "overview" | "register-patient" | "register-staff";

// Admin dashboard with frontdesk support
export default function AdminDashboardClient({
  profiles,
  links,
  patients,
  doctors,
  frontdesk,
  admins,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editingUser, setEditingUser] = useState<Profile | null>(null);

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

  async function handleRegisterStaff(formData: FormData) {
    const result = await registerStaff(formData);
    if (result.error) {
      showMessage("error", result.error);
    } else {
      showMessage("success", result.message || "Staff registered!");
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

  async function handleUpdateUser(formData: FormData) {
    const result = await updateUserProfile(formData);
    if (result.error) {
      showMessage("error", result.error);
    } else {
      showMessage("success", result.message || "User updated!");
      setEditingUser(null);
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

  // Filtered profiles for the overview table
  const filteredProfiles = useMemo(() => {
    let result = profiles;

    // Filter by role
    if (roleFilter !== "all") {
      result = result.filter((p) => p.role === roleFilter);
    }

    // Filter by search query (name, username, or MRN)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          (p.full_name && p.full_name.toLowerCase().includes(q)) ||
          (p.username && p.username.toLowerCase().includes(q)) ||
          (p.mrn && p.mrn.toLowerCase().includes(q))
      );
    }

    return result;
  }, [profiles, searchQuery, roleFilter]);

  const staff = [...doctors];

  // Build a map: patient_id -> doctor name(s)
  const patientDoctorMap = useMemo(() => {
    const map: Record<string, { linkId: string; doctorName: string }[]> = {};
    for (const link of links) {
      if (!map[link.patient_id]) map[link.patient_id] = [];
      map[link.patient_id].push({
        linkId: link.id,
        doctorName: profileName(link.doctor_id),
      });
    }
    return map;
  }, [links, profiles]);

  const tabs: { key: ActiveTab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "register-patient", label: "Register Patient" },
    { key: "register-staff", label: "Register Staff" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage users, register patients, and assign patients to doctors.
        </p>
      </div>

      {/* Workflow banner */}
      <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800 font-medium">Workflow:</p>
        <p className="text-sm text-blue-700 mt-1">
          <strong>Admin</strong> registers doctors &amp; patients, assigns patients to doctors &rarr;{" "}
          <strong>Doctor</strong> keys in medications &rarr;{" "}
          <strong>Patient</strong> logs daily doses &rarr;{" "}
          <strong>Doctor</strong> monitors compliance
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

      {/* ── OVERVIEW TAB ── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Patients" count={patients.length} color="blue" />
            <StatCard label="Doctors" count={doctors.length} color="green" />
            <StatCard label="Admins" count={admins.length} color="amber" />
          </div>

          {/* All users table */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 space-y-3">
              <h2 className="font-semibold text-gray-900">All Users ({profiles.length})</h2>

              {/* Search & filter controls */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search input */}
                <div className="relative flex-1">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" strokeLinecap="round" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, username, or MRN..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Role filter pills */}
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { value: "all", label: "All" },
                    { value: "patient", label: "Patient" },
                    { value: "doctor", label: "Doctor" },
                    { value: "admin", label: "Admin" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setRoleFilter(opt.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        roleFilter === opt.value
                          ? "bg-[var(--accent)] text-white shadow-sm"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Result count */}
              {(searchQuery || roleFilter !== "all") && (
                <p className="text-xs text-gray-400">
                  Showing {filteredProfiles.length} of {profiles.length} users
                </p>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-gray-500">Name</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500">Username</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500">Role</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500">Doctor</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500">MRN</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500">Phone</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500">DOB</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500">Created</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredProfiles.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">{p.full_name || "—"}</td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">{p.username || "—"}</td>
                      <td className="px-4 py-3">
                        <RoleBadge role={p.role} />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {p.role === "patient" ? (
                          patientDoctorMap[p.id]?.length ? (
                            <div className="flex flex-wrap gap-1">
                              {patientDoctorMap[p.id].map((d) => (
                                <span
                                  key={d.linkId}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200"
                                >
                                  {d.doctorName}
                                  <button
                                    onClick={() => handleUnlink(d.linkId)}
                                    disabled={isPending}
                                    className="ml-0.5 text-green-400 hover:text-red-500 disabled:opacity-50"
                                    title="Remove assignment"
                                  >
                                    &times;
                                  </button>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-300 text-xs">Unassigned</span>
                          )
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{p.mrn || "—"}</td>
                      <td className="px-4 py-3 text-gray-500">{p.phone || "—"}</td>
                      <td className="px-4 py-3 text-gray-500">{p.dob || "—"}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {p.created_at_display}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setEditingUser(p)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredProfiles.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center text-gray-400 py-8">
                        {searchQuery || roleFilter !== "all"
                          ? "No users match the current filter."
                          : "No users registered yet."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ── REGISTER PATIENT TAB ── */}
      {activeTab === "register-patient" && (
        <div className="space-y-6">
          {/* Register new patient form */}
          <div className="card max-w-xl lg:max-w-3xl">
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
                  placeholder="e.g. ahmad"
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

              {/* Assign to doctor on registration */}
              {staff.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign to Doctor (optional)
                  </label>
                  <select
                    name="doctor_id"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none"
                  >
                    <option value="">— No assignment —</option>
                    {staff.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.full_name} ({d.role})
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

          {/* Assign existing patient to doctor */}
          {patients.length > 0 && staff.length > 0 && (
            <div className="card max-w-xl lg:max-w-3xl">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Assign Existing Patient to Doctor</h2>
              <p className="text-sm text-gray-500 mb-5">
                Link a registered patient to a doctor for prescription &amp; monitoring.
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
                    {staff.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {isPending ? "Assigning..." : "Assign Patient to Doctor"}
                </button>
              </form>
            </div>
          )}

          {/* Current assignments list */}
          {links.length > 0 && (
            <div className="card overflow-hidden max-w-xl lg:max-w-3xl">
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
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── REGISTER STAFF TAB ── */}
      {activeTab === "register-staff" && (
        <div className="card max-w-xl lg:max-w-3xl">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Register Staff</h2>
          <p className="text-sm text-gray-500 mb-6">
            Create accounts for doctors, front desk staff, or additional admins.
          </p>
          <form action={handleRegisterStaff} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                name="full_name"
                required
                placeholder="e.g. Dr. Siti Aminah"
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
                placeholder="e.g. siti"
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role <span className="text-red-400">*</span>
              </label>
              <select
                name="role"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none"
              >
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="btn-primary w-full disabled:opacity-50"
            >
              {isPending ? "Registering..." : "Register Staff"}
            </button>
          </form>
        </div>
      )}

      {/* ── EDIT USER MODAL ── */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          isPending={isPending}
          onClose={() => setEditingUser(null)}
          onSubmit={handleUpdateUser}
          doctors={doctors}
          assignedDoctors={patientDoctorMap[editingUser.id] || []}
          onLink={handleLink}
          onUnlink={handleUnlink}
        />
      )}
    </div>
  );
}

/* ── Edit User Modal ─────────────────────────────────────── */

function EditUserModal({
  user,
  isPending,
  onClose,
  onSubmit,
  doctors,
  assignedDoctors,
  onLink,
  onUnlink,
}: {
  user: Profile;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  doctors: Profile[];
  assignedDoctors: { linkId: string; doctorName: string }[];
  onLink: (formData: FormData) => Promise<void>;
  onUnlink: (linkId: string) => Promise<void>;
}) {
  const [fullName, setFullName] = useState(user.full_name || "");
  const [role, setRole] = useState(user.role);
  const [mrn, setMrn] = useState(user.mrn || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [dob, setDob] = useState(user.dob || "");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("user_id", user.id);
    fd.set("full_name", fullName);
    fd.set("role", role);
    fd.set("mrn", mrn);
    fd.set("phone", phone);
    fd.set("dob", dob);
    if (newPassword) fd.set("new_password", newPassword);
    onSubmit(fd);
  }

  function handleAssignDoctor() {
    if (!selectedDoctorId) return;
    const fd = new FormData();
    fd.set("patient_id", user.id);
    fd.set("doctor_id", selectedDoctorId);
    onLink(fd);
    setSelectedDoctorId("");
  }

  const inputClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Edit User</h2>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{user.username}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role <span className="text-red-400">*</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={inputClass}
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* MRN & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">MRN</label>
              <input
                type="text"
                value={mrn}
                onChange={(e) => setMrn(e.target.value)}
                placeholder="e.g. M00044439"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+60123456789"
                className={inputClass}
              />
            </div>
          </div>

          {/* DOB */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Doctor Assignment (patients only) */}
          {(role === "patient") && doctors.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h3 className="text-sm font-semibold text-gray-700">Assigned Doctor</h3>
              </div>

              {/* Current assignments */}
              {assignedDoctors.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {assignedDoctors.map((d) => (
                    <span
                      key={d.linkId}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200"
                    >
                      {d.doctorName}
                      <button
                        type="button"
                        onClick={() => onUnlink(d.linkId)}
                        disabled={isPending}
                        className="text-green-400 hover:text-red-500 disabled:opacity-50"
                        title="Remove assignment"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Assign new doctor */}
              <div className="flex gap-2">
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className={inputClass + " flex-1"}
                >
                  <option value="">Select doctor to assign...</option>
                  {doctors
                    .filter((doc) => !assignedDoctors.some((a) => a.doctorName === doc.full_name))
                    .map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.full_name}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={handleAssignDoctor}
                  disabled={isPending || !selectedDoctorId}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  Assign
                </button>
              </div>
              {assignedDoctors.length === 0 && (
                <p className="text-xs text-amber-500 mt-2">No doctor assigned yet.</p>
              )}
            </div>
          )}

          {/* Password section */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <h3 className="text-sm font-semibold text-gray-700">Change Password</h3>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave empty to keep current password"
                className={inputClass + " pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {newPassword && newPassword.length < 6 && (
              <p className="text-xs text-red-500 mt-1">Password must be at least 6 characters</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !fullName.trim() || (newPassword.length > 0 && newPassword.length < 6)}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────── */

function StatCard({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: "blue" | "green" | "purple" | "amber";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-sm font-medium opacity-80">{label}</p>
    </div>
  );
}

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
