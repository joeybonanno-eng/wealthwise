"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

interface MonthData {
  month: string;
  label: string;
  income: number;
  expenses: number;
  net: number;
  cumulative_savings: number;
}

interface ForecastData {
  months: MonthData[];
  income_breakdown: Record<string, number>;
  expense_breakdown: Record<string, number>;
  summary: {
    monthly_income: number;
    monthly_expenses: number;
    avg_net: number;
    total_income_12m: number;
    total_expenses_12m: number;
    projected_savings_12m: number;
  };
}

export default function ForecastPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const result = await apiClient.getCashflowForecast();
      setData(result);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (session?.accessToken) { apiClient.setToken(session.accessToken); loadData(); }
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Cash Flow Forecast</h1>
          <p className="text-gray-400 text-sm mt-1">12-month projection based on your recurring transactions</p>
        </div>

        {!data || data.months.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4 opacity-50">&#x1F4CA;</div>
            <p className="text-gray-400 text-lg">No transactions to forecast</p>
            <p className="text-gray-500 text-sm mt-2">Add recurring transactions in the Budget page first</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Monthly Income</p>
                <p className="text-xl font-bold text-emerald-400 mt-1">{fmt(data.summary.monthly_income)}</p>
              </div>
              <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Monthly Expenses</p>
                <p className="text-xl font-bold text-red-400 mt-1">{fmt(data.summary.monthly_expenses)}</p>
              </div>
              <div className={`bg-gray-800/80 border rounded-xl p-4 ${data.summary.avg_net >= 0 ? "border-emerald-500/30" : "border-red-500/30"}`}>
                <p className="text-gray-400 text-xs uppercase tracking-wider">Net / Month</p>
                <p className={`text-xl font-bold mt-1 ${data.summary.avg_net >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {data.summary.avg_net >= 0 ? "+" : ""}{fmt(data.summary.avg_net)}
                </p>
              </div>
            </div>

            {/* 12-Month Projection */}
            <div className="bg-gray-800/80 border border-emerald-500/20 rounded-xl p-5 mb-6">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">12-Month Projection</h2>
              <p className={`text-3xl font-bold ${data.summary.projected_savings_12m >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {data.summary.projected_savings_12m >= 0 ? "+" : ""}{fmt(data.summary.projected_savings_12m)}
              </p>
              <p className="text-gray-500 text-sm mt-1">Projected net savings over the next 12 months</p>
            </div>

            {/* Expense Breakdown */}
            {Object.keys(data.expense_breakdown).length > 0 && (
              <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-5 mb-6">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Expense Breakdown</h2>
                <div className="space-y-2">
                  {Object.entries(data.expense_breakdown).map(([cat, amount]) => (
                    <div key={cat} className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">{cat}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-700 rounded-full h-2">
                          <div className="bg-red-500 h-2 rounded-full" style={{ width: `${Math.min((amount / data.summary.monthly_expenses) * 100, 100)}%` }} />
                        </div>
                        <span className="text-sm text-gray-400 w-24 text-right">{fmt(amount)}/mo</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly Table */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-700">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Month-by-Month</h2>
              </div>
              <div className="hidden md:grid grid-cols-5 gap-2 px-5 py-2 border-b border-gray-700 text-xs text-gray-500 uppercase">
                <div>Month</div>
                <div className="text-right">Income</div>
                <div className="text-right">Expenses</div>
                <div className="text-right">Net</div>
                <div className="text-right">Cumulative</div>
              </div>
              {data.months.map((m) => (
                <div key={m.month} className="grid grid-cols-3 md:grid-cols-5 gap-2 px-5 py-2.5 border-b border-gray-700/30 text-sm">
                  <div className="text-gray-400 font-medium">{m.label}</div>
                  <div className="text-right text-emerald-400 hidden md:block">{fmt(m.income)}</div>
                  <div className="text-right text-red-400 hidden md:block">{fmt(m.expenses)}</div>
                  <div className={`text-right font-medium ${m.net >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {m.net >= 0 ? "+" : ""}{fmt(m.net)}
                  </div>
                  <div className={`text-right ${m.cumulative_savings >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {fmt(m.cumulative_savings)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
