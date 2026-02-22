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
import ThemeToggle from "@/components/ThemeToggle";
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
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [statusBarData, setStatusBarData] = useState<{
    totalAssets: number;
    totalLiabilities: number;
    savingsRate: number;
    portfolioGainPct: number;
  } | null>(null);

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

  const toggleGroup = useCallback((group: string) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  }, []);

  const formatCurrency = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n.toLocaleString()}`;
  };

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

  // Load profile and insight count + poll every 60s
  useEffect(() => {
    if (session?.accessToken) {
      apiClient.setToken(session.accessToken);
      apiClient.getProfile().then(setProfile).catch(() => {});
      apiClient.checkInAchievements().catch(() => {}); // silent streak update
      apiClient.getDashboard().then((data) => {
        setStatusBarData({
          totalAssets: data.net_worth.total_assets,
          totalLiabilities: data.net_worth.total_liabilities,
          savingsRate: data.budget.savings_rate,
          portfolioGainPct: data.portfolio.total_gain_pct,
        });
      }).catch(() => {});

      const fetchInsightCount = () => {
        apiClient.getInsights().then((data) => {
          setInsightCount((prev) => {
            if (data.total > prev && prev > 0) {
              // New insights arrived — could show a toast here
            }
            return data.total;
          });
        }).catch(() => {});
      };

      fetchInsightCount();
      const interval = setInterval(fetchInsightCount, 60000);
      return () => clearInterval(interval);
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

        <div className="p-3 border-t border-gray-800 space-y-1 overflow-y-auto max-h-[60vh]">
          {/* Always visible */}
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full flex items-center justify-between px-3 py-2 text-sm text-emerald-400 hover:text-emerald-300 hover:bg-gray-800 rounded-lg transition-colors font-medium"
          >
            Dashboard
          </button>
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

          {/* Portfolio group */}
          <button onClick={() => toggleGroup("portfolio")} className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors">
            Portfolio
            <svg className={`w-3 h-3 transition-transform ${expandedGroups.portfolio ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
          {expandedGroups.portfolio && (
            <div className="space-y-0.5">
              <button onClick={() => router.push("/dashboard")} className="w-full text-left pl-5 pr-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">Portfolio</button>
              <button onClick={() => router.push("/watchlist")} className="w-full text-left pl-5 pr-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">Watchlist</button>
              <button onClick={() => router.push("/compare")} className="w-full text-left pl-5 pr-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">Compare</button>
              <button onClick={() => router.push("/screener")} className="w-full text-left pl-5 pr-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">Screener</button>
              <button onClick={() => router.push("/allocation")} className="w-full text-left pl-5 pr-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">Allocation</button>
            </div>
          )}

          {/* Money group */}
          <button onClick={() => toggleGroup("money")} className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors">
            Money
            <svg className={`w-3 h-3 transition-transform ${expandedGroups.money ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
          {expandedGroups.money && (
            <div className="space-y-0.5">
              <button onClick={() => router.push("/budget")} className="w-full text-left pl-5 pr-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">Budget</button>
              <button onClick={() => router.push("/net-worth")} className="w-full text-left pl-5 pr-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">Net Worth</button>
              <button onClick={() => router.push("/savings-goals")} className="w-full text-left pl-5 pr-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">Savings Goals</button>
              <button onClick={() => router.push("/subscriptions")} className="w-full text-left pl-5 pr-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">Subscriptions</button>
            </div>
          )}

          {/* Insights group */}
          <button onClick={() => toggleGroup("insights")} className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors">
            Insights
            <svg className={`w-3 h-3 transition-transform ${expandedGroups.insights ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
          {expandedGroups.insights && (
            <div className="space-y-0.5">
              <button onClick={() => router.push("/news")} className="w-full text-left pl-5 pr-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">News</button>
              <button onClick={() => router.push("/health-score")} className="w-full text-left pl-5 pr-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">Health Score</button>
              <button onClick={() => router.push("/forecast")} className="w-full text-left pl-5 pr-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">Cash Flow</button>
              <button onClick={() => router.push("/spending-coach")} className="w-full text-left pl-5 pr-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">Spending Coach</button>
              <button onClick={() => router.push("/reports")} className="w-full text-left pl-5 pr-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">Reports</button>
            </div>
          )}

          {/* Calculators group */}
          <button onClick={() => toggleGroup("calculators")} className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors">
            Calculators
            <svg className={`w-3 h-3 transition-transform ${expandedGroups.calculators ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
          {expandedGroups.calculators && (
            <div className="space-y-0.5">
              <button onClick={() => router.push("/calculators/retirement")} className="w-full text-left pl-5 pr-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">Retirement</button>
              <button onClick={() => router.push("/calculators/compound")} className="w-full text-left pl-5 pr-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">Compound Interest</button>
              <button onClick={() => router.push("/calculators/mortgage")} className="w-full text-left pl-5 pr-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">Mortgage</button>
              <button onClick={() => router.push("/calculators/debt-payoff")} className="w-full text-left pl-5 pr-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">Debt Payoff</button>
              <button onClick={() => router.push("/calculators/tax")} className="w-full text-left pl-5 pr-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">Tax Estimator</button>
            </div>
          )}

          {/* Tools group */}
          <button onClick={() => toggleGroup("tools")} className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors">
            Tools
            <svg className={`w-3 h-3 transition-transform ${expandedGroups.tools ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
          {expandedGroups.tools && (
            <div className="space-y-0.5">
              <button onClick={() => setShowPlanWizard(true)} className="w-full text-left pl-5 pr-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">Create a Plan</button>
              <button onClick={() => setShowAlertModal(true)} className="w-full text-left pl-5 pr-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">Price Alerts</button>
              <button onClick={() => setShowAlertsDashboard(true)} className="w-full text-left pl-5 pr-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">My Alerts</button>
              <button onClick={() => router.push("/calendar")} className="w-full text-left pl-5 pr-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">Calendar</button>
              <button onClick={() => router.push("/import-export")} className="w-full text-left pl-5 pr-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">Import/Export</button>
              <button onClick={() => router.push("/search")} className="w-full text-left pl-5 pr-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">Search</button>
              <button onClick={() => router.push("/goals")} className="w-full text-left pl-5 pr-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">Goal Drift</button>
            </div>
          )}

          {/* Learn group */}
          <button onClick={() => toggleGroup("learn")} className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors">
            Learn
            <svg className={`w-3 h-3 transition-transform ${expandedGroups.learn ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
          {expandedGroups.learn && (
            <div className="space-y-0.5">
              <button onClick={() => router.push("/learn")} className="w-full text-left pl-5 pr-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">Learn</button>
              <button onClick={() => router.push("/achievements")} className="w-full text-left pl-5 pr-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">Achievements</button>
            </div>
          )}

          {/* Account group */}
          <button onClick={() => toggleGroup("account")} className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors">
            Account
            <svg className={`w-3 h-3 transition-transform ${expandedGroups.account ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
          {expandedGroups.account && (
            <div className="space-y-0.5">
              <button onClick={() => router.push("/profile")} className="w-full text-left pl-5 pr-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">Profile</button>
              <button onClick={() => router.push("/settings")} className="w-full text-left pl-5 pr-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">Notifications</button>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="w-full text-left pl-5 pr-3 py-1.5 text-sm text-red-400/70 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors">Sign Out</button>
            </div>
          )}
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
            <ThemeToggle />
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

        {/* Financial Status Bar */}
        {statusBarData && (
          <div className="flex items-center gap-0 text-xs border-b border-gray-800 bg-gray-900 overflow-x-auto">
            <div className="flex items-center gap-1.5 px-4 py-2 border-r border-gray-800 whitespace-nowrap">
              <span className="text-gray-500">Assets</span>
              <span className="text-emerald-400 font-semibold">{formatCurrency(statusBarData.totalAssets)}</span>
            </div>
            <div className="flex items-center gap-1.5 px-4 py-2 border-r border-gray-800 whitespace-nowrap">
              <span className="text-gray-500">Debt</span>
              <span className="text-red-400 font-semibold">{formatCurrency(statusBarData.totalLiabilities)}</span>
            </div>
            <div className="flex items-center gap-1.5 px-4 py-2 border-r border-gray-800 whitespace-nowrap">
              <span className="text-gray-500">Retire</span>
              <span className="text-white font-semibold">
                {(() => {
                  const age = profile?.age || 30;
                  const retireAge = 65;
                  const daysLeft = Math.max(0, Math.round((retireAge - age) * 365.25));
                  return `${daysLeft.toLocaleString()}d`;
                })()}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-4 py-2 whitespace-nowrap">
              {statusBarData.savingsRate > 15 && statusBarData.portfolioGainPct >= 0 ? (
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  On Track
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-400 font-semibold">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Needs Attention
                </span>
              )}
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
