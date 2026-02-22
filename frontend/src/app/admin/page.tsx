"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Analytics {
  users: { total: number; dau: number; wau: number; new_this_week: number };
  subscriptions: { active: number; canceled: number; past_due: number; conversion_rate: number };
  messages: { total: number; today: number; this_week: number; total_conversations: number };
  insights: { total: number; accepted: number; dismissed: number; acceptance_rate: number };
  features: {
    users_with_plans: number;
    users_with_profiles: number;
    total_plans: number;
    plan_adoption_rate: number;
    profile_completion_rate: number;
  };
  daily_volume: Array<{ date: string; label: string; count: number }>;
}

function StatCard({
  label,
  value,
  sub,
  color = "emerald",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  const colors: Record<string, string> = {
    emerald: "border-emerald-500/30 text-emerald-400",
    blue: "border-blue-500/30 text-blue-400",
    purple: "border-purple-500/30 text-purple-400",
    amber: "border-amber-500/30 text-amber-400",
    red: "border-red-500/30 text-red-400",
  };
  return (
    <div className={`bg-gray-800/80 border ${colors[color]?.split(" ")[0] || "border-gray-700"} rounded-xl p-4`}>
      <p className="text-gray-400 text-xs uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colors[color]?.split(" ")[1] || "text-white"}`}>
        {value}
      </p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

function MiniBar({ data }: { data: Array<{ date: string; label: string; count: number }> }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((d) => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-emerald-500/60 rounded-t transition-all"
            style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? 4 : 0 }}
          />
          <span className="text-[10px] text-gray-500">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const { status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/analytics`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    fetchAnalytics();
  }, [status, router, fetchAnalytics]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <p className="text-gray-400">Failed to load analytics</p>
      </div>
    );
  }

  const a = analytics;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Platform analytics overview</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchAnalytics}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={() => router.push("/chat")}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm transition-colors"
            >
              Back to Chat
            </button>
          </div>
        </div>

        {/* Users */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-300 mb-3">Users</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total Users" value={a.users.total} color="emerald" />
            <StatCard label="DAU" value={a.users.dau} sub="Daily active" color="blue" />
            <StatCard label="WAU" value={a.users.wau} sub="Weekly active" color="blue" />
            <StatCard label="New This Week" value={a.users.new_this_week} color="purple" />
          </div>
        </section>

        {/* Subscriptions */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-300 mb-3">Subscriptions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Active" value={a.subscriptions.active} color="emerald" />
            <StatCard label="Canceled" value={a.subscriptions.canceled} color="amber" />
            <StatCard label="Past Due" value={a.subscriptions.past_due} color="red" />
            <StatCard
              label="Conversion Rate"
              value={`${a.subscriptions.conversion_rate}%`}
              sub={`${a.subscriptions.active} of ${a.users.total}`}
              color="purple"
            />
          </div>
        </section>

        {/* Messages */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-300 mb-3">Messages</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <StatCard label="Total Messages" value={a.messages.total.toLocaleString()} color="emerald" />
            <StatCard label="Today" value={a.messages.today} color="blue" />
            <StatCard label="This Week" value={a.messages.this_week} color="blue" />
            <StatCard label="Conversations" value={a.messages.total_conversations} color="purple" />
          </div>
          <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">
              Daily Message Volume (Last 7 Days)
            </p>
            <MiniBar data={a.daily_volume} />
          </div>
        </section>

        {/* Insights */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-300 mb-3">Insights</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total Generated" value={a.insights.total} color="emerald" />
            <StatCard label="Accepted" value={a.insights.accepted} color="blue" />
            <StatCard label="Dismissed" value={a.insights.dismissed} color="amber" />
            <StatCard
              label="Acceptance Rate"
              value={`${a.insights.acceptance_rate}%`}
              color="purple"
            />
          </div>
        </section>

        {/* Feature Adoption */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-300 mb-3">Feature Adoption</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard
              label="Financial Plans"
              value={a.features.total_plans}
              sub={`${a.features.plan_adoption_rate}% of users`}
              color="emerald"
            />
            <StatCard
              label="Profile Completion"
              value={`${a.features.profile_completion_rate}%`}
              sub={`${a.features.users_with_profiles} users`}
              color="blue"
            />
            <StatCard
              label="Users with Plans"
              value={a.features.users_with_plans}
              color="purple"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
