"use client";

import { useState, useCallback } from "react";
import { SinglePageFlow } from "@/components/SinglePageFlow";
import { CalendarOverview } from "@/components/CalendarOverview";
import { BookingsListPage } from "@/components/BookingsListPage";
import { BookingDetailPage } from "@/components/BookingDetailPage";
import { BrandPreviewPage } from "@/components/BrandPreviewPage";
import { useIntake } from "@/context/IntakeContext";
import { useCampaign } from "@/context/CampaignContext";
import { BookingCampaign } from "@/lib/types";
import { PlusCircle, Calendar, LayoutGrid, BookOpen } from "lucide-react";

type Tab = "builder" | "calendar" | "bookings";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("builder");
  const [showBookingDetail, setShowBookingDetail] = useState(false);
  const [brandPreviewOpen, setBrandPreviewOpen] = useState(false);
  const [autoExpandBookingId, setAutoExpandBookingId] = useState<string | null>(null);
  const [highlightCampaignId, setHighlightCampaignId] = useState<string | null>(null);
  const { intake, bookings, selectBooking, createBooking, addCampaignToBooking } = useIntake();
  const { draft, updateDraft, resetDraft } = useCampaign();

  const handleOpenBooking = useCallback(
    (id: string) => {
      selectBooking(id);
      setShowBookingDetail(true);
    },
    [selectBooking]
  );

  const handleNewBooking = useCallback(() => {
    createBooking();
    setShowBookingDetail(true);
  }, [createBooking]);

  const handleBackToList = useCallback(() => {
    selectBooking(null);
    setShowBookingDetail(false);
  }, [selectBooking]);

  const handleAddCampaign = useCallback((bookingId?: string) => {
    const target = bookingId
      ? bookings.find((b) => b.id === bookingId) ?? intake
      : intake;
    if (!target.id) return;

    resetDraft();

    const countryMap: Record<string, string> = { AE: "AE", SA: "SA", EG: "EG" };
    const country = countryMap[target.campaignCountry] || "AE";

    updateDraft({
      entryType: "brand",
      ownerType: "ops_managed",
      campaignType: target.advertiserType === "3P" ? "third_party" : "internal",
      pricingModel: "cpm",
      country,
      linkedBookingId: target.id,
      linkedBookingName: target.bookingName,
    });

    setActiveTab("builder");
  }, [intake, bookings, resetDraft, updateDraft]);

  const handleCampaignSubmit = useCallback(() => {
    if (!draft.linkedBookingId) return;

    const campaignId = `C-${Date.now().toString(36).toUpperCase()}`;
    const bookingId = draft.linkedBookingId;

    const newCampaign: BookingCampaign = {
      id: campaignId,
      campaignName: draft.campaignName || `Campaign — ${draft.linkedBookingName}`,
      status: "draft",
      budget: draft.budgetType === "daily" ? draft.dailyBudget : draft.totalBudget,
      pricingModel: draft.pricingModel === "cpt" ? "cpt" : "cpm",
      startDate: draft.startDate,
      endDate: draft.endDate,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      spend: 0,
      createdAt: new Date(),
    };

    addCampaignToBooking(bookingId, newCampaign);

    setAutoExpandBookingId(bookingId);
    setHighlightCampaignId(campaignId);
    setShowBookingDetail(false);
    setActiveTab("bookings");
  }, [draft, addCampaignToBooking]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "builder", label: "Campaign Builder", icon: <PlusCircle className="w-4 h-4" /> },
    { id: "calendar", label: "Calendar Overview", icon: <Calendar className="w-4 h-4" /> },
    { id: "bookings", label: "Bookings", icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
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
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id !== "bookings") {
                      setShowBookingDetail(false);
                    }
                  }}
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

      {activeTab === "builder" && <SinglePageFlow onCampaignSubmit={handleCampaignSubmit} />}
      {activeTab === "calendar" && <CalendarOverview />}
      {activeTab === "bookings" && !showBookingDetail && (
        <BookingsListPage
          onOpenBooking={handleOpenBooking}
          onNewBooking={handleNewBooking}
          onAddCampaign={(bookingId) => {
            handleAddCampaign(bookingId);
          }}
          autoExpandBookingId={autoExpandBookingId}
          highlightCampaignId={highlightCampaignId}
          onClearHighlight={() => {
            setAutoExpandBookingId(null);
            setHighlightCampaignId(null);
          }}
        />
      )}
      {activeTab === "bookings" && showBookingDetail && (
        <BookingDetailPage
          onAddCampaign={() => handleAddCampaign()}
          onOpenBrandPreview={() => setBrandPreviewOpen(true)}
          onBackToList={handleBackToList}
        />
      )}

      {brandPreviewOpen && <BrandPreviewPage onClose={() => setBrandPreviewOpen(false)} />}
    </div>
  );
}
