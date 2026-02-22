"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

interface Stock {
  symbol: string;
  name: string;
  price: number | null;
  change_pct: number | null;
  pe_ratio: number | null;
  forward_pe: number | null;
  dividend_yield: number;
  market_cap_b: number | null;
  sector: string;
  beta: number;
  eps: number;
  fifty_two_week_high: number | null;
  fifty_two_week_low: number | null;
}

export default function ScreenerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [results, setResults] = useState<Stock[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Filters
  const [minPe, setMinPe] = useState("");
  const [maxPe, setMaxPe] = useState("");
  const [minYield, setMinYield] = useState("");
  const [maxYield, setMaxYield] = useState("");
  const [minCap, setMinCap] = useState("");
  const [maxCap, setMaxCap] = useState("");
  const [sector, setSector] = useState("");
  const [sortBy, setSortBy] = useState("market_cap");

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (session?.accessToken) apiClient.setToken(session.accessToken);
  }, [status, session, router]);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, number | string | undefined> = { sort_by: sortBy };
      if (minPe) params.min_pe = parseFloat(minPe);
      if (maxPe) params.max_pe = parseFloat(maxPe);
      if (minYield) params.min_yield = parseFloat(minYield);
      if (maxYield) params.max_yield = parseFloat(maxYield);
      if (minCap) params.min_cap = parseFloat(minCap);
      if (maxCap) params.max_cap = parseFloat(maxCap);
      if (sector) params.sector = sector;

      const data = await apiClient.screenStocks(params);
      setResults(data.results);
      setSectors(data.sectors);
      setLoaded(true);
    } catch {
      alert("Screener failed. Try again.");
    } finally {
      setLoading(false);
    }
  }, [minPe, maxPe, minYield, maxYield, minCap, maxCap, sector, sortBy]);

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
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Investment Screener</h1>
            <p className="text-gray-400 text-sm mt-1">Screen 50 popular stocks by fundamental criteria</p>
          </div>
          <button onClick={() => router.push("/chat")} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Chat</button>
        </div>

        {/* Filters */}
        <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wider">P/E Min</label>
              <input type="number" value={minPe} onChange={(e) => setMinPe(e.target.value)} placeholder="Any" className="w-full mt-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wider">P/E Max</label>
              <input type="number" value={maxPe} onChange={(e) => setMaxPe(e.target.value)} placeholder="Any" className="w-full mt-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wider">Div Yield Min (%)</label>
              <input type="number" step="0.1" value={minYield} onChange={(e) => setMinYield(e.target.value)} placeholder="Any" className="w-full mt-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wider">Div Yield Max (%)</label>
              <input type="number" step="0.1" value={maxYield} onChange={(e) => setMaxYield(e.target.value)} placeholder="Any" className="w-full mt-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wider">Market Cap Min ($B)</label>
              <input type="number" value={minCap} onChange={(e) => setMinCap(e.target.value)} placeholder="Any" className="w-full mt-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wider">Market Cap Max ($B)</label>
              <input type="number" value={maxCap} onChange={(e) => setMaxCap(e.target.value)} placeholder="Any" className="w-full mt-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wider">Sector</label>
              <select value={sector} onChange={(e) => setSector(e.target.value)} className="w-full mt-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500">
                <option value="">All Sectors</option>
                {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wider">Sort By</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full mt-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500">
                <option value="market_cap">Market Cap</option>
                <option value="pe_ratio">P/E Ratio</option>
                <option value="dividend_yield">Dividend Yield</option>
                <option value="price">Price</option>
                <option value="change_pct">Day Change</option>
              </select>
            </div>
          </div>
          <button onClick={handleSearch} disabled={loading} className="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors">
            {loading ? "Screening..." : "Screen Stocks"}
          </button>
        </div>

        {/* Results */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
            <span className="ml-3 text-gray-400 text-sm">Screening stocks... this may take a moment</span>
          </div>
        )}

        {!loading && loaded && results.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4 opacity-50">&#x1F50D;</div>
            <p className="text-gray-400 text-lg">No stocks match your criteria</p>
            <p className="text-gray-500 text-sm mt-2">Try widening your filters</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-xs text-gray-400 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Symbol</th>
                  <th className="text-left px-2 py-3 hidden md:table-cell">Name</th>
                  <th className="text-right px-2 py-3">Price</th>
                  <th className="text-right px-2 py-3">Change</th>
                  <th className="text-right px-2 py-3 hidden md:table-cell">P/E</th>
                  <th className="text-right px-2 py-3 hidden md:table-cell">Yield</th>
                  <th className="text-right px-2 py-3 hidden md:table-cell">Mkt Cap</th>
                  <th className="text-right px-2 py-3 hidden lg:table-cell">Sector</th>
                  <th className="text-right px-2 py-3 hidden lg:table-cell">Beta</th>
                </tr>
              </thead>
              <tbody>
                {results.map((s) => (
                  <tr key={s.symbol} className="border-b border-gray-700/50 hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-bold text-white">{s.symbol}</td>
                    <td className="px-2 py-3 text-gray-400 hidden md:table-cell truncate max-w-[150px]">{s.name}</td>
                    <td className="px-2 py-3 text-right text-white">{s.price ? fmt(s.price) : "—"}</td>
                    <td className={`px-2 py-3 text-right ${(s.change_pct || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {s.change_pct != null ? `${s.change_pct >= 0 ? "+" : ""}${s.change_pct}%` : "—"}
                    </td>
                    <td className="px-2 py-3 text-right text-gray-300 hidden md:table-cell">{s.pe_ratio ?? "—"}</td>
                    <td className="px-2 py-3 text-right text-gray-300 hidden md:table-cell">{s.dividend_yield > 0 ? `${s.dividend_yield}%` : "—"}</td>
                    <td className="px-2 py-3 text-right text-gray-300 hidden md:table-cell">{s.market_cap_b ? `$${s.market_cap_b}B` : "—"}</td>
                    <td className="px-2 py-3 text-right text-gray-400 text-xs hidden lg:table-cell">{s.sector}</td>
                    <td className="px-2 py-3 text-right text-gray-400 hidden lg:table-cell">{s.beta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-700">
              {results.length} stocks found
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
