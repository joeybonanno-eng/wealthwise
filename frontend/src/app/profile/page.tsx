"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    age: "",
    annual_income: "",
    monthly_expenses: "",
    total_savings: "",
    total_debt: "",
    risk_tolerance: "",
    investment_goals: "",
    portfolio_description: "",
  });

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
          });
        })
        .catch(() => {})
        .finally(() => setLoading(false));
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
    <div className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Financial Profile</h1>
          <button
            onClick={() => router.push("/chat")}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Back to Chat
          </button>
        </div>

        <p className="text-gray-400 mb-6">
          Fill in your financial details to get personalized advice from your AI
          advisor. All fields are optional.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Age
              </label>
              <input
                type="number"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                className={inputClass}
                placeholder="30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Risk Tolerance
              </label>
              <select
                value={form.risk_tolerance}
                onChange={(e) =>
                  setForm({ ...form, risk_tolerance: e.target.value })
                }
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
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Annual Income ($)
              </label>
              <input
                type="number"
                value={form.annual_income}
                onChange={(e) =>
                  setForm({ ...form, annual_income: e.target.value })
                }
                className={inputClass}
                placeholder="75000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Monthly Expenses ($)
              </label>
              <input
                type="number"
                value={form.monthly_expenses}
                onChange={(e) =>
                  setForm({ ...form, monthly_expenses: e.target.value })
                }
                className={inputClass}
                placeholder="3000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Total Savings ($)
              </label>
              <input
                type="number"
                value={form.total_savings}
                onChange={(e) =>
                  setForm({ ...form, total_savings: e.target.value })
                }
                className={inputClass}
                placeholder="50000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Total Debt ($)
              </label>
              <input
                type="number"
                value={form.total_debt}
                onChange={(e) =>
                  setForm({ ...form, total_debt: e.target.value })
                }
                className={inputClass}
                placeholder="10000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Investment Goals
            </label>
            <textarea
              value={form.investment_goals}
              onChange={(e) =>
                setForm({ ...form, investment_goals: e.target.value })
              }
              className={inputClass}
              rows={3}
              placeholder="e.g., Retirement in 30 years, save for house down payment, build emergency fund"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Current Portfolio Description
            </label>
            <textarea
              value={form.portfolio_description}
              onChange={(e) =>
                setForm({ ...form, portfolio_description: e.target.value })
              }
              className={inputClass}
              rows={3}
              placeholder="e.g., 60% S&P 500 index fund, 20% bonds, 10% international stocks, 10% cash"
            />
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
              <span className="text-emerald-400 text-sm">
                Profile saved successfully!
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
