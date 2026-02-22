"use client";

import Image from "next/image";
import AnimatedSection from "./AnimatedSection";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Software Engineer",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    text: "I used to spend hours researching stocks. WealthWise gives me institutional-quality analysis in seconds. It&apos;s like having a Goldman Sachs analyst in my pocket.",
    stars: 5,
  },
  {
    name: "Marcus Johnson",
    role: "Small Business Owner",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    text: "The personalized advice based on my risk profile is incredible. I set it to &apos;mentor mode&apos; and it teaches me while helping me invest. Best $0.01 I&apos;ve ever spent.",
    stars: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "Graduate Student",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    text: "As a finance PhD student, I was skeptical. But the PhD communication mode actually uses proper academic frameworks — CAPM, Sharpe ratios, the works. Genuinely impressed.",
    stars: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection className="text-center mb-16">
          <p className="text-sm text-emerald-400 uppercase tracking-widest mb-4">
            Testimonials
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold">
            Loved by <span className="gradient-text">Investors</span>
          </h2>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <AnimatedSection key={t.name} delay={i * 0.1}>
              <div className="p-6 rounded-2xl glass-card h-full flex flex-col">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(t.stars)].map((_, j) => (
                    <svg
                      key={j}
                      className="w-5 h-5 text-yellow-400 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>

                {/* Quote */}
                <p className="text-gray-300 text-sm leading-relaxed flex-1">
                  &ldquo;{t.text}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-800/50">
                  <Image
                    src={t.avatar}
                    alt={t.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
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
