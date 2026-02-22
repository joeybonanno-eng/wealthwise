"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import apiClient from "@/lib/api-client";

interface SharedPlan {
  title: string;
  plan_type: string;
  ai_plan: string | null;
  created_at: string;
}

export default function SharedPlanPage() {
  const params = useParams();
  const token = params?.token as string;
  const [plan, setPlan] = useState<SharedPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiClient
      .getSharedPlan(token)
      .then(setPlan)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Plan Not Found</h1>
          <p className="text-gray-400 mb-6">This shared plan may have been removed or the link is invalid.</p>
          <a
            href="/"
            className="py-2 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            Go to WealthWise
          </a>
        </div>
      </div>
    );
  }

  const typeLabels: Record<string, string> = {
    retirement: "Retirement Plan",
    home: "Home Purchase Plan",
    debt: "Debt Payoff Plan",
    wealth: "Wealth Building Plan",
    custom: "Custom Plan",
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="text-lg font-bold">
            <span className="text-emerald-400">Wealth</span>Wise
          </span>
          <a
            href="/"
            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Get Your Own Plan
          </a>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6">
          <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-1 rounded-full">
            {typeLabels[plan.plan_type] || plan.plan_type}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold mt-3 mb-2">{plan.title}</h1>
          <p className="text-sm text-gray-500">
            Created {new Date(plan.created_at).toLocaleDateString()}
          </p>
        </div>

        {plan.ai_plan ? (
          <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-headings:text-emerald-400">
            <ReactMarkdown>{plan.ai_plan}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-gray-400">This plan doesn&apos;t have generated content yet.</p>
        )}

        <div className="mt-12 pt-6 border-t border-gray-800 text-center">
          <p className="text-gray-400 text-sm mb-4">
            Want your own personalized financial plan?
          </p>
          <a
            href="/register"
            className="inline-block py-3 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors"
          >
            Get Started Free
          </a>
        </div>
      </div>
    </div>
  );
}
