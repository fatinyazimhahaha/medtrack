interface StreakBadgeProps {
  streak: number;
}

export default function StreakBadge({ streak }: StreakBadgeProps) {
  const emoji = streak >= 7 ? "🔥" : streak >= 3 ? "⚡" : "💪";

  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2">
      <span className="text-2xl">{emoji}</span>
      <div>
        <p className="text-lg font-bold text-orange-700">{streak}-day streak</p>
        <p className="text-xs text-orange-500">
          {streak >= 7
            ? "Amazing! Keep it up!"
            : streak >= 3
            ? "Great consistency!"
            : "Keep going!"}
        </p>
      </div>
    </div>
  );
}
