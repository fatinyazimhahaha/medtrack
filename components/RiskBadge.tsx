import type { RiskLevel } from "@/lib/types";
import { riskColor } from "@/lib/risk";

interface RiskBadgeProps {
  level: RiskLevel;
  score: number;
}

export default function RiskBadge({ level, score }: RiskBadgeProps) {
  const c = riskColor(level);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${c.bg} ${c.text} ${c.border}`}
      title={`Risk score: ${score}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          level === "RED"
            ? "bg-red-500"
            : level === "YELLOW"
            ? "bg-yellow-500"
            : "bg-emerald-500"
        }`}
      />
      {level} ({score})
    </span>
  );
}
