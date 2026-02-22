"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

interface Target {
  category: string;
  target_pct: number;
}

interface Suggestion {
  category: string;
  action: string;
  amount: number;
  current_pct: number;
  target_pct: number;
  diff_pct: number;
}

export default function AllocationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<string[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [currentAlloc, setCurrentAlloc] = useState<Record<string, number>>({});
  const [targetMap, setTargetMap] = useState<Record<string, number>>({});
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasTargets, setHasTargets] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [targetsData, analysisData] = await Promise.all([
        apiClient.getAllocationTargets(),
        apiClient.getAllocationAnalysis(),
      ]);
      setCategories(targetsData.categories);
      if (targetsData.targets.length > 0) {
        setTargets(targetsData.targets.map((t) => ({ category: t.category, target_pct: t.target_pct })));
        setHasTargets(true);
      } else {
        // Default targets
        setTargets(targetsData.categories.map((c) => ({ category: c, target_pct: 0 })));
      }
      setCurrentAlloc(analysisData.current);
      setTargetMap(analysisData.targets);
      setSuggestions(analysisData.suggestions);
      setTotalValue(analysisData.total_value);
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

  const handleSave = async () => {
    const total = targets.reduce((s, t) => s + t.target_pct, 0);
    if (Math.abs(total - 100) > 0.5) {
      alert(`Targets must sum to 100% (currently ${total}%)`);
      return;
    }
    setSaving(true);
    try {
      await apiClient.setAllocationTargets(targets.filter((t) => t.target_pct > 0));
      await loadData();
    } catch {
      alert("Failed to save targets");
    } finally {
      setSaving(false);
    }
  };

  const updateTarget = (idx: number, pct: number) => {
    const updated = [...targets];
    updated[idx] = { ...updated[idx], target_pct: pct };
    setTargets(updated);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
      </div>
    );
  }

  const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
  const totalPct = targets.reduce((s, t) => s + t.target_pct, 0);
  const allCategories = Array.from(new Set([...Object.keys(currentAlloc), ...Object.keys(targetMap), ...categories]));

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Asset Allocation</h1>
            <p className="text-gray-400 text-sm mt-1">Set targets and rebalance your portfolio</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => router.push("/portfolio")} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Portfolio</button>
            <button onClick={() => router.push("/chat")} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Chat</button>
          </div>
        </div>

        {/* Current vs Target Comparison */}
        {(hasTargets || Object.keys(currentAlloc).length > 0) && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-300">Current vs Target</h3>
              <span className="text-xs text-gray-500">Total: {fmt(totalValue)}</span>
            </div>
            <div className="space-y-3">
              {allCategories.sort().map((cat) => {
                const cur = currentAlloc[cat] || 0;
                const tgt = targetMap[cat] || 0;
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">{cat}</span>
                      <span className="text-gray-300">
                        {cur}% current{tgt > 0 ? ` / ${tgt}% target` : ""}
                      </span>
                    </div>
                    <div className="relative w-full bg-gray-700 rounded-full h-3">
                      <div className="absolute bg-emerald-500/60 h-3 rounded-full" style={{ width: `${Math.min(cur, 100)}%` }} />
                      {tgt > 0 && (
                        <div className="absolute h-3 border-r-2 border-yellow-400" style={{ left: `${Math.min(tgt, 100)}%` }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Set Targets */}
        <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">
            Target Allocation <span className={`text-xs ${Math.abs(totalPct - 100) <= 0.5 ? "text-emerald-400" : "text-red-400"}`}>({totalPct}%)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {targets.map((t, idx) => (
              <div key={t.category} className="flex items-center gap-2">
                <span className="text-sm text-gray-400 w-28 shrink-0">{t.category}</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={t.target_pct}
                  onChange={(e) => updateTarget(idx, parseFloat(e.target.value) || 0)}
                  className="w-20 bg-gray-900 border border-gray-600 rounded-lg px-2 py-1 text-white text-sm text-center focus:outline-none focus:border-emerald-500"
                />
                <span className="text-gray-500 text-sm">%</span>
              </div>
            ))}
          </div>
          <button
            onClick={handleSave}
            disabled={saving || Math.abs(totalPct - 100) > 0.5}
            className="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
          >
            {saving ? "Saving..." : "Save Targets"}
          </button>
        </div>

        {/* Rebalance Suggestions */}
        {suggestions.length > 0 && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Rebalance Suggestions</h3>
            <div className="space-y-2">
              {suggestions.map((s) => (
                <div key={s.category} className="flex items-center justify-between py-2 border-b border-gray-700/50">
                  <div>
                    <span className="text-white font-medium">{s.category}</span>
                    <span className="text-gray-500 text-xs ml-2">{s.current_pct}% &rarr; {s.target_pct}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${s.action === "Buy" ? "text-emerald-400" : "text-red-400"}`}>
                      {s.action} {fmt(s.amount)}
                    </span>
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
