"use client";

import { useEffect, useRef } from "react";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";
import type { ChatMessage as ChatMessageType } from "@/hooks/useChat";

interface ChatWindowProps {
  messages: ChatMessageType[];
  loading: boolean;
  onSend: (message: string) => void;
}

export default function ChatWindow({
  messages,
  loading,
  onSend,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-emerald-600/20 flex items-center justify-center mb-4">
              <span className="text-2xl sm:text-3xl">&#128200;</span>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">
              Welcome to WealthWise
            </h2>
            <p className="text-sm sm:text-base text-gray-400 max-w-md">
              Ask me about stock prices, market trends, company fundamentals, or
              get personalized financial advice.
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 max-w-lg">
              {[
                "What's the current price of AAPL?",
                "Compare NVDA and AMD",
                "How are sectors performing today?",
                "Should I invest in index funds?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => onSend(suggestion)}
                  className="text-left px-4 py-3 bg-gray-800 hover:bg-gray-750 active:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {loading && (
          <div className="flex justify-start mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white">
                W
              </div>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-800">
        <ChatInput onSend={onSend} disabled={loading} />
      </div>
    </div>
  );
}
