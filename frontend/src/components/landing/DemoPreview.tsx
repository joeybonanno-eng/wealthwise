"use client";

import { useEffect, useRef, useState } from "react";
import AnimatedSection from "./AnimatedSection";

const conversation = [
  {
    role: "user" as const,
    text: "Compare NVDA vs AMD for a growth portfolio",
  },
  {
    role: "assistant" as const,
    text: `**NVIDIA (NVDA) vs AMD — Growth Analysis**

📊 **NVDA** is trading at ~$875 with a 52-week gain of +215%. Its AI/data center revenue grew 409% YoY, dominating the GPU compute market with ~80% share.

📊 **AMD** trades at ~$178 with a 52-week gain of +68%. Its MI300X chips are gaining traction, and data center revenue grew 38% QoQ.

**My take for your profile:**
Given your *aggressive* risk tolerance and *long-term* timeline, NVDA offers stronger AI momentum, but AMD provides a better entry point at a lower P/E ratio.

Consider a **70/30 NVDA/AMD split** to capture upside while hedging on AMD's catching-up potential.`,
  },
];

export default function DemoPreview() {
  const [visibleChars, setVisibleChars] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const assistantText = conversation[1].text;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) setStarted(true);
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    // Start typing after a short delay (simulating user message appearing first)
    const delay = setTimeout(() => {
      const timer = setInterval(() => {
        setVisibleChars((prev) => {
          if (prev >= assistantText.length) {
            clearInterval(timer);
            return prev;
          }
          return prev + 2;
        });
      }, 15);
      return () => clearInterval(timer);
    }, 800);
    return () => clearTimeout(delay);
  }, [started, assistantText.length]);

  return (
    <section id="demo" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection className="text-center mb-16">
          <p className="text-sm text-emerald-400 uppercase tracking-widest mb-4">
            Live Preview
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold">
            See <span className="gradient-text">WealthWise</span> in Action
          </h2>
        </AnimatedSection>

        <AnimatedSection>
          <div
            ref={ref}
            className="max-w-3xl mx-auto rounded-2xl glass-card overflow-hidden glow-emerald"
          >
            {/* Chat header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-800/50">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-medium text-gray-300">
                WealthWise AI
              </span>
              <span className="text-xs text-gray-500">Online</span>
            </div>

            {/* Messages */}
            <div className="p-6 space-y-4 min-h-[400px]">
              {/* User message */}
              <div className="flex justify-end">
                <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-br-md bg-emerald-600 text-white text-sm">
                  {conversation[0].text}
                </div>
              </div>

              {/* Assistant message with typing effect */}
              {started && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-bl-md bg-gray-800/80 text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">
                    {assistantText.slice(0, visibleChars)}
                    {visibleChars < assistantText.length && (
                      <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse ml-0.5" />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Input bar */}
            <div className="px-6 py-4 border-t border-gray-800/50">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700/50">
                <span className="text-gray-500 text-sm flex-1">
                  Ask about any stock, ETF, or strategy...
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
