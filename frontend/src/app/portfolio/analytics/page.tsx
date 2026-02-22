"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

interface Performer {
  symbol: string;
  market_value: number;
  cost_basis: number;
  gain_loss: number | null;
  gain_loss_pct: number | null;
  sector: string;
}

interface AnalyticsSummary {
  total_value: number;
  total_cost: number;
  total_gain_loss: number;
  total_gain_loss_pct: number;
  positions: number;
  best_performer: string | null;
  worst_performer: string | null;
}

interface Analytics {
  sectors: Record<string, number>;
  top_performers: Performer[];
  worst_performers: Performer[];
  summary: AnalyticsSummary;
}

export default function PortfolioAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (session?.accessToken) {
      apiClient.setToken(session.accessToken);
      apiClient
        .getPortfolioAnalytics()
        .then(setAnalytics)
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

  if (!analytics || analytics.summary.positions === 0) {
    return (
      <div className="min-h-screen bg-gray-950 text-white pb-24 md:pb-8">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Portfolio Analytics</h1>
            <button
              onClick={() => router.push("/portfolio")}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              Portfolio
            </button>
          </div>
          <div className="text-center py-16">
            <div className="text-4xl mb-4 opacity-50">&#x1F4CA;</div>
            <p className="text-gray-400 text-lg">No holdings to analyze</p>
            <p className="text-gray-500 text-sm mt-2">
              Add holdings to your portfolio first
            </p>
          </div>
        </div>
      </div>
    );
  }

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  const { sectors, top_performers, worst_performers, summary } = analytics;
  const maxSectorPct = Math.max(...Object.values(sectors), 1);

  const SECTOR_COLORS: Record<string, string> = {
    Technology: "bg-blue-500",
    Healthcare: "bg-pink-500",
    "Financial Services": "bg-yellow-500",
    "Consumer Cyclical": "bg-orange-500",
    "Communication Services": "bg-purple-500",
    Industrials: "bg-cyan-500",
    "Consumer Defensive": "bg-teal-500",
    Energy: "bg-red-500",
    Utilities: "bg-green-500",
    "Real Estate": "bg-amber-500",
    "Basic Materials": "bg-lime-500",
    Unknown: "bg-gray-500",
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Portfolio Analytics</h1>
            <p className="text-gray-400 text-sm mt-1">
              Deep dive into your portfolio performance
            </p>
          </div>
          <button
            onClick={() => router.push("/portfolio")}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
          >
            Portfolio
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-xs uppercase tracking-wider">
              Total Value
            </p>
            <p className="text-xl font-bold text-white mt-1">
              {fmt(summary.total_value)}
            </p>
          </div>
          <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-xs uppercase tracking-wider">
              Positions
            </p>
            <p className="text-xl font-bold text-white mt-1">
              {summary.positions}
            </p>
          </div>
          <div
            className={`bg-gray-800/80 border rounded-xl p-4 ${
              summary.total_gain_loss >= 0
                ? "border-emerald-500/30"
                : "border-red-500/30"
            }`}
          >
            <p className="text-gray-400 text-xs uppercase tracking-wider">
              Total Return
            </p>
            <p
              className={`text-xl font-bold mt-1 ${
                summary.total_gain_loss_pct >= 0
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              {summary.total_gain_loss_pct >= 0 ? "+" : ""}
              {summary.total_gain_loss_pct}%
            </p>
          </div>
          <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-xs uppercase tracking-wider">
              Best Performer
            </p>
            <p className="text-xl font-bold text-emerald-400 mt-1">
              {summary.best_performer || "—"}
            </p>
          </div>
        </div>

        {/* Sector Allocation */}
        <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">
            Sector Allocation
          </h3>
          <div className="space-y-3">
            {Object.entries(sectors).map(([sector, pct]) => (
              <div key={sector}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">{sector}</span>
                  <span className="text-gray-400">{pct}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all ${
                      SECTOR_COLORS[sector] || "bg-emerald-500"
                    }`}
                    style={{ width: `${(pct / maxSectorPct) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top & Worst Performers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-800/80 border border-emerald-500/30 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-emerald-400 mb-3">
              Top Performers
            </h3>
            {top_performers.length === 0 ? (
              <p className="text-gray-500 text-sm">No data</p>
            ) : (
              <div className="space-y-3">
                {top_performers.map((p) => (
                  <div
                    key={p.symbol}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-white">{p.symbol}</span>
                      <span className="text-gray-500 text-xs ml-2">
                        {p.sector}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-400 font-mono">
                        +{p.gain_loss_pct}%
                      </span>
                      <span className="text-gray-500 text-xs ml-2">
                        {fmt(p.gain_loss || 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-800/80 border border-red-500/30 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-red-400 mb-3">
              Worst Performers
            </h3>
            {worst_performers.length === 0 ? (
              <p className="text-gray-500 text-sm">No data</p>
            ) : (
              <div className="space-y-3">
                {worst_performers.map((p) => (
                  <div
                    key={p.symbol}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-white">{p.symbol}</span>
                      <span className="text-gray-500 text-xs ml-2">
                        {p.sector}
                      </span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-mono ${
                          (p.gain_loss_pct || 0) >= 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {(p.gain_loss_pct || 0) >= 0 ? "+" : ""}
                        {p.gain_loss_pct}%
                      </span>
                      <span className="text-gray-500 text-xs ml-2">
                        {fmt(p.gain_loss || 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
