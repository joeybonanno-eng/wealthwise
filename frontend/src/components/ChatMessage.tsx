"use client";

import ReactMarkdown from "react-markdown";
import MarketDataCard from "./MarketDataCard";
import { useSpeech } from "@/hooks/useSpeech";
import type { ChatMessage as ChatMessageType } from "@/hooks/useChat";

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const { speak, stop, isSpeaking } = useSpeech();

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[85%] ${
          isUser
            ? "bg-emerald-600 text-white rounded-2xl rounded-br-md px-4 py-3"
            : "text-gray-100"
        }`}
      >
        {!isUser && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white">
              W
            </div>
            <span className="text-sm font-medium text-emerald-400">
              WealthWise
            </span>
          </div>
        )}

        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-li:my-0 prose-ul:my-1">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}

        {message.tool_results && message.tool_results.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.tool_results.map((tr, idx) => (
              <MarketDataCard key={idx} tool={tr.tool} result={tr.result} />
            ))}
          </div>
        )}

        {/* Voice playback button — assistant messages only */}
        {!isUser && message.content && (
          <div className="flex justify-end mt-2">
            <button
              onClick={() => (isSpeaking ? stop() : speak(message.content))}
              className="p-1.5 text-gray-500 hover:text-emerald-400 transition-colors rounded-lg hover:bg-gray-800"
              title={isSpeaking ? "Stop speaking" : "Read aloud"}
            >
              {isSpeaking ? (
                <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="4" y="4" width="4" height="16" rx="1" />
                  <rect x="10" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
