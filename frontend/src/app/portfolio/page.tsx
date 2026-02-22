"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

interface Holding {
  id: number;
  symbol: string;
  shares: number;
  avg_cost: number;
  notes: string | null;
  current_price: number | null;
  change_percent: number | null;
  market_value: number;
  cost_basis: number;
  gain_loss: number | null;
  gain_loss_pct: number | null;
}

interface Summary {
  total_value: number;
  total_cost: number;
  total_gain_loss: number;
  total_gain_loss_pct: number;
  positions: number;
}

export default function PortfolioPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [shares, setShares] = useState("");
  const [avgCost, setAvgCost] = useState("");
  const [adding, setAdding] = useState(false);

  const loadPortfolio = useCallback(async () => {
    try {
      const data = await apiClient.getPortfolio();
      setHoldings(data.holdings);
      setSummary(data.summary);
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
    if (session?.accessToken) {
      apiClient.setToken(session.accessToken);
      loadPortfolio();
    }
  }, [status, session, router, loadPortfolio]);

  const handleAdd = async () => {
    if (!symbol || !shares || !avgCost) return;
    setAdding(true);
    try {
      await apiClient.addHolding({
        symbol: symbol.toUpperCase(),
        shares: parseFloat(shares),
        avg_cost: parseFloat(avgCost),
      });
      setSymbol("");
      setShares("");
      setAvgCost("");
      setShowAdd(false);
      await loadPortfolio();
    } catch {
      alert("Failed to add holding. Check the symbol.");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.deleteHolding(id);
      await loadPortfolio();
    } catch {
      // silently fail
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
      </div>
    );
  }

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Portfolio</h1>
            <p className="text-gray-400 text-sm mt-1">Track your holdings</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm transition-colors"
            >
              + Add Holding
            </button>
            <button
              onClick={() => router.push("/portfolio/analytics")}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              Analytics
            </button>
            <button
              onClick={() => router.push("/portfolio/dividends")}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              Dividends
            </button>
            <button
              onClick={() => router.push("/chat")}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              Chat
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && summary.positions > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Total Value</p>
              <p className="text-xl font-bold text-white mt-1">{fmt(summary.total_value)}</p>
            </div>
            <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Cost Basis</p>
              <p className="text-xl font-bold text-gray-300 mt-1">{fmt(summary.total_cost)}</p>
            </div>
            <div className={`bg-gray-800/80 border rounded-xl p-4 ${
              summary.total_gain_loss >= 0 ? "border-emerald-500/30" : "border-red-500/30"
            }`}>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Total Gain/Loss</p>
              <p className={`text-xl font-bold mt-1 ${
                summary.total_gain_loss >= 0 ? "text-emerald-400" : "text-red-400"
              }`}>
                {summary.total_gain_loss >= 0 ? "+" : ""}{fmt(summary.total_gain_loss)}
              </p>
            </div>
            <div className={`bg-gray-800/80 border rounded-xl p-4 ${
              summary.total_gain_loss_pct >= 0 ? "border-emerald-500/30" : "border-red-500/30"
            }`}>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Return</p>
              <p className={`text-xl font-bold mt-1 ${
                summary.total_gain_loss_pct >= 0 ? "text-emerald-400" : "text-red-400"
              }`}>
                {summary.total_gain_loss_pct >= 0 ? "+" : ""}{summary.total_gain_loss_pct}%
              </p>
            </div>
          </div>
        )}

        {/* Add Holding Form */}
        {showAdd && (
          <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Add New Holding</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Symbol (e.g. AAPL)"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
              <input
                type="number"
                placeholder="Shares"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
              <input
                type="number"
                placeholder="Avg Cost ($)"
                value={avgCost}
                onChange={(e) => setAvgCost(e.target.value)}
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleAdd}
                disabled={adding || !symbol || !shares || !avgCost}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                {adding ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        )}

        {/* Holdings Table */}
        {holdings.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4 opacity-50">&#x1F4BC;</div>
            <p className="text-gray-400 text-lg">No holdings yet</p>
            <p className="text-gray-500 text-sm mt-2">
              Add your first stock holding to start tracking your portfolio
            </p>
          </div>
        ) : (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
            {/* Desktop header */}
            <div className="hidden md:grid grid-cols-8 gap-2 px-4 py-3 border-b border-gray-700 text-xs text-gray-400 uppercase tracking-wider">
              <div>Symbol</div>
              <div className="text-right">Shares</div>
              <div className="text-right">Avg Cost</div>
              <div className="text-right">Price</div>
              <div className="text-right">Day %</div>
              <div className="text-right">Value</div>
              <div className="text-right">Gain/Loss</div>
              <div className="text-right">Actions</div>
            </div>

            {holdings.map((h) => (
              <div
                key={h.id}
                className="grid grid-cols-2 md:grid-cols-8 gap-2 px-4 py-3 border-b border-gray-700/50 items-center hover:bg-gray-800/50 transition-colors"
              >
                {/* Symbol */}
                <div className="font-bold text-white">{h.symbol}</div>

                {/* Shares */}
                <div className="text-right md:text-right text-gray-300">
                  <span className="md:hidden text-gray-500 text-xs mr-1">Shares:</span>
                  {h.shares}
                </div>

                {/* Avg Cost */}
                <div className="text-right text-gray-300 hidden md:block">
                  {fmt(h.avg_cost)}
                </div>

                {/* Current Price */}
                <div className="text-right text-white hidden md:block">
                  {h.current_price ? fmt(h.current_price) : "—"}
                </div>

                {/* Day Change */}
                <div className={`text-right hidden md:block ${
                  (h.change_percent || 0) >= 0 ? "text-emerald-400" : "text-red-400"
                }`}>
                  {h.change_percent != null
                    ? `${h.change_percent >= 0 ? "+" : ""}${h.change_percent.toFixed(2)}%`
                    : "—"}
                </div>

                {/* Market Value */}
                <div className="text-right text-white">
                  <span className="md:hidden text-gray-500 text-xs mr-1">Value:</span>
                  {fmt(h.market_value)}
                </div>

                {/* Gain/Loss */}
                <div className={`text-right ${
                  h.gain_loss != null
                    ? h.gain_loss >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                    : "text-gray-500"
                }`}>
                  <span className="md:hidden text-gray-500 text-xs mr-1">P&L:</span>
                  {h.gain_loss != null
                    ? `${h.gain_loss >= 0 ? "+" : ""}${fmt(h.gain_loss)} (${h.gain_loss_pct?.toFixed(1)}%)`
                    : "—"}
                </div>

                {/* Delete */}
                <div className="text-right">
                  <button
                    onClick={() => handleDelete(h.id)}
                    className="text-gray-500 hover:text-red-400 text-xs transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
