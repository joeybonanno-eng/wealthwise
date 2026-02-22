"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

interface YearlyData {
  year: number;
  balance: number;
  total_contributed: number;
  interest_earned: number;
}

export default function CompoundInterestPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [principal, setPrincipal] = useState("10000");
  const [monthly, setMonthly] = useState("500");
  const [rate, setRate] = useState("7");
  const [years, setYears] = useState("20");
  const [result, setResult] = useState<{
    final_balance: number;
    total_contributed: number;
    total_interest: number;
    yearly_data: YearlyData[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (session?.accessToken) {
      apiClient.setToken(session.accessToken);
    }
  }, [status, session, router]);

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const data = await apiClient.calculateCompoundInterest({
        principal: parseFloat(principal) || 0,
        monthly_contribution: parseFloat(monthly) || 0,
        annual_rate: parseFloat(rate) || 0,
        years: parseInt(years) || 1,
      });
      setResult(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Compound Interest Calculator</h1>
          <p className="text-gray-400 text-sm mt-1">See how your money grows over time</p>
        </div>

        {/* Input Form */}
        <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Initial Investment</label>
              <input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Monthly Contribution</label>
              <input
                type="number"
                value={monthly}
                onChange={(e) => setMonthly(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Annual Return (%)</label>
              <input
                type="number"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Time Period (Years)</label>
              <input
                type="number"
                value={years}
                onChange={(e) => setYears(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <button
            onClick={handleCalculate}
            disabled={loading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? "Calculating..." : "Calculate"}
          </button>
        </div>

        {/* Results */}
        {result && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-800/80 border border-emerald-500/30 rounded-xl p-5">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Final Balance</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{fmt(result.final_balance)}</p>
              </div>
              <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-5">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Total Contributed</p>
                <p className="text-2xl font-bold text-white mt-1">{fmt(result.total_contributed)}</p>
              </div>
              <div className="bg-gray-800/80 border border-blue-500/30 rounded-xl p-5">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Interest Earned</p>
                <p className="text-2xl font-bold text-blue-400 mt-1">{fmt(result.total_interest)}</p>
              </div>
            </div>

            {/* Growth Bar Visualization */}
            {result.total_contributed > 0 && (
              <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-5 mb-6">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Breakdown</h2>
                <div className="flex rounded-full overflow-hidden h-6">
                  <div
                    className="bg-gray-500 flex items-center justify-center text-xs font-medium"
                    style={{ width: `${(result.total_contributed / result.final_balance) * 100}%` }}
                  >
                    {((result.total_contributed / result.final_balance) * 100).toFixed(0)}%
                  </div>
                  <div
                    className="bg-emerald-500 flex items-center justify-center text-xs font-medium"
                    style={{ width: `${(result.total_interest / result.final_balance) * 100}%` }}
                  >
                    {((result.total_interest / result.final_balance) * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>Contributions</span>
                  <span>Interest</span>
                </div>
              </div>
            )}

            {/* Year-by-Year Table */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-700">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Year-by-Year Growth</h2>
              </div>
              <div className="hidden md:grid grid-cols-4 gap-2 px-5 py-2 border-b border-gray-700 text-xs text-gray-500 uppercase">
                <div>Year</div>
                <div className="text-right">Balance</div>
                <div className="text-right">Contributed</div>
                <div className="text-right">Interest</div>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {result.yearly_data.map((y) => (
                  <div key={y.year} className="grid grid-cols-2 md:grid-cols-4 gap-2 px-5 py-2 border-b border-gray-700/30 text-sm">
                    <div className="text-gray-400">Year {y.year}</div>
                    <div className="text-right text-emerald-400 font-medium">{fmt(y.balance)}</div>
                    <div className="text-right text-gray-400 hidden md:block">{fmt(y.total_contributed)}</div>
                    <div className="text-right text-blue-400 hidden md:block">{fmt(y.interest_earned)}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
