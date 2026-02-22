"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import apiClient from "@/lib/api-client";

interface Alert {
  id: number;
  symbol: string;
  condition: string;
  target_price: number;
  message: string | null;
  is_active: boolean;
  triggered: boolean;
  triggered_at: string | null;
  created_at: string;
}

interface AlertCheckResult {
  alert: Alert;
  current_price: number | null;
  just_triggered: boolean;
}

interface AlertsDashboardProps {
  onClose: () => void;
}

export default function AlertsDashboard({ onClose }: AlertsDashboardProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [checkResults, setCheckResults] = useState<AlertCheckResult[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    try {
      const data = await apiClient.getAlerts();
      setAlerts(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  async function handleCheck() {
    setChecking(true);
    try {
      const data = await apiClient.checkAlerts();
      setCheckResults(data.results);
      // Refresh alerts list to reflect triggered state changes
      await loadAlerts();
    } catch {
      // silently fail
    } finally {
      setChecking(false);
    }
  }

  async function toggleAlert(id: number, isActive: boolean) {
    try {
      await apiClient.updateAlert(id, { is_active: !isActive });
      await loadAlerts();
    } catch {
      // silently fail
    }
  }

  async function deleteAlert(id: number) {
    try {
      await apiClient.deleteAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // silently fail
    }
  }

  function getCurrentPrice(alertId: number): number | null {
    if (!checkResults) return null;
    const result = checkResults.find((r) => r.alert.id === alertId);
    return result?.current_price ?? null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">My Alerts</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCheck}
              disabled={checking}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
            >
              {checking ? (
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              Check Now
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No alerts set yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Create one from the + menu in chat
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const currentPrice = getCurrentPrice(alert.id);
                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border ${
                      alert.triggered
                        ? "border-amber-500/50 bg-amber-500/5"
                        : alert.is_active
                        ? "border-gray-700"
                        : "border-gray-800 opacity-50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{alert.symbol}</span>
                          {alert.triggered && (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                              Triggered
                            </span>
                          )}
                          {!alert.is_active && !alert.triggered && (
                            <span className="px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded-full">
                              Paused
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          {alert.condition === "above" ? "Above" : "Below"}{" "}
                          <span className="text-white">${alert.target_price.toFixed(2)}</span>
                          {currentPrice !== null && (
                            <span className="ml-2 text-gray-500">
                              (now: ${currentPrice.toFixed(2)})
                            </span>
                          )}
                        </p>
                        {alert.message && (
                          <p className="text-xs text-gray-500 mt-1">{alert.message}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleAlert(alert.id, alert.is_active)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            alert.is_active
                              ? "text-emerald-400 hover:bg-emerald-500/10"
                              : "text-gray-500 hover:bg-gray-800"
                          }`}
                          title={alert.is_active ? "Pause alert" : "Resume alert"}
                        >
                          {alert.is_active ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => deleteAlert(alert.id)}
                          className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete alert"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
