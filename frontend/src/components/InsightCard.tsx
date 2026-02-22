"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Insight } from "@/hooks/useInsights";

const typeIcons: Record<string, JSX.Element> = {
  opportunity: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  suggestion: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  milestone: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z" />
    </svg>
  ),
  nudge: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  ),
};

const urgencyColors: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  medium: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  low: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const typeColors: Record<string, string> = {
  opportunity: "text-emerald-400",
  warning: "text-red-400",
  suggestion: "text-amber-400",
  milestone: "text-blue-400",
  nudge: "text-purple-400",
};

interface InsightCardProps {
  insight: Insight;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
}

export default function InsightCard({ insight, onAccept, onDismiss }: InsightCardProps) {
  const [showReasoning, setShowReasoning] = useState(false);

  const actions: string[] = (() => {
    if (!insight.actions) return [];
    try {
      return JSON.parse(insight.actions);
    } catch {
      return [];
    }
  })();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3 }}
      className="bg-gray-800/80 border border-gray-700 rounded-xl p-4 hover:border-emerald-500/30 transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className={typeColors[insight.type] || "text-gray-400"}>
            {typeIcons[insight.type] || typeIcons.suggestion}
          </span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
              urgencyColors[insight.urgency] || urgencyColors.medium
            }`}
          >
            {insight.urgency}
          </span>
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {insight.impact} impact
        </span>
      </div>

      {/* Title */}
      <h3 className="text-white font-semibold mb-1">{insight.title}</h3>

      {/* Body */}
      <p className="text-gray-300 text-sm leading-relaxed mb-3">{insight.body}</p>

      {/* Confidence bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Confidence</span>
          <span>{Math.round(insight.confidence * 100)}%</span>
        </div>
        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${insight.confidence * 100}%` }}
          />
        </div>
      </div>

      {/* Reasoning toggle */}
      <button
        onClick={() => setShowReasoning(!showReasoning)}
        className="text-xs text-gray-400 hover:text-emerald-400 transition-colors mb-3 flex items-center gap-1"
      >
        <svg
          className={`w-3 h-3 transition-transform ${showReasoning ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Why am I seeing this?
      </button>

      <AnimatePresence>
        {showReasoning && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-xs text-gray-400 bg-gray-900/50 rounded-lg p-3 mb-3">
              {insight.reasoning}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggested actions */}
      {actions.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Suggested actions:</p>
          <ul className="space-y-1">
            {actions.map((action, idx) => (
              <li key={idx} className="text-xs text-gray-300 flex items-start gap-1.5">
                <span className="text-emerald-400 mt-0.5">&#8226;</span>
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 pt-2 border-t border-gray-700/50">
        <button
          onClick={() => onAccept(insight.id)}
          className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors font-medium"
        >
          Got it
        </button>
        <button
          onClick={() => onDismiss(insight.id)}
          className="py-1.5 px-3 text-gray-400 hover:text-white hover:bg-gray-700 text-sm rounded-lg transition-colors"
        >
          Dismiss
        </button>
      </div>
    </motion.div>
  );
}
