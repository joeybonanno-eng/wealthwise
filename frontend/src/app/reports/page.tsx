"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

interface Report {
  generated_at: string;
  month: string;
  portfolio: {
    total_value: number;
    total_cost: number;
    total_gain: number;
    total_gain_pct: number;
    positions: number;
    top_holdings: Array<{ symbol: string; shares: number; market_value: number; gain_loss: number }>;
  };
  net_worth: { total_assets: number; total_liabilities: number; net_worth: number };
  budget: {
    monthly_income: number;
    monthly_expenses: number;
    net_savings: number;
    savings_rate: number;
    top_expenses: Record<string, number>;
  };
  activity: {
    conversations: number;
    plans: number;
    insights: number;
    alerts: number;
    watchlist_items: number;
    badges_earned: number;
    current_streak: number;
    longest_streak: number;
  };
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const data = await apiClient.getMonthlyReport();
      setReport(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
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

  const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Monthly Report</h1>
            <p className="text-gray-400 text-sm mt-1">{report?.month || "Financial snapshot"}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm transition-colors">Print</button>
            <button onClick={() => router.push("/chat")} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Chat</button>
          </div>
        </div>

        {report && (
          <div className="space-y-6">
            {/* Portfolio Section */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
              <h2 className="text-lg font-semibold text-emerald-400 mb-4">Portfolio</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider">Value</p>
                  <p className="text-xl font-bold text-white">{fmt(report.portfolio.total_value)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider">Cost Basis</p>
                  <p className="text-xl font-bold text-gray-300">{fmt(report.portfolio.total_cost)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider">Gain/Loss</p>
                  <p className={`text-xl font-bold ${report.portfolio.total_gain >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {report.portfolio.total_gain >= 0 ? "+" : ""}{fmt(report.portfolio.total_gain)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider">Return</p>
                  <p className={`text-xl font-bold ${report.portfolio.total_gain_pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {report.portfolio.total_gain_pct >= 0 ? "+" : ""}{report.portfolio.total_gain_pct}%
                  </p>
                </div>
              </div>
              {report.portfolio.top_holdings.length > 0 && (
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Top Holdings</p>
                  <div className="space-y-1">
                    {report.portfolio.top_holdings.map((h) => (
                      <div key={h.symbol} className="flex justify-between text-sm">
                        <span className="text-white font-medium">{h.symbol}</span>
                        <span className="text-gray-300">{fmt(h.market_value)}</span>
                        <span className={h.gain_loss >= 0 ? "text-emerald-400" : "text-red-400"}>
                          {h.gain_loss >= 0 ? "+" : ""}{fmt(h.gain_loss)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Net Worth Section */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
              <h2 className="text-lg font-semibold text-emerald-400 mb-4">Net Worth</h2>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider">Assets</p>
                  <p className="text-xl font-bold text-emerald-400">{fmt(report.net_worth.total_assets)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider">Liabilities</p>
                  <p className="text-xl font-bold text-red-400">{fmt(report.net_worth.total_liabilities)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider">Net Worth</p>
                  <p className={`text-xl font-bold ${report.net_worth.net_worth >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {fmt(report.net_worth.net_worth)}
                  </p>
                </div>
              </div>
            </div>

            {/* Budget Section */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
              <h2 className="text-lg font-semibold text-emerald-400 mb-4">Monthly Budget</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider">Income</p>
                  <p className="text-xl font-bold text-emerald-400">{fmt(report.budget.monthly_income)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider">Expenses</p>
                  <p className="text-xl font-bold text-red-400">{fmt(report.budget.monthly_expenses)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider">Net Savings</p>
                  <p className={`text-xl font-bold ${report.budget.net_savings >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {fmt(report.budget.net_savings)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider">Savings Rate</p>
                  <p className={`text-xl font-bold ${report.budget.savings_rate >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {report.budget.savings_rate}%
                  </p>
                </div>
              </div>
              {Object.keys(report.budget.top_expenses).length > 0 && (
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Top Expenses</p>
                  <div className="space-y-1">
                    {Object.entries(report.budget.top_expenses).map(([cat, val]) => (
                      <div key={cat} className="flex justify-between text-sm">
                        <span className="text-gray-400">{cat}</span>
                        <span className="text-red-400">{fmt(val)}/mo</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Activity Section */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
              <h2 className="text-lg font-semibold text-emerald-400 mb-4">Activity</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Conversations", value: report.activity.conversations },
                  { label: "Plans", value: report.activity.plans },
                  { label: "Insights", value: report.activity.insights },
                  { label: "Alerts", value: report.activity.alerts },
                  { label: "Watchlist", value: report.activity.watchlist_items },
                  { label: "Badges", value: report.activity.badges_earned },
                  { label: "Current Streak", value: report.activity.current_streak },
                  { label: "Longest Streak", value: report.activity.longest_streak },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <p className="text-2xl font-bold text-white">{item.value}</p>
                    <p className="text-gray-500 text-xs">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
