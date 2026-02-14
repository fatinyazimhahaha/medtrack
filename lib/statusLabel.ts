/** Display label for dose status. "taken" shows as "Complete" for patient/doctor UI. */
export function getStatusLabel(status: string): string {
  switch (status) {
    case "taken":
      return "Complete";
    case "skipped":
      return "Skipped";
    case "missed":
      return "Missed";
    case "pending":
      return "Pending";
    default:
      return status;
  }
}
