"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s/g, "") // headers
    .replace(/\*\*([^*]+)\*\*/g, "$1") // bold
    .replace(/\*([^*]+)\*/g, "$1") // italic
    .replace(/__([^_]+)__/g, "$1") // bold alt
    .replace(/_([^_]+)_/g, "$1") // italic alt
    .replace(/~~([^~]+)~~/g, "$1") // strikethrough
    .replace(/`([^`]+)`/g, "$1") // inline code
    .replace(/```[\s\S]*?```/g, "") // code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1") // images
    .replace(/^\s*[-*+]\s/gm, "") // unordered list
    .replace(/^\s*\d+\.\s/gm, "") // ordered list
    .replace(/^\s*>\s/gm, "") // blockquotes
    .replace(/---+/g, "") // horizontal rules
    .replace(/\|/g, " ") // table pipes
    .replace(/\n{2,}/g, ". ") // double newlines to sentence breaks
    .replace(/\n/g, " ") // single newlines to spaces
    .trim();
}

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const getPreferredVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (typeof window === "undefined" || !window.speechSynthesis) return null;

    const voices = window.speechSynthesis.getVoices();
    // Prefer natural-sounding English voices
    const preferred = [
      "Samantha", "Karen", "Daniel", "Google US English", "Google UK English Female",
      "Microsoft Zira", "Microsoft David", "Alex",
    ];

    for (const name of preferred) {
      const voice = voices.find((v) => v.name.includes(name));
      if (voice) return voice;
    }

    // Fallback: first English voice
    const englishVoice = voices.find((v) => v.lang.startsWith("en"));
    return englishVoice || voices[0] || null;
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;

      // Cancel any current speech
      window.speechSynthesis.cancel();

      const cleanText = stripMarkdown(text);
      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const voice = getPreferredVoice();
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [getPreferredVoice]
  );

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking };
}
