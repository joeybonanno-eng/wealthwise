"use client";

const timelines = [
  {
    id: "short",
    label: "Short Term",
    range: "1-3 years",
    icon: "⚡",
    description: "Quick wins and near-term goals",
  },
  {
    id: "medium",
    label: "Medium Term",
    range: "3-7 years",
    icon: "📅",
    description: "Building towards mid-range milestones",
  },
  {
    id: "long",
    label: "Long Term",
    range: "7-15 years",
    icon: "🎯",
    description: "Steady growth for major life goals",
  },
  {
    id: "very_long",
    label: "Very Long Term",
    range: "15+ years",
    icon: "🏔️",
    description: "Retirement and generational wealth",
  },
];

interface TimelineStepProps {
  selected: string;
  onChange: (timeline: string) => void;
}

export default function TimelineStep({ selected, onChange }: TimelineStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Investment Timeline</h2>
        <p className="mt-2 text-gray-400">
          When do you plan to use these investments?
        </p>
      </div>

      <div className="space-y-3 max-w-lg mx-auto">
        {timelines.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
              selected === t.id
                ? "border-emerald-500 bg-emerald-500/10"
                : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
            }`}
          >
            <span className="text-3xl">{t.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{t.label}</p>
                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  {t.range}
                </span>
              </div>
              <p className="text-sm text-gray-400">{t.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
