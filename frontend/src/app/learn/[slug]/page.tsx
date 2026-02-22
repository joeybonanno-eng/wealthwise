"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import apiClient from "@/lib/api-client";

interface Lesson {
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  read_time: string;
  content: string;
}

export default function LessonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const slug = params?.slug as string;
    if (!slug) return;
    apiClient
      .getLesson(slug)
      .then(setLesson)
      .catch(() => router.push("/learn"))
      .finally(() => setLoading(false));
  }, [params, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
      </div>
    );
  }

  if (!lesson) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24 md:pb-8">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => router.push("/learn")}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Lessons
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {lesson.title}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 capitalize">
              {lesson.difficulty}
            </span>
            <span className="text-xs text-gray-500">{lesson.read_time}</span>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-emerald max-w-none prose-headings:text-white prose-p:text-gray-300 prose-li:text-gray-300 prose-strong:text-white prose-blockquote:border-emerald-500 prose-blockquote:text-gray-400 prose-th:text-gray-300 prose-td:text-gray-400 prose-table:text-sm">
          <ReactMarkdown>{lesson.content}</ReactMarkdown>
        </div>

        {/* Navigation */}
        <div className="mt-12 pt-6 border-t border-gray-800 flex justify-between">
          <button
            onClick={() => router.push("/learn")}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
          >
            All Lessons
          </button>
          <button
            onClick={() => router.push("/chat")}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm transition-colors"
          >
            Ask AI About This Topic
          </button>
        </div>
      </div>
    </div>
  );
}
