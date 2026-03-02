"use client";

import { memo, useMemo } from "react";
import { useCampaign } from "@/context/CampaignContext";
import { Card, CardContent } from "@/components/ui/Card";
import { cn, formatNumber, formatCurrency } from "@/lib/utils";
import {
  Target,
  BarChart3,
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Info,
  Layers,
  Users,
} from "lucide-react";
import { countries } from "@/lib/mock-data";

interface BiddingSectionProps {
  sectionRef: (el: HTMLElement | null) => void;
  slotMultiplier: string;
  slotGroupMultipliers: Record<string, string>;
  slotTargetingMode: "all" | "include" | "exclude";
  estimatedReach: number;
}

const BiddingSection = memo(function BiddingSection({
  sectionRef,
  slotMultiplier,
  slotGroupMultipliers,
  slotTargetingMode,
  estimatedReach,
}: BiddingSectionProps) {
  const { draft } = useCampaign();

  const isSeller = draft.entryType === "seller";

  // --- Seller-specific currency logic ---
  const selectedCountry = useMemo(
    () => countries.find((c) => c.code === draft.country),
    [draft.country]
  );
  const currency = isSeller ? selectedCountry?.currency || "AED" : "USD";

  // --- Bid metrics ---
  const metrics = useMemo(() => {
    const targetBids = draft.audienceSegments.map((s) => s.bid);
    const avgBid =
      targetBids.length > 0
        ? targetBids.reduce((a, b) => a + b, 0) / targetBids.length
        : 0;
    const minBid = targetBids.length > 0 ? Math.min(...targetBids) : 0;
    const maxBid = targetBids.length > 0 ? Math.max(...targetBids) : 0;
    // For include mode, compute average of group multipliers; for exclude, use single multiplier
    const slotMultiplierValue = (() => {
      if (!isSeller && slotTargetingMode === "include" && Object.keys(slotGroupMultipliers).length > 0) {
        const vals = Object.values(slotGroupMultipliers).map(v => parseFloat(v) || 0);
        return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      }
      return parseFloat(slotMultiplier) || 0;
    })();
    const effectiveAvgBid = isSeller
      ? avgBid
      : avgBid * (1 + slotMultiplierValue / 100);

    // Thresholds differ per flow
    let lowThreshold: number;
    let highThreshold: number;
    if (isSeller) {
      lowThreshold = currency === "EGP" ? 90 : 11;
      highThreshold = currency === "EGP" ? 180 : 22;
    } else {
      lowThreshold = 3;
      highThreshold = 6;
    }

    const competitivenessLevel =
      effectiveAvgBid < lowThreshold
        ? "low"
        : effectiveAvgBid < highThreshold
        ? "medium"
        : "high";
    const winRate =
      effectiveAvgBid < lowThreshold
        ? 30
        : effectiveAvgBid < highThreshold
        ? 60
        : 85;
    const estimatedViews = Math.round(
      Math.min(estimatedReach, (draft.budget / (effectiveAvgBid || 1)) * 1000) *
        (winRate / 100)
    );
    const budgetUtilization =
      effectiveAvgBid > 0
        ? Math.min(
            100,
            Math.round(
              ((estimatedViews * effectiveAvgBid) / 1000 / draft.budget) * 100
            )
          )
        : 0;

    return {
      targetBids,
      avgBid,
      minBid,
      maxBid,
      slotMultiplierValue,
      effectiveAvgBid,
      competitivenessLevel,
      winRate,
      estimatedViews,
      budgetUtilization,
    };
  }, [
    draft.audienceSegments,
    draft.budget,
    slotMultiplier,
    slotGroupMultipliers,
    slotTargetingMode,
    estimatedReach,
    isSeller,
    currency,
  ]);

  const {
    avgBid,
    minBid,
    maxBid,
    slotMultiplierValue,
    effectiveAvgBid,
    competitivenessLevel,
    winRate,
    estimatedViews,
    budgetUtilization,
  } = metrics;

  // Currency display helpers
  const currencyPrefix = isSeller ? `${currency} ` : "$";

  return (
    <section ref={sectionRef} id="bidding" className="scroll-mt-36">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Bidding Competitiveness
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Second-price auction: you pay the second-highest bid +{" "}
            {isSeller ? `0.01 ${currency}` : "$0.01"}
          </p>

          {draft.audienceSegments.length === 0 ? (
            <div className="p-8 bg-gray-50 rounded-xl text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-gray-700 font-medium mb-1">
                No Audience Targets Added
              </h3>
              <p className="text-sm text-gray-500">
                Add audience targets with CPM bids in the Targeting section
                above to see competitiveness analysis
              </p>
            </div>
          ) : (
            <>
              {/* Bid Summary Grid */}
              <div
                className={cn(
                  "grid gap-4 mb-6",
                  isSeller ? "grid-cols-4" : "grid-cols-5"
                )}
              >
                <div className="p-4 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-500 block mb-1">
                    Targets
                  </span>
                  <div className="text-2xl font-bold text-gray-900">
                    {draft.audienceSegments.length}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-500 block mb-1">
                    Avg CPM Bid
                  </span>
                  <div
                    className={cn(
                      "font-bold text-gray-900",
                      isSeller ? "text-xl" : "text-2xl"
                    )}
                  >
                    {currencyPrefix}
                    {avgBid.toFixed(2)}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-500 block mb-1">
                    Bid Range
                  </span>
                  <div className="text-lg font-bold text-gray-900">
                    {currencyPrefix}
                    {isSeller ? minBid.toFixed(0) : minBid.toFixed(2)} -{" "}
                    {isSeller
                      ? maxBid.toFixed(0)
                      : `$${maxBid.toFixed(2)}`}
                  </div>
                </div>

                {/* Brand-only: Slot Multiplier column */}
                {!isSeller && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <span className="text-xs text-gray-500 block mb-1">
                      {slotTargetingMode === "include" && Object.keys(slotGroupMultipliers).length > 0
                        ? "Avg Slot Multiplier"
                        : "Slot Multiplier"}
                    </span>
                    <div className="text-2xl font-bold text-gray-900">
                      +{Math.round(slotMultiplierValue)}%
                    </div>
                  </div>
                )}

                {/* Competitiveness / Effective Avg column */}
                <div
                  className={cn(
                    "p-4 rounded-lg",
                    competitivenessLevel === "low" && "bg-red-50",
                    competitivenessLevel === "medium" && "bg-yellow-50",
                    competitivenessLevel === "high" && "bg-green-50"
                  )}
                >
                  <span className="text-xs text-gray-500 block mb-1">
                    {isSeller ? "Competitiveness" : "Effective Avg"}
                  </span>
                  <div
                    className={cn(
                      "font-bold",
                      isSeller ? "text-xl" : "text-2xl",
                      competitivenessLevel === "low" && "text-red-600",
                      competitivenessLevel === "medium" && "text-yellow-600",
                      competitivenessLevel === "high" && "text-green-600"
                    )}
                  >
                    {isSeller
                      ? competitivenessLevel === "low"
                        ? "Low"
                        : competitivenessLevel === "medium"
                        ? "Medium"
                        : "High"
                      : `$${effectiveAvgBid.toFixed(2)}`}
                  </div>
                </div>
              </div>

              {/* Competitiveness Bar */}
              <div className="mb-6 p-4 bg-white border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    Overall Competitiveness
                  </span>
                  <span
                    className={cn(
                      "text-sm font-bold px-3 py-1 rounded-full",
                      competitivenessLevel === "low" &&
                        "bg-red-100 text-red-700",
                      competitivenessLevel === "medium" &&
                        "bg-yellow-100 text-yellow-700",
                      competitivenessLevel === "high" &&
                        "bg-green-100 text-green-700"
                    )}
                  >
                    {competitivenessLevel === "low"
                      ? "Low"
                      : competitivenessLevel === "medium"
                      ? "Medium"
                      : "High"}
                  </span>
                </div>
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      competitivenessLevel === "low" &&
                        "bg-gradient-to-r from-red-400 to-red-500",
                      competitivenessLevel === "medium" &&
                        "bg-gradient-to-r from-yellow-400 to-yellow-500",
                      competitivenessLevel === "high" &&
                        "bg-gradient-to-r from-green-400 to-green-500"
                    )}
                    style={{
                      width: isSeller
                        ? `${
                            competitivenessLevel === "low"
                              ? 30
                              : competitivenessLevel === "medium"
                              ? 60
                              : 90
                          }%`
                        : `${Math.min(100, (effectiveAvgBid / 10) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {competitivenessLevel === "low"
                    ? isSeller
                      ? "Your bids may not win many auctions. Consider increasing target CPM bids."
                      : "Your bids may not win many auctions. Consider increasing target CPM bids or adding a slot multiplier."
                    : competitivenessLevel === "medium"
                    ? "Your bids are competitive for most placements. Good balance of cost and reach."
                    : "Your bids are highly competitive. You should win most auctions."}
                </p>
              </div>

              {/* Performance Forecast */}
              <div
                className={cn(
                  "p-4 rounded-xl border",
                  isSeller
                    ? "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-100"
                    : "bg-gradient-to-r from-primary-50 to-blue-50 border-primary-100"
                )}
              >
                <h4 className="font-medium text-gray-900 mb-4">
                  Estimated Performance
                </h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatNumber(estimatedReach)}
                    </div>
                    <p className="text-xs text-gray-500">
                      Available Reach/day
                    </p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div
                      className={cn(
                        "text-2xl font-bold",
                        isSeller ? "text-amber-600" : "text-primary-600"
                      )}
                    >
                      {formatNumber(estimatedViews)}
                    </div>
                    <p className="text-xs text-gray-500">Est. Daily Views</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {winRate}%
                    </div>
                    <p className="text-xs text-gray-500">Est. Win Rate</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {budgetUtilization}%
                    </div>
                    <p className="text-xs text-gray-500">
                      Budget Utilization
                    </p>
                  </div>
                </div>

                {/* Brand-only: Budget summary row */}
                {!isSeller && (
                  <div className="mt-4 pt-4 border-t border-primary-100 grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                      <span className="text-sm text-gray-600">
                        Daily Budget
                      </span>
                      <span className="font-semibold text-gray-900">
                        ${formatNumber(draft.budget)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                      <span className="text-sm text-gray-600">
                        Max Total Spend
                      </span>
                      <span className="font-semibold text-gray-900">
                        {draft.startDate && draft.endDate && !draft.noEndDate
                          ? `$${formatNumber(
                              draft.budget *
                                Math.ceil(
                                  (draft.endDate.getTime() -
                                    draft.startDate.getTime()) /
                                    (1000 * 60 * 60 * 24)
                                )
                            )}`
                          : "Unlimited"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
});

export default BiddingSection;
