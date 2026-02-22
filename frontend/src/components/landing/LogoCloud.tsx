"use client";

import AnimatedSection from "./AnimatedSection";

const publications = [
  "Bloomberg",
  "Reuters",
  "Wall Street Journal",
  "Financial Times",
  "CNBC",
  "Forbes",
];

export default function LogoCloud() {
  return (
    <AnimatedSection className="py-16 border-y border-gray-800/50">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <p className="text-sm text-gray-500 uppercase tracking-widest mb-8">
          Trusted by investors who read
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          {publications.map((name) => (
            <span
              key={name}
              className="text-xl font-semibold text-gray-600 hover:text-gray-400 transition-colors"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}
