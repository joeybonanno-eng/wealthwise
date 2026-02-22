"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import InsightCard from "@/components/InsightCard";
import { useInsights } from "@/hooks/useInsights";
import apiClient from "@/lib/api-client";

export default function AdvisorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { insights, loading, generating, generate, accept, dismiss } = useInsights();
  const [profile, setProfile] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.accessToken) {
      apiClient.setToken(session.accessToken);
      apiClient.getProfile().then(setProfile).catch(() => {});
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
      </div>
    );
  }

  const savingsRate =
    profile?.annual_income && profile?.monthly_expenses
      ? Math.round(
          ((profile.annual_income / 12 - profile.monthly_expenses) /
            (profile.annual_income / 12)) *
            100
        )
      : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/chat")}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold">
              <span className="text-emerald-400">Advisor</span> Console
            </h1>
          </div>
          <span className="text-sm text-gray-500">{session?.user?.name}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Financial Pulse */}
        {profile && (
          <div>
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
              Financial Pulse
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Total Savings</p>
                <p className="text-xl font-bold text-emerald-400">
                  {profile.total_savings != null
                    ? `$${Number(profile.total_savings).toLocaleString()}`
                    : "--"}
                </p>
              </div>
              <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Monthly Savings Rate</p>
                <p className="text-xl font-bold text-emerald-400">
                  {savingsRate != null ? `${savingsRate}%` : "--"}
                </p>
              </div>
              <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Total Debt</p>
                <p className="text-xl font-bold text-red-400">
                  {profile.total_debt != null
                    ? `$${Number(profile.total_debt).toLocaleString()}`
                    : "--"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={generate}
              disabled={generating}
              className="flex items-center gap-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Insights
                </>
              )}
            </button>
            <button
              onClick={() => router.push("/chat")}
              className="flex items-center gap-2 py-2 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium border border-gray-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Go to Chat
            </button>
          </div>
        </div>

        {/* Intelligence Feed */}
        <div>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
            Intelligence Feed
          </h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
            </div>
          ) : insights.length === 0 ? (
            <div className="text-center py-16 bg-gray-800/40 border border-gray-700 rounded-xl">
              <svg
                className="w-12 h-12 text-gray-600 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              <h3 className="text-gray-400 font-medium mb-2">No insights yet</h3>
              <p className="text-gray-500 text-sm mb-4">
                Click &ldquo;Generate Insights&rdquo; to get personalized financial intelligence.
              </p>
              <button
                onClick={generate}
                disabled={generating}
                className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white rounded-lg transition-colors text-sm font-medium"
              >
                {generating ? "Generating..." : "Generate your first insights"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {insights.map((insight) => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    onAccept={accept}
                    onDismiss={dismiss}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
