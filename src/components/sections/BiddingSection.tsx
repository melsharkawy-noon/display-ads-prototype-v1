"use client";

import { memo, useMemo, useState, useEffect } from "react";
import { useCampaign } from "@/context/CampaignContext";
import { Card, CardContent } from "@/components/ui/Card";
import { cn, formatNumber } from "@/lib/utils";
import {
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Info,
  Users,
  BarChart3,
  Eye,
  DollarSign,
} from "lucide-react";

interface BiddingSectionProps {
  sectionRef: (el: HTMLElement | null) => void;
  slotMultiplier: string;
  slotGroupMultipliers: Record<string, string>;
  slotTargetingMode: "all" | "include" | "exclude";
  estimatedReach: number;
}

const BASE_DAILY_INVENTORY = 15_000_000;

function estimateAvailableViews(
  audienceCount: number,
  hasCompound: boolean,
  slotMode: "all" | "include" | "exclude",
  slotCount: number
): number {
  let available = BASE_DAILY_INVENTORY;
  if (audienceCount > 0) {
    const audienceMultiplier = Math.max(0.02, 1 - audienceCount * 0.18);
    available *= audienceMultiplier;
  }
  if (hasCompound) available *= 0.6;
  if (slotMode === "include" && slotCount > 0) {
    available *= Math.min(1, slotCount * 0.12);
  } else if (slotMode === "exclude" && slotCount > 0) {
    available *= Math.max(0.3, 1 - slotCount * 0.04);
  }
  return Math.round(available);
}

function getRecommendedBid(audienceCount: number, hasCompound: boolean): number {
  let base = 3.5;
  if (audienceCount >= 4) base = 6.5;
  else if (audienceCount >= 2) base = 5.0;
  else if (audienceCount >= 1) base = 4.0;
  if (hasCompound) base += 1.0;
  return Math.round(base * 100) / 100;
}

const BiddingSection = memo(function BiddingSection({
  sectionRef,
  slotMultiplier,
  slotGroupMultipliers,
  slotTargetingMode,
  estimatedReach,
}: BiddingSectionProps) {
  const { draft, updateDraft } = useCampaign();

  const isSeller = draft.entryType === "seller";

  // Local input state kept in sync with draft
  const [localBudget, setLocalBudget] = useState(draft.budget.toString());
  const [localBid, setLocalBid] = useState(draft.bidAmount.toString());

  useEffect(() => { setLocalBudget(draft.budget.toString()); }, [draft.budget]);
  useEffect(() => { setLocalBid(draft.bidAmount.toString()); }, [draft.bidAmount]);

  const audienceCount = draft.audienceSegments.length;
  const hasCompound = draft.audienceSegments.some((s) => s.conditions && s.conditions.length > 1);
  const slotCount = slotTargetingMode === "include" ? draft.slotIds.length : draft.excludedSlotIds.length;

  const forecast = useMemo(() => {
    const bid = parseFloat(localBid) || draft.bidAmount || 5;
    const budget = parseFloat(localBudget) || draft.budget || 0;
    const expectedViews = bid > 0 ? Math.round((budget / bid) * 1000) : 0;
    const availableViews = estimateAvailableViews(audienceCount, hasCompound, slotTargetingMode, slotCount);
    const recommended = getRecommendedBid(audienceCount, hasCompound);

    let feasibility: "comfortable" | "tight" | "insufficient";
    if (availableViews >= expectedViews * 1.3) feasibility = "comfortable";
    else if (availableViews >= expectedViews * 0.9) feasibility = "tight";
    else feasibility = "insufficient";

    const bidAlignment = bid >= recommended * 0.85 ? "aligned" : "below";

    const targetingLevel =
      audienceCount === 0
        ? "Broad"
        : audienceCount <= 2
        ? "Moderate"
        : audienceCount <= 4
        ? "Narrow"
        : "Very Niche";

    return { bid, budget, expectedViews, availableViews, recommended, feasibility, bidAlignment, targetingLevel };
  }, [localBid, localBudget, draft.bidAmount, draft.budget, audienceCount, hasCompound, slotTargetingMode, slotCount]);

  const commitBudget = () => {
    const num = parseFloat(localBudget);
    if (!isNaN(num) && num >= 100) {
      updateDraft({
        budget: num,
        dailyBudget: draft.budgetType === "daily" ? num : draft.dailyBudget,
        totalBudget: draft.budgetType === "total" ? num : draft.totalBudget,
      });
    } else if (!isNaN(num) && num > 0 && num < 100) {
      setLocalBudget("100");
      updateDraft({
        budget: 100,
        dailyBudget: draft.budgetType === "daily" ? 100 : draft.dailyBudget,
        totalBudget: draft.budgetType === "total" ? 100 : draft.totalBudget,
      });
    }
  };

  const commitBid = () => {
    const num = parseFloat(localBid);
    if (!isNaN(num) && num > 0) updateDraft({ bidAmount: num });
    else setLocalBid(draft.bidAmount.toString());
  };

  if (isSeller) return null;

  return (
    <section ref={sectionRef} id="bidding" className="scroll-mt-36">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Delivery Forecast</h2>
          <p className="text-sm text-gray-500 mb-5">
            Adjust budget and bid to find the right delivery target for this campaign
          </p>

          {/* Interactive Controls */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 mb-6">
            <div className="grid grid-cols-12 gap-4 items-end">
              {/* Budget Input */}
              <div className="col-span-5">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Campaign Budget
                  <span className="text-[10px] text-gray-400 font-normal ml-1">
                    ({draft.budgetType === "daily" ? "per day" : "total"})
                  </span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    inputMode="decimal"
                    value={localBudget}
                    onChange={(e) => setLocalBudget(e.target.value)}
                    onBlur={commitBudget}
                    onKeyDown={(e) => e.key === "Enter" && commitBudget()}
                    className={cn(
                      "w-full pl-8 pr-3 py-2.5 border rounded-lg text-lg font-semibold focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white",
                      parseFloat(localBudget) > 0 && parseFloat(localBudget) < 100 ? "border-red-300" : "border-gray-300"
                    )}
                    placeholder="1,000"
                  />
                </div>
                {parseFloat(localBudget) > 0 && parseFloat(localBudget) < 100 && (
                  <p className="text-[10px] text-red-500 mt-1">Minimum budget is $100</p>
                )}
              </div>

              {/* CPM Bid Input */}
              <div className="col-span-4">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  CPM Bid
                  <span className="text-[10px] text-gray-400 font-normal ml-1">per 1,000 views</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    inputMode="decimal"
                    value={localBid}
                    onChange={(e) => setLocalBid(e.target.value)}
                    onBlur={commitBid}
                    onKeyDown={(e) => e.key === "Enter" && commitBid()}
                    className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                    placeholder="5.00"
                  />
                </div>
                {forecast.bidAlignment === "below" && (
                  <p className="text-[10px] text-amber-600 mt-1">
                    Rec: ${forecast.recommended.toFixed(2)}
                  </p>
                )}
              </div>

              {/* Live Expected Views */}
              <div className="col-span-3">
                <div className="p-2.5 bg-primary-50 rounded-lg text-center border border-primary-200">
                  <div className="text-xs text-primary-600 font-medium mb-0.5">Expected Views</div>
                  <div className="text-xl font-bold text-primary-700">{formatNumber(forecast.expectedViews)}</div>
                  <div className="text-[10px] text-primary-500">(Budget &divide; Bid) &times; 1K</div>
                </div>
              </div>
            </div>
          </div>

          {/* Forecast Cards Grid */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-primary-50 rounded-lg text-center">
              <Eye className="w-5 h-5 text-primary-500 mx-auto mb-1.5" />
              <div className="text-2xl font-bold text-primary-700">{formatNumber(forecast.expectedViews)}</div>
              <p className="text-xs text-primary-600 mt-0.5">Expected Views</p>
              <p className="text-[10px] text-gray-400">from budget &amp; bid</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <BarChart3 className="w-5 h-5 text-gray-400 mx-auto mb-1.5" />
              <div className="text-2xl font-bold text-gray-900">~{formatNumber(forecast.availableViews)}</div>
              <p className="text-xs text-gray-600 mt-0.5">Available Views</p>
              <p className="text-[10px] text-gray-400">estimated inventory for targeting</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <Users className="w-5 h-5 text-gray-400 mx-auto mb-1.5" />
              <div className="text-lg font-bold text-gray-900">{forecast.targetingLevel}</div>
              <p className="text-xs text-gray-600 mt-0.5">Targeting Level</p>
              <p className="text-[10px] text-gray-400">{audienceCount} segment{audienceCount !== 1 ? "s" : ""}</p>
            </div>
            <div className={cn(
              "p-4 rounded-lg text-center",
              forecast.feasibility === "comfortable" && "bg-green-50",
              forecast.feasibility === "tight" && "bg-amber-50",
              forecast.feasibility === "insufficient" && "bg-red-50"
            )}>
              {forecast.feasibility === "comfortable" && <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1.5" />}
              {forecast.feasibility === "tight" && <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto mb-1.5" />}
              {forecast.feasibility === "insufficient" && <AlertTriangle className="w-5 h-5 text-red-500 mx-auto mb-1.5" />}
              <div className={cn(
                "text-lg font-bold",
                forecast.feasibility === "comfortable" && "text-green-700",
                forecast.feasibility === "tight" && "text-amber-700",
                forecast.feasibility === "insufficient" && "text-red-700"
              )}>
                {forecast.feasibility === "comfortable" ? "Feasible" : forecast.feasibility === "tight" ? "Tight" : "Limited"}
              </div>
              <p className={cn(
                "text-xs mt-0.5",
                forecast.feasibility === "comfortable" && "text-green-600",
                forecast.feasibility === "tight" && "text-amber-600",
                forecast.feasibility === "insufficient" && "text-red-600"
              )}>Delivery Outlook</p>
            </div>
          </div>

          {/* Delivery Feasibility Message */}
          <div className={cn(
            "p-4 rounded-lg border mb-6",
            forecast.feasibility === "comfortable" && "bg-green-50 border-green-200",
            forecast.feasibility === "tight" && "bg-amber-50 border-amber-200",
            forecast.feasibility === "insufficient" && "bg-red-50 border-red-200"
          )}>
            <div className="flex items-start gap-3">
              {forecast.feasibility === "comfortable" && <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />}
              {forecast.feasibility === "tight" && <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />}
              {forecast.feasibility === "insufficient" && <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
              <div>
                <p className={cn(
                  "text-sm font-medium",
                  forecast.feasibility === "comfortable" && "text-green-800",
                  forecast.feasibility === "tight" && "text-amber-800",
                  forecast.feasibility === "insufficient" && "text-red-800"
                )}>
                  {forecast.feasibility === "comfortable" && "Inventory comfortably supports this campaign."}
                  {forecast.feasibility === "tight" && "Inventory is tight for this targeting."}
                  {forecast.feasibility === "insufficient" && "Targeting limits available inventory."}
                </p>
                <p className={cn(
                  "text-xs mt-1",
                  forecast.feasibility === "comfortable" && "text-green-600",
                  forecast.feasibility === "tight" && "text-amber-600",
                  forecast.feasibility === "insufficient" && "text-red-600"
                )}>
                  {forecast.feasibility === "comfortable" && `Available inventory (~${formatNumber(forecast.availableViews)}) is well above your expected delivery (${formatNumber(forecast.expectedViews)}).`}
                  {forecast.feasibility === "tight" && `Available inventory (~${formatNumber(forecast.availableViews)}) is close to your expected delivery (${formatNumber(forecast.expectedViews)}). Consider broadening targeting if full delivery is critical.`}
                  {forecast.feasibility === "insufficient" && `Available inventory (~${formatNumber(forecast.availableViews)}) is below your expected delivery (${formatNumber(forecast.expectedViews)}). Reduce targeting constraints, increase bid, or lower expected delivery.`}
                </p>
              </div>
            </div>
          </div>

          {/* Recommended Bid — inventory-access framing */}
          <div className="p-4 bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg border border-primary-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary-500" />
                <span className="text-sm font-medium text-gray-900">Recommended CPM Bid</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-lg font-bold text-primary-700">${forecast.recommended.toFixed(2)}</div>
                  <span className="text-[10px] text-gray-400">for this targeting</span>
                </div>
                {forecast.bidAlignment === "below" && (
                  <button
                    onClick={() => {
                      const rec = forecast.recommended;
                      setLocalBid(rec.toFixed(2));
                      updateDraft({ bidAmount: rec });
                    }}
                    className="px-3 py-1.5 text-xs font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors whitespace-nowrap"
                  >
                    Apply ${forecast.recommended.toFixed(2)}
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
              <p className={cn(
                "text-xs",
                forecast.bidAlignment === "aligned" ? "text-green-700" : "text-amber-700"
              )}>
                {forecast.bidAlignment === "aligned"
                  ? "Your current bid provides good access to available inventory for this targeting."
                  : `Your current bid ($${forecast.bid.toFixed(2)}) may limit available inventory for this targeting. Increasing bid improves delivery likelihood.`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
});

export default BiddingSection;
