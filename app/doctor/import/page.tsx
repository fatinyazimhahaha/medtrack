import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import ImportMedsForm from "@/components/ImportMedsForm";
import { importDischargeMeds } from "./actions";

export default async function DoctorImportPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <a
          href="/doctor"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          ← Back to Dashboard
        </a>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Import Discharge Medications
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Paste or upload the JSON prescription data from the hospital system.
          This will create the patient profile, medication plan, and generate
          scheduled doses for the next 7 days.
        </p>
      </div>

      <div className="card">
        <ImportMedsForm importAction={importDischargeMeds} />
      </div>
    </div>
  );
}
