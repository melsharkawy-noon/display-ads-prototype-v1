"use client";

import { memo, useState, useMemo } from "react";
import { useCampaign } from "@/context/CampaignContext";
import { Card, CardContent } from "@/components/ui/Card";
import { cn, formatNumber } from "@/lib/utils";
import {
  countries,
  pages,
  slots,
  brands,
  categories,
  products,
} from "@/lib/mock-data";
import {
  CheckCircle,
  ChevronDown,
  Trash2,
  Users,
  Layers,
  Info,
} from "lucide-react";

interface SellerTargetingSectionProps {
  sectionRef: (el: HTMLElement | null) => void;
}

export const SellerTargetingSection = memo(function SellerTargetingSection({
  sectionRef,
}: SellerTargetingSectionProps) {
  const { draft, updateDraft } = useCampaign();

  // Seller targeting state
  const [sellerTargetingCategory, setSellerTargetingCategory] = useState<string | null>("reengagement");
  const [sellerTargetingSearch, setSellerTargetingSearch] = useState("");

  // Seller targeting form state - Re-engagement
  const [reengAction, setReengAction] = useState("");
  const [reengLookback, setReengLookback] = useState("30");
  const [reengTargetType, setReengTargetType] = useState("");
  const [reengTargetValue, setReengTargetValue] = useState("");
  const [reengBid, setReengBid] = useState("4.00");

  // Seller targeting form state - Demographic
  const [demoType, setDemoType] = useState("");
  const [demoValue, setDemoValue] = useState("");
  const [demoBid, setDemoBid] = useState("3.50");

  // Seller targeting form state - In-Market
  const [inMarketCategory, setInMarketCategory] = useState("");
  const [inMarketSubcategory, setInMarketSubcategory] = useState("");
  const [inMarketBid, setInMarketBid] = useState("4.50");

  // Seller targeting bulk bid state
  const [showBulkBidMenu, setShowBulkBidMenu] = useState(false);
  const [customBulkBid, setCustomBulkBid] = useState("5.00");

  // Slot targeting state (local to seller)
  const [slotTargetingMode, setSlotTargetingMode] = useState<"all" | "include" | "exclude">("all");
  const [slotPageFilter, setSlotPageFilter] = useState<string>("all");
  const [slotSearchQuery, setSlotSearchQuery] = useState("");

  // Slot multiplier (local to seller)
  const [slotMultiplier, setSlotMultiplier] = useState("0");

  // Estimated reach for seller
  const estimatedReach = useMemo(() => {
    let relevantSlots: typeof slots = [];

    if (slotTargetingMode === "all") {
      relevantSlots = slots;
    } else if (slotTargetingMode === "include") {
      relevantSlots = draft.slotIds.length > 0
        ? slots.filter(s => draft.slotIds.includes(s.id))
        : slots;
    } else {
      relevantSlots = slots.filter(s => !draft.excludedSlotIds.includes(s.id));
    }

    let total = 0;
    relevantSlots.forEach(slot => {
      total += slot.avgDailyViews;
    });

    const totalRules = draft.segments.reduce((sum, s) => sum + s.rules.length, 0);
    const targetingFactor = totalRules === 0 ? 1.0 : totalRules <= 2 ? 0.6 : totalRules <= 4 ? 0.3 : 0.1;
    const frequencyFactor = draft.frequencyCapEnabled ? Math.min(1, draft.maxViews / 5) : 1.0;

    return Math.round(total * targetingFactor * frequencyFactor);
  }, [draft.slotIds, draft.excludedSlotIds, draft.segments, draft.frequencyCapEnabled, draft.maxViews, slotTargetingMode]);

  const expandedCategory = sellerTargetingCategory;
  const setExpandedCategory = setSellerTargetingCategory;

  // Get currency from selected country
  const selectedCountry = countries.find(c => c.code === draft.country);
  const currency = selectedCountry?.currency || "AED";
  
  // Currency conversion rates from USD base
  const conversionRates: Record<string, number> = {
    "AED": 3.67,
    "SAR": 3.75,
    "EGP": 30.90,
  };
  const rate = conversionRates[currency] || 1;

  // Generate unique ID
  const generateId = () => `target_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Bid ranges based on action and target type (in local currency)
  const getBidRange = (action: string, targetType: string, demoTypeVal?: string) => {
    // Base ranges in USD, will be converted to local currency
    const reengRangesUSD: Record<string, Record<string, { min: number; max: number; recommended: number }>> = {
      "viewed_products": {
        "brand": { min: 0.80, max: 2.30, recommended: 1.40 },
        "category": { min: 0.70, max: 1.90, recommended: 1.10 },
      },
      "purchased_products": {
        "brand": { min: 1.20, max: 3.30, recommended: 2.00 },
        "category": { min: 1.00, max: 2.60, recommended: 1.60 },
      },
      "added_to_cart": {
        "brand": { min: 1.40, max: 3.80, recommended: 2.30 },
        "category": { min: 1.10, max: 3.00, recommended: 1.85 },
      },
    };
    
    // Demographic bid ranges in USD
    const demoRangesUSD: Record<string, { min: number; max: number; recommended: number }> = {
      "age": { min: 0.55, max: 1.80, recommended: 1.00 },
      "gender": { min: 0.50, max: 1.50, recommended: 0.90 },
      "income": { min: 0.70, max: 2.20, recommended: 1.20 },
    };

    // In-Market bid ranges in USD (higher intent = higher bids)
    const inMarketRangesUSD: Record<string, { min: number; max: number; recommended: number }> = {
      "electronics": { min: 1.20, max: 3.50, recommended: 2.00 },
      "fashion": { min: 0.90, max: 2.80, recommended: 1.60 },
      "beauty": { min: 0.85, max: 2.50, recommended: 1.50 },
      "home": { min: 0.80, max: 2.40, recommended: 1.40 },
      "grocery": { min: 0.60, max: 1.80, recommended: 1.00 },
      "baby": { min: 0.90, max: 2.60, recommended: 1.55 },
      "sports": { min: 0.75, max: 2.30, recommended: 1.30 },
      "health": { min: 0.85, max: 2.50, recommended: 1.45 },
      "automotive": { min: 1.00, max: 3.00, recommended: 1.80 },
      "toys": { min: 0.70, max: 2.20, recommended: 1.25 },
      "default": { min: 0.75, max: 2.40, recommended: 1.35 },
    };

    let baseRange;
    if (demoTypeVal) {
      baseRange = demoRangesUSD[demoTypeVal] || { min: 0.55, max: 1.60, recommended: 0.95 };
    } else if (action === "in_market") {
      baseRange = inMarketRangesUSD[targetType] || inMarketRangesUSD["default"];
    } else {
      baseRange = reengRangesUSD[action]?.[targetType] || { min: 0.55, max: 2.20, recommended: 1.10 };
    }
    
    // Convert to local currency
    return {
      min: Math.round(baseRange.min * rate * 100) / 100,
      max: Math.round(baseRange.max * rate * 100) / 100,
      recommended: Math.round(baseRange.recommended * rate * 100) / 100,
    };
  };

  const addReengagementTarget = () => {
    if (!reengAction || !reengTargetType || !reengTargetValue) return;
    
    const targetLabel = reengTargetType === "brand" 
      ? brands.find(b => b.id === reengTargetValue)?.name 
      : categories.find(c => c.id === reengTargetValue)?.name;
    
    const actionLabels: Record<string, string> = {
      "viewed_products": "Viewed Products",
      "purchased_products": "Purchased Products", 
      "added_to_cart": "Added to Cart"
    };

    const bidRange = getBidRange(reengAction, reengTargetType);

    const newSegment = {
      id: generateId(),
      type: "reengagement" as const,
      name: `${actionLabels[reengAction]} - ${targetLabel}`,
      description: `${reengLookback} day lookback`,
      lookback: parseInt(reengLookback),
      category: reengTargetType === "category" ? reengTargetValue : undefined,
      bid: parseFloat(reengBid) || bidRange.recommended,
      suggestedBid: bidRange.recommended,
      bidRange: { min: bidRange.min, max: bidRange.max },
    };
    updateDraft({ audienceSegments: [...draft.audienceSegments, newSegment] });
    
    // Reset form
    setReengAction("");
    setReengTargetType("");
    setReengTargetValue("");
    setReengBid("");
  };

  const addDemographicTarget = () => {
    if (!demoType || !demoValue) return;
    
    const demoLabels: Record<string, Record<string, string>> = {
      "age": { "18_24": "18-24", "25_34": "25-34", "35_44": "35-44", "45_54": "45-54", "55_plus": "55+" },
      "gender": { "male": "Male", "female": "Female" },
      "income": { "low": "Low Income", "medium": "Medium Income", "high": "High Income" },
    };

    const bidRange = getBidRange("", "", demoType);

    const newSegment = {
      id: generateId(),
      type: "demographic" as const,
      name: `${demoType.charAt(0).toUpperCase() + demoType.slice(1)}: ${demoLabels[demoType]?.[demoValue] || demoValue}`,
      bid: parseFloat(demoBid) || bidRange.recommended,
      suggestedBid: bidRange.recommended,
      bidRange: { min: bidRange.min, max: bidRange.max },
    };
    updateDraft({ audienceSegments: [...draft.audienceSegments, newSegment] });
    
    // Reset form
    setDemoType("");
    setDemoValue("");
    setDemoBid("");
  };

  const addInMarketTarget = () => {
    if (!inMarketCategory) return;
    
    const categoryObj = categories.find(c => c.id === inMarketCategory);
    const subcategoryObj = categoryObj?.subcategories?.find(s => s.id === inMarketSubcategory);
    
    const targetName = subcategoryObj 
      ? `${categoryObj?.name} › ${subcategoryObj.name}`
      : categoryObj?.name || inMarketCategory;

    const bidRange = getBidRange("in_market", inMarketCategory);

    const newSegment = {
      id: generateId(),
      type: "in_market" as const,
      name: `In-Market: ${targetName}`,
      description: "Users actively shopping in this category",
      category: inMarketCategory,
      subcategory: inMarketSubcategory || undefined,
      bid: parseFloat(inMarketBid) || bidRange.recommended,
      suggestedBid: bidRange.recommended,
      bidRange: { min: bidRange.min, max: bidRange.max },
    };
    updateDraft({ audienceSegments: [...draft.audienceSegments, newSegment] });
    
    // Reset form
    setInMarketCategory("");
    setInMarketSubcategory("");
    setInMarketBid("");
  };

  const removeSegment = (segmentId: string) => {
    updateDraft({ audienceSegments: draft.audienceSegments.filter(s => s.id !== segmentId) });
  };

  const updateSegmentBid = (segmentId: string, bid: number) => {
    updateDraft({
      audienceSegments: draft.audienceSegments.map(s => 
        s.id === segmentId ? { ...s, bid } : s
      )
    });
  };

  // Bulk bid application
  const applyBulkBid = (mode: "custom" | "aggressive" | "recommended") => {
    updateDraft({
      audienceSegments: draft.audienceSegments.map(s => ({
        ...s,
        bid: mode === "custom" 
          ? parseFloat(customBulkBid) || s.bid
          : mode === "aggressive" 
            ? s.bidRange.max 
            : s.suggestedBid
      }))
    });
    setShowBulkBidMenu(false);
  };

  // Get current bid range for form display
  const currentReengRange = reengAction && reengTargetType 
    ? getBidRange(reengAction, reengTargetType) 
    : null;
  
  const currentDemoRange = demoType 
    ? getBidRange("", "", demoType) 
    : null;
  
  const currentInMarketRange = inMarketCategory 
    ? getBidRange("in_market", inMarketCategory) 
    : null;

  // Calculate recommended slot multiplier for seller
  const sellerRecommendedSlotMultiplier = slotTargetingMode === "include" 
    ? (draft.slotIds.length <= 3 ? 25 : draft.slotIds.length <= 10 ? 15 : 10)
    : slotTargetingMode === "exclude"
      ? (draft.excludedSlotIds.length >= 10 ? 5 : 0)
      : 0;

  return (
    <section 
      ref={sectionRef}
      id="seller-targeting" 
      className="scroll-mt-36"
    >
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Targeting & Serving Controls</h2>
          <p className="text-sm text-gray-500 mb-6">Add audience targets with individual CPM bids in {currency}</p>
          
          {/* 1. Audience Targeting */}
          <div className="mb-6 pb-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Audience Targeting</h3>
                <p className="text-xs text-gray-500">Add targets with individual CPM bids</p>
              </div>
            </div>
          
          {/* Recommended Audiences - based on selected products/landing page */}
          {(draft.landingPageUrl || draft.builderConfig.products.length > 0) && (() => {
            // Get product info for recommendations
            const selectedProducts = products.filter(p => draft.builderConfig.products.includes(p.id));
            const productCategories = [...new Set(selectedProducts.map(p => p.category).filter(Boolean))];
            const productBrands = [...new Set(selectedProducts.map(p => p.brand).filter(Boolean))];
            
            // Define recommendation types
            const recommendations = [
              {
                id: "viewed_products",
                name: "Viewed Similar Products",
                description: "Users who viewed products like yours (30d)",
                type: "reengagement" as const,
                action: "viewed_products",
                targetType: "category",
                targetValue: productCategories[0] || draft.builderConfig.categories[0] || "electronics",
                lookback: 30,
              },
              {
                id: "cart_abandoners",
                name: "Cart Abandoners",
                description: "Users who added similar items to cart (14d)",
                type: "reengagement" as const,
                action: "added_to_cart",
                targetType: "category",
                targetValue: productCategories[0] || draft.builderConfig.categories[0] || "electronics",
                lookback: 14,
              },
              {
                id: "past_purchasers",
                name: "Past Purchasers",
                description: "Users who purchased from this category (90d)",
                type: "reengagement" as const,
                action: "purchased_products",
                targetType: "category",
                targetValue: productCategories[0] || draft.builderConfig.categories[0] || "electronics",
                lookback: 90,
              },
            ];
            
            // Add brand-specific recommendation if brand is available
            if (productBrands.length > 0 || draft.builderConfig.brands.length > 0) {
              const brandId = productBrands[0] || draft.builderConfig.brands[0];
              const brandName = brands.find(b => b.id === brandId)?.name || "Brand";
              recommendations.push({
                id: "brand_viewers",
                name: `${brandName} Shoppers`,
                description: `Users interested in ${brandName} (30d)`,
                type: "reengagement" as const,
                action: "viewed_products",
                targetType: "brand",
                targetValue: brandId,
                lookback: 30,
              });
            }
            
            // Check which recommendations are already added
            const isRecAdded = (recId: string) => {
              return draft.audienceSegments.some(seg => seg.id.includes(recId));
            };
            
            const availableRecs = recommendations.filter(rec => !isRecAdded(rec.id));
            const allAdded = availableRecs.length === 0;
            
            // Add a single recommendation
            const addRecommendation = (rec: typeof recommendations[0]) => {
              const range = getBidRange(rec.action, rec.targetType);
              const newSegment = {
                id: `rec_${rec.id}_${Date.now()}`,
                type: rec.type,
                name: rec.name,
                description: rec.description,
                lookback: rec.lookback,
                category: rec.targetType === "category" ? rec.targetValue : undefined,
                bid: range.recommended,
                suggestedBid: range.recommended,
                bidRange: { min: range.min, max: range.max },
              };
              updateDraft({ audienceSegments: [...draft.audienceSegments, newSegment] });
            };
            
            // Add all recommendations
            const addAllRecommendations = () => {
              const newSegments = availableRecs.map(rec => {
                const range = getBidRange(rec.action, rec.targetType);
                return {
                  id: `rec_${rec.id}_${Date.now()}`,
                  type: rec.type,
                  name: rec.name,
                  description: rec.description,
                  lookback: rec.lookback,
                  category: rec.targetType === "category" ? rec.targetValue : undefined,
                  bid: range.recommended,
                  suggestedBid: range.recommended,
                  bidRange: { min: range.min, max: range.max },
                };
              });
              updateDraft({ audienceSegments: [...draft.audienceSegments, ...newSegments] });
            };
            
            // Remove all recommendation-based segments
            const removeAllRecommendations = () => {
              const filtered = draft.audienceSegments.filter(seg => !seg.id.startsWith("rec_"));
              updateDraft({ audienceSegments: filtered });
            };
            
            return (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Recommended Audiences</p>
                      <p className="text-xs text-amber-600">Based on your selected products</p>
                    </div>
                  </div>
                  {allAdded ? (
                    <button
                      onClick={removeAllRecommendations}
                      className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline"
                    >
                      Remove All
                    </button>
                  ) : (
                    <button
                      onClick={addAllRecommendations}
                      className="text-xs font-medium text-amber-700 hover:text-amber-800 hover:underline"
                    >
                      Add All
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableRecs.map(rec => (
                    <button
                      key={rec.id}
                      onClick={() => addRecommendation(rec)}
                      className="px-2.5 py-1 text-xs bg-white border border-amber-300 rounded-full hover:bg-amber-100 transition-colors"
                    >
                      + {rec.name}
                    </button>
                  ))}
                  {allAdded && (
                    <span className="text-xs text-amber-600 italic">All recommendations added</span>
                  )}
                </div>
              </div>
            );
          })()}
          
          {/* Audience Targeting - Bucket Layout */}
          <div className="grid grid-cols-12 gap-4 items-start">
            {/* Left Panel - Add Targets */}
            <div className="col-span-5 space-y-3" id="seller-targeting-left">
              {/* Re-engagement Bucket */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(expandedCategory === "reengagement" ? null : "reengagement")}
                  className="w-full p-3 bg-gray-50 text-left flex items-center justify-between hover:bg-gray-100"
                >
                  <span className="font-medium text-gray-900">Re-engagement</span>
                  <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform", expandedCategory === "reengagement" && "rotate-180")} />
                </button>
                
                {expandedCategory === "reengagement" && (
                  <div className="p-4 space-y-3 bg-white">
                    {/* Action */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Action</label>
                      <select
                        value={reengAction}
                        onChange={(e) => { setReengAction(e.target.value); setReengBid(""); }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                      >
                        <option value="">Select action</option>
                        <option value="viewed_products">Viewed Products</option>
                        <option value="purchased_products">Purchased Products</option>
                        <option value="added_to_cart">Added to Cart</option>
                      </select>
                    </div>

                    {/* Lookback Window */}
                    <div className={cn(!reengAction && "opacity-40 pointer-events-none")}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Lookback Window</label>
                      <select
                        value={reengLookback}
                        onChange={(e) => setReengLookback(e.target.value)}
                        disabled={!reengAction}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white disabled:bg-gray-50"
                      >
                        <option value="14">14 days</option>
                        <option value="30">30 days</option>
                        <option value="60">60 days</option>
                        <option value="90">90 days</option>
                        <option value="365">365 days</option>
                      </select>
                    </div>

                    {/* Target Type */}
                    <div className={cn(!reengAction && "opacity-40 pointer-events-none")}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Target</label>
                      <select
                        value={reengTargetType}
                        onChange={(e) => { setReengTargetType(e.target.value); setReengTargetValue(""); setReengBid(""); }}
                        disabled={!reengAction}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white disabled:bg-gray-50"
                      >
                        <option value="">Select target type</option>
                        <option value="brand">Brand</option>
                        <option value="category">Category</option>
                      </select>
                    </div>

                    {/* Target Value - Always visible */}
                    <div className={cn(!reengTargetType && "opacity-40 pointer-events-none")}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {reengTargetType === "brand" ? "Select Brand" : reengTargetType === "category" ? "Select Category" : "Select Value"}
                      </label>
                      <select
                        value={reengTargetValue}
                        onChange={(e) => {
                          setReengTargetValue(e.target.value);
                          if (e.target.value && reengAction && reengTargetType) {
                            const range = getBidRange(reengAction, reengTargetType);
                            setReengBid(range.recommended.toFixed(2));
                          }
                        }}
                        disabled={!reengTargetType}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white disabled:bg-gray-50"
                      >
                        <option value="">Select {reengTargetType || "value"}</option>
                        {reengTargetType === "brand" && brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        {reengTargetType === "category" && categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    {/* CPM Bid with Range - Always visible */}
                    <div className={cn(!reengTargetValue && "opacity-40 pointer-events-none")}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">CPM Bid ({currency})</label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">{currency}</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={reengBid}
                            onChange={(e) => setReengBid(e.target.value)}
                            placeholder={currentReengRange ? currentReengRange.recommended.toFixed(2) : "5.00"}
                            disabled={!reengTargetValue}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-50"
                          />
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {currentReengRange ? `${currentReengRange.min.toFixed(2)} - ${currentReengRange.max.toFixed(2)}` : "-- - --"}
                        </span>
                      </div>
                    </div>

                    {/* Add Button */}
                    <button
                      onClick={addReengagementTarget}
                      disabled={!reengAction || !reengTargetType || !reengTargetValue}
                      className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-600"
                    >
                      Add Target
                    </button>
                  </div>
                )}
              </div>

              {/* Demographic Bucket */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(expandedCategory === "demographic" ? null : "demographic")}
                  className="w-full p-3 bg-gray-50 text-left flex items-center justify-between hover:bg-gray-100"
                >
                  <span className="font-medium text-gray-900">Demographic</span>
                  <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform", expandedCategory === "demographic" && "rotate-180")} />
                </button>
                
                {expandedCategory === "demographic" && (
                  <div className="p-4 space-y-3 bg-white">
                    {/* Demographic Type */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                      <select
                        value={demoType}
                        onChange={(e) => { setDemoType(e.target.value); setDemoValue(""); setDemoBid(""); }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                      >
                        <option value="">Select type</option>
                        <option value="age">Age</option>
                        <option value="gender">Gender</option>
                        <option value="income">Income Level</option>
                      </select>
                    </div>

                    {/* Demographic Value - Always visible */}
                    <div className={cn(!demoType && "opacity-40 pointer-events-none")}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {demoType === "age" ? "Age Range" : demoType === "gender" ? "Gender" : demoType === "income" ? "Income Level" : "Value"}
                      </label>
                      <select
                        value={demoValue}
                        onChange={(e) => {
                          setDemoValue(e.target.value);
                          if (e.target.value && demoType) {
                            const range = getBidRange("", "", demoType);
                            setDemoBid(range.recommended.toFixed(2));
                          }
                        }}
                        disabled={!demoType}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white disabled:bg-gray-50"
                      >
                        <option value="">Select value</option>
                        {demoType === "age" && <><option value="18_24">18-24</option><option value="25_34">25-34</option><option value="35_44">35-44</option><option value="45_54">45-54</option><option value="55_plus">55+</option></>}
                        {demoType === "gender" && <><option value="male">Male</option><option value="female">Female</option></>}
                        {demoType === "income" && <><option value="low">Low Income</option><option value="medium">Medium Income</option><option value="high">High Income</option></>}
                        {!demoType && <option value="" disabled>Select type first</option>}
                      </select>
                    </div>

                    {/* CPM Bid with Range - Always visible */}
                    <div className={cn(!demoValue && "opacity-40 pointer-events-none")}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">CPM Bid ({currency})</label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">{currency}</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={demoBid}
                            onChange={(e) => setDemoBid(e.target.value)}
                            placeholder={currentDemoRange ? currentDemoRange.recommended.toFixed(2) : "3.50"}
                            disabled={!demoValue}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-50"
                          />
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {currentDemoRange ? `${currentDemoRange.min.toFixed(2)} - ${currentDemoRange.max.toFixed(2)}` : "-- - --"}
                        </span>
                      </div>
                    </div>

                    {/* Add Button */}
                    <button
                      onClick={addDemographicTarget}
                      disabled={!demoType || !demoValue}
                      className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-600"
                    >
                      Add Target
                    </button>
                  </div>
                )}
              </div>

              {/* In-Market Bucket */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(expandedCategory === "in_market" ? null : "in_market")}
                  className="w-full p-3 bg-gray-50 text-left flex items-center justify-between hover:bg-gray-100"
                >
                  <span className="font-medium text-gray-900">In-Market</span>
                  <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform", expandedCategory === "in_market" && "rotate-180")} />
                </button>
                
                {expandedCategory === "in_market" && (
                  <div className="p-4 space-y-3 bg-white">
                    {/* Category */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                      <select
                        value={inMarketCategory}
                        onChange={(e) => {
                          setInMarketCategory(e.target.value);
                          setInMarketSubcategory("");
                          if (e.target.value) {
                            const range = getBidRange("in_market", e.target.value);
                            setInMarketBid(range.recommended.toFixed(2));
                          } else {
                            setInMarketBid("");
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                      >
                        <option value="">Select category...</option>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                      </select>
                    </div>

                    {/* Subcategory (optional) - Always visible */}
                    <div className={cn(!inMarketCategory && "opacity-40 pointer-events-none")}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Subcategory <span className="text-gray-400">(optional)</span>
                      </label>
                      <select
                        value={inMarketSubcategory}
                        onChange={(e) => setInMarketSubcategory(e.target.value)}
                        disabled={!inMarketCategory}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white disabled:bg-gray-50"
                      >
                        <option value="">All subcategories</option>
                        {inMarketCategory && (() => {
                          const selectedCat = categories.find(c => c.id === inMarketCategory);
                          return (selectedCat?.subcategories || []).map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>);
                        })()}
                      </select>
                    </div>

                    {/* CPM Bid with Range - Always visible */}
                    <div className={cn(!inMarketCategory && "opacity-40 pointer-events-none")}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">CPM Bid ({currency})</label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">{currency}</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={inMarketBid}
                            onChange={(e) => setInMarketBid(e.target.value)}
                            placeholder={currentInMarketRange ? currentInMarketRange.recommended.toFixed(2) : "5.00"}
                            disabled={!inMarketCategory}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-50"
                          />
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {currentInMarketRange ? `${currentInMarketRange.min.toFixed(2)} - ${currentInMarketRange.max.toFixed(2)}` : "-- - --"}
                        </span>
                      </div>
                    </div>

                    {/* Add Button */}
                    <button
                      onClick={addInMarketTarget}
                      disabled={!inMarketCategory}
                      className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-600"
                    >
                      Add Target
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Added Targets */}
            <div className="col-span-7">
              <div className="border rounded-lg overflow-hidden flex flex-col h-fit max-h-[420px]">
                {/* Header */}
                <div className="p-3 bg-gray-50 border-b flex items-center justify-between">
                  <span className="font-medium text-gray-900">
                    {draft.audienceSegments.length} Target{draft.audienceSegments.length !== 1 ? "s" : ""} Added
                  </span>
                  <div className="flex items-center gap-2">
                    {draft.audienceSegments.length > 0 && (
                      <>
                        {/* Bulk Bid Button */}
                        <div className="relative">
                          <button
                            onClick={() => setShowBulkBidMenu(!showBulkBidMenu)}
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                          >
                            Apply bid to all
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          
                          {showBulkBidMenu && (
                            <div className="absolute right-0 top-full mt-1 w-64 bg-white border rounded-lg shadow-lg z-20">
                              <div className="p-2 border-b">
                                <div className="text-xs font-medium text-gray-700 mb-1">Custom CPM Bid ({currency})</div>
                                <div className="flex items-center gap-2">
                                  <div className="relative flex-1">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">{currency}</span>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={customBulkBid}
                                      onChange={(e) => setCustomBulkBid(e.target.value)}
                                      className="w-full pl-9 pr-2 py-1 border rounded text-sm"
                                    />
                                  </div>
                                  <button
                                    onClick={() => applyBulkBid("custom")}
                                    className="px-2 py-1 bg-primary-500 text-white rounded text-xs font-medium hover:bg-primary-600"
                                  >
                                    Apply
                                  </button>
                                </div>
                              </div>
                              <button
                                onClick={() => applyBulkBid("aggressive")}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between"
                              >
                                <span>Aggressive Bid</span>
                                <span className="text-xs text-gray-500">Max for each target</span>
                              </button>
                              <button
                                onClick={() => applyBulkBid("recommended")}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between border-t"
                              >
                                <span>Recommended Bid</span>
                                <span className="text-xs text-gray-500">Optimal for each target</span>
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <span className="text-gray-300">|</span>
                        
                        <button
                          onClick={() => updateDraft({ audienceSegments: [] })}
                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                          Remove all
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Targets List */}
                <div className="flex-1 overflow-y-auto p-3">
                  {draft.audienceSegments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <Users className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm">No targets added</p>
                      <p className="text-xs">Select a bucket on the left to add targets</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {draft.audienceSegments.map(segment => (
                        <div key={segment.id} className="flex items-center justify-between p-2.5 bg-primary-50 border border-primary-200 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-100 text-primary-700 font-medium uppercase">
                                {segment.type === "in_market" ? "In-Market" : segment.type}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-gray-900 truncate">{segment.name}</p>
                            {segment.description && <p className="text-xs text-gray-500">{segment.description}</p>}
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <div className="text-right">
                              <div className="relative">
                                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">{currency}</span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={segment.bid.toFixed(2)}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val)) updateSegmentBid(segment.id, val);
                                  }}
                                  className="w-16 pl-6 pr-1 py-1 border rounded text-xs text-right"
                                />
                              </div>
                              <span className="text-[9px] text-gray-400">{segment.bidRange.min.toFixed(2)}-{segment.bidRange.max.toFixed(2)}</span>
                            </div>
                            <button
                              onClick={() => removeSegment(segment.id)}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* 2. Slot Targeting */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Slot Targeting</h3>
                <p className="text-xs text-gray-500">Choose which placements to target <span className="text-gray-400">(values show Est. Reach)</span></p>
              </div>
            </div>
            
            {/* Targeting Mode Tabs */}
            <div className="flex gap-2 mb-4">
              {[
                { value: "all", label: "All Slots", desc: "Target all available placements" },
                { value: "include", label: "Include Only", desc: "Target specific slots only" },
                { value: "exclude", label: "Exclude", desc: "Target all except selected" },
              ].map(mode => (
                <button
                  key={mode.value}
                  onClick={() => {
                    setSlotTargetingMode(mode.value as "all" | "include" | "exclude");
                    if (mode.value === "all") {
                      updateDraft({ slotIds: [], excludedSlotIds: [] });
                    }
                  }}
                  className={cn(
                    "flex-1 px-3 py-2 rounded-lg border text-sm transition-colors text-left",
                    slotTargetingMode === mode.value
                      ? mode.value === "exclude" ? "bg-red-50 border-red-300 text-red-700" : "bg-primary-50 border-primary-300 text-primary-700"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <div className="font-medium">{mode.label}</div>
                  <div className="text-xs opacity-70">{mode.desc}</div>
                </button>
              ))}
            </div>
            
            {/* Slot Selection - Left/Right Layout */}
            {slotTargetingMode !== "all" && (
              <div className="grid grid-cols-12 gap-3">
                {/* Left: Available Slots */}
                <div className="col-span-7 border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-2 border-b flex gap-2 items-center">
                    <select
                      value={slotPageFilter}
                      onChange={(e) => setSlotPageFilter(e.target.value)}
                      className="w-36 px-2 py-1 border border-gray-300 rounded text-xs"
                    >
                      <option value="all">All Pages</option>
                      {pages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input
                      type="text"
                      placeholder="Search slots..."
                      value={slotSearchQuery}
                      onChange={(e) => setSlotSearchQuery(e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {pages
                      .filter(p => slotPageFilter === "all" || !slotPageFilter || p.id === slotPageFilter)
                      .map(page => {
                        const pageSlots = slots.filter(s => 
                          s.pageId === page.id && 
                          (!slotSearchQuery || (s.zone || s.name).toLowerCase().includes(slotSearchQuery.toLowerCase()))
                        );
                        if (pageSlots.length === 0) return null;
                        
                        // Group slots by zone for CPM
                        const zoneGroups = pageSlots.reduce((acc, slot) => {
                          const zoneName = slot.zone || slot.name;
                          if (!acc[zoneName]) acc[zoneName] = [];
                          acc[zoneName].push(slot);
                          return acc;
                        }, {} as Record<string, typeof pageSlots>);
                        
                        const allPageSelected = slotTargetingMode === "include"
                          ? pageSlots.every(s => draft.slotIds.includes(s.id))
                          : pageSlots.every(s => draft.excludedSlotIds.includes(s.id));
                        
                        return (
                          <div key={page.id} className="border-b last:border-b-0">
                            <div className="px-2 py-1.5 bg-gray-50 flex items-center justify-between">
                              <span className="text-xs font-medium text-gray-700">{page.name}</span>
                              <button
                                onClick={() => {
                                  if (slotTargetingMode === "include") {
                                    const newIds = allPageSelected
                                      ? draft.slotIds.filter(id => !pageSlots.some(s => s.id === id))
                                      : [...new Set([...draft.slotIds, ...pageSlots.map(s => s.id)])];
                                    updateDraft({ slotIds: newIds });
                                  } else {
                                    const newIds = allPageSelected
                                      ? draft.excludedSlotIds.filter(id => !pageSlots.some(s => s.id === id))
                                      : [...new Set([...draft.excludedSlotIds, ...pageSlots.map(s => s.id)])];
                                    updateDraft({ excludedSlotIds: newIds });
                                  }
                                }}
                                className={cn("text-[10px] px-1.5 py-0.5 rounded", slotTargetingMode === "include" ? "text-primary-600 hover:bg-primary-50" : "text-red-600 hover:bg-red-50")}
                              >
                                {allPageSelected ? "Remove All" : "Add All"}
                              </button>
                            </div>
                            {/* Show zones instead of individual slots for CPM */}
                            {Object.entries(zoneGroups).map(([zoneName, zoneSlots]) => {
                              const zoneSlotIds = zoneSlots.map(s => s.id);
                              const isZoneSelected = slotTargetingMode === "include" 
                                ? zoneSlotIds.every(id => draft.slotIds.includes(id))
                                : zoneSlotIds.every(id => draft.excludedSlotIds.includes(id));
                              const totalViews = zoneSlots.reduce((sum, s) => sum + s.avgDailyViews, 0);
                              
                              return (
                                <div
                                  key={zoneName}
                                  onClick={() => {
                                    if (slotTargetingMode === "include") {
                                      const newIds = isZoneSelected
                                        ? draft.slotIds.filter(id => !zoneSlotIds.includes(id))
                                        : [...new Set([...draft.slotIds, ...zoneSlotIds])];
                                      updateDraft({ slotIds: newIds });
                                    } else {
                                      const newIds = isZoneSelected
                                        ? draft.excludedSlotIds.filter(id => !zoneSlotIds.includes(id))
                                        : [...new Set([...draft.excludedSlotIds, ...zoneSlotIds])];
                                      updateDraft({ excludedSlotIds: newIds });
                                    }
                                  }}
                                  className={cn("px-2 py-1.5 flex items-center gap-2 cursor-pointer border-b last:border-b-0 text-xs", isZoneSelected && slotTargetingMode === "include" && "bg-primary-50", isZoneSelected && slotTargetingMode === "exclude" && "bg-red-50")}
                                >
                                  <div className={cn("w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0", isZoneSelected && slotTargetingMode === "include" && "bg-primary-500 border-primary-500", isZoneSelected && slotTargetingMode === "exclude" && "bg-red-500 border-red-500", !isZoneSelected && "border-gray-300")}>
                                    {isZoneSelected && <CheckCircle className="w-2 h-2 text-white" />}
                                  </div>
                                  <span className="truncate flex-1">{zoneName}</span>
                                  <span className="text-gray-400 shrink-0">{totalViews >= 1000000 ? `${(totalViews / 1000000).toFixed(1)}M` : `${Math.round(totalViews / 1000)}K`}/day</span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                  </div>
                </div>
                
                {/* Right: Selected/Excluded Zones */}
                <div className={cn("col-span-5 border rounded-lg overflow-hidden", slotTargetingMode === "include" ? "border-primary-200" : "border-red-200")}>
                  <div className={cn("px-3 py-2 border-b flex items-center justify-between", slotTargetingMode === "include" ? "bg-primary-50" : "bg-red-50")}>
                    <span className={cn("text-xs font-medium", slotTargetingMode === "include" ? "text-primary-700" : "text-red-700")}>
                      {slotTargetingMode === "include" ? "Included Zones" : "Excluded Zones"}
                    </span>
                    {((slotTargetingMode === "include" && draft.slotIds.length > 0) || (slotTargetingMode === "exclude" && draft.excludedSlotIds.length > 0)) && (
                      <button onClick={() => updateDraft(slotTargetingMode === "include" ? { slotIds: [] } : { excludedSlotIds: [] })} className="text-xs text-gray-500 hover:text-red-600">Clear</button>
                    )}
                  </div>
                  <div className="max-h-48 overflow-y-auto p-2">
                    {((slotTargetingMode === "include" && draft.slotIds.length === 0) || (slotTargetingMode === "exclude" && draft.excludedSlotIds.length === 0)) ? (
                      <div className="text-center py-6 text-gray-400 text-xs">
                        <Layers className="w-6 h-6 mx-auto mb-2 opacity-50" />
                        No zones {slotTargetingMode === "include" ? "selected" : "excluded"}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {/* Group selected slots by page and zone */}
                        {(() => {
                          const selectedIds = slotTargetingMode === "include" ? draft.slotIds : draft.excludedSlotIds;
                          const selectedSlots = slots.filter(s => selectedIds.includes(s.id));
                          const groupedByPageZone: Record<string, { page: typeof pages[0]; zone: string; slotIds: string[] }> = {};
                          
                          selectedSlots.forEach(slot => {
                            const page = pages.find(p => p.id === slot.pageId);
                            const key = `${slot.pageId}-${slot.zone || slot.name}`;
                            if (!groupedByPageZone[key]) {
                              groupedByPageZone[key] = { page: page!, zone: slot.zone || slot.name, slotIds: [] };
                            }
                            groupedByPageZone[key].slotIds.push(slot.id);
                          });
                          
                          return Object.entries(groupedByPageZone).map(([key, { page, zone, slotIds: groupSlotIds }]) => (
                            <div key={key} className={cn("flex items-center justify-between px-2 py-1.5 rounded text-xs", slotTargetingMode === "include" ? "bg-primary-100" : "bg-red-100")}>
                              <div className="truncate flex-1">
                                <span className="text-gray-500">{page?.name}:</span> {zone}
                              </div>
                              <button 
                                onClick={() => { 
                                  if (slotTargetingMode === "include") { 
                                    updateDraft({ slotIds: draft.slotIds.filter(i => !groupSlotIds.includes(i)) }); 
                                  } else { 
                                    updateDraft({ excludedSlotIds: draft.excludedSlotIds.filter(i => !groupSlotIds.includes(i)) }); 
                                  } 
                                }} 
                                className="ml-2 text-gray-400 hover:text-red-600"
                              >×</button>
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Slot Multiplier */}
            {slotTargetingMode !== "all" && ((slotTargetingMode === "include" && draft.slotIds.length > 0) || (slotTargetingMode === "exclude" && draft.excludedSlotIds.length > 0)) && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-amber-900 mb-1">Slot Multiplier</h4>
                    <p className="text-xs text-amber-700 mb-3">
                      {slotTargetingMode === "include" 
                        ? `Narrow targeting to ${draft.slotIds.length} slot${draft.slotIds.length !== 1 ? "s" : ""} requires a bid multiplier for competitiveness`
                        : `Excluding ${draft.excludedSlotIds.length} slot${draft.excludedSlotIds.length !== 1 ? "s" : ""} may benefit from a bid adjustment`}
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-amber-800">Add</span>
                        <div className="relative">
                          <input type="text" inputMode="decimal" value={slotMultiplier} onChange={(e) => setSlotMultiplier(e.target.value)} className="w-16 px-2 py-1.5 border border-amber-300 rounded-lg text-sm text-right pr-6 bg-white" />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-600 text-sm">%</span>
                        </div>
                        <span className="text-sm text-amber-800">to all target bids</span>
                      </div>
                      <div className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">Recommended: {sellerRecommendedSlotMultiplier}%</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Reach Impact */}
          <div className="p-4 bg-primary-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-primary-900">Estimated Daily Reach</h4>
                <p className="text-sm text-primary-700">Based on current targeting settings</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-600">{formatNumber(estimatedReach)}</div>
                <p className="text-xs text-primary-500">impressions/day</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
});
