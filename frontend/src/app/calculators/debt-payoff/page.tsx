"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

interface DebtInput {
  name: string;
  balance: string;
  interest_rate: string;
  minimum_payment: string;
}

interface StrategyResult {
  strategy: string;
  months_to_payoff: number;
  years_to_payoff: number;
  total_paid: number;
  total_interest: number;
  schedule: Array<{ month: number; total_remaining: number }>;
}

interface Results {
  avalanche: StrategyResult;
  snowball: StrategyResult;
  summary: {
    total_debt: number;
    total_minimum_payments: number;
    extra_monthly: number;
    interest_saved_avalanche: number;
    recommended: string;
  };
}

export default function DebtPayoffPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [debts, setDebts] = useState<DebtInput[]>([
    { name: "", balance: "", interest_rate: "", minimum_payment: "" },
  ]);
  const [extraMonthly, setExtraMonthly] = useState("0");
  const [results, setResults] = useState<Results | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [activeStrategy, setActiveStrategy] = useState<"avalanche" | "snowball">("avalanche");

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (session?.accessToken) apiClient.setToken(session.accessToken);
  }, [status, session, router]);

  const addDebt = () => {
    setDebts([...debts, { name: "", balance: "", interest_rate: "", minimum_payment: "" }]);
  };

  const removeDebt = (idx: number) => {
    if (debts.length <= 1) return;
    setDebts(debts.filter((_, i) => i !== idx));
  };

  const updateDebt = (idx: number, field: keyof DebtInput, value: string) => {
    const updated = [...debts];
    updated[idx] = { ...updated[idx], [field]: value };
    setDebts(updated);
  };

  const handleCalculate = async () => {
    const parsed = debts
      .filter((d) => d.name && d.balance && d.interest_rate && d.minimum_payment)
      .map((d) => ({
        name: d.name,
        balance: parseFloat(d.balance),
        interest_rate: parseFloat(d.interest_rate),
        minimum_payment: parseFloat(d.minimum_payment),
      }));
    if (parsed.length === 0) { alert("Add at least one debt"); return; }

    setCalculating(true);
    try {
      const data = await apiClient.calculateDebtPayoff({
        debts: parsed,
        extra_monthly: parseFloat(extraMonthly) || 0,
      });
      setResults(data);
      setActiveStrategy(data.summary.recommended as "avalanche" | "snowball");
    } catch {
      alert("Calculation failed");
    } finally {
      setCalculating(false);
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
  const active = results ? results[activeStrategy] : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Debt Payoff Planner</h1>
            <p className="text-gray-400 text-sm mt-1">Compare snowball vs avalanche strategies</p>
          </div>
          <button onClick={() => router.push("/chat")} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Chat</button>
        </div>

        {/* Input Form */}
        <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Your Debts</h3>
          <div className="space-y-3">
            {debts.map((d, idx) => (
              <div key={idx} className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
                <input type="text" placeholder="Name" value={d.name} onChange={(e) => updateDebt(idx, "name", e.target.value)} className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
                <input type="number" placeholder="Balance ($)" value={d.balance} onChange={(e) => updateDebt(idx, "balance", e.target.value)} className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
                <input type="number" step="0.1" placeholder="Rate (%)" value={d.interest_rate} onChange={(e) => updateDebt(idx, "interest_rate", e.target.value)} className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
                <input type="number" placeholder="Min Payment ($)" value={d.minimum_payment} onChange={(e) => updateDebt(idx, "minimum_payment", e.target.value)} className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
                <button onClick={() => removeDebt(idx)} className="text-gray-500 hover:text-red-400 text-sm py-2">{debts.length > 1 ? "Remove" : ""}</button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <button onClick={addDebt} className="text-emerald-400 hover:text-emerald-300 text-sm">+ Add Debt</button>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <div>
              <label className="text-gray-400 text-xs uppercase tracking-wider">Extra Monthly ($)</label>
              <input type="number" value={extraMonthly} onChange={(e) => setExtraMonthly(e.target.value)} className="block w-32 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm mt-1 focus:outline-none focus:border-emerald-500" />
            </div>
            <button onClick={handleCalculate} disabled={calculating} className="mt-5 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors">
              {calculating ? "Calculating..." : "Calculate"}
            </button>
          </div>
        </div>

        {/* Results */}
        {results && (
          <>
            {/* Strategy Toggle */}
            <div className="flex gap-2 mb-4">
              <button onClick={() => setActiveStrategy("avalanche")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeStrategy === "avalanche" ? "bg-emerald-600 text-white" : "bg-gray-800 text-gray-400"}`}>
                Avalanche {results.summary.recommended === "avalanche" ? "(Recommended)" : ""}
              </button>
              <button onClick={() => setActiveStrategy("snowball")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeStrategy === "snowball" ? "bg-emerald-600 text-white" : "bg-gray-800 text-gray-400"}`}>
                Snowball {results.summary.recommended === "snowball" ? "(Recommended)" : ""}
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Total Debt</p>
                <p className="text-xl font-bold text-red-400 mt-1">{fmt(results.summary.total_debt)}</p>
              </div>
              <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Payoff Time</p>
                <p className="text-xl font-bold text-white mt-1">{active?.years_to_payoff} yrs</p>
                <p className="text-gray-500 text-xs">{active?.months_to_payoff} months</p>
              </div>
              <div className="bg-gray-800/80 border border-red-500/30 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Total Interest</p>
                <p className="text-xl font-bold text-red-400 mt-1">{fmt(active?.total_interest || 0)}</p>
              </div>
              <div className="bg-gray-800/80 border border-emerald-500/30 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Interest Saved</p>
                <p className="text-xl font-bold text-emerald-400 mt-1">{fmt(results.summary.interest_saved_avalanche)}</p>
                <p className="text-gray-500 text-xs">vs other strategy</p>
              </div>
            </div>

            {/* Payoff Schedule */}
            {active && active.schedule.length > 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Payoff Schedule ({activeStrategy})</h3>
                <div className="space-y-1 max-h-72 overflow-y-auto">
                  {active.schedule.map((s) => {
                    const pct = results.summary.total_debt > 0
                      ? ((results.summary.total_debt - s.total_remaining) / results.summary.total_debt) * 100
                      : 100;
                    return (
                      <div key={s.month} className="flex items-center gap-3">
                        <span className="text-gray-500 text-xs w-20 shrink-0">Month {s.month}</span>
                        <div className="flex-1 bg-gray-700 rounded-full h-3">
                          <div className="bg-emerald-500/80 h-3 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <span className="text-white text-xs w-24 text-right shrink-0">{fmt(s.total_remaining)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4 p-3 bg-gray-800/30 border border-gray-700 rounded-xl text-xs text-gray-500">
              <strong>Avalanche:</strong> Pay highest-interest debt first — saves the most money.
              <strong className="ml-2">Snowball:</strong> Pay smallest balance first — builds momentum with quick wins.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
