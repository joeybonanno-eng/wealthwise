"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LandingPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/chat");
    }
  }, [status, router]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="text-2xl font-bold">
          <span className="text-emerald-400">Wealth</span>Wise
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-gray-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors font-medium"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 max-w-7xl mx-auto text-center">
        <h1 className="text-5xl sm:text-6xl font-bold leading-tight">
          Your AI-Powered
          <br />
          <span className="text-emerald-400">Financial Advisor</span>
        </h1>
        <p className="mt-6 text-xl text-gray-400 max-w-2xl mx-auto">
          Get real-time market insights, personalized investment advice, and
          portfolio analysis powered by advanced AI. All for just $5/month.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-lg font-medium transition-colors"
          >
            Start Free Trial
          </Link>
          <Link
            href="#features"
            className="px-8 py-4 border border-gray-700 hover:border-gray-500 rounded-xl text-lg text-gray-300 hover:text-white transition-colors"
          >
            Learn More
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-24 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-16">
          Everything You Need to Invest{" "}
          <span className="text-emerald-400">Smarter</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: "\u{1F4C8}",
              title: "Real-Time Market Data",
              description:
                "Get instant stock quotes, price history, and company fundamentals pulled directly from the market.",
            },
            {
              icon: "\u{1F916}",
              title: "AI-Powered Analysis",
              description:
                "Advanced AI analyzes market trends and provides data-driven insights tailored to your financial situation.",
            },
            {
              icon: "\u{1F4B0}",
              title: "Personalized Advice",
              description:
                "Set up your financial profile and receive investment recommendations matched to your goals and risk tolerance.",
            },
            {
              icon: "\u{1F4CA}",
              title: "Sector Analysis",
              description:
                "Track performance across all major market sectors to identify opportunities and trends.",
            },
            {
              icon: "\u{1F4AC}",
              title: "Conversational Interface",
              description:
                "Ask questions naturally - just like talking to a financial advisor. No jargon or complexity required.",
            },
            {
              icon: "\u{1F512}",
              title: "Secure & Private",
              description:
                "Your financial data is encrypted and never shared. We take your privacy seriously.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-emerald-800 transition-colors"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-24 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">
          Simple, Transparent <span className="text-emerald-400">Pricing</span>
        </h2>
        <p className="text-gray-400 text-center mb-12">
          One plan. Everything included. No hidden fees.
        </p>
        <div className="max-w-sm mx-auto bg-gray-900 border border-emerald-800 rounded-2xl p-8 text-center">
          <div className="text-sm font-medium text-emerald-400 uppercase tracking-wider mb-2">
            Pro Plan
          </div>
          <div className="text-5xl font-bold">
            $5<span className="text-xl text-gray-400">/mo</span>
          </div>
          <ul className="mt-8 space-y-4 text-left">
            {[
              "Unlimited AI conversations",
              "Real-time stock quotes",
              "Historical price analysis",
              "Company fundamentals",
              "Sector performance tracking",
              "Personalized financial profile",
              "Conversation history",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-gray-300">
                <span className="text-emerald-400 font-bold">{"\u2713"}</span>
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/register"
            className="mt-8 block w-full py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors"
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-gray-500">
          <div>
            <span className="text-emerald-400 font-bold">Wealth</span>Wise
          </div>
          <div>Not financial advice. For informational purposes only.</div>
        </div>
      </footer>
    </div>
  );
}
