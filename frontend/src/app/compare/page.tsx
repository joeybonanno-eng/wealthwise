"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

interface CompareResult {
  symbol: string;
  name: string;
  price?: number | null;
  change_percent?: number | null;
  market_cap?: number | null;
  pe_ratio?: number | null;
  forward_pe?: number | null;
  dividend_yield?: number | null;
  fifty_two_week_high?: number | null;
  fifty_two_week_low?: number | null;
  sector?: string;
  beta?: number | null;
  eps?: number | null;
  error?: string;
}

export default function ComparePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [input, setInput] = useState("AAPL, GOOGL");
  const [results, setResults] = useState<CompareResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (session?.accessToken) {
      apiClient.setToken(session.accessToken);
    }
  }, [status, session, router]);

  const handleCompare = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const data = await apiClient.compareStocks(input.trim());
      setResults(data.results);
    } catch {
      alert("Failed to fetch comparison data.");
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number | null | undefined) =>
    n != null ? n.toLocaleString("en-US", { style: "currency", currency: "USD" }) : "—";

  const fmtCap = (n: number | null | undefined) => {
    if (n == null) return "—";
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    return fmt(n);
  };

  const fmtPct = (n: number | null | undefined) =>
    n != null ? `${(n * 100).toFixed(2)}%` : "—";

  const fmtNum = (n: number | null | undefined) =>
    n != null ? n.toFixed(2) : "—";

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
      </div>
    );
  }

  const metrics = [
    { label: "Price", render: (r: CompareResult) => fmt(r.price) },
    {
      label: "Day Change",
      render: (r: CompareResult) =>
        r.change_percent != null
          ? `${r.change_percent >= 0 ? "+" : ""}${r.change_percent.toFixed(2)}%`
          : "—",
      color: (r: CompareResult) =>
        r.change_percent != null
          ? r.change_percent >= 0
            ? "text-emerald-400"
            : "text-red-400"
          : "text-gray-400",
    },
    { label: "Market Cap", render: (r: CompareResult) => fmtCap(r.market_cap) },
    { label: "P/E Ratio", render: (r: CompareResult) => fmtNum(r.pe_ratio) },
    { label: "Forward P/E", render: (r: CompareResult) => fmtNum(r.forward_pe) },
    { label: "EPS", render: (r: CompareResult) => fmt(r.eps) },
    { label: "Dividend Yield", render: (r: CompareResult) => fmtPct(r.dividend_yield) },
    { label: "Beta", render: (r: CompareResult) => fmtNum(r.beta) },
    { label: "52W High", render: (r: CompareResult) => fmt(r.fifty_two_week_high) },
    { label: "52W Low", render: (r: CompareResult) => fmt(r.fifty_two_week_low) },
    { label: "Sector", render: (r: CompareResult) => r.sector || "—" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24 md:pb-8">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Compare Investments</h1>
            <p className="text-gray-400 text-sm mt-1">
              Side-by-side stock comparison (up to 4)
            </p>
          </div>
          <button
            onClick={() => router.push("/chat")}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
          >
            Chat
          </button>
        </div>

        {/* Input */}
        <div className="flex gap-3 mb-6">
          <input
            type="text"
            placeholder="Enter symbols (e.g. AAPL, GOOGL, MSFT)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCompare()}
            className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={handleCompare}
            disabled={loading}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? "Loading..." : "Compare"}
          </button>
        </div>

        {/* Results Table */}
        {results.length > 0 && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">
                    Metric
                  </th>
                  {results.map((r) => (
                    <th
                      key={r.symbol}
                      className="text-right px-4 py-3 text-white font-bold"
                    >
                      <div>{r.symbol}</div>
                      <div className="text-xs text-gray-400 font-normal">
                        {r.name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map((m) => (
                  <tr
                    key={m.label}
                    className="border-b border-gray-700/50 hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3 text-gray-400">{m.label}</td>
                    {results.map((r) => (
                      <td
                        key={r.symbol}
                        className={`text-right px-4 py-3 font-mono ${
                          m.color ? m.color(r) : "text-gray-200"
                        }`}
                      >
                        {r.error ? "—" : m.render(r)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {results.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4 opacity-50">&#x1F4CA;</div>
            <p className="text-gray-400 text-lg">
              Enter stock symbols to compare
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Compare up to 4 stocks side by side
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
