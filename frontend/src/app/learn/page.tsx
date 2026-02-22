"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

interface Lesson {
  slug: string;
  title: string;
  description: string;
  icon: string;
  difficulty: string;
  read_time: string;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-emerald-500/20 text-emerald-400",
  intermediate: "bg-yellow-500/20 text-yellow-400",
  advanced: "bg-red-500/20 text-red-400",
};

const ICONS: Record<string, string> = {
  "pie-chart": "\u{1F4CA}",
  calendar: "\u{1F4C5}",
  layers: "\u{1F4DA}",
  shield: "\u{1F6E1}",
  "trending-up": "\u{1F4C8}",
  "file-text": "\u{1F4C4}",
  sunset: "\u{1F305}",
  "alert-triangle": "\u{26A0}",
};

export default function LearnPage() {
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .getLessons()
      .then(setLessons)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Financial Education</h1>
            <p className="text-gray-400 text-sm mt-1">
              Learn the fundamentals of personal finance and investing
            </p>
          </div>
          <button
            onClick={() => router.push("/chat")}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
          >
            Chat
          </button>
        </div>

        {/* Lesson Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lessons.map((lesson) => (
            <button
              key={lesson.slug}
              onClick={() => router.push(`/learn/${lesson.slug}`)}
              className="text-left bg-gray-800/80 border border-gray-700 rounded-xl p-5 hover:border-emerald-500/50 hover:bg-gray-800 transition-all group"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">
                  {ICONS[lesson.icon] || "\u{1F4D6}"}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold group-hover:text-emerald-400 transition-colors line-clamp-2">
                    {lesson.title}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                    {lesson.description}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        DIFFICULTY_COLORS[lesson.difficulty] || "bg-gray-700 text-gray-400"
                      }`}
                    >
                      {lesson.difficulty}
                    </span>
                    <span className="text-xs text-gray-500">
                      {lesson.read_time}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
