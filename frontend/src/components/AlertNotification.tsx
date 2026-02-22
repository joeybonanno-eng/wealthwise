"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TriggeredAlert {
  symbol: string;
  condition: string;
  target_price: number;
  current_price: number | null;
  message: string | null;
}

interface AlertNotificationProps {
  alerts: TriggeredAlert[];
  onDismiss: () => void;
}

export default function AlertNotification({
  alerts,
  onDismiss,
}: AlertNotificationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (alerts.length === 0) return;
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 10000);
    return () => clearTimeout(timer);
  }, [alerts, onDismiss]);

  if (alerts.length === 0) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-2 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-4"
        >
          <div className="bg-amber-500/10 border border-amber-500/30 backdrop-blur-md rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-amber-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span className="font-medium text-amber-400 text-sm">
                  Price Alert{alerts.length > 1 ? "s" : ""} Triggered
                </span>
              </div>
              <button
                onClick={() => {
                  setVisible(false);
                  onDismiss();
                }}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-2 space-y-1">
              {alerts.map((alert, i) => (
                <p key={i} className="text-sm text-gray-200">
                  <span className="font-bold text-white">{alert.symbol}</span>{" "}
                  hit{" "}
                  <span className="text-white">
                    ${alert.current_price?.toFixed(2)}
                  </span>
                  ! (target: {alert.condition}{" "}
                  ${alert.target_price.toFixed(2)})
                  {alert.message && (
                    <span className="text-gray-400"> — {alert.message}</span>
                  )}
                </p>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
