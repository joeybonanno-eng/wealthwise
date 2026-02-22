"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

interface WatchlistItem {
  id: number;
  symbol: string;
  name: string | null;
  target_buy_price: number | null;
  notes: string | null;
  current_price: number | null;
  change_percent: number | null;
  distance_pct: number | null;
  buy_signal: boolean;
  added_at: string;
}

export default function WatchlistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [adding, setAdding] = useState(false);

  const loadWatchlist = useCallback(async () => {
    try {
      const data = await apiClient.getWatchlist();
      setItems(data);
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
      loadWatchlist();
    }
  }, [status, session, router, loadWatchlist]);

  const handleAdd = async () => {
    if (!symbol) return;
    setAdding(true);
    try {
      await apiClient.addToWatchlist({
        symbol: symbol.toUpperCase(),
        target_buy_price: targetPrice ? parseFloat(targetPrice) : undefined,
        notes: notes || undefined,
      });
      setSymbol("");
      setTargetPrice("");
      setNotes("");
      setShowAdd(false);
      await loadWatchlist();
    } catch {
      alert("Failed to add to watchlist.");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.removeFromWatchlist(id);
      await loadWatchlist();
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

  const buySignals = items.filter((i) => i.buy_signal);

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Watchlist</h1>
            <p className="text-gray-400 text-sm mt-1">
              Track stocks you&apos;re interested in
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm transition-colors"
            >
              + Add
            </button>
            <button
              onClick={() => router.push("/chat")}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              Chat
            </button>
          </div>
        </div>

        {/* Buy Signal Alerts */}
        {buySignals.length > 0 && (
          <div className="bg-emerald-900/30 border border-emerald-500/50 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-emerald-400 mb-2">
              Buy Signals
            </h3>
            <div className="flex flex-wrap gap-2">
              {buySignals.map((item) => (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-1.5 bg-emerald-600/20 border border-emerald-500/50 rounded-full px-3 py-1 text-sm"
                >
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="font-bold text-emerald-400">
                    {item.symbol}
                  </span>
                  <span className="text-emerald-300">
                    at {item.current_price ? fmt(item.current_price) : "—"}
                  </span>
                  <span className="text-emerald-500 text-xs">
                    (target: {item.target_buy_price ? fmt(item.target_buy_price) : "—"})
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Add Form */}
        {showAdd && (
          <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">
              Add to Watchlist
            </h3>
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
                placeholder="Target Buy Price ($)"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
              <input
                type="text"
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleAdd}
                disabled={adding || !symbol}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                {adding ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        )}

        {/* Watchlist Table */}
        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4 opacity-50">&#x1F440;</div>
            <p className="text-gray-400 text-lg">Your watchlist is empty</p>
            <p className="text-gray-500 text-sm mt-2">
              Add stocks to track their prices and set buy targets
            </p>
          </div>
        ) : (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
            <div className="hidden md:grid grid-cols-7 gap-2 px-4 py-3 border-b border-gray-700 text-xs text-gray-400 uppercase tracking-wider">
              <div>Symbol</div>
              <div className="text-right">Price</div>
              <div className="text-right">Day %</div>
              <div className="text-right">Target</div>
              <div className="text-right">Distance</div>
              <div>Notes</div>
              <div className="text-right">Actions</div>
            </div>

            {items.map((item) => (
              <div
                key={item.id}
                className={`grid grid-cols-2 md:grid-cols-7 gap-2 px-4 py-3 border-b border-gray-700/50 items-center hover:bg-gray-800/50 transition-colors ${
                  item.buy_signal ? "bg-emerald-900/10" : ""
                }`}
              >
                <div>
                  <span className="font-bold text-white">{item.symbol}</span>
                  {item.buy_signal && (
                    <span className="ml-2 text-xs bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                      BUY
                    </span>
                  )}
                  {item.name && (
                    <div className="text-xs text-gray-500 truncate">
                      {item.name}
                    </div>
                  )}
                </div>
                <div className="text-right font-mono text-white">
                  {item.current_price ? fmt(item.current_price) : "—"}
                </div>
                <div
                  className={`text-right hidden md:block font-mono ${
                    (item.change_percent || 0) >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {item.change_percent != null
                    ? `${item.change_percent >= 0 ? "+" : ""}${item.change_percent.toFixed(2)}%`
                    : "—"}
                </div>
                <div className="text-right hidden md:block text-gray-300 font-mono">
                  {item.target_buy_price ? fmt(item.target_buy_price) : "—"}
                </div>
                <div
                  className={`text-right hidden md:block font-mono ${
                    item.distance_pct != null
                      ? item.distance_pct <= 0
                        ? "text-emerald-400"
                        : item.distance_pct <= 5
                        ? "text-yellow-400"
                        : "text-gray-400"
                      : "text-gray-500"
                  }`}
                >
                  {item.distance_pct != null
                    ? `${item.distance_pct >= 0 ? "+" : ""}${item.distance_pct}%`
                    : "—"}
                </div>
                <div className="hidden md:block text-gray-500 text-sm truncate">
                  {item.notes || "—"}
                </div>
                <div className="text-right">
                  <button
                    onClick={() => handleDelete(item.id)}
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
