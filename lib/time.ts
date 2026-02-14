// Malaysia timezone helpers  (Asia/Kuala_Lumpur = UTC+8)
const MY_TZ = "Asia/Kuala_Lumpur";

/** Convert a Date (or ISO string) to MY locale string */
export function toMYTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-MY", { timeZone: MY_TZ });
}

/** Format to short time string e.g. "08:00 AM" */
export function formatTimeMY(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString("en-US", {
    timeZone: MY_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/** Format to short date string e.g. "14 Feb" */
export function formatDateMY(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-MY", {
    timeZone: MY_TZ,
    day: "numeric",
    month: "short",
  });
}

/** Format to full date e.g. "14 Feb 2026" */
export function formatFullDateMY(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-MY", {
    timeZone: MY_TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Get today's date in MY timezone as YYYY-MM-DD */
export function todayMY(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MY_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return parts; // e.g. "2026-02-14"
}

/** Get start of day in MY as a Date (UTC) */
export function startOfDayMY(dateStr?: string): Date {
  const d = dateStr ?? todayMY();
  return new Date(`${d}T00:00:00+08:00`);
}

/** Get end of day in MY as a Date (UTC) */
export function endOfDayMY(dateStr?: string): Date {
  const d = dateStr ?? todayMY();
  return new Date(`${d}T23:59:59.999+08:00`);
}

/** Create a timestamptz for a given date + time in MY  e.g. ("2026-02-14", "08:00") */
export function myDatetime(dateStr: string, timeStr: string): string {
  return new Date(`${dateStr}T${timeStr}:00+08:00`).toISOString();
}

/** Calculate age from DOB string */
export function ageFromDob(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/** Get HH:mm from a scheduled_at timestamptz in MY timezone */
export function extractTimeMY(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleTimeString("en-GB", {
    timeZone: MY_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
