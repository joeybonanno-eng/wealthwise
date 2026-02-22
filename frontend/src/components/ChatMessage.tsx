"use client";

import ReactMarkdown from "react-markdown";
import MarketDataCard from "./MarketDataCard";
import type { ChatMessage as ChatMessageType } from "@/hooks/useChat";

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

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
      </div>
    </div>
  );
}
