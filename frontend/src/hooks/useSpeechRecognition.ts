"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  audioLevel: number;
  startListening: () => void;
  stopListening: () => void;
}

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [transcriptCount, setTranscriptCount] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  // Check support in useEffect to avoid SSR hydration mismatch
  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
    setIsSupported(supported);
  }, []);

  // Cleanup audio analysis on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startAudioAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average level (0-1)
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length / 255;
        setAudioLevel(avg);

        rafRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch {
      // Microphone access denied or unavailable — waveform won't show but STT still works
    }
  }, []);

  const stopAudioAnalysis = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setInterimTranscript("");
    };

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      setInterimTranscript(interim);

      if (final) {
        setTranscript(final);
        setTranscriptCount((c) => c + 1);
        setInterimTranscript("");
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setInterimTranscript("");
      stopAudioAnalysis();
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
      stopAudioAnalysis();
    };

    recognitionRef.current = recognition;
    recognition.start();
    startAudioAnalysis();
  }, [isSupported, startAudioAnalysis, stopAudioAnalysis]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript("");
    stopAudioAnalysis();
  }, [stopAudioAnalysis]);

  return {
    isListening,
    transcript: transcriptCount > 0 ? transcript : "",
    interimTranscript,
    isSupported,
    audioLevel,
    startListening,
    stopListening,
  };
}
