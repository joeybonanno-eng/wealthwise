"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ChatWindow from "@/components/ChatWindow";
import PaywallGate from "@/components/PaywallGate";
import { useChat } from "@/hooks/useChat";

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const {
    messages,
    conversations,
    currentConversationId,
    loading,
    conversationsLoading,
    sendMessage,
    loadConversation,
    newConversation,
    deleteConversation,
  } = useChat();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
      </div>
    );
  }

  return (
    <PaywallGate>
      <div className="flex h-screen bg-gray-950">
        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? "w-72" : "w-0"
          } transition-all duration-300 overflow-hidden border-r border-gray-800 flex flex-col`}
        >
          <div className="p-4 border-b border-gray-800">
            <button
              onClick={newConversation}
              className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              + New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversationsLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-400 mx-auto" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No conversations yet
              </p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`group flex items-center rounded-lg cursor-pointer ${
                    currentConversationId === conv.id
                      ? "bg-gray-800 text-white"
                      : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
                  }`}
                >
                  <button
                    onClick={() => loadConversation(conv.id)}
                    className="flex-1 text-left px-3 py-2 text-sm truncate"
                  >
                    {conv.title}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 px-2 py-1 text-gray-500 hover:text-red-400 transition-opacity"
                    title="Delete conversation"
                  >
                    &#10005;
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-gray-800 space-y-2">
            <button
              onClick={() => router.push("/profile")}
              className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              Financial Profile
            </button>
            <button
              onClick={() => router.push("/subscription")}
              className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              Subscription
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-white">
              <span className="text-emerald-400">WealthWise</span> AI
            </h1>
            <span className="text-sm text-gray-500 ml-auto">
              {session?.user?.name}
            </span>
          </div>

          <ChatWindow
            messages={messages}
            loading={loading}
            onSend={sendMessage}
          />
        </div>
      </div>
    </PaywallGate>
  );
}
