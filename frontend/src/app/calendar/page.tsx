"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

interface CalendarEvent {
  date: string;
  type: string;
  title: string;
  detail: string;
  category: string;
}

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [grouped, setGrouped] = useState<Record<string, CalendarEvent[]>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const loadCalendar = useCallback(async () => {
    try {
      const data = await apiClient.getFinancialCalendar();
      setEvents(data.events);
      setGrouped(data.grouped);
      setTotal(data.total);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (session?.accessToken) {
      apiClient.setToken(session.accessToken);
      loadCalendar();
    }
  }, [status, session, router, loadCalendar]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
      </div>
    );
  }

  const typeColors: Record<string, string> = {
    bill: "bg-red-500/20 text-red-400 border-red-500/30",
    dividend: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    goal: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    alert: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };

  const typeIcons: Record<string, string> = {
    bill: "\u{1F4B3}",
    dividend: "\u{1F4B0}",
    goal: "\u{1F3AF}",
    alert: "\u{1F514}",
  };

  const filteredGrouped = Object.entries(grouped)
    .map(([date, evts]) => ({
      date,
      events: filter === "all" ? evts : evts.filter((e) => e.type === filter),
    }))
    .filter((g) => g.events.length > 0);

  const types = Array.from(new Set(events.map((e) => e.type)));

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Financial Calendar</h1>
            <p className="text-gray-400 text-sm mt-1">{total} upcoming event{total !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filter === "all" ? "bg-emerald-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            All ({total})
          </button>
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filter === t ? "bg-emerald-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {typeIcons[t] || ""} {t.charAt(0).toUpperCase() + t.slice(1)} ({events.filter((e) => e.type === t).length})
            </button>
          ))}
        </div>

        {/* Events grouped by date */}
        {filteredGrouped.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4 opacity-50">&#x1F4C5;</div>
            <p className="text-gray-400 text-lg">No upcoming events</p>
            <p className="text-gray-500 text-sm mt-2">Add bills, holdings, goals, or alerts to see them here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredGrouped.map(({ date, events: dayEvents }) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-gray-800 px-3 py-1 rounded-lg">
                    <p className="text-emerald-400 font-bold text-sm">{new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
                  </div>
                  <div className="flex-1 h-px bg-gray-800" />
                </div>

                <div className="space-y-2 ml-2">
                  {dayEvents.map((evt, i) => (
                    <div
                      key={`${date}-${i}`}
                      className={`border rounded-lg p-3 ${typeColors[evt.type] || "bg-gray-800/50 text-gray-300 border-gray-700"}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{typeIcons[evt.type] || ""} {evt.title}</p>
                          <p className="text-xs opacity-80 mt-0.5">{evt.detail}</p>
                        </div>
                        <span className="text-xs bg-gray-900/50 px-2 py-0.5 rounded">{evt.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
