"use client";

const topics = [
  "Stock Analysis",
  "ETFs & Index Funds",
  "Cryptocurrency",
  "Real Estate",
  "Retirement Planning",
  "Tax Optimization",
  "Budgeting",
  "Options Trading",
  "Sector Analysis",
  "Global Markets",
  "Dividend Investing",
  "Technical Analysis",
];

interface TopicsStepProps {
  selected: string[];
  onChange: (topics: string[]) => void;
}

export default function TopicsStep({ selected, onChange }: TopicsStepProps) {
  function toggle(topic: string) {
    onChange(
      selected.includes(topic)
        ? selected.filter((t) => t !== topic)
        : [...selected, topic]
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">What interests you?</h2>
        <p className="mt-2 text-gray-400">
          Select topics you&apos;d like to explore
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
        {topics.map((topic) => (
          <button
            key={topic}
            onClick={() => toggle(topic)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              selected.includes(topic)
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                : "border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300"
            }`}
          >
            {topic}
          </button>
        ))}
      </div>
    </div>
  );
}
