"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

interface BacktestResult {
  symbol: string;
  weight: number;
  allocated?: number;
  start_price?: number;
  end_price?: number;
  return_pct?: number;
  final_value?: number;
  gain?: number;
  error?: string;
}

interface BacktestData {
  results: BacktestResult[];
  summary: {
    investment: number;
    years: number;
    final_value: number;
    total_gain: number;
    total_return_pct: number;
    annualized_return: number;
  };
  error?: string;
}

export default function BacktestPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [years, setYears] = useState("5");
  const [investment, setInvestment] = useState("10000");
  const [data, setData] = useState<BacktestData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (session?.accessToken) { apiClient.setToken(session.accessToken); }
  }, [status, session, router]);

  const handleBacktest = async () => {
    setLoading(true);
    try {
      const result = await apiClient.backtestPortfolio(parseInt(years) || 5, parseFloat(investment) || 10000);
      setData(result);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
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
            <h1 className="text-2xl font-bold">Portfolio Backtester</h1>
            <p className="text-gray-400 text-sm mt-1">What if you had invested in your current portfolio years ago?</p>
          </div>
          <button onClick={() => router.push("/portfolio")}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">
            Back to Portfolio
          </button>
        </div>

        {/* Input */}
        <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Investment Amount</label>
              <input type="number" value={investment} onChange={(e) => setInvestment(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Years Ago</label>
              <select value={years} onChange={(e) => setYears(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500">
                {[1, 2, 3, 5, 7, 10, 15, 20].map((y) => (
                  <option key={y} value={y}>{y} year{y > 1 ? "s" : ""}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={handleBacktest} disabled={loading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors">
                {loading ? "Running..." : "Run Backtest"}
              </button>
            </div>
          </div>
        </div>

        {data?.error && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4 opacity-50">&#x1F4BC;</div>
            <p className="text-gray-400 text-lg">{data.error}</p>
            <p className="text-gray-500 text-sm mt-2">Add holdings to your portfolio first</p>
          </div>
        )}

        {data && !data.error && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Invested</p>
                <p className="text-xl font-bold text-white mt-1">{fmt(data.summary.investment)}</p>
              </div>
              <div className={`bg-gray-800/80 border rounded-xl p-4 ${data.summary.total_gain >= 0 ? "border-emerald-500/30" : "border-red-500/30"}`}>
                <p className="text-gray-400 text-xs uppercase tracking-wider">Final Value</p>
                <p className={`text-xl font-bold mt-1 ${data.summary.total_gain >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {fmt(data.summary.final_value)}
                </p>
              </div>
              <div className={`bg-gray-800/80 border rounded-xl p-4 ${data.summary.total_gain >= 0 ? "border-emerald-500/30" : "border-red-500/30"}`}>
                <p className="text-gray-400 text-xs uppercase tracking-wider">Total Return</p>
                <p className={`text-xl font-bold mt-1 ${data.summary.total_return_pct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {data.summary.total_return_pct >= 0 ? "+" : ""}{data.summary.total_return_pct}%
                </p>
              </div>
              <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Annualized</p>
                <p className={`text-xl font-bold mt-1 ${data.summary.annualized_return >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {data.summary.annualized_return >= 0 ? "+" : ""}{data.summary.annualized_return}%/yr
                </p>
              </div>
            </div>

            {/* Per-Holding Results */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-700">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Per-Holding Results</h2>
              </div>
              <div className="hidden md:grid grid-cols-6 gap-2 px-5 py-2 border-b border-gray-700 text-xs text-gray-500 uppercase">
                <div>Symbol</div>
                <div className="text-right">Weight</div>
                <div className="text-right">Allocated</div>
                <div className="text-right">Final Value</div>
                <div className="text-right">Return</div>
                <div className="text-right">Gain</div>
              </div>
              {data.results.map((r) => (
                <div key={r.symbol} className="grid grid-cols-3 md:grid-cols-6 gap-2 px-5 py-2.5 border-b border-gray-700/30 text-sm">
                  <div className="font-bold text-white">{r.symbol}</div>
                  <div className="text-right text-gray-400">{r.weight}%</div>
                  {r.error ? (
                    <div className="col-span-4 text-right text-gray-500">{r.error}</div>
                  ) : (
                    <>
                      <div className="text-right text-gray-300 hidden md:block">{fmt(r.allocated || 0)}</div>
                      <div className="text-right text-white hidden md:block">{fmt(r.final_value || 0)}</div>
                      <div className={`text-right ${(r.return_pct || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {(r.return_pct || 0) >= 0 ? "+" : ""}{r.return_pct}%
                      </div>
                      <div className={`text-right hidden md:block ${(r.gain || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {(r.gain || 0) >= 0 ? "+" : ""}{fmt(r.gain || 0)}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
