"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

interface Milestone {
  id: number;
  title: string;
  type: string;
  timeline: string;
  status: string;
  created_at: string | null;
}

const typeColors: Record<string, string> = {
  retirement: "bg-blue-500",
  home: "bg-purple-500",
  debt: "bg-red-500",
  wealth: "bg-emerald-500",
  custom: "bg-amber-500",
};

const typeIcons: Record<string, string> = {
  retirement: "\u{1F3D6}",
  home: "\u{1F3E0}",
  debt: "\u{1F4B3}",
  wealth: "\u{1F4C8}",
  custom: "\u{1F3AF}",
};

export default function TimelinePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.accessToken) {
      apiClient.setToken(session.accessToken);
      apiClient
        .getTimeline()
        .then((data) => setMilestones(data.milestones))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [session]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/advisor")}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold">
              <span className="text-emerald-400">Financial</span> Timeline
            </h1>
          </div>
          <span className="text-sm text-gray-500">{session?.user?.name}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {milestones.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">{"\u{1F4C5}"}</div>
            <h3 className="text-gray-400 font-medium mb-2">No milestones yet</h3>
            <p className="text-gray-500 text-sm mb-6">
              Create financial plans to see your goals on the timeline.
            </p>
            <button
              onClick={() => router.push("/chat")}
              className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Go to Chat to Create a Plan
            </button>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-800" />

            <div className="space-y-8">
              {milestones.map((milestone, idx) => {
                const dotColor = typeColors[milestone.type] || typeColors.custom;
                const icon = typeIcons[milestone.type] || typeIcons.custom;
                const date = milestone.created_at
                  ? new Date(milestone.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })
                  : "";

                return (
                  <div key={milestone.id} className="relative flex items-start gap-6 pl-2">
                    {/* Timeline dot */}
                    <div
                      className={`relative z-10 w-10 h-10 rounded-full ${dotColor} flex items-center justify-center text-lg shadow-lg flex-shrink-0`}
                    >
                      {icon}
                    </div>

                    {/* Content card */}
                    <div className="flex-1 bg-gray-800/60 border border-gray-700 rounded-xl p-4 hover:border-emerald-500/30 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-white font-semibold">{milestone.title}</h3>
                        <span className="text-xs text-gray-500 whitespace-nowrap">{date}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-700 text-gray-300 capitalize">
                          {milestone.type}
                        </span>
                        {milestone.timeline && (
                          <span className="text-xs text-gray-400">
                            Target: {milestone.timeline}
                          </span>
                        )}
                      </div>
                      {/* Progress visualization */}
                      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${dotColor} transition-all duration-700`}
                          style={{
                            width: `${Math.min(100, ((idx + 1) / milestones.length) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Future marker */}
              <div className="relative flex items-start gap-6 pl-2">
                <div className="relative z-10 w-10 h-10 rounded-full bg-gray-700 border-2 border-dashed border-gray-600 flex items-center justify-center text-gray-500 flex-shrink-0">
                  ?
                </div>
                <div className="flex-1 bg-gray-800/30 border border-dashed border-gray-700 rounded-xl p-4">
                  <h3 className="text-gray-500 font-medium">Your next milestone</h3>
                  <p className="text-gray-600 text-sm">Create a new plan to add goals to your timeline.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
