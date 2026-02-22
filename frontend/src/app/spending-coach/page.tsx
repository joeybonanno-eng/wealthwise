"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

interface OverBudget {
  category: string;
  spent: number;
  budget: number;
  over_by: number;
}

interface CoachData {
  coaching: string;
  tips: string[];
  over_budget: OverBudget[];
  stats: {
    monthly_income: number;
    monthly_expenses: number;
    net_savings: number;
    savings_rate: number;
    expense_categories: number;
    income_sources: number;
  } | null;
}

export default function SpendingCoachPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<CoachData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const result = await apiClient.getSpendingCoach();
      setData(result);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (session?.accessToken) { apiClient.setToken(session.accessToken); loadData(); }
  }, [status, session, router, loadData]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
          <p className="text-gray-400 text-sm">Analyzing your spending...</p>
        </div>
      </div>
    );
  }

  const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">AI Spending Coach</h1>
            <p className="text-gray-400 text-sm mt-1">Personalized spending analysis and recommendations</p>
          </div>
          <button onClick={() => router.push("/chat")} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Chat</button>
        </div>

        {data?.stats && (
          <>
            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Income</p>
                <p className="text-xl font-bold text-emerald-400 mt-1">{fmt(data.stats.monthly_income)}</p>
              </div>
              <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Expenses</p>
                <p className="text-xl font-bold text-red-400 mt-1">{fmt(data.stats.monthly_expenses)}</p>
              </div>
              <div className={`bg-gray-800/80 border rounded-xl p-4 ${data.stats.net_savings >= 0 ? "border-emerald-500/30" : "border-red-500/30"}`}>
                <p className="text-gray-400 text-xs uppercase tracking-wider">Net Savings</p>
                <p className={`text-xl font-bold mt-1 ${data.stats.net_savings >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {fmt(data.stats.net_savings)}
                </p>
              </div>
              <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Savings Rate</p>
                <p className={`text-xl font-bold mt-1 ${data.stats.savings_rate >= 20 ? "text-emerald-400" : data.stats.savings_rate >= 0 ? "text-yellow-400" : "text-red-400"}`}>
                  {data.stats.savings_rate}%
                </p>
              </div>
            </div>

            {/* Over Budget Alerts */}
            {data.over_budget && data.over_budget.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 mb-6">
                <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3">Over Budget</h2>
                <div className="space-y-2">
                  {data.over_budget.map((o) => (
                    <div key={o.category} className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">{o.category}</span>
                      <span className="text-red-400">
                        {fmt(o.spent)} / {fmt(o.budget)} (+{fmt(o.over_by)})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* AI Coaching */}
        <div className="bg-gray-800/80 border border-emerald-500/20 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4">AI Analysis</h2>
          <div className="prose prose-invert prose-sm max-w-none">
            {(data?.coaching || "").split("\n").map((line, i) => (
              <p key={i} className="text-gray-200 leading-relaxed mb-2">{line}</p>
            ))}
          </div>
        </div>

        {/* Quick Tips */}
        {data?.tips && data.tips.length > 0 && (
          <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Tips</h2>
            <ul className="space-y-3">
              {data.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                  <span className="text-emerald-400 font-bold mt-0.5">{i + 1}.</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!data?.stats && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4 opacity-50">&#x1F4B8;</div>
            <p className="text-gray-400 text-lg">{data?.coaching || "No spending data yet"}</p>
            <button onClick={() => router.push("/budget")}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm transition-colors">
              Go to Budget
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
