"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import apiClient from "@/lib/api-client";

interface PlanWizardProps {
  onClose: () => void;
  profile?: {
    annual_income?: number;
    monthly_expenses?: number;
    total_savings?: number;
    total_debt?: number;
    risk_tolerance?: string;
  };
}

const PLAN_TYPES = [
  { id: "retirement", label: "Retirement", icon: "\u2600\uFE0F", desc: "Plan for a comfortable retirement" },
  { id: "home", label: "Buy a Home", icon: "\uD83C\uDFE0", desc: "Save for your dream home" },
  { id: "debt", label: "Pay Off Debt", icon: "\uD83D\uDCB3", desc: "Eliminate debt strategically" },
  { id: "wealth", label: "Build Wealth", icon: "\uD83D\uDCC8", desc: "Grow your net worth" },
  { id: "custom", label: "Custom Goal", icon: "\uD83C\uDFAF", desc: "Set your own financial goal" },
];

const TIMELINES = [
  { id: "1-3yr", label: "1-3 Years", desc: "Short-term" },
  { id: "3-7yr", label: "3-7 Years", desc: "Medium-term" },
  { id: "7-15yr", label: "7-15 Years", desc: "Long-term" },
  { id: "15+yr", label: "15+ Years", desc: "Very long-term" },
];

const PRIORITIES = [
  { id: "safety", label: "Safety First", desc: "Preserve capital above all" },
  { id: "growth", label: "Growth Focused", desc: "Maximize long-term gains" },
  { id: "income", label: "Income Generation", desc: "Steady cash flow priority" },
  { id: "balanced", label: "Balanced", desc: "Mix of growth and safety" },
];

export default function PlanWizard({ onClose, profile }: PlanWizardProps) {
  const [step, setStep] = useState(0);
  const [planType, setPlanType] = useState("");
  const [customGoal, setCustomGoal] = useState("");
  const [timeline, setTimeline] = useState("");
  const [finances, setFinances] = useState({
    income: profile?.annual_income || 0,
    expenses: profile?.monthly_expenses || 0,
    savings: profile?.total_savings || 0,
    debt: profile?.total_debt || 0,
  });
  const [riskTolerance, setRiskTolerance] = useState(
    profile?.risk_tolerance || "moderate"
  );
  const [priority, setPriority] = useState("balanced");
  const [generating, setGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const steps = ["Plan Type", "Timeline", "Finances", "Priorities", "Generate"];

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    try {
      const planData = {
        plan_type: planType,
        custom_goal: customGoal,
        timeline,
        finances,
        risk_tolerance: riskTolerance,
        priority,
      };

      const title =
        planType === "custom"
          ? customGoal || "Custom Financial Plan"
          : `${PLAN_TYPES.find((p) => p.id === planType)?.label || "Financial"} Plan`;

      const result = await apiClient.createPlan({
        title,
        plan_type: planType,
        data: planData,
      });

      setGeneratedPlan(result.ai_plan);
      setSaved(true);
    } catch (err: any) {
      setError(err.message || "Failed to generate plan");
    } finally {
      setGenerating(false);
    }
  }

  const canProceed = () => {
    if (step === 0) return planType !== "" && (planType !== "custom" || customGoal.trim() !== "");
    if (step === 1) return timeline !== "";
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-white">Financial Plan Wizard</h2>
            {!generatedPlan && (
              <div className="flex gap-1 mt-2">
                {steps.map((s, i) => (
                  <div
                    key={s}
                    className={`h-1 flex-1 rounded-full ${
                      i <= step ? "bg-emerald-500" : "bg-gray-700"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {generatedPlan ? (
            <div>
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{generatedPlan}</ReactMarkdown>
              </div>
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-800">
                {saved && (
                  <span className="text-emerald-400 text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Plan saved
                  </span>
                )}
                <button
                  onClick={onClose}
                  className="ml-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                >
                  Back to Chat
                </button>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Step 0: Plan Type */}
                {step === 0 && (
                  <div className="space-y-3">
                    <p className="text-gray-400 mb-4">What financial goal do you want to plan for?</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {PLAN_TYPES.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setPlanType(type.id)}
                          className={`p-4 rounded-xl border text-left transition-all ${
                            planType === type.id
                              ? "border-emerald-500 bg-emerald-500/10"
                              : "border-gray-700 hover:border-gray-600"
                          }`}
                        >
                          <span className="text-2xl">{type.icon}</span>
                          <p className="font-medium text-white mt-2">{type.label}</p>
                          <p className="text-sm text-gray-400">{type.desc}</p>
                        </button>
                      ))}
                    </div>
                    {planType === "custom" && (
                      <input
                        type="text"
                        value={customGoal}
                        onChange={(e) => setCustomGoal(e.target.value)}
                        placeholder="Describe your financial goal..."
                        className="w-full mt-3 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    )}
                  </div>
                )}

                {/* Step 1: Timeline */}
                {step === 1 && (
                  <div className="space-y-3">
                    <p className="text-gray-400 mb-4">What is your target timeline?</p>
                    <div className="grid grid-cols-2 gap-3">
                      {TIMELINES.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTimeline(t.id)}
                          className={`p-4 rounded-xl border text-center transition-all ${
                            timeline === t.id
                              ? "border-emerald-500 bg-emerald-500/10"
                              : "border-gray-700 hover:border-gray-600"
                          }`}
                        >
                          <p className="font-medium text-white">{t.label}</p>
                          <p className="text-sm text-gray-400">{t.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Current Finances */}
                {step === 2 && (
                  <div className="space-y-4">
                    <p className="text-gray-400 mb-4">
                      Your current financial snapshot (pre-filled from profile):
                    </p>
                    {[
                      { key: "income", label: "Annual Income", prefix: "$" },
                      { key: "expenses", label: "Monthly Expenses", prefix: "$" },
                      { key: "savings", label: "Total Savings", prefix: "$" },
                      { key: "debt", label: "Total Debt", prefix: "$" },
                    ].map(({ key, label, prefix }) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          {label}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                            {prefix}
                          </span>
                          <input
                            type="number"
                            value={finances[key as keyof typeof finances] || ""}
                            onChange={(e) =>
                              setFinances((prev) => ({
                                ...prev,
                                [key]: Number(e.target.value),
                              }))
                            }
                            className="w-full pl-8 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Step 3: Risk & Priorities */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div>
                      <p className="text-gray-400 mb-3">Risk Tolerance</p>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">Conservative</span>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={
                            { conservative: 1, "moderately-conservative": 2, moderate: 3, "moderately-aggressive": 4, aggressive: 5 }[
                              riskTolerance
                            ] || 3
                          }
                          onChange={(e) => {
                            const map: Record<string, string> = {
                              "1": "conservative",
                              "2": "moderately-conservative",
                              "3": "moderate",
                              "4": "moderately-aggressive",
                              "5": "aggressive",
                            };
                            setRiskTolerance(map[e.target.value]);
                          }}
                          className="flex-1 accent-emerald-500"
                        />
                        <span className="text-sm text-gray-500">Aggressive</span>
                      </div>
                      <p className="text-center text-sm text-emerald-400 mt-1 capitalize">
                        {riskTolerance.replace("-", " ")}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-400 mb-3">Investment Priority</p>
                      <div className="grid grid-cols-2 gap-3">
                        {PRIORITIES.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => setPriority(p.id)}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              priority === p.id
                                ? "border-emerald-500 bg-emerald-500/10"
                                : "border-gray-700 hover:border-gray-600"
                            }`}
                          >
                            <p className="font-medium text-white text-sm">{p.label}</p>
                            <p className="text-xs text-gray-400">{p.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Review & Generate */}
                {step === 4 && (
                  <div className="space-y-4">
                    <p className="text-gray-400 mb-4">Review your plan inputs:</p>
                    <div className="bg-gray-800 rounded-xl p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Plan Type</span>
                        <span className="text-white capitalize">
                          {planType === "custom" ? customGoal : planType}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Timeline</span>
                        <span className="text-white">{timeline}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Annual Income</span>
                        <span className="text-white">${finances.income.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Monthly Expenses</span>
                        <span className="text-white">${finances.expenses.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Savings</span>
                        <span className="text-white">${finances.savings.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Debt</span>
                        <span className="text-white">${finances.debt.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Risk Tolerance</span>
                        <span className="text-white capitalize">{riskTolerance.replace("-", " ")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Priority</span>
                        <span className="text-white capitalize">{priority}</span>
                      </div>
                    </div>

                    {error && (
                      <p className="text-red-400 text-sm">{error}</p>
                    )}

                    <button
                      onClick={handleGenerate}
                      disabled={generating}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {generating ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Generating your plan...
                        </>
                      ) : (
                        "Generate My Plan"
                      )}
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Footer Navigation */}
        {!generatedPlan && !generating && (
          <div className="flex justify-between p-6 border-t border-gray-800">
            <button
              onClick={() => step > 0 ? setStep(step - 1) : onClose()}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              {step === 0 ? "Cancel" : "Back"}
            </button>
            {step < 4 && (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Next
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
