"use client";

import Link from "next/link";
import AnimatedSection from "./AnimatedSection";

export default function CTASection() {
  return (
    <section className="py-24 px-6 relative">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        <AnimatedSection>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
            Ready to Make
            <br />
            <span className="gradient-text">Smarter Investments?</span>
          </h2>
          <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto">
            Join thousands of investors who&apos;ve upgraded their financial
            decision-making with AI-powered insights.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl text-lg font-semibold transition-all hover:shadow-xl hover:shadow-emerald-500/25 hover:-translate-y-0.5"
            >
              Start Your Free Trial
            </Link>
            <p className="text-sm text-gray-500">
              No credit card required to start
            </p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
