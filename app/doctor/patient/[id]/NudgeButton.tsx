"use client";

import { useState, useTransition } from "react";
import { getSupabaseBrowser } from "@/lib/supabaseBrowser";

interface NudgeButtonProps {
  patientId: string;
  doctorId: string;
  patientName: string;
}

export default function NudgeButton({
  patientId,
  doctorId,
  patientName,
}: NudgeButtonProps) {
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState(
    `Hi ${patientName}, please remember to take your medications on time. Your health matters!`
  );

  function handleSend() {
    startTransition(async () => {
      const supabase = getSupabaseBrowser();
      await supabase.from("nudge_logs").insert({
        doctor_id: doctorId,
        patient_id: patientId,
        message,
      });
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    });
  }

  return (
    <div className="space-y-2">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={2}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
      />
      <button
        onClick={handleSend}
        disabled={isPending || sent}
        className={`btn-primary text-sm ${sent ? "bg-emerald-600" : ""}`}
      >
        {sent
          ? "✅ Nudge Sent!"
          : isPending
          ? "Sending..."
          : "📩 Send Nudge"}
      </button>
      <p className="text-xs text-gray-400">
        (Mocked — logs the nudge but doesn&apos;t send real SMS)
      </p>
    </div>
  );
}
