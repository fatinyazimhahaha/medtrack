"use client";

import { useRouter } from "next/navigation";
import PatientDoseCard from "@/components/PatientDoseCard";
import type { DoseWithMedication } from "@/lib/types";
import { updateDoseStatus } from "./actions";
import { AlarmIcon, SunriseIcon, SunIcon, MoonIcon } from "@/components/icons";

interface Props {
  timeSlots: [string, DoseWithMedication[]][];
}

/** Get time slot label and icon based on hour */
function getTimeSlotInfo(time: string): { label: string; icon: React.ReactNode } {
  const hour = parseInt(time.split(":")[0] ?? "0", 10);
  if (hour >= 5 && hour < 8) {
    return {
      label: `Early Morning (${formatTimeLabel(time)})`,
      icon: <AlarmIcon className="h-5 w-5 text-rose-500" />,
    };
  }
  if (hour >= 8 && hour < 12) {
    return {
      label: `Morning (${formatTimeLabel(time)})`,
      icon: <SunriseIcon className="h-5 w-5 text-amber-500" />,
    };
  }
  if (hour >= 12 && hour < 17) {
    return {
      label: `Afternoon (${formatTimeLabel(time)})`,
      icon: <SunIcon className="h-5 w-5 text-amber-500" />,
    };
  }
  if (hour >= 17 && hour < 21) {
    return {
      label: `Evening (${formatTimeLabel(time)})`,
      icon: <SunIcon className="h-5 w-5 text-orange-400" />,
    };
  }
  return {
    label: formatTimeLabel(time),
    icon: <MoonIcon className="h-5 w-5 text-indigo-500" />,
  };
}

function formatTimeLabel(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h ?? "0", 10);
  const min = m ?? "00";
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${min} ${ampm}`;
}

export default function PatientTodayClient({ timeSlots }: Props) {
  const router = useRouter();

  async function handleLog(
    doseId: string,
    status: "taken" | "skipped",
    note: string
  ) {
    const result = await updateDoseStatus(doseId, status, note || null);
    if (result.error) {
      console.error("Failed to update dose:", result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-10">
      {timeSlots.map(([time, doses]) => {
        const { label, icon } = getTimeSlotInfo(time);
        return (
          <section key={time} className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                {icon}
              </div>
              <h2 className="text-lg font-semibold text-gray-800">
                {label}
              </h2>
            </div>
            <div className="space-y-4">
              {doses.map((dose) => (
                <PatientDoseCard key={dose.id} dose={dose} onLog={handleLog} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
