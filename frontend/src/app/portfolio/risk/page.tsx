"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

interface RiskFactor {
  name: string;
  score: number;
  max: number;
  detail: string;
}

interface HoldingRisk {
  symbol: string;
  weight: number;
  beta: number;
  sector: string;
}

interface RiskData {
  risk_score: number;
  risk_level: string;
  weighted_beta: number;
  factors: RiskFactor[];
  holdings_risk: HoldingRisk[];
}

export default function PortfolioRiskPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRisk = useCallback(async () => {
    try {
      const result = await apiClient.getPortfolioRisk();
      setData(result);
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
      loadRisk();
    }
  }, [status, session, router, loadRisk]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
      </div>
    );
  }

  const riskColor = (level: string) => {
    if (level === "Low") return "text-emerald-400";
    if (level === "Medium") return "text-yellow-400";
    return "text-red-400";
  };

  const riskBorderColor = (level: string) => {
    if (level === "Low") return "border-emerald-500/30";
    if (level === "Medium") return "border-yellow-500/30";
    return "border-red-500/30";
  };

  const scoreColor = (score: number) => {
    if (score <= 30) return "bg-emerald-500";
    if (score <= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Portfolio Risk Score</h1>
            <p className="text-gray-400 text-sm mt-1">Understand your portfolio&apos;s risk profile</p>
          </div>
          <button
            onClick={() => router.push("/portfolio")}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
          >
            Back to Portfolio
          </button>
        </div>

        {!data || data.risk_level === "N/A" ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4 opacity-50">&#x1F6E1;</div>
            <p className="text-gray-400 text-lg">No portfolio data</p>
            <p className="text-gray-500 text-sm mt-2">Add holdings to see your risk score</p>
          </div>
        ) : (
          <>
            {/* Main Score */}
            <div className={`bg-gray-800/80 border ${riskBorderColor(data.risk_level)} rounded-xl p-6 mb-6 text-center`}>
              <p className={`text-6xl font-bold ${riskColor(data.risk_level)}`}>{data.risk_score}</p>
              <p className={`text-lg font-semibold mt-1 ${riskColor(data.risk_level)}`}>{data.risk_level} Risk</p>
              <p className="text-gray-500 text-sm mt-1">Weighted Beta: {data.weighted_beta}</p>
              <div className="w-full bg-gray-700 rounded-full h-3 mt-4 max-w-md mx-auto">
                <div
                  className={`${scoreColor(data.risk_score)} h-3 rounded-full transition-all`}
                  style={{ width: `${data.risk_score}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1 max-w-md mx-auto">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
            </div>

            {/* Risk Factors */}
            <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-5 mb-6">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Risk Factors</h2>
              <div className="space-y-4">
                {data.factors.map((f) => (
                  <div key={f.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-300">{f.name}</span>
                      <span className="text-xs text-gray-500">{f.score} / {f.max} — {f.detail}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`${scoreColor(f.score / f.max * 100)} h-2 rounded-full`}
                        style={{ width: `${(f.score / f.max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Holdings Risk Table */}
            {data.holdings_risk.length > 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-700">
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Holdings by Weight</h2>
                </div>
                <div className="hidden md:grid grid-cols-4 gap-2 px-5 py-2 border-b border-gray-700 text-xs text-gray-500 uppercase">
                  <div>Symbol</div>
                  <div className="text-right">Weight</div>
                  <div className="text-right">Beta</div>
                  <div className="text-right">Sector</div>
                </div>
                {data.holdings_risk.map((h) => (
                  <div key={h.symbol} className="grid grid-cols-2 md:grid-cols-4 gap-2 px-5 py-2.5 border-b border-gray-700/30 text-sm">
                    <div className="font-bold text-white">{h.symbol}</div>
                    <div className="text-right text-gray-300">{h.weight}%</div>
                    <div className={`text-right hidden md:block ${h.beta > 1.3 ? "text-red-400" : h.beta < 0.8 ? "text-emerald-400" : "text-gray-300"}`}>
                      {h.beta}
                    </div>
                    <div className="text-right text-gray-500 hidden md:block">{h.sector}</div>
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
