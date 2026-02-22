"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

interface DashboardData {
  portfolio: {
    total_value: number;
    total_gain: number;
    total_gain_pct: number;
    positions: number;
  };
  net_worth: {
    total_assets: number;
    total_liabilities: number;
    net_worth: number;
  };
  budget: {
    monthly_income: number;
    monthly_expenses: number;
    savings_rate: number;
  };
  streak: { current: number; longest: number };
  badges_earned: number;
  watchlist_buy_signals: number;
  pending_insights: number;
  active_alerts: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const dashboard = await apiClient.getDashboard();
      setData(dashboard);
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
      // Silent check-in for achievements
      apiClient.checkInAchievements().catch(() => {});
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

  const quickLinks = [
    { label: "Chat", path: "/chat" },
    { label: "Portfolio", path: "/portfolio" },
    { label: "Net Worth", path: "/net-worth" },
    { label: "Budget", path: "/budget" },
    { label: "News", path: "/news" },
    { label: "Watchlist", path: "/watchlist" },
    { label: "Dividends", path: "/portfolio/dividends" },
    { label: "Retirement Calc", path: "/calculators/retirement" },
    { label: "Achievements", path: "/achievements" },
    { label: "Learn", path: "/learn" },
    { label: "Compare", path: "/compare" },
    { label: "Screener", path: "/screener" },
    { label: "Tax-Loss", path: "/portfolio/tax-loss" },
    { label: "Allocation", path: "/allocation" },
    { label: "Debt Payoff", path: "/calculators/debt-payoff" },
    { label: "Subscriptions", path: "/subscriptions" },
    { label: "Reports", path: "/reports" },
    { label: "Advisor", path: "/advisor" },
    { label: "Savings Goals", path: "/savings-goals" },
    { label: "Calendar", path: "/calendar" },
    { label: "AI Review", path: "/portfolio/review" },
    { label: "Compound Calc", path: "/calculators/compound" },
    { label: "Risk Score", path: "/portfolio/risk" },
    { label: "Import/Export", path: "/import-export" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24 md:pb-8">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">
            <span className="text-emerald-400">WealthWise</span> Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">Your financial overview at a glance</p>
        </div>

        {data && (
          <>
            {/* Top Row: Portfolio + Net Worth */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Portfolio Card */}
              <button
                onClick={() => router.push("/portfolio")}
                className="bg-gray-800/80 border border-gray-700 rounded-xl p-5 text-left hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Portfolio Value</p>
                  <span className="text-gray-600 text-xs">{data.portfolio.positions} positions</span>
                </div>
                <p className="text-2xl font-bold text-white">{fmt(data.portfolio.total_value)}</p>
                <p className={`text-sm mt-1 ${data.portfolio.total_gain >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {data.portfolio.total_gain >= 0 ? "+" : ""}{fmt(data.portfolio.total_gain)} ({data.portfolio.total_gain_pct}%)
                </p>
              </button>

              {/* Net Worth Card */}
              <button
                onClick={() => router.push("/net-worth")}
                className="bg-gray-800/80 border border-gray-700 rounded-xl p-5 text-left hover:border-gray-600 transition-colors"
              >
                <p className="text-gray-400 text-xs uppercase tracking-wider font-medium mb-3">Net Worth</p>
                <p className={`text-2xl font-bold ${data.net_worth.net_worth >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {fmt(data.net_worth.net_worth)}
                </p>
                <div className="flex gap-4 mt-1 text-xs">
                  <span className="text-emerald-400/70">Assets: {fmt(data.net_worth.total_assets)}</span>
                  <span className="text-red-400/70">Debt: {fmt(data.net_worth.total_liabilities)}</span>
                </div>
              </button>
            </div>

            {/* Middle Row: Budget + Streak/Badges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Budget Card */}
              <button
                onClick={() => router.push("/budget")}
                className="bg-gray-800/80 border border-gray-700 rounded-xl p-5 text-left hover:border-gray-600 transition-colors"
              >
                <p className="text-gray-400 text-xs uppercase tracking-wider font-medium mb-3">Monthly Budget</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-emerald-400 font-bold">{fmt(data.budget.monthly_income)}</p>
                    <p className="text-gray-500 text-xs">Income</p>
                  </div>
                  <div>
                    <p className="text-red-400 font-bold">{fmt(data.budget.monthly_expenses)}</p>
                    <p className="text-gray-500 text-xs">Expenses</p>
                  </div>
                  <div>
                    <p className={`font-bold ${data.budget.savings_rate >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {data.budget.savings_rate}%
                    </p>
                    <p className="text-gray-500 text-xs">Savings Rate</p>
                  </div>
                </div>
              </button>

              {/* Streak & Badges Card */}
              <button
                onClick={() => router.push("/achievements")}
                className="bg-gray-800/80 border border-gray-700 rounded-xl p-5 text-left hover:border-gray-600 transition-colors"
              >
                <p className="text-gray-400 text-xs uppercase tracking-wider font-medium mb-3">Streak & Badges</p>
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-3xl font-bold text-orange-400">{data.streak.current}</p>
                    <p className="text-gray-500 text-xs">Day Streak</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-emerald-400">{data.badges_earned}</p>
                    <p className="text-gray-500 text-xs">Badges</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Bottom Row: Signals, Insights, Alerts */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <button
                onClick={() => router.push("/watchlist")}
                className="bg-gray-800/80 border border-gray-700 rounded-xl p-4 text-center hover:border-gray-600 transition-colors"
              >
                <p className="text-2xl font-bold text-yellow-400">{data.watchlist_buy_signals}</p>
                <p className="text-gray-400 text-xs uppercase tracking-wider mt-1">Buy Signals</p>
              </button>
              <button
                onClick={() => router.push("/advisor")}
                className="bg-gray-800/80 border border-gray-700 rounded-xl p-4 text-center hover:border-gray-600 transition-colors"
              >
                <p className="text-2xl font-bold text-blue-400">{data.pending_insights}</p>
                <p className="text-gray-400 text-xs uppercase tracking-wider mt-1">Insights</p>
              </button>
              <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-purple-400">{data.active_alerts}</p>
                <p className="text-gray-400 text-xs uppercase tracking-wider mt-1">Active Alerts</p>
              </div>
            </div>
          </>
        )}

        {/* Quick Links */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Links</h2>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {quickLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => router.push(link.path)}
                className="px-3 py-2 bg-gray-800/50 border border-gray-700 hover:border-gray-600 hover:bg-gray-800/80 rounded-lg text-sm text-gray-300 transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
