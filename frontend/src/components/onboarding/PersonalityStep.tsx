"use client";

const communicationLevels = [
  {
    id: "elementary",
    label: "Elementary School",
    description: "Simple words, everyday analogies",
    icon: "🎈",
  },
  {
    id: "high_school",
    label: "High School",
    description: "Plain language, terms explained",
    icon: "📖",
  },
  {
    id: "college",
    label: "College",
    description: "Standard financial terminology",
    icon: "🎓",
  },
  {
    id: "phd",
    label: "PhD",
    description: "Advanced quant analysis & theory",
    icon: "🔬",
  },
];

const advisorTones = [
  {
    id: "friendly",
    label: "Friendly",
    description: "Warm, encouraging, supportive",
    icon: "😊",
  },
  {
    id: "professional",
    label: "Professional",
    description: "Formal, data-driven, precise",
    icon: "💼",
  },
  {
    id: "mentor",
    label: "Mentor",
    description: "Educational, teaches concepts",
    icon: "🧑‍🏫",
  },
  {
    id: "casual",
    label: "Casual",
    description: "Relaxed, conversational, fun",
    icon: "😎",
  },
];

interface PersonalityStepProps {
  communicationLevel: string;
  advisorTone: string;
  onChangeCommunication: (level: string) => void;
  onChangeTone: (tone: string) => void;
}

export default function PersonalityStep({
  communicationLevel,
  advisorTone,
  onChangeCommunication,
  onChangeTone,
}: PersonalityStepProps) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Customize Your Advisor</h2>
        <p className="mt-2 text-gray-400">
          How should WealthWise communicate with you?
        </p>
      </div>

      {/* Communication Level */}
      <div className="max-w-lg mx-auto">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
          Communication Level
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {communicationLevels.map((level) => (
            <button
              key={level.id}
              onClick={() => onChangeCommunication(level.id)}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                communicationLevel === level.id
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
              }`}
            >
              <span className="text-xl">{level.icon}</span>
              <div>
                <p className="text-sm font-medium">{level.label}</p>
                <p className="text-xs text-gray-500">{level.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Advisor Tone */}
      <div className="max-w-lg mx-auto">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
          Advisor Tone
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {advisorTones.map((tone) => (
            <button
              key={tone.id}
              onClick={() => onChangeTone(tone.id)}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                advisorTone === tone.id
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
              }`}
            >
              <span className="text-xl">{tone.icon}</span>
              <div>
                <p className="text-sm font-medium">{tone.label}</p>
                <p className="text-xs text-gray-500">{tone.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
