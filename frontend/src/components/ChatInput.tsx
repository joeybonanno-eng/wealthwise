"use client";

import { FormEvent, useState, useRef, useEffect } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input, interimTranscript]);

  // Append finalized transcript to input
  useEffect(() => {
    if (transcript) {
      setInput((prev) => {
        const separator = prev && !prev.endsWith(" ") ? " " : "";
        return prev + separator + transcript;
      });
    }
  }, [transcript]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function toggleMic() {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }

  // Show interim text as placeholder-style preview
  const displayValue =
    isListening && interimTranscript
      ? input + (input && !input.endsWith(" ") ? " " : "") + interimTranscript
      : input;

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-1.5 sm:gap-2 p-2 sm:p-4">
      <textarea
        ref={textareaRef}
        value={displayValue}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about stocks, market trends, or financial advice..."
        disabled={disabled}
        rows={1}
        className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none disabled:opacity-50 text-[16px] sm:text-base"
      />

      {/* Mic button — only shown if browser supports speech recognition */}
      {isSupported && (
        <button
          type="button"
          onClick={toggleMic}
          disabled={disabled}
          className="relative w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-400 hover:text-white hover:bg-gray-800"
          title={isListening ? "Stop recording" : "Voice input"}
        >
          {isListening && (
            <span className="absolute inset-0 rounded-xl bg-red-500/20 animate-ping" />
          )}
          <svg
            className={`w-5 h-5 relative z-10 ${isListening ? "text-red-400" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-14 0m7 7v4m-4 0h8M12 1a3 3 0 00-3 3v7a3 3 0 006 0V4a3 3 0 00-3-3z"
            />
          </svg>
        </button>
      )}

      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className="w-11 h-11 flex-shrink-0 flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
      >
        {disabled ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        )}
      </button>
    </form>
  );
}
