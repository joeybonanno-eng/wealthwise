"use client";

const levels = [
  {
    id: "beginner",
    label: "Beginner",
    description: "New to investing, learning the basics",
    icon: "🌱",
  },
  {
    id: "intermediate",
    label: "Intermediate",
    description: "Familiar with stocks, ETFs, and basic strategies",
    icon: "📊",
  },
  {
    id: "advanced",
    label: "Advanced",
    description: "Active investor, understands technical analysis",
    icon: "🎯",
  },
  {
    id: "expert",
    label: "Expert",
    description: "Professional-level knowledge, complex strategies",
    icon: "🏆",
  },
];

interface ExperienceStepProps {
  selected: string;
  onChange: (level: string) => void;
}

export default function ExperienceStep({
  selected,
  onChange,
}: ExperienceStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">
          What&apos;s your investing experience?
        </h2>
        <p className="mt-2 text-gray-400">
          This helps us tailor our recommendations
        </p>
      </div>

      <div className="space-y-3 max-w-lg mx-auto">
        {levels.map((level) => (
          <button
            key={level.id}
            onClick={() => onChange(level.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
              selected === level.id
                ? "border-emerald-500 bg-emerald-500/10"
                : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
            }`}
          >
            <span className="text-3xl">{level.icon}</span>
            <div>
              <p className="font-medium">{level.label}</p>
              <p className="text-sm text-gray-400">{level.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
