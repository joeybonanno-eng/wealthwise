"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import apiClient from "@/lib/api-client";
import { LOCALE_LABELS, type Locale, getLocale, setLocale } from "@/lib/i18n";

interface MemoryEntry {
  id: number;
  key: string;
  value: string;
  source: string;
  confidence: number;
  last_updated: string | null;
}

interface UsageData {
  messages: { usage: number; limit: number; remaining: number };
  plans: { usage: number; limit: number; remaining: number };
  alerts: { usage: number; limit: number; remaining: number };
  insights: { usage: number; limit: number; remaining: number };
  is_pro: boolean;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "memory" | "usage">("profile");
  const [form, setForm] = useState({
    age: "",
    annual_income: "",
    monthly_expenses: "",
    total_savings: "",
    total_debt: "",
    risk_tolerance: "",
    investment_goals: "",
    portfolio_description: "",
    communication_level: "",
    advisor_tone: "",
    language: "en",
  });
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (session?.accessToken) {
      apiClient.setToken(session.accessToken);
      apiClient
        .getProfile()
        .then((profile) => {
          setForm({
            age: profile.age?.toString() || "",
            annual_income: profile.annual_income?.toString() || "",
            monthly_expenses: profile.monthly_expenses?.toString() || "",
            total_savings: profile.total_savings?.toString() || "",
            total_debt: profile.total_debt?.toString() || "",
            risk_tolerance: profile.risk_tolerance || "",
            investment_goals: profile.investment_goals || "",
            portfolio_description: profile.portfolio_description || "",
            communication_level: profile.communication_level || "college",
            advisor_tone: profile.advisor_tone || "professional",
            language: (profile as any).language || "en",
          });
        })
        .catch(() => {})
        .finally(() => setLoading(false));

      setLocaleState(getLocale());
      apiClient.getMemories().then(setMemories).catch(() => {});
      apiClient.getUsage().then(setUsage).catch(() => {});
    }
  }, [session, status, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    const data: Record<string, any> = {};
    if (form.age) data.age = parseInt(form.age);
    if (form.annual_income) data.annual_income = parseFloat(form.annual_income);
    if (form.monthly_expenses)
      data.monthly_expenses = parseFloat(form.monthly_expenses);
    if (form.total_savings) data.total_savings = parseFloat(form.total_savings);
    if (form.total_debt) data.total_debt = parseFloat(form.total_debt);
    if (form.risk_tolerance) data.risk_tolerance = form.risk_tolerance;
    if (form.investment_goals) data.investment_goals = form.investment_goals;
    if (form.portfolio_description)
      data.portfolio_description = form.portfolio_description;
    if (form.communication_level)
      data.communication_level = form.communication_level;
    if (form.advisor_tone) data.advisor_tone = form.advisor_tone;
    if (form.language) data.language = form.language;

    try {
      await apiClient.updateProfile(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteMemory(key: string) {
    try {
      await apiClient.deleteMemory(key);
      setMemories((prev) => prev.filter((m) => m.key !== key));
    } catch {
      // silently fail
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
      </div>
    );
  }

  const inputClass =
    "w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent";

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4 pb-20 md:pb-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <button
            onClick={() => router.push("/chat")}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Back to Chat
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 mb-6 bg-gray-800/50 rounded-lg p-1">
          {[
            { id: "profile" as const, label: "Profile" },
            { id: "memory" as const, label: "AI Memory" },
            { id: "usage" as const, label: "Usage" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <>
            <p className="text-gray-400 mb-6">
              Fill in your financial details to get personalized advice. All fields are optional.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Age</label>
                  <input
                    type="number"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    className={inputClass}
                    placeholder="30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Risk Tolerance</label>
                  <select
                    value={form.risk_tolerance}
                    onChange={(e) => setForm({ ...form, risk_tolerance: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">Select...</option>
                    <option value="conservative">Conservative</option>
                    <option value="moderate">Moderate</option>
                    <option value="aggressive">Aggressive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Annual Income ($)</label>
                  <input
                    type="number"
                    value={form.annual_income}
                    onChange={(e) => setForm({ ...form, annual_income: e.target.value })}
                    className={inputClass}
                    placeholder="75000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Monthly Expenses ($)</label>
                  <input
                    type="number"
                    value={form.monthly_expenses}
                    onChange={(e) => setForm({ ...form, monthly_expenses: e.target.value })}
                    className={inputClass}
                    placeholder="3000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Total Savings ($)</label>
                  <input
                    type="number"
                    value={form.total_savings}
                    onChange={(e) => setForm({ ...form, total_savings: e.target.value })}
                    className={inputClass}
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Total Debt ($)</label>
                  <input
                    type="number"
                    value={form.total_debt}
                    onChange={(e) => setForm({ ...form, total_debt: e.target.value })}
                    className={inputClass}
                    placeholder="10000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Investment Goals</label>
                <textarea
                  value={form.investment_goals}
                  onChange={(e) => setForm({ ...form, investment_goals: e.target.value })}
                  className={inputClass}
                  rows={3}
                  placeholder="e.g., Retirement in 30 years, save for house down payment"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Current Portfolio</label>
                <textarea
                  value={form.portfolio_description}
                  onChange={(e) => setForm({ ...form, portfolio_description: e.target.value })}
                  className={inputClass}
                  rows={3}
                  placeholder="e.g., 60% S&P 500 index fund, 20% bonds, 10% international, 10% cash"
                />
              </div>

              <div className="pt-6 border-t border-gray-800">
                <h2 className="text-lg font-semibold text-white mb-1">Personalization</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Customize how your AI advisor communicates with you.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Language</label>
                    <select
                      value={form.language}
                      onChange={(e) => {
                        const lang = e.target.value as Locale;
                        setForm({ ...form, language: lang });
                        setLocale(lang);
                        setLocaleState(lang);
                      }}
                      className={inputClass}
                    >
                      {Object.entries(LOCALE_LABELS).map(([code, label]) => (
                        <option key={code} value={code}>{label}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-600 mt-1">AI responses will be in this language</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Communication Level</label>
                    <select
                      value={form.communication_level}
                      onChange={(e) => setForm({ ...form, communication_level: e.target.value })}
                      className={inputClass}
                    >
                      <option value="elementary">Elementary School</option>
                      <option value="high_school">High School</option>
                      <option value="college">College</option>
                      <option value="phd">PhD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Advisor Tone</label>
                    <select
                      value={form.advisor_tone}
                      onChange={(e) => setForm({ ...form, advisor_tone: e.target.value })}
                      className={inputClass}
                    >
                      <option value="friendly">Friendly</option>
                      <option value="professional">Professional</option>
                      <option value="mentor">Mentor</option>
                      <option value="casual">Casual</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="py-3 px-8 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white font-medium rounded-lg transition-colors"
                >
                  {saving ? "Saving..." : "Save Profile"}
                </button>
                {saved && (
                  <span className="text-emerald-400 text-sm">Profile saved successfully!</span>
                )}
              </div>
            </form>
          </>
        )}

        {/* AI Memory Tab */}
        {activeTab === "memory" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">What Your Advisor Remembers</h2>
                <p className="text-sm text-gray-500 mt-1">
                  These are behavioral signals your AI advisor has learned from your conversations.
                </p>
              </div>
            </div>

            {memories.length === 0 ? (
              <div className="text-center py-16 bg-gray-800/40 border border-gray-700 rounded-xl">
                <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h3 className="text-gray-400 font-medium mb-2">No memories yet</h3>
                <p className="text-gray-500 text-sm">
                  Start chatting with your advisor to build personalized memory.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {memories.map((memory) => (
                  <div
                    key={memory.id}
                    className="flex items-start justify-between gap-3 p-4 bg-gray-800/60 border border-gray-700 rounded-xl group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-emerald-400">
                          {memory.key.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded">
                          {memory.source}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 break-words">{memory.value}</p>
                      {memory.last_updated && (
                        <p className="text-xs text-gray-600 mt-1">
                          Updated {new Date(memory.last_updated).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteMemory(memory.key)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 transition-all"
                      title="Delete this memory"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Usage Tab */}
        {activeTab === "usage" && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Your Usage</h2>
                {usage && (
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                    usage.is_pro
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : "bg-gray-700 text-gray-300"
                  }`}>
                    {usage.is_pro ? "Pro" : "Free"}
                  </span>
                )}
              </div>

              {usage ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "Messages", data: usage.messages, icon: "chat" },
                    { label: "Financial Plans", data: usage.plans, icon: "plan" },
                    { label: "Price Alerts", data: usage.alerts, icon: "alert" },
                    { label: "AI Insights", data: usage.insights, icon: "insight" },
                  ].map((item) => {
                    const pct = item.data.limit > 0
                      ? Math.min(100, (item.data.usage / item.data.limit) * 100)
                      : 0;
                    const isUnlimited = item.data.limit >= 999999;
                    return (
                      <div key={item.label} className="bg-gray-800/60 border border-gray-700 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-300">{item.label}</span>
                          <span className="text-sm text-gray-500">
                            {item.data.usage} / {isUnlimited ? "Unlimited" : item.data.limit}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: isUnlimited ? "5%" : `${pct}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {isUnlimited
                            ? `${item.data.usage} used`
                            : `${item.data.remaining} remaining`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-400 mx-auto" />
                </div>
              )}
            </div>

            {usage && !usage.is_pro && (
              <div className="bg-gradient-to-r from-emerald-900/30 to-emerald-800/10 border border-emerald-700/40 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-2">Upgrade to Pro</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Unlimited conversations, plans, alerts, and 5x more daily insights for $9.99/month.
                </p>
                <button
                  onClick={() => router.push("/subscription")}
                  className="py-2 px-6 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors font-medium"
                >
                  Upgrade Now
                </button>
              </div>
            )}

            {usage?.is_pro && (
              <div className="text-center">
                <button
                  onClick={() => router.push("/subscription")}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Manage Subscription
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
