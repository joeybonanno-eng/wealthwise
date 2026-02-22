"use client";

interface WelcomeStepProps {
  name: string;
  onChange: (name: string) => void;
}

export default function WelcomeStep({ name, onChange }: WelcomeStepProps) {
  return (
    <div className="text-center space-y-8">
      <div>
        <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
            />
          </svg>
        </div>
        <h2 className="text-3xl font-bold">
          Welcome to <span className="gradient-text">WealthWise</span>
        </h2>
        <p className="mt-3 text-gray-400">
          Let&apos;s personalize your experience. This takes about 2 minutes.
        </p>
      </div>

      <div className="max-w-sm mx-auto">
        <label className="block text-sm font-medium text-gray-300 mb-2 text-left">
          What should we call you?
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center text-lg"
          placeholder="Your first name"
          autoFocus
        />
      </div>
    </div>
  );
}
