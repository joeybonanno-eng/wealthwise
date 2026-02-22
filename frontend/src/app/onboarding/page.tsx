"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

import WelcomeStep from "@/components/onboarding/WelcomeStep";
import GoalsStep from "@/components/onboarding/GoalsStep";
import ExperienceStep from "@/components/onboarding/ExperienceStep";
import RiskToleranceStep from "@/components/onboarding/RiskToleranceStep";
import FinancialSnapshotStep from "@/components/onboarding/FinancialSnapshotStep";
import TimelineStep from "@/components/onboarding/TimelineStep";
import TopicsStep from "@/components/onboarding/TopicsStep";
import PersonalityStep from "@/components/onboarding/PersonalityStep";

const TOTAL_STEPS = 8;

interface OnboardingData {
  name: string;
  goals: string[];
  experience_level: string;
  risk_tolerance: string;
  income: string;
  expenses: string;
  savings: string;
  debt: string;
  investment_timeline: string;
  interested_topics: string[];
  communication_level: string;
  advisor_tone: string;
}

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [direction, setDirection] = useState(1);

  const [data, setData] = useState<OnboardingData>({
    name: "",
    goals: [],
    experience_level: "",
    risk_tolerance: "",
    income: "",
    expenses: "",
    savings: "",
    debt: "",
    investment_timeline: "",
    interested_topics: [],
    communication_level: "college",
    advisor_tone: "professional",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.accessToken) {
      apiClient.setToken(session.accessToken);
    }
  }, [session]);

  function next() {
    if (step < TOTAL_STEPS - 1) {
      setDirection(1);
      setStep(step + 1);
    }
  }

  function back() {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  }

  function skip() {
    router.push("/chat");
  }

  async function complete() {
    setSaving(true);
    try {
      const profileData: Record<string, unknown> = {
        onboarding_completed: true,
      };

      if (data.goals.length > 0) {
        profileData.investment_goals = data.goals.join(", ");
      }
      if (data.experience_level) {
        profileData.experience_level = data.experience_level;
      }
      if (data.risk_tolerance) {
        profileData.risk_tolerance = data.risk_tolerance;
      }
      if (data.income) {
        profileData.annual_income = parseFloat(data.income);
      }
      if (data.expenses) {
        profileData.monthly_expenses = parseFloat(data.expenses);
      }
      if (data.savings) {
        profileData.total_savings = parseFloat(data.savings);
      }
      if (data.debt) {
        profileData.total_debt = parseFloat(data.debt);
      }
      if (data.investment_timeline) {
        profileData.investment_timeline = data.investment_timeline;
      }
      if (data.interested_topics.length > 0) {
        profileData.interested_topics = data.interested_topics.join(", ");
      }
      if (data.communication_level) {
        profileData.communication_level = data.communication_level;
      }
      if (data.advisor_tone) {
        profileData.advisor_tone = data.advisor_tone;
      }

      await apiClient.updateProfile(profileData);
      router.push("/chat");
    } catch {
      alert("Failed to save profile. You can update it later in settings.");
      router.push("/chat");
    } finally {
      setSaving(false);
    }
  }

  const isLastStep = step === TOTAL_STEPS - 1;

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: dir > 0 ? -100 : 100,
      opacity: 0,
    }),
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 max-w-3xl mx-auto w-full">
        <span className="text-lg font-bold">
          <span className="gradient-text">Wealth</span>Wise
        </span>
        <button
          onClick={skip}
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Skip for now
        </button>
      </div>

      {/* Progress bar */}
      <div className="max-w-3xl mx-auto w-full px-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">
            Step {step + 1} of {TOTAL_STEPS}
          </span>
          <span className="text-xs text-gray-500">
            {Math.round(((step + 1) / TOTAL_STEPS) * 100)}%
          </span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
            style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {step === 0 && (
                <WelcomeStep
                  name={data.name}
                  onChange={(name) => setData({ ...data, name })}
                />
              )}
              {step === 1 && (
                <GoalsStep
                  selected={data.goals}
                  onChange={(goals) => setData({ ...data, goals })}
                />
              )}
              {step === 2 && (
                <ExperienceStep
                  selected={data.experience_level}
                  onChange={(experience_level) =>
                    setData({ ...data, experience_level })
                  }
                />
              )}
              {step === 3 && (
                <RiskToleranceStep
                  selected={data.risk_tolerance}
                  onChange={(risk_tolerance) =>
                    setData({ ...data, risk_tolerance })
                  }
                />
              )}
              {step === 4 && (
                <FinancialSnapshotStep
                  income={data.income}
                  expenses={data.expenses}
                  savings={data.savings}
                  debt={data.debt}
                  onChange={(field, value) =>
                    setData({ ...data, [field]: value })
                  }
                />
              )}
              {step === 5 && (
                <TimelineStep
                  selected={data.investment_timeline}
                  onChange={(investment_timeline) =>
                    setData({ ...data, investment_timeline })
                  }
                />
              )}
              {step === 6 && (
                <TopicsStep
                  selected={data.interested_topics}
                  onChange={(interested_topics) =>
                    setData({ ...data, interested_topics })
                  }
                />
              )}
              {step === 7 && (
                <PersonalityStep
                  communicationLevel={data.communication_level}
                  advisorTone={data.advisor_tone}
                  onChangeCommunication={(communication_level) =>
                    setData({ ...data, communication_level })
                  }
                  onChangeTone={(advisor_tone) =>
                    setData({ ...data, advisor_tone })
                  }
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-6 py-6 max-w-3xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <button
            onClick={back}
            disabled={step === 0}
            className="px-6 py-3 text-sm text-gray-400 hover:text-white disabled:opacity-0 disabled:pointer-events-none transition-all"
          >
            Back
          </button>
          <button
            onClick={isLastStep ? complete : next}
            disabled={saving}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-emerald-500/25"
          >
            {saving
              ? "Saving..."
              : isLastStep
              ? "Complete Setup"
              : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
