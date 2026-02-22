"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

interface YearlyEntry {
  year: number;
  principal_paid: number;
  interest_paid: number;
  remaining_balance: number;
}

interface MortgageResult {
  monthly_payment: number;
  monthly_tax: number;
  monthly_insurance: number;
  total_monthly: number;
  loan_amount: number;
  down_payment: number;
  total_interest: number;
  total_paid: number;
  yearly_schedule: YearlyEntry[];
}

export default function MortgagePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [homePrice, setHomePrice] = useState("400000");
  const [downPct, setDownPct] = useState("20");
  const [rate, setRate] = useState("6.5");
  const [term, setTerm] = useState("30");
  const [taxRate, setTaxRate] = useState("1.2");
  const [insurance, setInsurance] = useState("1200");
  const [result, setResult] = useState<MortgageResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (session?.accessToken) { apiClient.setToken(session.accessToken); }
  }, [status, session, router]);

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const data = await apiClient.calculateMortgage({
        home_price: parseFloat(homePrice) || 0,
        down_payment_pct: parseFloat(downPct) || 20,
        interest_rate: parseFloat(rate) || 0,
        loan_term: parseInt(term) || 30,
        property_tax_rate: parseFloat(taxRate) || 1.2,
        insurance_annual: parseFloat(insurance) || 1200,
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
          <h1 className="text-2xl font-bold">Mortgage Calculator</h1>
          <p className="text-gray-400 text-sm mt-1">Calculate monthly payments and total cost</p>
        </div>

        {/* Input Form */}
        <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Home Price</label>
              <input type="number" value={homePrice} onChange={(e) => setHomePrice(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Down Payment (%)</label>
              <input type="number" value={downPct} onChange={(e) => setDownPct(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Interest Rate (%)</label>
              <input type="number" value={rate} onChange={(e) => setRate(e.target.value)} step="0.1"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Loan Term (Years)</label>
              <select value={term} onChange={(e) => setTerm(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500">
                <option value="15">15 years</option>
                <option value="20">20 years</option>
                <option value="30">30 years</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Property Tax (%/yr)</label>
              <input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} step="0.1"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Insurance ($/yr)</label>
              <input type="number" value={insurance} onChange={(e) => setInsurance(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
            </div>
          </div>
          <button onClick={handleCalculate} disabled={loading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors">
            {loading ? "Calculating..." : "Calculate"}
          </button>
        </div>

        {result && (
          <>
            {/* Payment Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-gray-800/80 border border-emerald-500/30 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Monthly Payment</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{fmt(result.total_monthly)}</p>
                <p className="text-xs text-gray-500 mt-1">P&I: {fmt(result.monthly_payment)}</p>
              </div>
              <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Loan Amount</p>
                <p className="text-xl font-bold text-white mt-1">{fmt(result.loan_amount)}</p>
                <p className="text-xs text-gray-500 mt-1">Down: {fmt(result.down_payment)}</p>
              </div>
              <div className="bg-gray-800/80 border border-red-500/30 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Total Interest</p>
                <p className="text-xl font-bold text-red-400 mt-1">{fmt(result.total_interest)}</p>
              </div>
              <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Total Paid</p>
                <p className="text-xl font-bold text-white mt-1">{fmt(result.total_paid)}</p>
              </div>
            </div>

            {/* Payment Breakdown Bar */}
            <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-5 mb-6">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Monthly Breakdown</h2>
              <div className="flex rounded-full overflow-hidden h-6">
                <div className="bg-emerald-500 flex items-center justify-center text-xs font-medium"
                  style={{ width: `${(result.monthly_payment / result.total_monthly) * 100}%` }}>
                  P&I
                </div>
                <div className="bg-yellow-500 flex items-center justify-center text-xs font-medium text-gray-900"
                  style={{ width: `${(result.monthly_tax / result.total_monthly) * 100}%` }}>
                  Tax
                </div>
                <div className="bg-blue-500 flex items-center justify-center text-xs font-medium"
                  style={{ width: `${(result.monthly_insurance / result.total_monthly) * 100}%` }}>
                  Ins
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>P&I: {fmt(result.monthly_payment)}</span>
                <span>Tax: {fmt(result.monthly_tax)}</span>
                <span>Insurance: {fmt(result.monthly_insurance)}</span>
              </div>
            </div>

            {/* Amortization Schedule */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-700">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Amortization Schedule</h2>
              </div>
              <div className="hidden md:grid grid-cols-4 gap-2 px-5 py-2 border-b border-gray-700 text-xs text-gray-500 uppercase">
                <div>Year</div>
                <div className="text-right">Principal</div>
                <div className="text-right">Interest</div>
                <div className="text-right">Balance</div>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {result.yearly_schedule.map((y) => (
                  <div key={y.year} className="grid grid-cols-2 md:grid-cols-4 gap-2 px-5 py-2 border-b border-gray-700/30 text-sm">
                    <div className="text-gray-400">Year {y.year}</div>
                    <div className="text-right text-emerald-400 hidden md:block">{fmt(y.principal_paid)}</div>
                    <div className="text-right text-red-400 hidden md:block">{fmt(y.interest_paid)}</div>
                    <div className="text-right text-gray-300">{fmt(y.remaining_balance)}</div>
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
