"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

interface Sub {
  id: number;
  name: string;
  amount: number;
  frequency: string;
  category: string;
  monthly_cost: number;
  annual_cost: number;
  next_due: string | null;
  is_active: boolean;
}

interface Summary {
  count: number;
  total_monthly: number;
  total_annual: number;
  daily_cost: number;
  by_category: Record<string, number>;
}

export default function SubscriptionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subs, setSubs] = useState<Sub[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const data = await apiClient.getSubscriptions();
      setSubs(data.subscriptions);
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
            <h1 className="text-2xl font-bold">Subscriptions</h1>
            <p className="text-gray-400 text-sm mt-1">Track your recurring expenses and annual costs</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => router.push("/budget")} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Budget</button>
            <button onClick={() => router.push("/chat")} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Chat</button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Subscriptions</p>
              <p className="text-2xl font-bold text-white mt-1">{summary.count}</p>
            </div>
            <div className="bg-gray-800/80 border border-red-500/30 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Monthly Cost</p>
              <p className="text-xl font-bold text-red-400 mt-1">{fmt(summary.total_monthly)}</p>
            </div>
            <div className="bg-gray-800/80 border border-red-500/30 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Annual Cost</p>
              <p className="text-xl font-bold text-red-400 mt-1">{fmt(summary.total_annual)}</p>
            </div>
            <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Daily Cost</p>
              <p className="text-xl font-bold text-white mt-1">{fmt(summary.daily_cost)}</p>
            </div>
          </div>
        )}

        {/* Category Breakdown */}
        {summary && Object.keys(summary.by_category).length > 0 && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Annual Cost by Category</h3>
            <div className="space-y-2">
              {Object.entries(summary.by_category).map(([cat, val]) => (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">{cat}</span>
                    <span className="text-white">{fmt(val)}/yr</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-red-500/70 h-2 rounded-full" style={{ width: `${Math.min((val / summary.total_annual) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subscriptions List */}
        {subs.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4 opacity-50">&#x1F4B3;</div>
            <p className="text-gray-400 text-lg">No subscriptions tracked</p>
            <p className="text-gray-500 text-sm mt-2">Add recurring expenses in the Budget page to see them here</p>
            <button onClick={() => router.push("/budget")} className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm transition-colors">Go to Budget</button>
          </div>
        ) : (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
            <div className="hidden md:grid grid-cols-5 gap-2 px-4 py-3 border-b border-gray-700 text-xs text-gray-400 uppercase tracking-wider">
              <div>Name</div>
              <div>Category</div>
              <div className="text-right">Amount</div>
              <div className="text-right">Monthly</div>
              <div className="text-right">Annual</div>
            </div>
            {subs.map((s) => (
              <div key={s.id} className="grid grid-cols-2 md:grid-cols-5 gap-2 px-4 py-3 border-b border-gray-700/50 items-center hover:bg-gray-800/50">
                <div className="font-medium text-white">{s.name}</div>
                <div className="text-gray-400 text-sm hidden md:block">{s.category}</div>
                <div className="text-right text-gray-300">
                  {fmt(s.amount)}/{s.frequency === "yearly" ? "yr" : s.frequency === "weekly" ? "wk" : "mo"}
                </div>
                <div className="text-right text-white hidden md:block">{fmt(s.monthly_cost)}</div>
                <div className="text-right text-red-400 hidden md:block">{fmt(s.annual_cost)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
