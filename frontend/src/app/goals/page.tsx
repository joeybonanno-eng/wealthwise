"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

interface Drift {
  goal: string;
  expected: string;
  actual: string;
  severity: string;
  suggestion: string;
}

export default function GoalDriftPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [drifts, setDrifts] = useState<Drift[]>([]);
  const [overallStatus, setOverallStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (session?.accessToken) {
      apiClient.setToken(session.accessToken);
      apiClient
        .checkGoalDrift()
        .then((data) => {
          setDrifts(data.drifts);
          setOverallStatus(data.overall_status);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [status, session, router]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
      </div>
    );
  }

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    on_track: { label: "On Track", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
    on_track_with_notes: { label: "Mostly On Track", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
    minor_drift: { label: "Minor Drift Detected", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" },
    needs_attention: { label: "Needs Attention", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" },
  };

  const sc = statusConfig[overallStatus] || statusConfig.on_track;

  const severityColors: Record<string, string> = {
    high: "border-l-red-500",
    medium: "border-l-amber-500",
    low: "border-l-blue-500",
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24 md:pb-8">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Goal Drift Detection</h1>
            <p className="text-gray-400 text-sm mt-1">Are your finances aligned with your goals?</p>
          </div>
          <button
            onClick={() => router.push("/chat")}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
          >
            Back to Chat
          </button>
        </div>

        {/* Overall Status */}
        <div className={`border rounded-xl p-5 mb-6 ${sc.bg}`}>
          <div className="flex items-center gap-3">
            <div className={`text-3xl`}>
              {overallStatus === "on_track" ? "\u2705" : overallStatus === "needs_attention" ? "\u26A0\uFE0F" : "\uD83D\uDCCA"}
            </div>
            <div>
              <h2 className={`text-lg font-bold ${sc.color}`}>{sc.label}</h2>
              <p className="text-gray-400 text-sm">
                {drifts.length === 0
                  ? "Your financial behavior is well-aligned with your goals."
                  : `${drifts.length} area${drifts.length !== 1 ? "s" : ""} identified for review.`}
              </p>
            </div>
          </div>
        </div>

        {/* Drift Items */}
        {drifts.length > 0 ? (
          <div className="space-y-4">
            {drifts.map((d, i) => (
              <div
                key={i}
                className={`bg-gray-800/60 border border-gray-700/50 rounded-xl p-5 border-l-4 ${severityColors[d.severity] || "border-l-gray-500"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-white">{d.goal}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    d.severity === "high"
                      ? "bg-red-500/20 text-red-400"
                      : d.severity === "medium"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-blue-500/20 text-blue-400"
                  }`}>
                    {d.severity}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Expected</p>
                    <p className="text-gray-300">{d.expected}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Actual</p>
                    <p className="text-gray-300">{d.actual}</p>
                  </div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <p className="text-sm text-emerald-400">
                    <span className="font-medium">Suggestion:</span>{" "}
                    <span className="text-gray-300">{d.suggestion}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">{"\uD83C\uDFAF"}</div>
            <p className="text-gray-400 text-lg">Everything looks great!</p>
            <p className="text-gray-500 text-sm mt-2">Your financial activity is aligned with your stated goals.</p>
          </div>
        )}
      </div>
    </div>
  );
}
