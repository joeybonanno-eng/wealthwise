"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

export interface Insight {
  id: string;
  user_id: number;
  type: string;
  title: string;
  body: string;
  reasoning: string;
  confidence: number;
  urgency: string;
  impact: string;
  actions: string | null;
  source_goals: string | null;
  trigger: string;
  status: string;
  created_at: string;
  delivered_at: string | null;
  resolved_at: string | null;
}

export function useInsights() {
  const { data: session } = useSession();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (session?.accessToken) {
      apiClient.setToken(session.accessToken);
    }
  }, [session]);

  const refresh = useCallback(async () => {
    if (!session?.accessToken) return;
    apiClient.setToken(session.accessToken);
    setLoading(true);
    try {
      const data = await apiClient.getInsights();
      setInsights(data.insights);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const generate = useCallback(async () => {
    if (!session?.accessToken) return;
    apiClient.setToken(session.accessToken);
    setGenerating(true);
    try {
      await apiClient.generateInsights();
      await refresh();
    } catch {
      // silently fail
    } finally {
      setGenerating(false);
    }
  }, [session, refresh]);

  const accept = useCallback(
    async (id: string) => {
      if (!session?.accessToken) return;
      apiClient.setToken(session.accessToken);
      try {
        await apiClient.acceptInsight(id);
        setInsights((prev) => prev.filter((i) => i.id !== id));
      } catch {
        // silently fail
      }
    },
    [session]
  );

  const dismiss = useCallback(
    async (id: string) => {
      if (!session?.accessToken) return;
      apiClient.setToken(session.accessToken);
      try {
        await apiClient.dismissInsight(id);
        setInsights((prev) => prev.filter((i) => i.id !== id));
      } catch {
        // silently fail
      }
    },
    [session]
  );

  return {
    insights,
    loading,
    generating,
    refresh,
    generate,
    accept,
    dismiss,
  };
}
