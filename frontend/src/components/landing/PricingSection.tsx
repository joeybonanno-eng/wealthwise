"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import AnimatedSection from "./AnimatedSection";

const features = [
  "Unlimited AI conversations",
  "Real-time stock quotes & analysis",
  "Historical price charts",
  "Company fundamentals & financials",
  "Sector performance tracking",
  "Personalized financial profile",
  "Adjustable communication levels",
  "Custom advisor personality",
  "Conversation history & search",
  "Mobile-optimized experience",
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection className="text-center mb-16">
          <p className="text-sm text-emerald-400 uppercase tracking-widest mb-4">
            Pricing
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold">
            One Plan. <span className="gradient-text">Everything</span>{" "}
            Included.
          </h2>
          <p className="mt-4 text-gray-400 text-lg">
            No hidden fees. No upsells. Just pure financial intelligence.
          </p>
        </AnimatedSection>

        <AnimatedSection>
          <motion.div
            whileHover={{ y: -4 }}
            className="max-w-lg mx-auto rounded-3xl gradient-border p-8 sm:p-10 glass-card text-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium uppercase tracking-wider mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Most Popular
            </div>

            <div className="mb-2">
              <span className="text-6xl font-bold">$0.01</span>
              <span className="text-xl text-gray-400">/month</span>
            </div>
            <p className="text-gray-500 text-sm mb-8">
              Yes, really. One penny per month.
            </p>

            <ul className="space-y-3 text-left mb-10">
              {features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-3 text-gray-300 text-sm"
                >
                  <svg
                    className="w-5 h-5 text-emerald-400 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              href="/register"
              className="block w-full py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-lg font-semibold transition-all hover:shadow-xl hover:shadow-emerald-500/25"
            >
              Get Started Now
            </Link>
            <p className="mt-4 text-xs text-gray-500">
              Cancel anytime. No questions asked.
            </p>
          </motion.div>
        </AnimatedSection>
      </div>
    </section>
  );
}
