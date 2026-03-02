"use client";

import { ReactNode } from "react";
import { useCampaign } from "@/context/CampaignContext";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import {
  LayoutDashboard,
  Sparkles,
  Wallet,
  CreditCard,
  Settings,
  HelpCircle,
  Bell,
  ChevronLeft,
  ChevronRight,
  Save,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onNext?: () => void;
  onSave?: () => void;
  onSubmit?: () => void;
  nextLabel?: string;
  showSubmit?: boolean;
  nextDisabled?: boolean;
}

const sidebarItems = [
  { icon: LayoutDashboard, label: "Campaigns", active: true },
  { icon: Sparkles, label: "Recommendations", active: false },
  { icon: Wallet, label: "Budgets", active: false },
  { icon: CreditCard, label: "Payments", active: false },
  { icon: Settings, label: "Settings", active: false },
];

export function WizardLayout({
  children,
  title,
  subtitle,
  onBack,
  onNext,
  onSave,
  onSubmit,
  nextLabel = "Continue",
  showSubmit = false,
  nextDisabled = false,
}: WizardLayoutProps) {
  const { currentStep, totalSteps, completedSteps, draft } = useCampaign();
  const progress = Math.round((completedSteps.size / totalSteps) * 100);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-4 fixed h-full">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-10 h-10 bg-noon-yellow rounded-lg flex items-center justify-center">
            <span className="text-noon-dark font-bold text-lg">n</span>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 flex flex-col gap-2">
          {sidebarItems.map((item) => (
            <button
              key={item.label}
              className={cn(
                "w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors",
                item.active
                  ? "bg-primary-50 text-primary-600"
                  : "text-gray-400 hover:bg-gray-100"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Country selector */}
        <div className="mt-auto">
          <button className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-gray-100 text-sm">
            <span className="text-lg">{draft.country === "AE" ? "🇦🇪" : draft.country === "SA" ? "🇸🇦" : "🇪🇬"}</span>
            <span className="text-gray-600 font-medium">{draft.country}</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-20">
        {/* Top header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <span className="text-sm font-medium text-gray-600">
                {draft.ownerType === "ops_managed" ? "Managed Campaign" : "Self-Serve"}
              </span>
              {draft.campaignType && (
                <span className={cn(
                  "px-2 py-0.5 text-xs font-medium rounded-full",
                  draft.campaignType === "internal" 
                    ? "bg-purple-100 text-purple-700"
                    : "bg-blue-100 text-blue-700"
                )}>
                  {draft.campaignType === "internal" ? "Internal" : "Third-Party"}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <HelpCircle className="w-5 h-5 text-gray-500" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <Bell className="w-5 h-5 text-gray-500" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">O</span>
            </div>
          </div>
        </header>

        {/* Page header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right mr-2">
                <div className="text-sm font-medium text-gray-900">{progress}% Complete</div>
                <div className="text-xs text-gray-500">
                  Step {currentStep + 1} of {totalSteps}
                </div>
              </div>
              <ProgressRing progress={progress} />
            </div>
          </div>
        </div>

        {/* Main wizard content */}
        <main className="p-6 pb-32">
          <div className="max-w-6xl mx-auto animate-slide-in">{children}</div>
        </main>

        {/* Fixed bottom footer */}
        <footer className="fixed bottom-0 left-20 right-0 bg-white border-t border-gray-200 px-6 py-4 z-10">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div>
              {onBack && (
                <Button variant="outline" onClick={onBack}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {onSave && (
                <Button variant="secondary" onClick={onSave}>
                  <Save className="w-4 h-4 mr-1" />
                  Save as Draft
                </Button>
              )}
              {showSubmit && onSubmit ? (
                <Button variant="primary" onClick={onSubmit} disabled={nextDisabled}>
                  <Send className="w-4 h-4 mr-1" />
                  Submit Campaign
                </Button>
              ) : onNext ? (
                <Button variant="primary" onClick={onNext} disabled={nextDisabled}>
                  {nextLabel}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : null}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
