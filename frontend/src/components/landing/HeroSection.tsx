"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-pulse-glow [animation-delay:2s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-400/5 rounded-full blur-3xl animate-pulse-glow [animation-delay:1s]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm text-gray-300">
            AI-Powered Financial Intelligence
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight tracking-tight"
        >
          Your Money Deserves
          <br />
          <span className="gradient-text">Genius-Level</span> Advice
        </motion.h1>

        {/* Subhead */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
        >
          Real-time market data, personalized portfolio analysis, and
          institutional-grade insights — powered by AI that adapts to your
          financial goals.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/register"
            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl text-lg font-semibold transition-all hover:shadow-xl hover:shadow-emerald-500/25 hover:-translate-y-0.5"
          >
            Start Free — $0.01/mo
          </Link>
          <a
            href="#demo"
            className="px-8 py-4 glass rounded-2xl text-lg text-gray-300 hover:text-white transition-all hover:bg-white/10"
          >
            Watch Demo
          </a>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-12 flex items-center justify-center gap-6"
        >
          <div className="flex -space-x-3">
            {[
              "photo-1507003211169-0a1dd7228f2d",
              "photo-1494790108377-be9c29b29330",
              "photo-1472099645785-5658abf4ff4e",
              "photo-1438761681033-6461ffad8d80",
            ].map((id, i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-full border-2 border-gray-950 overflow-hidden"
              >
                <Image
                  src={`https://images.unsplash.com/${id}?w=80&h=80&fit=crop&crop=face`}
                  alt="User avatar"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className="w-4 h-4 text-yellow-400 fill-current"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              ))}
            </div>
            <p className="text-sm text-gray-400">
              Loved by 2,800+ investors
            </p>
          </div>
        </motion.div>

        {/* Floating dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-16 relative animate-float"
        >
          <div className="relative mx-auto max-w-4xl rounded-2xl overflow-hidden glow-emerald gradient-border">
            <div className="relative bg-gray-900/90 rounded-2xl p-1">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <div className="flex-1 mx-4 px-4 py-1 rounded-md bg-gray-800/50 text-xs text-gray-500 text-center">
                  wealthwise.app/chat
                </div>
              </div>
              <Image
                src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=600&fit=crop"
                alt="WealthWise Dashboard"
                width={1200}
                height={600}
                className="w-full rounded-b-xl"
                priority
              />
            </div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-12 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-gray-500 uppercase tracking-widest">
            Scroll to explore
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-gray-600 flex items-start justify-center p-1.5"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
