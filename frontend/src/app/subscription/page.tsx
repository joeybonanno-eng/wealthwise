"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSubscription } from "@/hooks/useSubscription";

export default function SubscriptionPage() {
  const { status } = useSession();
  const router = useRouter();
  const { hasSubscription, loading, subscribe, manageSubscription } =
    useSubscription();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-3xl font-bold text-white">Subscription</h1>

        {hasSubscription ? (
          <div className="space-y-4">
            <div className="bg-emerald-900/30 border border-emerald-700 rounded-lg p-6">
              <p className="text-emerald-400 font-semibold text-lg">
                Active Subscription
              </p>
              <p className="text-gray-400 mt-2">
                You have full access to WealthWise
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={manageSubscription}
                className="py-3 px-6 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Manage Subscription
              </button>
              <button
                onClick={() => router.push("/chat")}
                className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                Go to Chat
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
              <div className="text-5xl font-bold text-emerald-400">
                $0.01<span className="text-xl text-gray-400">/month</span>
              </div>
              <p className="text-gray-400 mt-4">
                Get unlimited access to your AI financial advisor
              </p>
              <ul className="text-left text-gray-300 mt-6 space-y-3">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">&#10003;</span> AI-powered
                  financial advice
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">&#10003;</span> Real-time
                  market data
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">&#10003;</span>{" "}
                  Personalized portfolio analysis
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">&#10003;</span> Unlimited
                  conversations
                </li>
              </ul>
            </div>
            <button
              onClick={subscribe}
              className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors text-lg"
            >
              Subscribe Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
