"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [emailBriefing, setEmailBriefing] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [emailInsights, setEmailInsights] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [briefingFrequency, setBriefingFrequency] = useState("daily");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (session?.accessToken) {
      apiClient.setToken(session.accessToken);
      apiClient
        .getNotificationPreferences()
        .then((data) => {
          setEmailBriefing(data.email_briefing);
          setEmailAlerts(data.email_alerts);
          setEmailInsights(data.email_insights);
          setPushEnabled(data.push_enabled);
          setBriefingFrequency(data.briefing_frequency);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [status, session, router]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await apiClient.updateNotificationPreferences({
        email_briefing: emailBriefing,
        email_alerts: emailAlerts,
        email_insights: emailInsights,
        push_enabled: pushEnabled,
        briefing_frequency: briefingFrequency,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
      </div>
    );
  }

  const Toggle = ({
    enabled,
    onToggle,
    label,
    description,
  }: {
    enabled: boolean;
    onToggle: () => void;
    label: string;
    description: string;
  }) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-700/50">
      <div>
        <p className="text-white font-medium text-sm">{label}</p>
        <p className="text-gray-400 text-xs mt-0.5">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          enabled ? "bg-emerald-600" : "bg-gray-600"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Notification Settings</h1>
            <p className="text-gray-400 text-sm mt-1">Control how you receive updates</p>
          </div>
          <button
            onClick={() => router.push("/chat")}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
          >
            Back to Chat
          </button>
        </div>

        {/* Email Notifications */}
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-2">Email Notifications</h2>
          <Toggle
            enabled={emailBriefing}
            onToggle={() => setEmailBriefing(!emailBriefing)}
            label="Daily/Weekly Briefing"
            description="Receive market summaries and portfolio updates"
          />
          <Toggle
            enabled={emailAlerts}
            onToggle={() => setEmailAlerts(!emailAlerts)}
            label="Price Alerts"
            description="Get notified when your price alerts are triggered"
          />
          <Toggle
            enabled={emailInsights}
            onToggle={() => setEmailInsights(!emailInsights)}
            label="AI Insights"
            description="Receive personalized financial insights"
          />
        </div>

        {/* Push Notifications */}
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-2">Push Notifications</h2>
          <Toggle
            enabled={pushEnabled}
            onToggle={() => setPushEnabled(!pushEnabled)}
            label="Browser Push Notifications"
            description="Get real-time notifications in your browser"
          />
        </div>

        {/* Briefing Frequency */}
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Briefing Frequency</h2>
          <div className="flex gap-3">
            {["daily", "weekly", "never"].map((freq) => (
              <button
                key={freq}
                onClick={() => setBriefingFrequency(freq)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  briefingFrequency === freq
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {freq.charAt(0).toUpperCase() + freq.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl text-sm font-medium transition-colors"
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}
