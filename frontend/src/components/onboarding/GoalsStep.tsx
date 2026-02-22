"use client";

const goals = [
  { id: "retirement", icon: "🏖️", label: "Retirement" },
  { id: "home", icon: "🏠", label: "Buy a Home" },
  { id: "emergency", icon: "🛡️", label: "Emergency Fund" },
  { id: "debt", icon: "💳", label: "Pay Off Debt" },
  { id: "wealth", icon: "📈", label: "Grow Wealth" },
  { id: "education", icon: "🎓", label: "Education" },
  { id: "passive", icon: "💰", label: "Passive Income" },
  { id: "business", icon: "🚀", label: "Start a Business" },
];

interface GoalsStepProps {
  selected: string[];
  onChange: (goals: string[]) => void;
}

export default function GoalsStep({ selected, onChange }: GoalsStepProps) {
  function toggle(id: string) {
    onChange(
      selected.includes(id)
        ? selected.filter((g) => g !== id)
        : [...selected, id]
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">What are your financial goals?</h2>
        <p className="mt-2 text-gray-400">Select all that apply</p>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
        {goals.map((goal) => (
          <button
            key={goal.id}
            onClick={() => toggle(goal.id)}
            className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
              selected.includes(goal.id)
                ? "border-emerald-500 bg-emerald-500/10 text-white"
                : "border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600"
            }`}
          >
            <span className="text-2xl">{goal.icon}</span>
            <span className="text-sm font-medium">{goal.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
