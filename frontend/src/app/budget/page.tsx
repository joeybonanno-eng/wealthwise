"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

interface Transaction {
  id: number;
  name: string;
  amount: number;
  category: string;
  frequency: string;
  type: string;
  is_active: boolean;
  next_due: string | null;
}

interface BudgetSummary {
  monthly_income: number;
  monthly_expenses: number;
  net_savings: number;
  savings_rate: number;
  by_category: Record<string, number>;
  total_transactions: number;
}

interface ExpenseCategory {
  id: number;
  name: string;
  monthly_budget: number;
  color: string;
}

interface SpendingInsights {
  analysis: string;
}

const CATEGORIES = [
  "Housing", "Transportation", "Food", "Utilities", "Insurance",
  "Healthcare", "Entertainment", "Shopping", "Education", "Savings",
  "Debt Payment", "Other",
];

const CATEGORY_COLORS: Record<string, string> = {
  Housing: "bg-blue-500",
  Transportation: "bg-yellow-500",
  Food: "bg-orange-500",
  Utilities: "bg-cyan-500",
  Insurance: "bg-purple-500",
  Healthcare: "bg-red-500",
  Entertainment: "bg-pink-500",
  Shopping: "bg-indigo-500",
  Education: "bg-teal-500",
  Savings: "bg-emerald-500",
  "Debt Payment": "bg-rose-500",
  Other: "bg-gray-500",
};

export default function BudgetPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Other");
  const [frequency, setFrequency] = useState("monthly");
  const [type, setType] = useState("expense");
  const [adding, setAdding] = useState(false);

  // Category management state
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [catName, setCatName] = useState("");
  const [catBudget, setCatBudget] = useState("");
  const [catColor, setCatColor] = useState("#10b981");

  // AI insights state
  const [insights, setInsights] = useState<string | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [txns, sum] = await Promise.all([
        apiClient.getBudgetTransactions(),
        apiClient.getBudgetSummary(),
      ]);
      setTransactions(txns);
      setSummary(sum);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const cats = await apiClient.getExpenseCategories();
      setCategories(cats);
    } catch {
      // ok
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (session?.accessToken) {
      apiClient.setToken(session.accessToken);
      loadData();
      loadCategories();
    }
  }, [status, session, router, loadData, loadCategories]);

  const handleAdd = async () => {
    if (!name || !amount) return;
    setAdding(true);
    try {
      await apiClient.createBudgetTransaction({
        name,
        amount: parseFloat(amount),
        category,
        frequency,
        type,
      });
      setName("");
      setAmount("");
      setCategory("Other");
      setFrequency("monthly");
      setType("expense");
      setShowAdd(false);
      await loadData();
    } catch {
      alert("Failed to add transaction.");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.deleteBudgetTransaction(id);
      await loadData();
    } catch {
      // silently fail
    }
  };

  const handleAddCategory = async () => {
    if (!catName || !catBudget) return;
    try {
      await apiClient.createExpenseCategory({
        name: catName,
        monthly_budget: parseFloat(catBudget),
        color: catColor,
      });
      setCatName("");
      setCatBudget("");
      setShowCategoryForm(false);
      await loadCategories();
    } catch {
      alert("Failed to add category.");
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await apiClient.deleteExpenseCategory(id);
      await loadCategories();
    } catch {
      // ok
    }
  };

  const handleGetInsights = async () => {
    setInsightsLoading(true);
    try {
      const data = await apiClient.getBudgetInsights();
      setInsights(data.analysis);
    } catch {
      setInsights("Unable to generate insights at this time.");
    } finally {
      setInsightsLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
      </div>
    );
  }

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  const maxCategoryAmount = summary
    ? Math.max(...Object.values(summary.by_category), 1)
    : 1;

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Budget Tracker</h1>
            <p className="text-gray-400 text-sm mt-1">
              Manage recurring income &amp; expenses
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm transition-colors"
            >
              + Add
            </button>
            <button
              onClick={() => router.push("/chat")}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              Chat
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider">
                Monthly Income
              </p>
              <p className="text-xl font-bold text-emerald-400 mt-1">
                {fmt(summary.monthly_income)}
              </p>
            </div>
            <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider">
                Monthly Expenses
              </p>
              <p className="text-xl font-bold text-red-400 mt-1">
                {fmt(summary.monthly_expenses)}
              </p>
            </div>
            <div
              className={`bg-gray-800/80 border rounded-xl p-4 ${
                summary.net_savings >= 0
                  ? "border-emerald-500/30"
                  : "border-red-500/30"
              }`}
            >
              <p className="text-gray-400 text-xs uppercase tracking-wider">
                Net Savings
              </p>
              <p
                className={`text-xl font-bold mt-1 ${
                  summary.net_savings >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {fmt(summary.net_savings)}
              </p>
            </div>
            <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider">
                Savings Rate
              </p>
              <p
                className={`text-xl font-bold mt-1 ${
                  summary.savings_rate >= 20
                    ? "text-emerald-400"
                    : summary.savings_rate >= 0
                    ? "text-yellow-400"
                    : "text-red-400"
                }`}
              >
                {summary.savings_rate}%
              </p>
            </div>
          </div>
        )}

        {/* Category Breakdown */}
        {summary && Object.keys(summary.by_category).length > 0 && (
          <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">
              Expenses by Category
            </h3>
            <div className="space-y-2">
              {Object.entries(summary.by_category).map(([cat, amt]) => {
                const catObj = categories.find((c) => c.name === cat);
                const budgetAmt = catObj?.monthly_budget;
                const pct = budgetAmt ? Math.min((amt / budgetAmt) * 100, 100) : (amt / maxCategoryAmount) * 100;
                const overBudget = budgetAmt ? amt > budgetAmt : false;
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{cat}</span>
                      <span className="text-gray-400">
                        {fmt(amt)}
                        {budgetAmt ? ` / ${fmt(budgetAmt)}` : ""}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          overBudget
                            ? "bg-red-500"
                            : CATEGORY_COLORS[cat] || "bg-emerald-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Management */}
        <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-300">Budget Categories</h3>
            <button
              onClick={() => setShowCategoryForm(!showCategoryForm)}
              className="text-xs text-emerald-400 hover:text-emerald-300"
            >
              + Add Category
            </button>
          </div>

          {showCategoryForm && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
              <input
                type="text"
                placeholder="Category name"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
              <input
                type="number"
                placeholder="Monthly budget ($)"
                value={catBudget}
                onChange={(e) => setCatBudget(e.target.value)}
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
              <input
                type="color"
                value={catColor}
                onChange={(e) => setCatColor(e.target.value)}
                className="bg-gray-900 border border-gray-600 rounded-lg h-[38px] cursor-pointer"
              />
              <button
                onClick={handleAddCategory}
                className="bg-emerald-600 hover:bg-emerald-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                Add
              </button>
            </div>
          )}

          {categories.length === 0 ? (
            <p className="text-gray-500 text-sm">No custom budget categories yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm"
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="text-gray-300">{c.name}</span>
                  <span className="text-gray-500">{fmt(c.monthly_budget)}</span>
                  <button
                    onClick={() => handleDeleteCategory(c.id)}
                    className="text-gray-500 hover:text-red-400 ml-1"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Insights */}
        <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-300">AI Spending Insights</h3>
            <button
              onClick={handleGetInsights}
              disabled={insightsLoading}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-3 py-1 rounded-lg transition-colors"
            >
              {insightsLoading ? "Analyzing..." : "Analyze"}
            </button>
          </div>
          {insights ? (
            <div className="text-sm text-gray-300 whitespace-pre-wrap">{insights}</div>
          ) : (
            <p className="text-gray-500 text-sm">
              Click Analyze to get AI-powered insights on your spending.
            </p>
          )}
        </div>

        {/* Add Transaction Form */}
        {showAdd && (
          <div className="bg-gray-800/80 border border-gray-700 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">
              Add Recurring Transaction
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <input
                type="text"
                placeholder="Name (e.g. Rent)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
              <input
                type="number"
                placeholder="Amount ($)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <button
                onClick={handleAdd}
                disabled={adding || !name || !amount}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                {adding ? "Adding..." : "Add Transaction"}
              </button>
            </div>
          </div>
        )}

        {/* Transactions List */}
        {transactions.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4 opacity-50">&#x1F4B0;</div>
            <p className="text-gray-400 text-lg">No recurring transactions</p>
            <p className="text-gray-500 text-sm mt-2">
              Add your income and expenses to track your budget
            </p>
          </div>
        ) : (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
            <div className="hidden md:grid grid-cols-7 gap-2 px-4 py-3 border-b border-gray-700 text-xs text-gray-400 uppercase tracking-wider">
              <div className="col-span-2">Name</div>
              <div className="text-right">Amount</div>
              <div>Category</div>
              <div>Frequency</div>
              <div>Type</div>
              <div className="text-right">Actions</div>
            </div>
            {transactions.map((t) => (
              <div
                key={t.id}
                className="grid grid-cols-2 md:grid-cols-7 gap-2 px-4 py-3 border-b border-gray-700/50 items-center hover:bg-gray-800/50 transition-colors"
              >
                <div className="md:col-span-2 font-medium text-white">
                  {t.name}
                  {!t.is_active && (
                    <span className="ml-2 text-xs text-gray-500">(paused)</span>
                  )}
                </div>
                <div
                  className={`text-right font-mono ${
                    t.type === "income" ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {t.type === "income" ? "+" : "-"}
                  {fmt(t.amount)}
                </div>
                <div className="hidden md:block text-gray-400 text-sm">
                  {t.category}
                </div>
                <div className="hidden md:block text-gray-400 text-sm capitalize">
                  {t.frequency}
                </div>
                <div className="hidden md:block">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      t.type === "income"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {t.type}
                  </span>
                </div>
                <div className="text-right">
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="text-gray-500 hover:text-red-400 text-xs transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
