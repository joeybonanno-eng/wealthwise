"use client";

import { useSubscription } from "@/hooks/useSubscription";

export default function PaywallGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { hasSubscription, loading, subscribe } = useSubscription();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  if (!hasSubscription) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md text-center space-y-6 p-8">
          <div className="text-6xl">&#128274;</div>
          <h2 className="text-2xl font-bold text-white">
            Subscribe to WealthWise
          </h2>
          <p className="text-gray-400">
            Get unlimited access to your AI financial advisor, real-time market
            data, and personalized investment insights.
          </p>
          <div className="text-4xl font-bold text-emerald-400">
            $5<span className="text-lg text-gray-400">/month</span>
          </div>
          <ul className="text-left text-gray-300 space-y-2">
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">&#10003;</span> Unlimited AI
              conversations
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">&#10003;</span> Real-time
              market data
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">&#10003;</span> Personalized
              financial advice
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">&#10003;</span> Portfolio
              analysis
            </li>
          </ul>
          <button
            onClick={subscribe}
            className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
          >
            Subscribe Now
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
