"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  tool_results?: Array<{ tool: string; result: Record<string, any> }>;
}

export interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export function useChat() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    number | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(true);

  useEffect(() => {
    if (session?.accessToken) {
      apiClient.setToken(session.accessToken);
    }
  }, [session]);

  const loadConversations = useCallback(async () => {
    if (!session?.accessToken) return;
    setConversationsLoading(true);
    try {
      apiClient.setToken(session.accessToken);
      const data = await apiClient.getConversations();
      setConversations(data);
    } catch {
      // silently fail
    } finally {
      setConversationsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const loadConversation = useCallback(
    async (id: number) => {
      if (!session?.accessToken) return;
      apiClient.setToken(session.accessToken);
      try {
        const data = await apiClient.getConversation(id);
        setMessages(data.messages as ChatMessage[]);
        setCurrentConversationId(id);
      } catch {
        // silently fail
      }
    },
    [session]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!session?.accessToken || loading) return;

      apiClient.setToken(session.accessToken);
      const userMessage: ChatMessage = {
        id: Date.now(),
        role: "user",
        content,
      };
      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);

      try {
        const response = await apiClient.sendMessage(
          content,
          currentConversationId ?? undefined
        );

        if (!currentConversationId) {
          setCurrentConversationId(response.conversation_id);
        }

        const assistantMessage: ChatMessage = {
          id: response.message.id,
          role: "assistant",
          content: response.message.content,
          tool_results: response.message.tool_results as any,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        loadConversations();
      } catch (err: any) {
        // Re-throw entitlement errors so the page can show upgrade prompt
        if (err?.message?.includes("free messages") || err?.message?.includes("Upgrade to Pro")) {
          // Remove the optimistic user message
          setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
          setLoading(false);
          throw err;
        }
        const errorMessage: ChatMessage = {
          id: Date.now() + 1,
          role: "assistant",
          content: `Sorry, I encountered an error: ${err.message}`,
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setLoading(false);
      }
    },
    [session, loading, currentConversationId, loadConversations]
  );

  const newConversation = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
  }, []);

  const deleteConversation = useCallback(
    async (id: number) => {
      if (!session?.accessToken) return;
      apiClient.setToken(session.accessToken);
      try {
        await apiClient.deleteConversation(id);
        if (currentConversationId === id) {
          newConversation();
        }
        loadConversations();
      } catch {
        // silently fail
      }
    },
    [session, currentConversationId, newConversation, loadConversations]
  );

  return {
    messages,
    conversations,
    currentConversationId,
    loading,
    conversationsLoading,
    sendMessage,
    loadConversation,
    newConversation,
    deleteConversation,
  };
}
