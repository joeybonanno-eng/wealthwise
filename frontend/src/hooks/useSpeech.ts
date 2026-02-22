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

export interface VoiceSettings {
  voiceName: string | null;
  rate: number;
  autoPlay: boolean;
}

const DEFAULT_SETTINGS: VoiceSettings = {
  voiceName: null,
  rate: 1.0,
  autoPlay: true,
};

function loadSettings(): VoiceSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem("ww-voice-settings");
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: VoiceSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("ww-voice-settings", JSON.stringify(settings));
  } catch {}
}

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [settings, setSettingsState] = useState<VoiceSettings>(DEFAULT_SETTINGS);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load settings from localStorage
  useEffect(() => {
    setSettingsState(loadSettings());
  }, []);

  // Load available voices
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const loadVoices = () => {
      const available = window.speechSynthesis
        .getVoices()
        .filter((v) => v.lang.startsWith("en"));
      setVoices(available);
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const updateSettings = useCallback((partial: Partial<VoiceSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  }, []);

  const getVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (typeof window === "undefined" || !window.speechSynthesis) return null;

    const allVoices = window.speechSynthesis.getVoices();

    // If user selected a voice, use it
    if (settings.voiceName) {
      const selected = allVoices.find((v) => v.name === settings.voiceName);
      if (selected) return selected;
    }

    // Fallback to preferred voices
    const preferred = [
      "Samantha", "Karen", "Daniel", "Google US English", "Google UK English Female",
      "Microsoft Zira", "Microsoft David", "Alex",
    ];

    for (const name of preferred) {
      const voice = allVoices.find((v) => v.name.includes(name));
      if (voice) return voice;
    }

    const englishVoice = allVoices.find((v) => v.lang.startsWith("en"));
    return englishVoice || allVoices[0] || null;
  }, [settings.voiceName]);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;

      window.speechSynthesis.cancel();

      const cleanText = stripMarkdown(text);
      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = settings.rate;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const voice = getVoice();
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [getVoice, settings.rate]
  );

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking, voices, settings, updateSettings };
}
