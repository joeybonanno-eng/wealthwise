"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import ChatWindow from "@/components/ChatWindow";
import AlertNotification from "@/components/AlertNotification";

const PlanWizard = dynamic(() => import("@/components/PlanWizard"), { ssr: false });
const AlertModal = dynamic(() => import("@/components/AlertModal"), { ssr: false });
const AlertsDashboard = dynamic(() => import("@/components/AlertsDashboard"), { ssr: false });
import { useChat } from "@/hooks/useChat";
import { useSpeech } from "@/hooks/useSpeech";
const VoiceSettings = dynamic(() => import("@/components/VoiceSettings"), { ssr: false });
import apiClient from "@/lib/api-client";

interface TriggeredAlert {
  symbol: string;
  condition: string;
  target_price: number;
  current_price: number | null;
  message: string | null;
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showPlanWizard, setShowPlanWizard] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showAlertsDashboard, setShowAlertsDashboard] = useState(false);
  const [triggeredAlerts, setTriggeredAlerts] = useState<TriggeredAlert[]>([]);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [insightCount, setInsightCount] = useState(0);

  const {
    messages,
    conversations,
    currentConversationId,
    loading,
    conversationsLoading,
    sendMessage: rawSendMessage,
    loadConversation,
    newConversation,
    deleteConversation,
  } = useChat();

  const { speak, stop: stopSpeech, isSpeaking, voices, settings: voiceSettings, updateSettings: updateVoiceSettings } = useSpeech();
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const wasLoading = useRef(false);

  // Wrap sendMessage to catch 403 entitlement errors
  const sendMessage = useCallback(
    async (content: string) => {
      try {
        setShowUpgrade(false);
        await rawSendMessage(content);
      } catch (err: any) {
        if (err?.message?.includes("free messages") || err?.message?.includes("Upgrade to Pro")) {
          setShowUpgrade(true);
        }
      }
    },
    [rawSendMessage]
  );

  // Detect mobile viewport
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
      if (!e.matches) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    onChange(mql);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Load profile and insight count
  useEffect(() => {
    if (session?.accessToken) {
      apiClient.setToken(session.accessToken);
      apiClient.getProfile().then(setProfile).catch(() => {});
      apiClient.getInsights().then((data) => setInsightCount(data.total)).catch(() => {});
    }
  }, [session]);

  // Check alerts on mount
  useEffect(() => {
    if (!session?.accessToken) return;
    apiClient.setToken(session.accessToken);
    apiClient
      .checkAlerts()
      .then((data) => {
        const triggered = data.results
          .filter((r) => r.just_triggered)
          .map((r) => ({
            symbol: r.alert.symbol,
            condition: r.alert.condition,
            target_price: r.alert.target_price,
            current_price: r.current_price,
            message: r.alert.message,
          }));
        if (triggered.length > 0) {
          setTriggeredAlerts(triggered);
        }
      })
      .catch(() => {});
  }, [session]);

  // Auto-play voice when AI response arrives (if enabled)
  useEffect(() => {
    if (wasLoading.current && !loading && voiceSettings.autoPlay) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === "assistant" && lastMessage.content) {
        speak(lastMessage.content);
      }
    }
    wasLoading.current = loading;
  }, [messages, loading, speak, voiceSettings.autoPlay]);

  const handleAlertCreated = useCallback(() => {
    // Optionally refresh alerts or show confirmation
  }, []);

  const handleDismissAlerts = useCallback(() => {
    setTriggeredAlerts([]);
  }, []);

  // Auto-close sidebar on mobile when selecting a conversation
  const handleLoadConversation = useCallback(
    (id: number) => {
      loadConversation(id);
      if (isMobile) setSidebarOpen(false);
    },
    [loadConversation, isMobile]
  );

  const handleNewConversation = useCallback(() => {
    newConversation();
    if (isMobile) setSidebarOpen(false);
  }, [newConversation, isMobile]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-950 md:pb-0 mobile-nav-pad">
      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={
          isMobile
            ? `fixed inset-y-0 left-0 z-40 w-72 bg-gray-950 border-r border-gray-800 flex flex-col transition-transform duration-300 ${
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`
            : `${
                sidebarOpen ? "w-72" : "w-0"
              } transition-all duration-300 overflow-hidden border-r border-gray-800 flex flex-col`
        }
      >
        <div className="p-4 border-b border-gray-800">
          <button
            onClick={handleNewConversation}
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
                  onClick={() => handleLoadConversation(conv.id)}
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
            onClick={() => router.push("/advisor")}
            className="w-full flex items-center justify-between px-3 py-2 text-sm text-emerald-400 hover:text-emerald-300 hover:bg-gray-800 rounded-lg transition-colors font-medium"
          >
            Advisor Console
            {insightCount > 0 && (
              <span className="ml-2 min-w-[1.25rem] h-5 flex items-center justify-center bg-emerald-600 text-white text-xs font-bold rounded-full px-1.5">
                {insightCount}
              </span>
            )}
          </button>
          <button
            onClick={() => router.push("/profile")}
            className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            Financial Profile
          </button>
          <button
            onClick={() => setShowPlanWizard(true)}
            className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            Create a Plan
          </button>
          <button
            onClick={() => setShowAlertModal(true)}
            className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            Set Price Alert
          </button>
          <button
            onClick={() => setShowAlertsDashboard(true)}
            className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            My Alerts
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
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Alert notification toast */}
        <AlertNotification
          alerts={triggeredAlerts}
          onDismiss={handleDismissAlerts}
        />

        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 border-b border-gray-800">
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
          <h1 className="text-base sm:text-lg font-semibold text-white">
            <span className="text-emerald-400">WealthWise</span> AI
          </h1>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className={`p-1.5 rounded-lg transition-colors ${
                isSpeaking
                  ? "text-emerald-400 bg-emerald-500/10"
                  : "text-gray-500 hover:text-gray-300 hover:bg-gray-800"
              }`}
              title="Voice settings"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>
            <span className="text-sm text-gray-500 truncate max-w-[120px] sm:max-w-none">
              {session?.user?.name}
            </span>
          </div>
        </div>

        {/* Upgrade prompt when free limit hit */}
        {showUpgrade && (
          <div className="mx-4 mt-3 p-4 bg-gradient-to-r from-emerald-900/40 to-emerald-800/20 border border-emerald-700/50 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="text-2xl">&#128274;</span>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">
                  You&apos;ve used all your free messages this month
                </h3>
                <p className="text-gray-300 text-sm mb-3">
                  Your advisor was just getting warmed up. Unlock unlimited conversations for $9.99/mo.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push("/subscription")}
                    className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors font-medium"
                  >
                    Unlock Pro
                  </button>
                  <button
                    onClick={() => setShowUpgrade(false)}
                    className="py-2 px-4 text-gray-400 hover:text-white text-sm rounded-lg transition-colors"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <ChatWindow
          messages={messages}
          loading={loading}
          onSend={sendMessage}
        />
      </div>

      {/* Modals */}
      {showPlanWizard && (
        <PlanWizard
          onClose={() => setShowPlanWizard(false)}
          profile={profile ? {
            annual_income: profile.annual_income,
            monthly_expenses: profile.monthly_expenses,
            total_savings: profile.total_savings,
            total_debt: profile.total_debt,
            risk_tolerance: profile.risk_tolerance,
          } : undefined}
        />
      )}

      {showAlertModal && (
        <AlertModal
          onClose={() => setShowAlertModal(false)}
          onCreated={handleAlertCreated}
        />
      )}

      {showAlertsDashboard && (
        <AlertsDashboard onClose={() => setShowAlertsDashboard(false)} />
      )}

      <VoiceSettings
        open={showVoiceSettings}
        onClose={() => setShowVoiceSettings(false)}
        voices={voices}
        settings={voiceSettings}
        onUpdate={updateVoiceSettings}
        isSpeaking={isSpeaking}
        onTestVoice={() => speak("Hello! I'm your WealthWise financial advisor. How can I help you today?")}
        onStopVoice={stopSpeech}
      />
    </div>
  );
}
