"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

interface BracketEntry {
  rate: number;
  income: number;
  tax: number;
}

interface TaxResult {
  federal_income_tax: number;
  ltcg_tax: number;
  total_federal_tax: number;
  fica_tax: number;
  total_tax: number;
  effective_rate: number;
  marginal_rate: number;
  taxable_income: number;
  agi: number;
  deduction: number;
  deduction_type: string;
  bracket_breakdown: BracketEntry[];
  take_home: number;
  monthly_take_home: number;
}

export default function TaxEstimatorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [filingStatus, setFilingStatus] = useState("single");
  const [grossIncome, setGrossIncome] = useState("85000");
  const [deductions, setDeductions] = useState("0");
  const [shortGains, setShortGains] = useState("0");
  const [longGains, setLongGains] = useState("0");
  const [retirement, setRetirement] = useState("6000");
  const [result, setResult] = useState<TaxResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (session?.accessToken) { apiClient.setToken(session.accessToken); }
  }, [status, session, router]);

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const data = await apiClient.estimateTaxes({
        filing_status: filingStatus,
        gross_income: parseFloat(grossIncome) || 0,
        deductions: parseFloat(deductions) || 0,
        capital_gains_short: parseFloat(shortGains) || 0,
        capital_gains_long: parseFloat(longGains) || 0,
        retirement_contributions: parseFloat(retirement) || 0,
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
          <h1 className="text-2xl font-bold">Tax Estimator</h1>
          <p className="text-gray-400 text-sm mt-1">Estimate your federal income tax liability (2024 brackets)</p>
        </div>

        {/* Input Form */}
        <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Filing Status</label>
              <select value={filingStatus} onChange={(e) => setFilingStatus(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500">
                <option value="single">Single</option>
                <option value="married_joint">Married Filing Jointly</option>
                <option value="married_separate">Married Filing Separately</option>
                <option value="head_of_household">Head of Household</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Gross Income</label>
              <input type="number" value={grossIncome} onChange={(e) => setGrossIncome(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Itemized Deductions</label>
              <input type="number" value={deductions} onChange={(e) => setDeductions(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Short-Term Cap Gains</label>
              <input type="number" value={shortGains} onChange={(e) => setShortGains(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Long-Term Cap Gains</label>
              <input type="number" value={longGains} onChange={(e) => setLongGains(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Retirement Contributions</label>
              <input type="number" value={retirement} onChange={(e) => setRetirement(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
            </div>
          </div>
          <button onClick={handleCalculate} disabled={loading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors">
            {loading ? "Estimating..." : "Estimate Taxes"}
          </button>
        </div>

        {result && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-gray-800/80 border border-red-500/30 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Total Tax</p>
                <p className="text-2xl font-bold text-red-400 mt-1">{fmt(result.total_tax)}</p>
              </div>
              <div className="bg-gray-800/80 border border-emerald-500/30 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Take Home</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{fmt(result.take_home)}</p>
              </div>
              <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Effective Rate</p>
                <p className="text-2xl font-bold text-white mt-1">{result.effective_rate}%</p>
              </div>
              <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Monthly Take-Home</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{fmt(result.monthly_take_home)}</p>
              </div>
            </div>

            {/* Tax Breakdown */}
            <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-5 mb-6">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Tax Breakdown</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">AGI</span><span className="text-white">{fmt(result.agi)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Deduction ({result.deduction_type})</span><span className="text-white">-{fmt(result.deduction)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Taxable Income</span><span className="text-white">{fmt(result.taxable_income)}</span></div>
                <hr className="border-gray-700" />
                <div className="flex justify-between"><span className="text-gray-400">Federal Income Tax</span><span className="text-red-400">{fmt(result.federal_income_tax)}</span></div>
                {result.ltcg_tax > 0 && (
                  <div className="flex justify-between"><span className="text-gray-400">LTCG Tax</span><span className="text-red-400">{fmt(result.ltcg_tax)}</span></div>
                )}
                <div className="flex justify-between"><span className="text-gray-400">FICA (SS + Medicare)</span><span className="text-red-400">{fmt(result.fica_tax)}</span></div>
                <hr className="border-gray-700" />
                <div className="flex justify-between font-bold"><span className="text-white">Total Tax</span><span className="text-red-400">{fmt(result.total_tax)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Marginal Rate</span><span className="text-white">{result.marginal_rate}%</span></div>
              </div>
            </div>

            {/* Bracket Breakdown */}
            {result.bracket_breakdown.length > 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-700">
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Federal Tax Brackets</h2>
                </div>
                <div className="hidden md:grid grid-cols-3 gap-2 px-5 py-2 border-b border-gray-700 text-xs text-gray-500 uppercase">
                  <div>Rate</div>
                  <div className="text-right">Taxable Income</div>
                  <div className="text-right">Tax</div>
                </div>
                {result.bracket_breakdown.map((b, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2 px-5 py-2.5 border-b border-gray-700/30 text-sm">
                    <div className="text-gray-300">{b.rate}%</div>
                    <div className="text-right text-gray-400">{fmt(b.income)}</div>
                    <div className="text-right text-red-400">{fmt(b.tax)}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
