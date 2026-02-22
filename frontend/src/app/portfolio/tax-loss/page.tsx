"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

interface Opportunity {
  symbol: string;
  shares: number;
  avg_cost: number;
  current_price: number;
  cost_basis: number;
  market_value: number;
  unrealized_loss: number;
  loss_pct: number;
  estimated_tax_savings_22: number;
  estimated_tax_savings_32: number;
}

interface Summary {
  total_unrealized_losses: number;
  estimated_tax_savings_22: number;
  estimated_tax_savings_32: number;
  positions_with_losses: number;
}

export default function TaxLossPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const data = await apiClient.getTaxLossHarvesting();
      setOpportunities(data.opportunities);
      setSummary(data.summary);
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
            <h1 className="text-2xl font-bold">Tax-Loss Harvesting</h1>
            <p className="text-gray-400 text-sm mt-1">Identify positions with unrealized losses to offset gains</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => router.push("/portfolio")} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Portfolio</button>
            <button onClick={() => router.push("/chat")} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Chat</button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-gray-800/80 border border-red-500/30 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Total Losses</p>
              <p className="text-xl font-bold text-red-400 mt-1">{fmt(summary.total_unrealized_losses)}</p>
            </div>
            <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Positions</p>
              <p className="text-xl font-bold text-white mt-1">{summary.positions_with_losses}</p>
            </div>
            <div className="bg-gray-800/80 border border-emerald-500/30 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Tax Savings (22%)</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">{fmt(summary.estimated_tax_savings_22)}</p>
            </div>
            <div className="bg-gray-800/80 border border-emerald-500/30 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Tax Savings (32%)</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">{fmt(summary.estimated_tax_savings_32)}</p>
            </div>
          </div>
        )}

        {opportunities.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4 opacity-50">&#x2705;</div>
            <p className="text-gray-400 text-lg">No tax-loss harvesting opportunities</p>
            <p className="text-gray-500 text-sm mt-2">All your positions are currently profitable — nice!</p>
          </div>
        ) : (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
            <div className="hidden md:grid grid-cols-7 gap-2 px-4 py-3 border-b border-gray-700 text-xs text-gray-400 uppercase tracking-wider">
              <div>Symbol</div>
              <div className="text-right">Shares</div>
              <div className="text-right">Avg Cost</div>
              <div className="text-right">Price</div>
              <div className="text-right">Loss</div>
              <div className="text-right">Loss %</div>
              <div className="text-right">Tax Savings</div>
            </div>
            {opportunities.map((o) => (
              <div key={o.symbol} className="grid grid-cols-2 md:grid-cols-7 gap-2 px-4 py-3 border-b border-gray-700/50 items-center hover:bg-gray-800/50">
                <div className="font-bold text-white">{o.symbol}</div>
                <div className="text-right text-gray-300">{o.shares}</div>
                <div className="text-right text-gray-300 hidden md:block">{fmt(o.avg_cost)}</div>
                <div className="text-right text-white hidden md:block">{fmt(o.current_price)}</div>
                <div className="text-right text-red-400">{fmt(o.unrealized_loss)}</div>
                <div className="text-right text-red-400 hidden md:block">{o.loss_pct}%</div>
                <div className="text-right text-emerald-400 hidden md:block">{fmt(o.estimated_tax_savings_22)}</div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-800/30 border border-gray-700 rounded-xl text-xs text-gray-500">
          Tax-loss harvesting involves selling investments at a loss to offset capital gains. Consult a tax professional before making decisions. Estimates assume short-term capital gains tax rates.
        </div>
      </div>
    </div>
  );
}
