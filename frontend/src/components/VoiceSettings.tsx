"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { VoiceSettings as VoiceSettingsType } from "@/hooks/useSpeech";

interface VoiceSettingsProps {
  open: boolean;
  onClose: () => void;
  voices: SpeechSynthesisVoice[];
  settings: VoiceSettingsType;
  onUpdate: (partial: Partial<VoiceSettingsType>) => void;
  isSpeaking: boolean;
  onTestVoice: () => void;
  onStopVoice: () => void;
}

const SPEED_OPTIONS = [
  { label: "0.5x", value: 0.5 },
  { label: "0.75x", value: 0.75 },
  { label: "1x", value: 1.0 },
  { label: "1.25x", value: 1.25 },
  { label: "1.5x", value: 1.5 },
  { label: "2x", value: 2.0 },
];

export default function VoiceSettings({
  open,
  onClose,
  voices,
  settings,
  onUpdate,
  isSpeaking,
  onTestVoice,
  onStopVoice,
}: VoiceSettingsProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-4 sm:right-6 z-50 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-white">Voice Settings</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Auto-play toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">Auto-play responses</label>
                <button
                  onClick={() => onUpdate({ autoPlay: !settings.autoPlay })}
                  className={`relative w-10 h-6 rounded-full transition-colors ${
                    settings.autoPlay ? "bg-emerald-600" : "bg-gray-700"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.autoPlay ? "translate-x-4" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Voice selection */}
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Voice</label>
                <select
                  value={settings.voiceName || ""}
                  onChange={(e) => onUpdate({ voiceName: e.target.value || null })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Auto (best available)</option>
                  {voices.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>

              {/* Speed control */}
              <div>
                <label className="block text-sm text-gray-300 mb-1.5">Speed</label>
                <div className="flex gap-1">
                  {SPEED_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => onUpdate({ rate: opt.value })}
                      className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${
                        settings.rate === opt.value
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Test voice */}
              <button
                onClick={isSpeaking ? onStopVoice : onTestVoice}
                className="w-full py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isSpeaking ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
                    </svg>
                    Stop
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Test Voice
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
