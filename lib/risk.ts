import type { RiskLevel } from "./types";

interface RiskInput {
  missedLast48h: number;
  criticalMissed: number;
  medsCount: number;
  age: number; // in years
}

export function calculateRiskScore(input: RiskInput): number {
  let score = 0;
  score += input.missedLast48h * 10;
  score += input.criticalMissed * 25;
  if (input.medsCount >= 5) score += 10;
  if (input.age >= 60) score += 10;
  return score;
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 40) return "RED";
  if (score >= 20) return "YELLOW";
  return "GREEN";
}

export function riskColor(level: RiskLevel) {
  switch (level) {
    case "RED":
      return { bg: "bg-red-100", text: "text-red-800", border: "border-red-300" };
    case "YELLOW":
      return { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-300" };
    case "GREEN":
      return { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-300" };
  }
}
