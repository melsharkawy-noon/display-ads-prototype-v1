"use client";

import { useState } from "react";
import { useCampaign } from "@/context/CampaignContext";
import { WizardLayout } from "@/components/layout/WizardLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Alert } from "@/components/ui/Alert";
import { formatCurrency, formatNumber, formatDate, getDaysBetween } from "@/lib/utils";
import { slots, countries, brands, categories, partners } from "@/lib/mock-data";
import {
  CheckCircle,
  Calendar,
  Target,
  Image,
  DollarSign,
  Users,
  Link,
  Edit,
} from "lucide-react";

interface StepReviewProps {
  onBack: () => void;
}

export function StepReview({ onBack }: StepReviewProps) {
  const { draft, markStepComplete } = useCampaign();
  const [submitted, setSubmitted] = useState(false);

  const selectedSlot = slots.find((s) => s.id === draft.slotIds[0]);
  const selectedSlots = slots.filter((s) => draft.slotIds.includes(s.id));
  const country = countries.find((c) => c.code === draft.country);
  const isCPD = draft.pricingModel === "cpd";
  const isInternal = draft.campaignType === "internal";

  const daysSelected =
    draft.startDate && draft.endDate
      ? getDaysBetween(draft.startDate, draft.endDate)
      : 0;
  const totalCost = isCPD ? (selectedSlot?.cpdRateUsd || 0) * daysSelected : 0;

  const handleSubmit = () => {
    markStepComplete(10);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <WizardLayout
        title="Campaign Submitted"
        subtitle="Your campaign has been submitted for review"
        onBack={undefined}
      >
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Campaign Submitted Successfully!
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Your campaign &quot;{draft.campaignName}&quot; has been submitted for quality check.
            You&apos;ll receive a notification once it&apos;s approved.
          </p>
          <div className="inline-block bg-gray-100 rounded-lg px-6 py-3">
            <span className="text-sm text-gray-500">Campaign ID:</span>
            <span className="ml-2 font-mono font-medium text-gray-900">
              CAMP-{Date.now().toString(36).toUpperCase()}
            </span>
          </div>
        </div>
      </WizardLayout>
    );
  }

  return (
    <WizardLayout
      title="Display - Create Campaign (Managed)"
      subtitle="Please review your campaign before submitting"
      onBack={onBack}
      showSubmit
      onSubmit={handleSubmit}
    >
      <div className="space-y-6">
        <Alert variant="info">
          Review all details carefully. Some fields cannot be changed after submission.
        </Alert>

        {/* Campaign Summary */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <h3 className="font-semibold text-gray-900">Campaign Summary</h3>
            <button className="text-primary-600 text-sm flex items-center gap-1 hover:underline">
              <Edit className="w-4 h-4" />
              Edit
            </button>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <span className="text-sm text-gray-500">Campaign Name</span>
                <p className="font-medium text-gray-900">{draft.campaignName || "—"}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Type</span>
                <p className="font-medium text-gray-900">
                  {isInternal ? "Internal" : "Third-Party"} | {isCPD ? "CPD" : "CPM"}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Country</span>
                <p className="font-medium text-gray-900">{country?.flag} {country?.name}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Est. Total Reach</span>
                <p className="font-medium text-gray-900">{formatNumber(draft.estimatedTotalReach)} impressions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule & Inventory */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Schedule & Inventory</h3>
            </div>
            <button className="text-primary-600 text-sm flex items-center gap-1 hover:underline">
              <Edit className="w-4 h-4" />
              Edit
            </button>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <span className="text-sm text-gray-500">Dates</span>
                <p className="font-medium text-gray-900">
                  {draft.startDate ? formatDate(draft.startDate) : "—"} -{" "}
                  {draft.noEndDate
                    ? "No end date"
                    : draft.endDate
                    ? formatDate(draft.endDate)
                    : "—"}
                  {daysSelected > 0 && ` (${daysSelected} days)`}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Slots</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedSlots.map((slot) => (
                    <Chip key={slot.id} variant="default" size="sm">
                      {slot.name}
                    </Chip>
                  ))}
                </div>
              </div>
              {!isCPD && (
                <div>
                  <span className="text-sm text-gray-500">Est. Impressions</span>
                  <p className="font-medium text-gray-900">
                    ~{formatNumber(selectedSlots.reduce((sum, s) => sum + s.avgDailyViews, 0) * daysSelected)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bidding & Budget */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Bidding & Budget</h3>
            </div>
            <button className="text-primary-600 text-sm flex items-center gap-1 hover:underline">
              <Edit className="w-4 h-4" />
              Edit
            </button>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {isCPD ? (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Daily Rate</span>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(selectedSlot?.cpdRateUsd || 0)}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Duration</span>
                  <p className="font-medium text-gray-900">{daysSelected} days</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Total Cost</span>
                  <p className="font-semibold text-primary-600 text-lg">
                    {formatCurrency(totalCost)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">
                      {draft.usePerSlotBidding ? "Bidding Mode" : "Bid"}
                    </span>
                    <p className="font-medium text-gray-900">
                      {draft.usePerSlotBidding ? "Per-slot bidding" : `${formatCurrency(draft.bidAmount)} CPM`}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">
                      {draft.budgetType === "daily" ? "Daily Budget" : "Total Budget"}
                    </span>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(draft.budgetType === "daily" ? draft.dailyBudget : draft.totalBudget)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Est. Total</span>
                    <p className="font-semibold text-primary-600 text-lg">
                      {formatCurrency(
                        draft.budgetType === "daily" ? draft.dailyBudget * daysSelected : draft.totalBudget
                      )}
                    </p>
                  </div>
                </div>
                {draft.usePerSlotBidding && Object.keys(draft.slotBids).length > 0 && (
                  <div className="pt-3 border-t">
                    <span className="text-sm text-gray-500 block mb-2">Per-slot bids</span>
                    <div className="space-y-1">
                      {selectedSlots.map((slot) => (
                        <div key={slot.id} className="flex justify-between text-sm">
                          <span className="text-gray-600">{slot.name}</span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(draft.slotBids[slot.id] || draft.bidAmount)} CPM
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Landing Page */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Link className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Landing Page</h3>
            </div>
            <button className="text-primary-600 text-sm flex items-center gap-1 hover:underline">
              <Edit className="w-4 h-4" />
              Edit
            </button>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div>
              <span className="text-sm text-gray-500">Mode</span>
              <p className="font-medium text-gray-900">
                {draft.landingPageMode === "builder" ? "Internal Builder" : "Direct URL"}
              </p>
            </div>
            {draft.landingPageUrl && (
              <div className="mt-3">
                <span className="text-sm text-gray-500">URL</span>
                <p className="font-medium text-gray-900 truncate">{draft.landingPageUrl}</p>
              </div>
            )}
            {draft.landingPageMode === "builder" && (
              <div className="mt-3 flex gap-4">
                <div>
                  <span className="text-sm text-gray-500">Brands</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {draft.builderConfig.brands.map((brandId) => {
                      const brand = brands.find((b) => b.id === brandId);
                      return (
                        <Chip key={brandId} variant="brand" size="sm">
                          {brand?.name}
                        </Chip>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Categories</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {draft.builderConfig.categories.map((catId) => {
                      const cat = categories.find((c) => c.id === catId);
                      return (
                        <Chip key={catId} variant="category" size="sm">
                          {cat?.name}
                        </Chip>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Creatives */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Image className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Creatives</h3>
            </div>
            <button className="text-primary-600 text-sm flex items-center gap-1 hover:underline">
              <Edit className="w-4 h-4" />
              Edit
            </button>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="flex flex-wrap gap-3">
              {draft.creatives.length > 0 ? (
                draft.creatives.map((creative) => (
                  <div
                    key={creative.id}
                    className="w-24 h-16 bg-gray-100 rounded-lg overflow-hidden relative"
                  >
                    <img
                      src={creative.assetUrl || ""}
                      alt={creative.fileName || ""}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 left-1 px-1 py-0.5 bg-black/50 text-white text-[10px] rounded">
                      {creative.platform === "mobile" ? "📱" : "🖥️"} {creative.language.toUpperCase()}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-gray-500">No creatives uploaded</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Targeting */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Targeting</h3>
            </div>
            <button className="text-primary-600 text-sm flex items-center gap-1 hover:underline">
              <Edit className="w-4 h-4" />
              Edit
            </button>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {draft.segments.length > 0 ? (
              <div className="space-y-2">
                {draft.segments.map((segment, idx) => (
                  <div key={segment.id} className="text-sm">
                    <span className="font-medium">Segment {idx + 1}:</span>{" "}
                    {segment.rules.length} rule{segment.rules.length !== 1 ? "s" : ""} ({segment.operator})
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-gray-500">No targeting configured (broad reach)</span>
            )}
            {draft.frequencyCapEnabled && (
              <div className="mt-3 text-sm text-gray-600">
                Frequency Cap: {draft.maxViews} views / {draft.frequencyPeriod}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attribution (Internal only) */}
        {isInternal && (
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-400" />
                <h3 className="font-semibold text-gray-900">Attribution (Internal)</h3>
              </div>
              <button className="text-primary-600 text-sm flex items-center gap-1 hover:underline">
                <Edit className="w-4 h-4" />
                Edit
              </button>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Partners</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {draft.partnerIds.map((partnerId) => {
                      const partner = partners.find((p) => p.id === partnerId);
                      return (
                        <Chip key={partnerId} variant="default" size="sm">
                          {partner?.name || partnerId}
                        </Chip>
                      );
                    })}
                    {draft.partnerIds.length === 0 && (
                      <span className="text-gray-500">None selected</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Brands</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(draft.attributionBrands.length > 0
                      ? draft.attributionBrands
                      : draft.builderConfig.brands
                    ).map((brandId) => {
                      const brand = brands.find((b) => b.id === brandId);
                      return (
                        <Chip key={brandId} variant="brand" size="sm">
                          {brand?.name}
                        </Chip>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Categories</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(draft.attributionCategories.length > 0
                      ? draft.attributionCategories
                      : draft.builderConfig.categories
                    ).map((catId) => {
                      const cat = categories.find((c) => c.id === catId);
                      return (
                        <Chip key={catId} variant="category" size="sm">
                          {cat?.name}
                        </Chip>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </WizardLayout>
  );
}
