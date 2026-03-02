"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { CampaignDraft, initialDraft } from "@/lib/types";

interface CampaignContextType {
  draft: CampaignDraft;
  updateDraft: (updates: Partial<CampaignDraft>) => void;
  resetDraft: () => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  totalSteps: number;
  completedSteps: Set<number>;
  markStepComplete: (step: number) => void;
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<CampaignDraft>(initialDraft);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const totalSteps = draft.campaignType === "internal" ? 11 : 10; // 0-10 for internal, 0-9 for third-party (step 9 Attribution skipped)

  const updateDraft = (updates: Partial<CampaignDraft>) => {
    setDraft((prev) => ({ ...prev, ...updates }));
  };

  const resetDraft = () => {
    setDraft(initialDraft);
    setCurrentStep(0);
    setCompletedSteps(new Set());
  };

  const markStepComplete = (step: number) => {
    setCompletedSteps((prev) => new Set([...prev, step]));
  };

  return (
    <CampaignContext.Provider
      value={{
        draft,
        updateDraft,
        resetDraft,
        currentStep,
        setCurrentStep,
        totalSteps,
        completedSteps,
        markStepComplete,
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaign() {
  const context = useContext(CampaignContext);
  if (context === undefined) {
    throw new Error("useCampaign must be used within a CampaignProvider");
  }
  return context;
}
