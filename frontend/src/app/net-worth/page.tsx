"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

const ASSET_CATEGORIES = ["Cash", "Investments", "Real Estate", "Vehicles", "Retirement Accounts", "Other Assets"];
const LIABILITY_CATEGORIES = ["Credit Cards", "Student Loans", "Mortgage", "Auto Loans", "Other Debt"];

interface Entry {
  id: number;
  name: string;
  category: string;
  amount: number;
  entry_type: string;
  created_at: string;
}

interface Summary {
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  asset_breakdown: Record<string, number>;
  liability_breakdown: Record<string, number>;
}

export default function NetWorthPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(ASSET_CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [entryType, setEntryType] = useState<"asset" | "liability">("asset");
  const [adding, setAdding] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [entriesData, summaryData] = await Promise.all([
        apiClient.getNetWorthEntries(),
        apiClient.getNetWorthSummary(),
      ]);
      setEntries(entriesData);
      setSummary(summaryData);
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

  const handleAdd = async () => {
    if (!name || !amount) return;
    setAdding(true);
    try {
      await apiClient.createNetWorthEntry({
        name: name.trim(),
        category,
        amount: parseFloat(amount),
        entry_type: entryType,
      });
      setName("");
      setAmount("");
      setShowForm(false);
      await loadData();
    } catch {
      alert("Failed to add entry");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.deleteNetWorthEntry(id);
      await loadData();
    } catch {
      // silent
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
      </div>
    );
  }

  const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
  const categories = entryType === "asset" ? ASSET_CATEGORIES : LIABILITY_CATEGORIES;

  const assets = entries.filter((e) => e.entry_type === "asset");
  const liabilities = entries.filter((e) => e.entry_type === "liability");

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Net Worth</h1>
            <p className="text-gray-400 text-sm mt-1">Track your assets and liabilities</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm transition-colors"
            >
              + Add Entry
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
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            <div className="bg-gray-800/80 border border-emerald-500/30 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Total Assets</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{fmt(summary.total_assets)}</p>
            </div>
            <div className="bg-gray-800/80 border border-red-500/30 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Total Liabilities</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{fmt(summary.total_liabilities)}</p>
            </div>
            <div className={`bg-gray-800/80 border rounded-xl p-4 ${summary.net_worth >= 0 ? "border-emerald-500/30" : "border-red-500/30"}`}>
              <p className="text-gray-400 text-xs uppercase tracking-wider">Net Worth</p>
              <p className={`text-2xl font-bold mt-1 ${summary.net_worth >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {fmt(summary.net_worth)}
              </p>
            </div>
          </div>
        )}

        {/* Category Breakdown */}
        {summary && (Object.keys(summary.asset_breakdown).length > 0 || Object.keys(summary.liability_breakdown).length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {Object.keys(summary.asset_breakdown).length > 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Asset Breakdown</h3>
                <div className="space-y-2">
                  {Object.entries(summary.asset_breakdown).sort((a, b) => b[1] - a[1]).map(([cat, val]) => (
                    <div key={cat}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">{cat}</span>
                        <span className="text-white">{fmt(val)}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full"
                          style={{ width: `${Math.min((val / summary.total_assets) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {Object.keys(summary.liability_breakdown).length > 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Liability Breakdown</h3>
                <div className="space-y-2">
                  {Object.entries(summary.liability_breakdown).sort((a, b) => b[1] - a[1]).map(([cat, val]) => (
                    <div key={cat}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">{cat}</span>
                        <span className="text-white">{fmt(val)}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${Math.min((val / summary.total_liabilities) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Form */}
        {showForm && (
          <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Add Entry</h3>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => { setEntryType("asset"); setCategory(ASSET_CATEGORIES[0]); }}
                className={`px-3 py-1.5 rounded-lg text-sm ${entryType === "asset" ? "bg-emerald-600 text-white" : "bg-gray-700 text-gray-400"}`}
              >
                Asset
              </button>
              <button
                onClick={() => { setEntryType("liability"); setCategory(LIABILITY_CATEGORIES[0]); }}
                className={`px-3 py-1.5 rounded-lg text-sm ${entryType === "liability" ? "bg-red-600 text-white" : "bg-gray-700 text-gray-400"}`}
              >
                Liability
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Name (e.g. Savings Account)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Amount ($)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleAdd}
                disabled={adding || !name || !amount}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                {adding ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        )}

        {/* Entries Lists */}
        {entries.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4 opacity-50">&#x1F4B0;</div>
            <p className="text-gray-400 text-lg">No entries yet</p>
            <p className="text-gray-500 text-sm mt-2">
              Add your assets and liabilities to track your net worth
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {assets.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-emerald-400 mb-3">Assets</h2>
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
                  {assets.map((e) => (
                    <div key={e.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50 hover:bg-gray-800/50">
                      <div>
                        <p className="text-white font-medium">{e.name}</p>
                        <p className="text-gray-500 text-xs">{e.category}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-emerald-400 font-semibold">{fmt(e.amount)}</p>
                        <button onClick={() => handleDelete(e.id)} className="text-gray-500 hover:text-red-400 text-xs">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {liabilities.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-red-400 mb-3">Liabilities</h2>
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
                  {liabilities.map((e) => (
                    <div key={e.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50 hover:bg-gray-800/50">
                      <div>
                        <p className="text-white font-medium">{e.name}</p>
                        <p className="text-gray-500 text-xs">{e.category}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-red-400 font-semibold">{fmt(e.amount)}</p>
                        <button onClick={() => handleDelete(e.id)} className="text-gray-500 hover:text-red-400 text-xs">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
