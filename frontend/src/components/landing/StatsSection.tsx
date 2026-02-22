"use client";

import { useEffect, useRef, useState } from "react";
import AnimatedSection from "./AnimatedSection";

function useCountUp(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [started, end, duration]);

  return { count, ref };
}

interface StatItemProps {
  value: number;
  suffix: string;
  label: string;
  format?: boolean;
  delay: number;
}

function StatItem({ value, suffix, label, format, delay }: StatItemProps) {
  const { count, ref } = useCountUp(value);
  return (
    <AnimatedSection delay={delay}>
      <div ref={ref} className="text-center">
        <div className="text-4xl sm:text-5xl font-bold gradient-text">
          {format
            ? `${(count / 1000000).toFixed(1)}M`
            : count.toLocaleString()}
          {suffix}
        </div>
        <p className="mt-2 text-gray-400">{label}</p>
      </div>
    </AnimatedSection>
  );
}

const stats = [
  { value: 2847, suffix: "+", label: "Active Investors" },
  { value: 98, suffix: "%", label: "Satisfaction Rate" },
  { value: 1200000, suffix: "+", label: "AI Analyses Run", format: true },
  { value: 24, suffix: "/7", label: "Market Coverage" },
];

export default function StatsSection() {
  return (
    <section className="py-24 px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent" />
      <div className="max-w-7xl mx-auto relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <StatItem
              key={stat.label}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              format={stat.format}
              delay={i * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
