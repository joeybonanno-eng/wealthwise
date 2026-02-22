"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

interface DividendHolding {
  symbol: string;
  shares: number;
  dividend_yield: number;
  dividend_rate: number;
  annual_income: number;
  yield_on_cost: number;
  frequency: string;
  ex_dividend_date: number | null;
}

export default function DividendsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [holdings, setHoldings] = useState<DividendHolding[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalYield, setTotalYield] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const data = await apiClient.getPortfolioDividends();
      setHoldings(data.holdings);
      setTotalIncome(data.total_annual_income);
      setTotalYield(data.total_yield_on_cost);
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
  const dividendPayers = holdings.filter((h) => h.dividend_rate > 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Dividend Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Analyze dividend income from your portfolio</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/portfolio")}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              Portfolio
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-800/80 border border-emerald-500/30 rounded-xl p-4">
            <p className="text-gray-400 text-xs uppercase tracking-wider">Annual Dividend Income</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{fmt(totalIncome)}</p>
            <p className="text-gray-500 text-xs mt-1">{fmt(totalIncome / 12)}/month</p>
          </div>
          <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-xs uppercase tracking-wider">Portfolio Yield on Cost</p>
            <p className="text-2xl font-bold text-white mt-1">{totalYield}%</p>
          </div>
          <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-xs uppercase tracking-wider">Dividend Payers</p>
            <p className="text-2xl font-bold text-white mt-1">{dividendPayers.length} / {holdings.length}</p>
          </div>
        </div>

        {/* Dividend Table */}
        {holdings.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4 opacity-50">&#x1F4B5;</div>
            <p className="text-gray-400 text-lg">No holdings yet</p>
            <p className="text-gray-500 text-sm mt-2">Add holdings to your portfolio to see dividend analysis</p>
          </div>
        ) : (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
            <div className="hidden md:grid grid-cols-7 gap-2 px-4 py-3 border-b border-gray-700 text-xs text-gray-400 uppercase tracking-wider">
              <div>Symbol</div>
              <div className="text-right">Shares</div>
              <div className="text-right">Yield</div>
              <div className="text-right">Rate/Share</div>
              <div className="text-right">Annual Income</div>
              <div className="text-right">Yield on Cost</div>
              <div className="text-right">Frequency</div>
            </div>

            {holdings.map((h) => (
              <div
                key={h.symbol}
                className="grid grid-cols-2 md:grid-cols-7 gap-2 px-4 py-3 border-b border-gray-700/50 items-center hover:bg-gray-800/50 transition-colors"
              >
                <div className="font-bold text-white">{h.symbol}</div>
                <div className="text-right text-gray-300">{h.shares}</div>
                <div className="text-right text-gray-300 hidden md:block">
                  {h.dividend_yield > 0 ? `${h.dividend_yield}%` : "—"}
                </div>
                <div className="text-right text-gray-300 hidden md:block">
                  {h.dividend_rate > 0 ? `$${h.dividend_rate}` : "—"}
                </div>
                <div className={`text-right ${h.annual_income > 0 ? "text-emerald-400" : "text-gray-500"}`}>
                  {h.annual_income > 0 ? fmt(h.annual_income) : "—"}
                </div>
                <div className="text-right text-gray-300 hidden md:block">
                  {h.yield_on_cost > 0 ? `${h.yield_on_cost}%` : "—"}
                </div>
                <div className="text-right text-gray-400 hidden md:block text-sm">
                  {h.frequency}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
