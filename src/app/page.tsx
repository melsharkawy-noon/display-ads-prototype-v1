"use client";

import { useState, useCallback } from "react";
import { SinglePageFlow } from "@/components/SinglePageFlow";
import { CalendarOverview } from "@/components/CalendarOverview";
import { SalesIntakePage } from "@/components/SalesIntakePage";
import { BrandPreviewPage } from "@/components/BrandPreviewPage";
import { useIntake } from "@/context/IntakeContext";
import { useCampaign } from "@/context/CampaignContext";
import { AED_TO_USD_RATE } from "@/lib/types";
import { PlusCircle, Calendar, LayoutGrid, ClipboardList } from "lucide-react";

type Tab = "builder" | "calendar" | "intake";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("builder");
  const [brandPreviewOpen, setBrandPreviewOpen] = useState(false);
  const { intake } = useIntake();
  const { updateDraft, resetDraft } = useCampaign();

  const handleConvertToCampaign = useCallback(() => {
    resetDraft();

    const countryMap: Record<string, string> = { AE: "AE", SA: "SA", EG: "EG" };
    const country = countryMap[intake.campaignCountry] || "AE";

    const netBudget = intake.finalBudget * (1 - intake.discountPercent / 100);
    let budgetUsd = netBudget;
    if (intake.currency === "AED") {
      budgetUsd = netBudget * AED_TO_USD_RATE;
    }

    updateDraft({
      entryType: "brand",
      ownerType: "ops_managed",
      campaignType: intake.advertiserType === "3P" ? "third_party" : "internal",
      pricingModel: "cpm",
      country,
      campaignName: intake.bookingName,
      budget: Math.round(budgetUsd),
      budgetType: "total",
      totalBudget: Math.round(budgetUsd),
    });

    setActiveTab("builder");
  }, [intake, resetDraft, updateDraft]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "builder", label: "Campaign Builder", icon: <PlusCircle className="w-4 h-4" /> },
    { id: "calendar", label: "Calendar Overview", icon: <Calendar className="w-4 h-4" /> },
    { id: "intake", label: "Sales Intake", icon: <ClipboardList className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                <LayoutGrid className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-gray-900">Display Ads</span>
            </div>

            <div className="flex items-center">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-primary-500 text-primary-600 bg-primary-50/50"
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="w-32" />
          </div>
        </div>
      </nav>

      {/* Content */}
      {activeTab === "builder" && <SinglePageFlow />}
      {activeTab === "calendar" && <CalendarOverview />}
      {activeTab === "intake" && (
        <SalesIntakePage
          onConvertToCampaign={handleConvertToCampaign}
          onOpenBrandPreview={() => setBrandPreviewOpen(true)}
        />
      )}

      {/* Brand Preview Overlay */}
      {brandPreviewOpen && <BrandPreviewPage onClose={() => setBrandPreviewOpen(false)} />}
    </div>
  );
}
