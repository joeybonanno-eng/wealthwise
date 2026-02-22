"use client";

import Image from "next/image";
import AnimatedSection from "./AnimatedSection";

const steps = [
  {
    step: "01",
    title: "Set Up Your Profile",
    description:
      "Tell us about your financial goals, risk tolerance, and investment timeline. Our guided onboarding takes less than 2 minutes.",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop",
  },
  {
    step: "02",
    title: "Ask Anything",
    description:
      "Chat naturally about stocks, portfolio strategies, market trends, or retirement planning. Our AI pulls real-time data to answer.",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
  },
  {
    step: "03",
    title: "Get Smarter Every Day",
    description:
      "Receive personalized insights that adapt to your growing knowledge. The more you use WealthWise, the better it understands you.",
    image:
      "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=600&h=400&fit=crop",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection className="text-center mb-20">
          <p className="text-sm text-emerald-400 uppercase tracking-widest mb-4">
            How It Works
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold">
            Three Steps to{" "}
            <span className="gradient-text">Financial Clarity</span>
          </h2>
        </AnimatedSection>

        <div className="space-y-24">
          {steps.map((step, i) => (
            <AnimatedSection key={step.step}>
              <div
                className={`flex flex-col ${
                  i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                } items-center gap-12`}
              >
                <div className="flex-1 space-y-4">
                  <span className="text-sm font-mono text-emerald-400">
                    Step {step.step}
                  </span>
                  <h3 className="text-3xl font-bold">{step.title}</h3>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    {step.description}
                  </p>
                </div>
                <div className="flex-1">
                  <div className="rounded-2xl overflow-hidden glow-emerald">
                    <Image
                      src={step.image}
                      alt={step.title}
                      width={600}
                      height={400}
                      className="w-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
