"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

interface Factor {
  name: string;
  score: number;
  max: number;
  detail: string;
  status: string;
}

interface HealthData {
  score: number;
  grade: string;
  label: string;
  factors: Factor[];
  recommendations: string[];
  metrics: {
    savings_rate: number;
    debt_to_income: number;
    emergency_months: number;
    positions: number;
    sectors: number;
  };
}

export default function HealthScorePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const result = await apiClient.getFinancialHealthScore();
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

  const gradeColor = (grade: string) => {
    if (grade === "A") return "text-emerald-400";
    if (grade === "B") return "text-blue-400";
    if (grade === "C") return "text-yellow-400";
    return "text-red-400";
  };

  const statusColor = (s: string) => {
    if (s === "good") return "bg-emerald-500";
    if (s === "warning") return "bg-yellow-500";
    return "bg-red-500";
  };

  const statusBadge = (s: string) => {
    if (s === "good") return "bg-emerald-500/20 text-emerald-400";
    if (s === "warning") return "bg-yellow-500/20 text-yellow-400";
    return "bg-red-500/20 text-red-400";
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Financial Health Score</h1>
            <p className="text-gray-400 text-sm mt-1">A comprehensive assessment of your financial well-being</p>
          </div>
          <button onClick={() => router.push("/chat")} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Chat</button>
        </div>

        {data && (
          <>
            {/* Main Score */}
            <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-8 mb-6 text-center">
              <div className="inline-flex items-center gap-4">
                <p className={`text-7xl font-bold ${gradeColor(data.grade)}`}>{data.score}</p>
                <div className="text-left">
                  <p className={`text-3xl font-bold ${gradeColor(data.grade)}`}>{data.grade}</p>
                  <p className="text-gray-400 text-sm">{data.label}</p>
                </div>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-4 mt-6 max-w-lg mx-auto">
                <div
                  className={`h-4 rounded-full transition-all ${
                    data.score >= 80 ? "bg-emerald-500" : data.score >= 60 ? "bg-blue-500" : data.score >= 40 ? "bg-yellow-500" : "bg-red-500"
                  }`}
                  style={{ width: `${data.score}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1 max-w-lg mx-auto">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
            </div>

            {/* Factors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {data.factors.map((f) => (
                <div key={f.name} className="bg-gray-800/80 border border-gray-700 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-semibold text-sm">{f.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(f.status)}`}>
                      {f.status.charAt(0).toUpperCase() + f.status.slice(1)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                    <div
                      className={`${statusColor(f.status)} h-2 rounded-full`}
                      style={{ width: `${(f.score / f.max) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">{f.detail}</span>
                    <span className="text-gray-500">{f.score} / {f.max}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Recommendations */}
            {data.recommendations.length > 0 && (
              <div className="bg-gray-800/80 border border-yellow-500/20 rounded-xl p-5 mb-6">
                <h2 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider mb-3">Recommendations</h2>
                <ul className="space-y-2">
                  {data.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-yellow-400 mt-0.5">&#x2022;</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Key Metrics */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Key Metrics</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-white">{data.metrics.savings_rate}%</p>
                  <p className="text-xs text-gray-500">Savings Rate</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{data.metrics.debt_to_income}%</p>
                  <p className="text-xs text-gray-500">Debt/Income</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{data.metrics.emergency_months}</p>
                  <p className="text-xs text-gray-500">Emergency Mo.</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{data.metrics.positions}</p>
                  <p className="text-xs text-gray-500">Positions</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{data.metrics.sectors}</p>
                  <p className="text-xs text-gray-500">Sectors</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
