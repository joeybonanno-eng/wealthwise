"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

interface HoldingSummary {
  symbol: string;
  shares: number;
  price?: number;
  market_value?: number;
  gain_loss?: number;
  gain_loss_pct?: number;
  sector?: string;
  beta?: number | null;
  pe_ratio?: number | null;
  dividend_yield?: number;
  error?: string;
}

interface PortfolioStats {
  total_value: number;
  total_cost: number;
  total_gain: number;
  total_gain_pct: number;
  positions: number;
  sectors: Record<string, number>;
}

export default function PortfolioReviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [review, setReview] = useState("");
  const [holdings, setHoldings] = useState<HoldingSummary[]>([]);
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReview = useCallback(async () => {
    try {
      const data = await apiClient.getPortfolioReview();
      setReview(data.review);
      setHoldings(data.holdings_summary);
      setStats(data.portfolio_stats || null);
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
      loadReview();
    }
  }, [status, session, router, loadReview]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
          <p className="text-gray-400 text-sm">Analyzing your portfolio...</p>
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
            <h1 className="text-2xl font-bold">AI Portfolio Review</h1>
            <p className="text-gray-400 text-sm mt-1">Comprehensive analysis powered by AI</p>
          </div>
          <button
            onClick={() => router.push("/portfolio")}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
          >
            Back to Portfolio
          </button>
        </div>

        {/* Stats Summary */}
        {stats && stats.positions > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Total Value</p>
              <p className="text-xl font-bold text-white mt-1">{fmt(stats.total_value)}</p>
            </div>
            <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Cost Basis</p>
              <p className="text-xl font-bold text-gray-300 mt-1">{fmt(stats.total_cost)}</p>
            </div>
            <div className={`bg-gray-800/80 border rounded-xl p-4 ${stats.total_gain >= 0 ? "border-emerald-500/30" : "border-red-500/30"}`}>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Total Return</p>
              <p className={`text-xl font-bold mt-1 ${stats.total_gain >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {stats.total_gain >= 0 ? "+" : ""}{stats.total_gain_pct}%
              </p>
            </div>
            <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Positions</p>
              <p className="text-xl font-bold text-white mt-1">{stats.positions}</p>
            </div>
          </div>
        )}

        {/* Sector Breakdown */}
        {stats && Object.keys(stats.sectors).length > 0 && (
          <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-5 mb-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Sector Allocation</h2>
            <div className="space-y-2">
              {Object.entries(stats.sectors)
                .sort(([, a], [, b]) => b - a)
                .map(([sector, pct]) => (
                  <div key={sector} className="flex items-center gap-3">
                    <span className="text-sm text-gray-300 w-36 truncate">{sector}</span>
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm text-gray-400 w-12 text-right">{pct}%</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* AI Review */}
        <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">AI Analysis</h2>
          <div className="prose prose-invert prose-sm max-w-none">
            {review.split("\n").map((line, i) => (
              <p key={i} className="text-gray-200 leading-relaxed mb-2">
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* Holdings Detail */}
        {holdings.length > 0 && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-700">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Holdings Detail</h2>
            </div>
            <div className="divide-y divide-gray-700/50">
              {holdings
                .filter((h) => !h.error)
                .map((h) => (
                  <div key={h.symbol} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white">{h.symbol}</span>
                      <span className="text-gray-500 text-xs ml-2">{h.sector}</span>
                    </div>
                    <div className="flex gap-4 text-sm">
                      {h.market_value != null && (
                        <span className="text-gray-300">{fmt(h.market_value)}</span>
                      )}
                      {h.gain_loss_pct != null && (
                        <span className={h.gain_loss_pct >= 0 ? "text-emerald-400" : "text-red-400"}>
                          {h.gain_loss_pct >= 0 ? "+" : ""}{h.gain_loss_pct}%
                        </span>
                      )}
                      {h.pe_ratio != null && (
                        <span className="text-gray-500">P/E {h.pe_ratio}</span>
                      )}
                      {h.dividend_yield != null && h.dividend_yield > 0 && (
                        <span className="text-gray-500">Yield {h.dividend_yield}%</span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
