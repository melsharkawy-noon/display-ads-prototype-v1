"use client";

import { useState, useEffect } from "react";
import { useCampaign } from "@/context/CampaignContext";
import { WizardLayout } from "@/components/layout/WizardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { RadioCard } from "@/components/ui/RadioCard";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { Checkbox } from "@/components/ui/Checkbox";
import { Toggle } from "@/components/ui/Toggle";
import { cn, formatCurrency, formatNumber, getDaysBetween } from "@/lib/utils";
import { slots } from "@/lib/mock-data";

interface StepBiddingProps {
  onBack: () => void;
  onNext: () => void;
}

export function StepBidding({ onBack, onNext }: StepBiddingProps) {
  const { draft, updateDraft, markStepComplete } = useCampaign();

  // Local state for input fields to allow natural typing behavior
  const [bidAmountStr, setBidAmountStr] = useState(draft.bidAmount.toString());
  const [dailyBudgetStr, setDailyBudgetStr] = useState(draft.dailyBudget.toString());
  const [totalBudgetStr, setTotalBudgetStr] = useState(draft.totalBudget.toString());
  const [slotBidsStr, setSlotBidsStr] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    Object.entries(draft.slotBids).forEach(([key, val]) => {
      initial[key] = val.toString();
    });
    return initial;
  });

  // Sync local state when draft changes from external source
  useEffect(() => {
    setBidAmountStr(draft.bidAmount.toString());
  }, [draft.bidAmount]);

  useEffect(() => {
    setDailyBudgetStr(draft.dailyBudget.toString());
  }, [draft.dailyBudget]);

  useEffect(() => {
    setTotalBudgetStr(draft.totalBudget.toString());
  }, [draft.totalBudget]);

  // Helper to update draft only when we have a valid number
  const commitBidAmount = (value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      updateDraft({ bidAmount: num });
    } else if (value === "") {
      updateDraft({ bidAmount: 0 });
    }
  };

  const commitDailyBudget = (value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      updateDraft({ dailyBudget: num });
    } else if (value === "") {
      updateDraft({ dailyBudget: 0 });
    }
  };

  const commitTotalBudget = (value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      updateDraft({ totalBudget: num });
    } else if (value === "") {
      updateDraft({ totalBudget: 0 });
    }
  };

  const commitSlotBid = (slotId: string, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      updateDraft({
        slotBids: { ...draft.slotBids, [slotId]: num },
      });
    } else if (value === "") {
      updateDraft({
        slotBids: { ...draft.slotBids, [slotId]: 0 },
      });
    }
  };
  const isCPD = draft.pricingModel === "cpd";

  const selectedSlots = slots.filter((s) => draft.slotIds.includes(s.id));
  const selectedSlot = selectedSlots[0];
  
  // Get bid for a specific slot
  const getSlotBid = (slotId: string) => {
    if (draft.usePerSlotBidding && draft.slotBids[slotId] !== undefined) {
      return draft.slotBids[slotId];
    }
    return draft.bidAmount;
  };

  // Update bid for a specific slot
  const updateSlotBid = (slotId: string, bid: number) => {
    updateDraft({
      slotBids: {
        ...draft.slotBids,
        [slotId]: bid,
      },
    });
  };

  // Check if all slot bids meet minimums
  const allBidsMeetMinimum = selectedSlots.every((slot) => {
    const bid = getSlotBid(slot.id);
    return bid >= slot.minCpmUsd;
  });

  // For single bid mode: calculate minimum CPM based on selected slots (highest minimum wins)
  const minCpmRequired = selectedSlots.length > 0 
    ? Math.max(...selectedSlots.map((s) => s.minCpmUsd))
    : 10;

  // Get average bid across slots for estimates
  const avgBid = draft.usePerSlotBidding && selectedSlots.length > 0
    ? selectedSlots.reduce((sum, slot) => sum + getSlotBid(slot.id), 0) / selectedSlots.length
    : draft.bidAmount;
  
  const daysSelected = draft.startDate && draft.endDate
    ? getDaysBetween(draft.startDate, draft.endDate)
    : 0;
  const totalCost = selectedSlot ? daysSelected * selectedSlot.cpdRateUsd : 0;

  // Targeting reduction factor (from serving controls)
  const totalRules = draft.segments.reduce((sum, s) => sum + s.rules.length, 0);
  const targetingFactor = totalRules === 0 
    ? 1.0 
    : totalRules <= 2 
    ? 0.6
    : totalRules <= 4
    ? 0.3
    : 0.1;

  // Frequency cap reduction factor
  const frequencyFactor = draft.frequencyCapEnabled 
    ? Math.min(1, draft.maxViews / 5)
    : 1.0;

  // Estimated reach after serving controls
  const reachAfterServingControls = Math.round(draft.estimatedTotalReach * targetingFactor * frequencyFactor);

  // Estimated performance for CPM based on budget (using average bid)
  const estDailyImpressions = avgBid > 0 ? (draft.dailyBudget / avgBid * 1000) : 0;
  const campaignDays = draft.startDate && draft.endDate
    ? getDaysBetween(draft.startDate, draft.endDate)
    : draft.noEndDate ? 30 : 0; // Assume 30 days if no end date for estimate
  const estTotalImpressionsBudget = estDailyImpressions * campaignDays;
  const estTotalSpend = draft.budgetType === "daily"
    ? draft.dailyBudget * campaignDays
    : draft.totalBudget;
  
  // Final estimated impressions (min of budget-based and reach-based)
  const estTotalImpressions = Math.min(estTotalImpressionsBudget, reachAfterServingControls);

  // Validation for single bid mode
  const singleBidBelowMinimum = !draft.usePerSlotBidding && draft.bidAmount < minCpmRequired;
  const hasValidBids = draft.usePerSlotBidding ? allBidsMeetMinimum : !singleBidBelowMinimum;

  const handleNext = () => {
    markStepComplete(7);
    onNext();
  };

  if (isCPD) {
    // CPD: Show booking summary
    return (
      <WizardLayout
        title="Display - Create Campaign (Managed)"
        subtitle="Review your CPD booking cost"
        onBack={onBack}
        onNext={handleNext}
        onSave={() => console.log("Save draft")}
      >
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Booking Summary</h3>

            <div className="max-w-lg space-y-4">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Slot</span>
                <span className="font-medium text-gray-900">{selectedSlot?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Daily Rate</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(selectedSlot?.cpdRateUsd || 0)} USD
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Duration</span>
                <span className="font-medium text-gray-900">
                  {daysSelected} days ({draft.startDate?.toLocaleDateString()} - {draft.endDate?.toLocaleDateString()})
                </span>
              </div>
              <div className="flex justify-between py-4 bg-gray-50 -mx-6 px-6 mt-4">
                <span className="text-lg font-semibold text-gray-900">Total Cost</span>
                <span className="text-2xl font-bold text-primary-600">
                  {formatCurrency(totalCost)} USD
                </span>
              </div>
            </div>

            <Alert variant="info" className="mt-6">
              CPD bookings guarantee 100% share of voice for the selected slot during your booked dates.
            </Alert>

            <div className="mt-6">
              <Checkbox
                checked={true}
                onChange={() => {}}
                label="I confirm this booking and understand it cannot be modified after submission."
              />
            </div>
          </CardContent>
        </Card>
      </WizardLayout>
    );
  }

  // CPM: Show bidding and budget options
  return (
    <WizardLayout
      title="Display - Create Campaign (Managed)"
      subtitle="Set your bid and budget for this CPM campaign"
      onBack={onBack}
      onNext={handleNext}
      onSave={() => console.log("Save draft")}
      nextDisabled={!hasValidBids}
    >
      <div className="space-y-6">
        {/* Bid Amount */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Bid Amount <span className="text-red-500">*</span>
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Set how much you&apos;re willing to pay per 1,000 impressions
                </p>
              </div>
              {selectedSlots.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Per-slot bidding</span>
                  <Toggle
                    checked={draft.usePerSlotBidding}
                    onChange={(checked) => {
                      // Initialize slot bids with current bid amount when enabling
                      if (checked) {
                        const initialBids: Record<string, number> = {};
                        selectedSlots.forEach((slot) => {
                          initialBids[slot.id] = Math.max(draft.bidAmount, slot.minCpmUsd);
                        });
                        updateDraft({ usePerSlotBidding: true, slotBids: initialBids });
                      } else {
                        updateDraft({ usePerSlotBidding: false });
                      }
                    }}
                    label=""
                  />
                </div>
              )}
            </div>

            {!draft.usePerSlotBidding ? (
              /* Single Bid Mode */
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Input
                    type="text"
                    inputMode="decimal"
                    prefix="USD"
                    value={bidAmountStr}
                    onChange={(e) => setBidAmountStr(e.target.value)}
                    onBlur={() => commitBidAmount(bidAmountStr)}
                    error={singleBidBelowMinimum ? `Bid must be at least $${minCpmRequired} CPM` : undefined}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Required minimum: <strong className="text-primary-600">${minCpmRequired}.00 CPM</strong>
                  </p>
                </div>

                {/* Slot Minimum CPM breakdown */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Minimum CPM by Slot</h4>
                  <div className="space-y-2">
                    {selectedSlots.map((slot) => (
                      <div key={slot.id} className="flex justify-between text-sm">
                        <span className="text-gray-600 truncate pr-2">{slot.name}</span>
                        <span className={`font-medium ${slot.minCpmUsd === minCpmRequired ? "text-primary-600" : "text-gray-500"}`}>
                          ${slot.minCpmUsd} CPM
                        </span>
                      </div>
                    ))}
                  </div>
                  {selectedSlots.length > 1 && (
                    <p className="text-xs text-gray-500 mt-2 pt-2 border-t">
                      Your bid must meet the highest minimum across all selected slots.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* Per-Slot Bidding Mode */
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Set individual bids for each slot to optimize competitiveness and budget allocation.
                  </p>
                </div>

                <div className="space-y-3">
                  {selectedSlots.map((slot) => {
                    const slotBid = getSlotBid(slot.id);
                    const bidBelowMin = slotBid < slot.minCpmUsd;
                    const avgCompetitorBid = Math.round(slot.minCpmUsd * 1.2);
                    const competitiveness = slotBid >= avgCompetitorBid ? "high" : slotBid >= slot.minCpmUsd * 1.1 ? "medium" : "low";
                    
                    return (
                      <div 
                        key={slot.id} 
                        className={cn(
                          "p-4 rounded-lg border-2 transition-colors",
                          bidBelowMin 
                            ? "border-red-200 bg-red-50" 
                            : competitiveness === "high"
                            ? "border-green-200 bg-green-50"
                            : competitiveness === "medium"
                            ? "border-amber-200 bg-amber-50"
                            : "border-gray-200 bg-gray-50"
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900">{slot.name}</h4>
                              <span className={cn(
                                "px-2 py-0.5 rounded text-xs font-medium",
                                bidBelowMin
                                  ? "bg-red-100 text-red-700"
                                  : competitiveness === "high"
                                  ? "bg-green-100 text-green-700"
                                  : competitiveness === "medium"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-gray-100 text-gray-600"
                              )}>
                                {bidBelowMin 
                                  ? "Below minimum" 
                                  : competitiveness === "high" 
                                  ? "Highly competitive" 
                                  : competitiveness === "medium"
                                  ? "Competitive"
                                  : "Low competitiveness"}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Min: ${slot.minCpmUsd} CPM</span>
                              <span>•</span>
                              <span>Avg competitor: ${avgCompetitorBid} CPM</span>
                              <span>•</span>
                              <span>~{formatNumber(slot.avgDailyViews)}/day</span>
                            </div>
                          </div>
                          <div className="w-32">
                            <Input
                              type="text"
                              inputMode="decimal"
                              prefix="$"
                              value={slotBidsStr[slot.id] ?? slotBid.toString()}
                              onChange={(e) => setSlotBidsStr({ ...slotBidsStr, [slot.id]: e.target.value })}
                              onBlur={() => commitSlotBid(slot.id, slotBidsStr[slot.id] ?? slotBid.toString())}
                              error={bidBelowMin ? `Min $${slot.minCpmUsd}` : undefined}
                            />
                          </div>
                        </div>
                        
                        {/* Competitiveness indicator bar */}
                        {!bidBelowMin && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500">Estimated impression share</span>
                              <span className="font-medium text-gray-700">
                                {Math.min(85, Math.max(15, 50 + (slotBid - avgCompetitorBid) * 3)).toFixed(0)}%
                              </span>
                            </div>
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full rounded-full",
                                  competitiveness === "high" ? "bg-green-500" : competitiveness === "medium" ? "bg-amber-500" : "bg-gray-400"
                                )}
                                style={{ width: `${Math.min(85, Math.max(15, 50 + (slotBid - avgCompetitorBid) * 3))}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Summary */}
                <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                  <span className="text-sm text-gray-600">Average bid across slots</span>
                  <span className="font-semibold text-gray-900">${avgBid.toFixed(2)} CPM</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Budget Type */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Budget Type <span className="text-red-500">*</span>
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Choose how to allocate your budget
            </p>

            <div className="space-y-4">
              <RadioCard
                selected={draft.budgetType === "daily"}
                onClick={() => updateDraft({ budgetType: "daily" })}
                title="Daily Budget"
                description="Spend up to this amount per day"
              >
                {draft.budgetType === "daily" && (
                  <div className="max-w-xs mt-3">
                    <Input
                      type="text"
                      inputMode="decimal"
                      prefix="USD"
                      value={dailyBudgetStr}
                      onChange={(e) => setDailyBudgetStr(e.target.value)}
                      onBlur={() => commitDailyBudget(dailyBudgetStr)}
                      helper="Minimum: $50 USD"
                    />
                  </div>
                )}
              </RadioCard>

              <RadioCard
                selected={draft.budgetType === "total"}
                onClick={() => updateDraft({ budgetType: "total" })}
                title="Total Budget"
                description="Set a fixed total spend for the campaign"
              >
                {draft.budgetType === "total" && (
                  <div className="space-y-3 mt-3">
                    <div className="max-w-xs">
                      <Input
                        type="text"
                        inputMode="decimal"
                        prefix="USD"
                        value={totalBudgetStr}
                        onChange={(e) => setTotalBudgetStr(e.target.value)}
                        onBlur={() => commitTotalBudget(totalBudgetStr)}
                        helper="Minimum: $100 USD"
                      />
                    </div>
                    <div className="max-w-xs">
                      <Select
                        label="Pacing"
                        options={[
                          { value: "even", label: "Even (Spread evenly across campaign)" },
                          { value: "asap", label: "ASAP (Spend as fast as possible)" },
                        ]}
                        value={draft.pacing}
                        onChange={(e) => updateDraft({ pacing: e.target.value as "even" | "asap" })}
                      />
                    </div>
                  </div>
                )}
              </RadioCard>
            </div>
          </CardContent>
        </Card>

        {/* Reach Funnel */}
        {hasValidBids && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reach & Performance Estimate</h3>

              <div className="space-y-4">
                {/* Funnel visualization */}
                <div className="space-y-3">
                  {/* Total reach from slots */}
                  <div className="flex items-center gap-4">
                    <div className="w-full bg-gray-100 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total available impressions</span>
                        <span className="font-semibold text-gray-900">{formatNumber(draft.estimatedTotalReach)}</span>
                      </div>
                      <div className="h-2 bg-gray-300 rounded-full mt-2" />
                    </div>
                  </div>

                  {/* After serving controls */}
                  <div className="flex items-center gap-4 pl-4">
                    <div className="w-full bg-blue-50 rounded-lg p-3 border-l-4 border-blue-400">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-sm text-blue-700">After targeting & frequency cap</span>
                          {(targetingFactor < 1 || frequencyFactor < 1) && (
                            <span className="ml-2 text-xs text-blue-500">
                              ({targetingFactor < 1 && `targeting: -${Math.round((1-targetingFactor)*100)}%`}
                              {targetingFactor < 1 && frequencyFactor < 1 && ", "}
                              {frequencyFactor < 1 && `freq cap: -${Math.round((1-frequencyFactor)*100)}%`})
                            </span>
                          )}
                        </div>
                        <span className="font-semibold text-blue-900">{formatNumber(reachAfterServingControls)}</span>
                      </div>
                      <div className="h-2 bg-blue-200 rounded-full mt-2">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${(reachAfterServingControls / draft.estimatedTotalReach) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Budget-constrained estimate */}
                  {draft.bidAmount > 0 && (
                    <div className="flex items-center gap-4 pl-8">
                      <div className="w-full bg-primary-50 rounded-lg p-3 border-l-4 border-primary-500">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-sm text-primary-700">With your budget</span>
                            <span className="ml-2 text-xs text-primary-500">
                              (${draft.budgetType === "daily" ? draft.dailyBudget : draft.totalBudget} {draft.budgetType})
                            </span>
                          </div>
                          <span className="font-bold text-primary-900">{formatNumber(estTotalImpressions)}</span>
                        </div>
                        <div className="h-2 bg-primary-200 rounded-full mt-2">
                          <div 
                            className="h-full bg-primary-500 rounded-full" 
                            style={{ width: `${Math.min(100, (estTotalImpressions / reachAfterServingControls) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Summary stats */}
                {draft.bidAmount > 0 && (
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        ~{formatNumber(estDailyImpressions)}
                      </div>
                      <div className="text-sm text-gray-500">daily impressions</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary-600">
                        ~{formatNumber(estTotalImpressions)}
                      </div>
                      <div className="text-sm text-gray-500">total impressions ({campaignDays} days)</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(estTotalSpend)}
                      </div>
                      <div className="text-sm text-gray-500">est. total spend</div>
                    </div>
                  </div>
                )}

                {/* Warning if budget exceeds available reach */}
                {estTotalImpressionsBudget > reachAfterServingControls && draft.bidAmount > 0 && (
                  <Alert variant="info">
                    Your budget can deliver more impressions than available. Consider reducing your budget or expanding your targeting.
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Slot Availability Indicator for CPM - Only show in single bid mode */}
        {hasValidBids && !draft.usePerSlotBidding && draft.slotIds.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Slot Traffic & Competitiveness</h3>

              <div className="space-y-4">
                {selectedSlots.map((slot) => {
                  const slotBid = getSlotBid(slot.id);
                  // Average competitor bid is typically 20% above minimum
                  const avgCompetitorBid = Math.round(slot.minCpmUsd * 1.2);
                  const competitiveness = slotBid >= avgCompetitorBid ? "high" : slotBid >= slot.minCpmUsd * 1.1 ? "medium" : "low";
                  const estimatedShare = slotBid >= avgCompetitorBid 
                    ? Math.min(85, 50 + (slotBid - avgCompetitorBid) * 3)
                    : Math.max(15, 50 - (avgCompetitorBid - slotBid) * 2);
                  
                  return (
                    <div key={slot.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{slot.name}</h4>
                          <p className="text-sm text-gray-500">
                            ~{formatNumber(slot.avgDailyViews)} daily available impressions
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          competitiveness === "high" 
                            ? "bg-green-100 text-green-700" 
                            : competitiveness === "medium"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {competitiveness === "high" ? "Highly Competitive" : competitiveness === "medium" ? "Competitive" : "Low Competitiveness"}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Estimated impression share</span>
                            <span className="font-medium text-gray-900">{estimatedShare.toFixed(0)}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                competitiveness === "high" 
                                  ? "bg-green-500" 
                                  : competitiveness === "medium"
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${estimatedShare}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Your bid: <strong>${slotBid}</strong> CPM</span>
                          <span className="text-gray-600">Avg competitor: <strong>${avgCompetitorBid}</strong> CPM</span>
                        </div>

                        {competitiveness === "low" && (
                          <Alert variant="warning" className="mt-2">
                            Your bid is below the average. Consider increasing to ${avgCompetitorBid}+ CPM for better reach.
                          </Alert>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </WizardLayout>
  );
}
