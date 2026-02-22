"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

interface Badge {
  key: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  unlocked_at: string | null;
}

interface Streak {
  current: number;
  longest: number;
  last_active: string | null;
}

export default function AchievementsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [earnedCount, setEarnedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [streak, setStreak] = useState<Streak>({ current: 0, longest: 0, last_active: null });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const data = await apiClient.getAchievements();
      setBadges(data.badges);
      setEarnedCount(data.earned_count);
      setTotalCount(data.total_count);
      setStreak(data.streak);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (session?.accessToken) {
      apiClient.setToken(session.accessToken);
      loadData();
    }
  }, [status, session, router, loadData]);

  if (status === "loading" || loading) {
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
            <h1 className="text-2xl font-bold">Achievements</h1>
            <p className="text-gray-400 text-sm mt-1">Track your progress and earn badges</p>
          </div>
          <button
            onClick={() => router.push("/chat")}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
          >
            Chat
          </button>
        </div>

        {/* Streak & Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          <div className="bg-gray-800/80 border border-orange-500/30 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-orange-400">{streak.current}</p>
            <p className="text-gray-400 text-xs uppercase tracking-wider mt-1">Day Streak</p>
          </div>
          <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-white">{streak.longest}</p>
            <p className="text-gray-400 text-xs uppercase tracking-wider mt-1">Longest Streak</p>
          </div>
          <div className="bg-gray-800/80 border border-emerald-500/30 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-emerald-400">{earnedCount} / {totalCount}</p>
            <p className="text-gray-400 text-xs uppercase tracking-wider mt-1">Badges Earned</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Progress</span>
            <span className="text-emerald-400">{Math.round((earnedCount / totalCount) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${(earnedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>

        {/* Badge Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {badges.map((badge) => (
            <div
              key={badge.key}
              className={`rounded-xl p-4 text-center border transition-all ${
                badge.earned
                  ? "bg-gray-800/80 border-emerald-500/30"
                  : "bg-gray-800/30 border-gray-700/50 opacity-50"
              }`}
            >
              <div className="text-4xl mb-2">{badge.icon}</div>
              <h3 className={`font-semibold text-sm ${badge.earned ? "text-white" : "text-gray-500"}`}>
                {badge.name}
              </h3>
              <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
              {badge.earned && badge.unlocked_at && (
                <p className="text-xs text-emerald-500 mt-2">
                  Earned {new Date(badge.unlocked_at).toLocaleDateString()}
                </p>
              )}
              {!badge.earned && (
                <p className="text-xs text-gray-600 mt-2">Locked</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
