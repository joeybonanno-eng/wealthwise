"use client";

const levels = [
  { id: "very_conservative", label: "Very Conservative", color: "bg-blue-500" },
  { id: "conservative", label: "Conservative", color: "bg-teal-500" },
  { id: "moderate", label: "Moderate", color: "bg-yellow-500" },
  { id: "aggressive", label: "Aggressive", color: "bg-orange-500" },
  { id: "very_aggressive", label: "Very Aggressive", color: "bg-red-500" },
];

interface RiskToleranceStepProps {
  selected: string;
  onChange: (level: string) => void;
}

export default function RiskToleranceStep({
  selected,
  onChange,
}: RiskToleranceStepProps) {
  const selectedIndex = levels.findIndex((l) => l.id === selected);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold">What&apos;s your risk tolerance?</h2>
        <p className="mt-2 text-gray-400">
          How comfortable are you with market volatility?
        </p>
      </div>

      <div className="max-w-lg mx-auto space-y-6">
        {/* Visual slider bar */}
        <div className="relative h-3 rounded-full bg-gray-800 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
            style={{
              width: `${((selectedIndex + 1) / levels.length) * 100}%`,
              background:
                "linear-gradient(to right, #3b82f6, #14b8a6, #eab308, #f97316, #ef4444)",
            }}
          />
        </div>

        {/* Options */}
        <div className="grid grid-cols-5 gap-2">
          {levels.map((level) => (
            <button
              key={level.id}
              onClick={() => onChange(level.id)}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                selected === level.id
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-gray-700/50 hover:border-gray-600"
              }`}
            >
              <div className={`w-4 h-4 rounded-full ${level.color}`} />
              <span className="text-xs text-center leading-tight">
                {level.label}
              </span>
            </button>
          ))}
        </div>

        {/* Description */}
        {selected && (
          <div className="text-center p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
            <p className="text-sm text-gray-300">
              {selected === "very_conservative" &&
                "Prefer stable, low-risk investments like bonds and savings. Priority is capital preservation."}
              {selected === "conservative" &&
                "Mostly low-risk with some growth. Comfortable with minor market fluctuations."}
              {selected === "moderate" &&
                "Balanced mix of growth and stability. Comfortable with moderate market swings."}
              {selected === "aggressive" &&
                "Growth-focused portfolio. Comfortable with significant short-term volatility for long-term gains."}
              {selected === "very_aggressive" &&
                "Maximum growth potential. Willing to accept major volatility and potential losses for highest returns."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
