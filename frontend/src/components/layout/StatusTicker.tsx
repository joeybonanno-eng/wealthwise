"use client";

import { useState, useEffect, useRef } from "react";
import { TickerSymbol } from "@/components/shared/TickerSymbol";
import { apiClient } from "@/lib/api-client";

interface TickerItem {
  symbol: string;
  price: number;
  change_pct: number;
}

const tickerData: TickerItem[] = [
  { symbol: "SPY", price: 592.45, change_pct: 0.82 },
  { symbol: "QQQ", price: 510.33, change_pct: 1.15 },
  { symbol: "DIA", price: 438.12, change_pct: 0.34 },
  { symbol: "GLD", price: 214.87, change_pct: -0.21 },
  { symbol: "BTC", price: 97842.50, change_pct: 2.47 },
  { symbol: "VIX", price: 14.32, change_pct: -3.18 },
  { symbol: "DXY", price: 103.45, change_pct: -0.12 },
];

const REFRESH_INTERVAL = 60_000; // 60 seconds

function TickerItemDisplay({ item }: { item: TickerItem }) {
  const isPositive = item.change_pct >= 0;
  const arrow = isPositive ? "\u25B2" : "\u25BC";
  const colorClass = isPositive ? "text-emerald-400" : "text-red-400";

  return (
    <span className="inline-flex items-center gap-2 px-4 whitespace-nowrap">
      <span className="text-xs font-semibold text-[var(--aiva-text-primary)] tracking-wide">
        {item.symbol}
      </span>
      <span className="text-xs text-[var(--aiva-text-secondary)] font-mono tabular-nums">
        {item.price.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </span>
      <span className={`text-xs font-medium font-mono tabular-nums ${colorClass}`}>
        {arrow} {isPositive ? "+" : ""}
        {item.change_pct.toFixed(2)}%
      </span>
    </span>
  );
}

export function StatusTicker() {
  const [prices, setPrices] = useState<Record<string, { price: number; change_pct: number }>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function fetchPrices() {
      const results = await Promise.allSettled(
        tickerData.map((t) => apiClient.getTickerQuote(t.symbol))
      );
      const next: Record<string, { price: number; change_pct: number }> = {};
      results.forEach((result, i) => {
        if (result.status === "fulfilled") {
          next[tickerData[i].symbol] = {
            price: result.value.price,
            change_pct: result.value.change_pct,
          };
        }
      });
      if (Object.keys(next).length > 0) {
        setPrices((prev) => ({ ...prev, ...next }));
      }
    }

    fetchPrices();
    intervalRef.current = setInterval(fetchPrices, REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const liveData = tickerData.map((t) => ({
    symbol: t.symbol,
    price: prices[t.symbol]?.price ?? t.price,
    change_pct: prices[t.symbol]?.change_pct ?? t.change_pct,
  }));

  // Duplicate the ticker data for seamless infinite scroll
  const items = [...liveData, ...liveData, ...liveData];

  return (
    <div className="h-10 bg-[var(--aiva-surface-elevated)] border-b border-[var(--aiva-border-subtle)] flex items-center overflow-hidden relative shrink-0">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[var(--aiva-surface-elevated)] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--aiva-surface-elevated)] to-transparent z-10 pointer-events-none" />

      {/* Scrolling content */}
      <div className="flex items-center animate-ticker whitespace-nowrap">
        {items.map((item, index) => (
          <span key={`${item.symbol}-${index}`} className="inline-flex items-center">
            <TickerSymbol symbol={item.symbol}>
              <TickerItemDisplay item={item} />
            </TickerSymbol>
            <span className="text-[var(--aiva-border)] mx-1">|</span>
          </span>
        ))}
      </div>

      <style jsx>{`
        @keyframes ticker-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
        .animate-ticker {
          animation: ticker-scroll 30s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
