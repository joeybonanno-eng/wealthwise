"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

interface YearData {
  year: number;
  age: number;
  balance: number;
}

interface Results {
  projected_balance: number;
  annual_withdrawal: number;
  monthly_withdrawal: number;
  success_rate: number;
  years_to_retirement: number;
  yearly_data: YearData[];
}

export default function RetirementCalculatorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [currentAge, setCurrentAge] = useState("30");
  const [retirementAge, setRetirementAge] = useState("65");
  const [currentSavings, setCurrentSavings] = useState("50000");
  const [monthlyContribution, setMonthlyContribution] = useState("1000");
  const [expectedReturn, setExpectedReturn] = useState("7");
  const [inflationRate, setInflationRate] = useState("3");
  const [results, setResults] = useState<Results | null>(null);
  const [calculating, setCalculating] = useState(false);

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
    setCalculating(true);
    try {
      const data = await apiClient.calculateRetirement({
        current_age: parseInt(currentAge),
        retirement_age: parseInt(retirementAge),
        current_savings: parseFloat(currentSavings),
        monthly_contribution: parseFloat(monthlyContribution),
        expected_return: parseFloat(expectedReturn),
        inflation_rate: parseFloat(inflationRate),
      });
      setResults(data);
    } catch {
      alert("Calculation failed. Check your inputs.");
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

  // For the year-by-year chart-like display, find the max balance
  const maxBalance = results ? Math.max(...results.yearly_data.map((d) => d.balance)) : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Retirement Calculator</h1>
            <p className="text-gray-400 text-sm mt-1">Project your retirement savings and income</p>
          </div>
          <button
            onClick={() => router.push("/chat")}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
          >
            Chat
          </button>
        </div>

        {/* Input Form */}
        <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1">Current Age</label>
              <input
                type="number"
                value={currentAge}
                onChange={(e) => setCurrentAge(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1">Retirement Age</label>
              <input
                type="number"
                value={retirementAge}
                onChange={(e) => setRetirementAge(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1">Current Savings ($)</label>
              <input
                type="number"
                value={currentSavings}
                onChange={(e) => setCurrentSavings(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1">Monthly Contribution ($)</label>
              <input
                type="number"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1">Expected Return (%)</label>
              <input
                type="number"
                step="0.1"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1">Inflation Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={inflationRate}
                onChange={(e) => setInflationRate(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <button
            onClick={handleCalculate}
            disabled={calculating}
            className="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
          >
            {calculating ? "Calculating..." : "Calculate"}
          </button>
        </div>

        {/* Results */}
        {results && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-gray-800/80 border border-emerald-500/30 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Projected Balance</p>
                <p className="text-xl font-bold text-emerald-400 mt-1">{fmt(results.projected_balance)}</p>
                <p className="text-gray-500 text-xs mt-1">at age {retirementAge}</p>
              </div>
              <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Annual Withdrawal</p>
                <p className="text-xl font-bold text-white mt-1">{fmt(results.annual_withdrawal)}</p>
                <p className="text-gray-500 text-xs mt-1">4% rule</p>
              </div>
              <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Monthly Income</p>
                <p className="text-xl font-bold text-white mt-1">{fmt(results.monthly_withdrawal)}</p>
                <p className="text-gray-500 text-xs mt-1">in retirement</p>
              </div>
              <div className={`bg-gray-800/80 border rounded-xl p-4 ${results.success_rate >= 80 ? "border-emerald-500/30" : results.success_rate >= 60 ? "border-yellow-500/30" : "border-red-500/30"}`}>
                <p className="text-gray-400 text-xs uppercase tracking-wider">Success Rate</p>
                <p className={`text-xl font-bold mt-1 ${results.success_rate >= 80 ? "text-emerald-400" : results.success_rate >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                  {results.success_rate}%
                </p>
                <p className="text-gray-500 text-xs mt-1">Monte Carlo</p>
              </div>
            </div>

            {/* Year-by-Year Growth */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Projected Growth (inflation-adjusted)</h3>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {results.yearly_data.map((d) => (
                  <div key={d.year} className="flex items-center gap-3">
                    <span className="text-gray-500 text-xs w-16 shrink-0">Age {d.age}</span>
                    <div className="flex-1 bg-gray-700 rounded-full h-4 relative">
                      <div
                        className="bg-emerald-500/80 h-4 rounded-full"
                        style={{ width: `${Math.max((d.balance / maxBalance) * 100, 1)}%` }}
                      />
                    </div>
                    <span className="text-white text-xs w-28 text-right shrink-0">{fmt(d.balance)}</span>
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
