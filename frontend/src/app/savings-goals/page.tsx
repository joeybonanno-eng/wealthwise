"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

interface Goal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  category: string;
  deadline: string | null;
  progress_pct: number;
  remaining: number;
  monthly_needed: number | null;
  created_at: string;
}

interface GoalsSummary {
  total_goals: number;
  total_target: number;
  total_saved: number;
  overall_progress: number;
}

export default function SavingsGoalsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [summary, setSummary] = useState<GoalsSummary | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [category, setCategory] = useState("General");
  const [deadline, setDeadline] = useState("");
  const [adding, setAdding] = useState(false);

  const loadGoals = useCallback(async () => {
    try {
      const data = await apiClient.getSavingsGoals();
      setGoals(data.goals);
      setSummary(data.summary);
      setCategories(data.categories);
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
      loadGoals();
    }
  }, [status, session, router, loadGoals]);

  const handleAdd = async () => {
    if (!name || !target) return;
    setAdding(true);
    try {
      await apiClient.createSavingsGoal({
        name,
        target_amount: parseFloat(target),
        current_amount: current ? parseFloat(current) : 0,
        category,
        deadline: deadline || undefined,
      });
      setName("");
      setTarget("");
      setCurrent("");
      setCategory("General");
      setDeadline("");
      setShowAdd(false);
      await loadGoals();
    } catch {
      // silent
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.deleteSavingsGoal(id);
      await loadGoals();
    } catch {
      // silent
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
      </div>
    );
  }

  const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Savings Goals</h1>
            <p className="text-gray-400 text-sm mt-1">Track progress toward your financial goals</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm transition-colors"
            >
              + New Goal
            </button>
            <button onClick={() => router.push("/chat")} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Chat</button>
          </div>
        </div>

        {/* Summary */}
        {summary && summary.total_goals > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Goals</p>
              <p className="text-xl font-bold text-white mt-1">{summary.total_goals}</p>
            </div>
            <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Total Target</p>
              <p className="text-xl font-bold text-white mt-1">{fmt(summary.total_target)}</p>
            </div>
            <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Total Saved</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">{fmt(summary.total_saved)}</p>
            </div>
            <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Progress</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">{summary.overall_progress}%</p>
            </div>
          </div>
        )}

        {/* Add Form */}
        {showAdd && (
          <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Create New Goal</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <input
                type="text"
                placeholder="Goal name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
              <input
                type="number"
                placeholder="Target amount ($)"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
              <input
                type="number"
                placeholder="Current amount ($)"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                type="date"
                placeholder="Deadline"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleAdd}
                disabled={adding || !name || !target}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                {adding ? "Creating..." : "Create Goal"}
              </button>
            </div>
          </div>
        )}

        {/* Goals List */}
        {goals.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4 opacity-50">&#x1F3AF;</div>
            <p className="text-gray-400 text-lg">No savings goals yet</p>
            <p className="text-gray-500 text-sm mt-2">Create your first goal to start tracking progress</p>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((g) => (
              <div key={g.id} className="bg-gray-800/80 border border-gray-700 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-semibold">{g.name}</h3>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">{g.category}</span>
                      {g.deadline && (
                        <span className="text-xs text-gray-500">Due: {g.deadline}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(g.id)}
                    className="text-gray-500 hover:text-red-400 text-xs transition-colors"
                  >
                    Remove
                  </button>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                  <div
                    className="bg-emerald-500 h-3 rounded-full transition-all"
                    style={{ width: `${Math.min(g.progress_pct, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-400 font-medium">{fmt(g.current_amount)} saved</span>
                  <span className="text-gray-400">{g.progress_pct}% of {fmt(g.target_amount)}</span>
                </div>

                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span>Remaining: {fmt(g.remaining)}</span>
                  {g.monthly_needed && (
                    <span>Need {fmt(g.monthly_needed)}/mo to reach goal</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
