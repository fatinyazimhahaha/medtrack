import Link from "next/link";

export const metadata = {
  title: "API Documentation — MedTrack MY",
  description: "Integration guide for pre-existing clinics using MedTrack doctor and patient roles.",
};

export default function ApiDocsPage() {
  const importExample = {
    patient: {
      full_name: "Ahmad Ali",
      mrn: "M0004499",
      phone: "+60129441105",
      dob: "2024-12-01",
    },
    plan: {
      start_date: "2026-02-14",
      end_date: null,
    },
    meds: [
      {
        med_name: "METFORMIN 500MG TAB",
        dose: "1 tab",
        route: "PO",
        times: ["06:00", "12:00", "18:00"],
        freq: "TDS",
        critical: false,
      },
      {
        med_name: "ATORVASTATIN 20MG TAB",
        dose: "2 tab",
        route: "PO",
        times: ["08:00"],
        freq: "OD",
        critical: false,
      },
    ],
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <Link href="/" className="text-sm text-blue-600 hover:text-blue-800">
          ← Back to Home
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          API Documentation
        </h1>
        <p className="mt-2 text-gray-600">
          Integration guide for pre-existing clinics using MedTrack&apos;s <strong>Doctor</strong> and{" "}
          <strong>Patient</strong> roles.
        </p>
      </div>

      <div className="space-y-10">
        {/* Overview */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Overview</h2>
          <p className="mt-3 text-gray-600">
            MedTrack MY allows existing clinics to integrate their doctor and patient workflows. Doctors can
            prescribe medications and import discharge data; patients can view their schedule and log doses
            (Complete or Skipped). This document describes the data formats and workflows for clinic integration.
          </p>
        </section>

        {/* Doctor Role */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Doctor Role</h2>
          <p className="mt-3 text-gray-600">
            Doctors manage assigned patients, prescribe medications, and import discharge data from
            hospital or clinic systems.
          </p>
          <h3 className="mt-6 font-semibold text-gray-800">Workflow</h3>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-gray-600">
            <li>Admin registers the doctor and assigns patients via the Admin dashboard.</li>
            <li>Doctor logs in and sees assigned patients on the Doctor Dashboard.</li>
            <li>Doctor prescribes meds (or imports discharge JSON) → creates medication plans and scheduled doses.</li>
            <li>Patient receives today&apos;s schedule and logs doses (Complete / Skipped).</li>
          </ol>

          <h3 className="mt-6 font-semibold text-gray-800">Import JSON Format</h3>
          <p className="mt-2 text-sm text-gray-600">
            From the Doctor Import page (<code className="rounded bg-gray-100 px-1 py-0.5">/doctor/import</code>),
            paste a JSON payload to bulk-create a patient, medication plan, and scheduled doses.
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            {JSON.stringify(importExample, null, 2)}
          </pre>
          <div className="mt-3 space-y-1 text-sm text-gray-600">
            <p><strong>patient:</strong> full_name, mrn, phone, dob (YYYY-MM-DD)</p>
            <p><strong>plan:</strong> start_date, end_date (optional)</p>
            <p><strong>meds:</strong> Array of med_name, dose, route, times (HH:mm 24h), freq, critical (boolean)</p>
            <p><strong>times:</strong> e.g. ["06:00","12:00","18:00"] for TDS; ["08:00"] for OD</p>
          </div>
        </section>

        {/* Patient Role */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Patient Role</h2>
          <p className="mt-3 text-gray-600">
            Patients view their daily medication schedule and log each dose as <strong>Complete</strong> or{" "}
            <strong>Skipped</strong>. Doctors can see adherence on the patient detail page.
          </p>
          <h3 className="mt-6 font-semibold text-gray-800">Patient Flow</h3>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-gray-600">
            <li>Patient logs in with username (e.g. ahmad1234) and password.</li>
            <li>Today&apos;s Medications: List of doses grouped by time, with Complete / Skipped buttons.</li>
            <li>History: Weekly adherence chart and dose counts.</li>
            <li>Dose status: pending → taken (Complete) or skipped.</li>
          </ol>
        </section>

        {/* Data Schema */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Data Schema</h2>
          <p className="mt-3 text-gray-600">
            Key tables used by Doctor and Patient roles:
          </p>
          <ul className="mt-4 space-y-3 text-sm text-gray-700">
            <li><code className="rounded bg-gray-100 px-1.5 py-0.5">profiles</code> — full_name, role, mrn, phone, dob</li>
            <li><code className="rounded bg-gray-100 px-1.5 py-0.5">patient_doctor</code> — Links patient_id to doctor_id</li>
            <li><code className="rounded bg-gray-100 px-1.5 py-0.5">medication_plans</code> — patient_id, pres_no, start_date, end_date</li>
            <li><code className="rounded bg-gray-100 px-1.5 py-0.5">medications</code> — plan_id, med_name, dose, route, times[], freq, critical</li>
            <li><code className="rounded bg-gray-100 px-1.5 py-0.5">scheduled_doses</code> — medication_id, patient_id, scheduled_at, status (pending|taken|skipped|missed)</li>
          </ul>
        </section>

        {/* Setup */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Clinic Setup</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-gray-600">
            <li>Admin creates doctor and patient accounts (Register Staff / Register Patient).</li>
            <li>Admin assigns patients to doctors (Register Patient tab → assign Doctor).</li>
            <li>Doctor imports discharge JSON or prescribes via the Prescribe form.</li>
            <li>Patients log in and use the Today / History views to manage adherence.</li>
          </ol>
          <p className="mt-4 text-sm text-gray-500">
            For programmatic integration, contact MedTrack for API keys and webhook support.
          </p>
        </section>
      </div>
    </div>
  );
}
