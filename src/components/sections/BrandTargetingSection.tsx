"use client";

import { memo, useState } from "react";
import { useCampaign } from "@/context/CampaignContext";
import { Card, CardContent } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { cn, formatNumber } from "@/lib/utils";
import type { AudienceCondition } from "@/lib/types";
import {
  pages,
  slots,
  brands,
  categories,
  products,
} from "@/lib/mock-data";
import {
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Trash2,
  Search,
  Users,
  Layers,
  AlertCircle,
  Info,
  Plus,
  X,
} from "lucide-react";

interface BrandTargetingSectionProps {
  sectionRef: (el: HTMLElement | null) => void;
  estimatedReach: number;
  slotsWithCptBookings: { slotId: string; slotName: string; pageName: string; dates: string[] }[];
  slotMultiplier: string;
  onSlotMultiplierChange: (value: string) => void;
  slotGroupMultipliers: Record<string, string>;
  onSlotGroupMultipliersChange: (value: Record<string, string>) => void;
  slotTargetingMode: "all" | "include" | "exclude";
  onSlotTargetingModeChange: (mode: "all" | "include" | "exclude") => void;
}

export const BrandTargetingSection = memo(function BrandTargetingSection({
  sectionRef,
  estimatedReach,
  slotsWithCptBookings,
  slotMultiplier,
  onSlotMultiplierChange,
  slotGroupMultipliers,
  onSlotGroupMultipliersChange,
  slotTargetingMode,
  onSlotTargetingModeChange,
}: BrandTargetingSectionProps) {
  const { draft, updateDraft } = useCampaign();

  // Brand targeting state
  const [brandTargetingCategory, setBrandTargetingCategory] = useState<string | null>("reengagement");
  const [showBrandBulkBidMenu, setShowBrandBulkBidMenu] = useState(false);
  const [brandCustomBulkBid, setBrandCustomBulkBid] = useState("5.00");

  // Audience targeting form state (local to brand)
  const [reengAction, setReengAction] = useState("");
  const [reengLookback, setReengLookback] = useState("30");
  const [reengTargetType, setReengTargetType] = useState("");
  const [reengTargetValue, setReengTargetValue] = useState("");
  const [reengBid, setReengBid] = useState("");
  const [demoType, setDemoType] = useState("");
  const [demoValue, setDemoValue] = useState("");
  const [demoBid, setDemoBid] = useState("");
  const [inMarketCategory, setInMarketCategory] = useState("");
  const [inMarketSubcategory, setInMarketSubcategory] = useState("");
  const [inMarketBid, setInMarketBid] = useState("");

  // Compound segment staging area (managed flow AND logic)
  const [stagedConditions, setStagedConditions] = useState<AudienceCondition[]>([]);
  const [segmentBid, setSegmentBid] = useState("");

  // Slot targeting local state
  const [slotPageFilter, setSlotPageFilter] = useState<string>("all");
  const [slotSearchQuery, setSlotSearchQuery] = useState("");

  // CPT conflict expand state
  const [showAllCptConflicts, setShowAllCptConflicts] = useState(false);

  // Currency conversion for brand targeting (same logic as seller)
  const brandCurrency = "USD"; // Brand always uses USD
  
  // Generate unique ID
  const generateBrandId = () => `target_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Bid ranges in USD for brand targeting
  const getBrandBidRange = (action: string, targetType: string, demoTypeVal?: string) => {
    const reengRangesUSD: Record<string, Record<string, { min: number; max: number; recommended: number }>> = {
      "viewed_products": { "brand": { min: 2.00, max: 6.00, recommended: 3.50 }, "category": { min: 1.50, max: 5.00, recommended: 2.80 } },
      "purchased_products": { "brand": { min: 3.00, max: 8.00, recommended: 5.00 }, "category": { min: 2.50, max: 7.00, recommended: 4.00 } },
      "added_to_cart": { "brand": { min: 3.50, max: 9.00, recommended: 5.50 }, "category": { min: 2.80, max: 7.50, recommended: 4.50 } },
    };
    const demoRangesUSD: Record<string, { min: number; max: number; recommended: number }> = {
      "age": { min: 1.50, max: 4.50, recommended: 2.50 },
      "gender": { min: 1.20, max: 4.00, recommended: 2.20 },
      "income": { min: 1.80, max: 5.50, recommended: 3.00 },
    };
    const inMarketRangesUSD: Record<string, { min: number; max: number; recommended: number }> = {
      "electronics": { min: 3.00, max: 9.00, recommended: 5.00 },
      "fashion": { min: 2.20, max: 7.00, recommended: 4.00 },
      "beauty": { min: 2.00, max: 6.50, recommended: 3.80 },
      "home": { min: 2.00, max: 6.00, recommended: 3.50 },
      "grocery": { min: 1.50, max: 4.50, recommended: 2.50 },
      "default": { min: 1.80, max: 6.00, recommended: 3.40 },
    };

    if (demoTypeVal) return demoRangesUSD[demoTypeVal] || { min: 1.50, max: 4.00, recommended: 2.40 };
    if (action === "in_market") return inMarketRangesUSD[targetType] || inMarketRangesUSD["default"];
    return reengRangesUSD[action]?.[targetType] || { min: 1.50, max: 5.50, recommended: 2.80 };
  };

  // --- Stage condition helpers (for AND compound segments) ---
  const actionLabels: Record<string, string> = { "viewed_products": "Viewed Products", "purchased_products": "Purchased Products", "added_to_cart": "Added to Cart" };
  const demoLabels: Record<string, Record<string, string>> = {
    "age": { "18_24": "18-24", "25_34": "25-34", "35_44": "35-44", "45_54": "45-54", "55_plus": "55+" },
    "gender": { "male": "Male", "female": "Female" },
    "income": { "low": "Low Income", "medium": "Medium Income", "high": "High Income" },
  };

  const stageReengagementCondition = () => {
    if (!reengAction || !reengTargetType || !reengTargetValue) return;
    const targetLabel = reengTargetType === "brand" 
      ? brands.find(b => b.id === reengTargetValue)?.name 
      : categories.find(c => c.id === reengTargetValue)?.name;
    const condition: AudienceCondition = {
      type: "reengagement",
      name: `${actionLabels[reengAction]} - ${targetLabel}`,
      description: `${reengLookback}d lookback`,
      lookback: parseInt(reengLookback),
      category: reengTargetType === "category" ? reengTargetValue : undefined,
    };
    setStagedConditions(prev => [...prev, condition]);
    setReengAction(""); setReengTargetType(""); setReengTargetValue(""); setReengBid("");
  };

  const stageDemographicCondition = () => {
    if (!demoType || !demoValue) return;
    const condition: AudienceCondition = {
      type: "demographic",
      name: `${demoType.charAt(0).toUpperCase() + demoType.slice(1)}: ${demoLabels[demoType]?.[demoValue] || demoValue}`,
    };
    setStagedConditions(prev => [...prev, condition]);
    setDemoType(""); setDemoValue(""); setDemoBid("");
  };

  const stageInMarketCondition = () => {
    if (!inMarketCategory) return;
    const categoryObj = categories.find(c => c.id === inMarketCategory);
    const subcategoryObj = categoryObj?.subcategories?.find(s => s.id === inMarketSubcategory);
    const targetName = subcategoryObj ? `${categoryObj?.name} › ${subcategoryObj.name}` : categoryObj?.name || inMarketCategory;
    const condition: AudienceCondition = {
      type: "in_market",
      name: `In-Market: ${targetName}`,
      description: "Active shoppers",
      category: inMarketCategory,
      subcategory: inMarketSubcategory || undefined,
    };
    setStagedConditions(prev => [...prev, condition]);
    setInMarketCategory(""); setInMarketSubcategory(""); setInMarketBid("");
  };

  const removeStagedCondition = (index: number) => {
    setStagedConditions(prev => prev.filter((_, i) => i !== index));
  };

  // Compute a combined bid range from all staged conditions
  const getStagedBidRange = () => {
    if (stagedConditions.length === 0) return { min: 1.50, max: 6.00, recommended: 3.50 };
    // Use the highest of the conditions' ranges (AND = narrower audience = higher value)
    let maxMin = 0, maxMax = 0, maxRec = 0;
    for (const cond of stagedConditions) {
      let range: { min: number; max: number; recommended: number };
      if (cond.type === "reengagement") {
        const action = cond.name.split(" - ")[0].toLowerCase().replace(/ /g, "_");
        const targetType = cond.category ? "category" : "brand";
        range = getBrandBidRange(action === "viewed_products" || action === "purchased_products" || action === "added_to_cart" ? action : "viewed_products", targetType);
      } else if (cond.type === "demographic") {
        const dt = cond.name.split(":")[0].toLowerCase();
        range = getBrandBidRange("", "", dt);
      } else {
        range = getBrandBidRange("in_market", cond.category || "default");
      }
      maxMin = Math.max(maxMin, range.min);
      maxMax = Math.max(maxMax, range.max);
      maxRec = Math.max(maxRec, range.recommended);
    }
    // Compound AND segments are more targeted = premium. Add 10% per extra condition
    const premium = 1 + (stagedConditions.length - 1) * 0.1;
    return { min: +(maxMin * premium).toFixed(2), max: +(maxMax * premium).toFixed(2), recommended: +(maxRec * premium).toFixed(2) };
  };

  const commitStagedSegment = () => {
    if (stagedConditions.length === 0) return;
    const bidRange = getStagedBidRange();
    const bid = parseFloat(segmentBid) || bidRange.recommended;
    
    // Build compound segment
    const isCompound = stagedConditions.length > 1;
    const primaryType = stagedConditions[0].type;
    const compoundName = stagedConditions.map(c => c.name).join(" AND ");
    
    const newSegment = {
      id: generateBrandId(),
      type: primaryType,
      name: isCompound ? compoundName : stagedConditions[0].name,
      description: isCompound 
        ? `${stagedConditions.length} ANDed conditions` 
        : stagedConditions[0].description,
      lookback: stagedConditions[0].lookback,
      category: stagedConditions[0].category,
      subcategory: stagedConditions[0].subcategory,
      bid,
      suggestedBid: bidRange.recommended,
      bidRange: { min: bidRange.min, max: bidRange.max },
      conditions: isCompound ? stagedConditions : undefined,
    };
    updateDraft({ audienceSegments: [...draft.audienceSegments, newSegment] });
    setStagedConditions([]);
    setSegmentBid("");
  };

  const removeBrandSegment = (segmentId: string) => {
    updateDraft({ audienceSegments: draft.audienceSegments.filter(s => s.id !== segmentId) });
  };

  const updateBrandSegmentBid = (segmentId: string, bid: number) => {
    updateDraft({ audienceSegments: draft.audienceSegments.map(s => s.id === segmentId ? { ...s, bid } : s) });
  };

  const applyBrandBulkBid = (mode: "custom" | "aggressive" | "recommended") => {
    updateDraft({
      audienceSegments: draft.audienceSegments.map(s => ({
        ...s,
        bid: mode === "custom" ? parseFloat(brandCustomBulkBid) || s.bid : mode === "aggressive" ? s.bidRange.max : s.suggestedBid
      }))
    });
    setShowBrandBulkBidMenu(false);
  };

  // Calculate recommended slot multiplier based on targeting mode
  const recommendedSlotMultiplier = slotTargetingMode === "include" 
    ? (draft.slotIds.length <= 3 ? 25 : draft.slotIds.length <= 10 ? 15 : 10)
    : slotTargetingMode === "exclude"
      ? (draft.excludedSlotIds.length >= 10 ? 5 : 0)
      : 0;


  return (
    <section 
      ref={sectionRef}
      id="targeting" 
      className="scroll-mt-36"
    >
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Targeting & Serving Controls</h2>
          <p className="text-sm text-gray-500 mb-6">Add audience targets with individual CPM bids</p>
          
          {/* 1. Audience Targeting - Same as Seller Flow */}
          <div className="mb-6 pb-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Audience Targeting</h3>
                <p className="text-xs text-gray-500">Add targets with individual CPM bids in USD</p>
              </div>
            </div>
            
            {/* Recommended Audiences - Based on Landing Page */}
            {(draft.landingPageUrl || draft.builderConfig.products.length > 0) && (() => {
              const selectedProducts = products.filter(p => draft.builderConfig.products.includes(p.id));
              const productCategories = [...new Set(selectedProducts.map(p => p.category).filter(Boolean))];
              const productBrands = [...new Set(selectedProducts.map(p => p.brand).filter(Boolean))];
              
              const recommendations = [
                { id: "viewed_products", name: "Viewed Similar Products", description: "30d lookback", type: "reengagement" as const, bidRange: getBrandBidRange("viewed_products", "category") },
                { id: "cart_abandoners", name: "Cart Abandoners", description: "7d lookback", type: "reengagement" as const, bidRange: getBrandBidRange("added_to_cart", "category") },
                { id: "past_purchasers", name: "Past Purchasers", description: "90d lookback", type: "reengagement" as const, bidRange: getBrandBidRange("purchased_products", "category") },
                ...(productBrands.length > 0 ? [{ id: `brand_${productBrands[0]}`, name: `${brands.find(b => b.id === productBrands[0])?.name || "Brand"} Shoppers`, description: "Brand affinity", type: "reengagement" as const, bidRange: getBrandBidRange("viewed_products", "brand") }] : []),
              ];
              
              const addedRecIds = draft.audienceSegments.map(s => s.id);
              const availableRecs = recommendations.filter(r => !addedRecIds.includes(r.id));
              const allRecsAdded = availableRecs.length === 0;
              
              const addRecommendation = (rec: typeof recommendations[0]) => {
                const newSegment = {
                  id: rec.id,
                  type: rec.type,
                  name: rec.name,
                  description: rec.description,
                  bid: rec.bidRange.recommended,
                  suggestedBid: rec.bidRange.recommended,
                  bidRange: { min: rec.bidRange.min, max: rec.bidRange.max },
                };
                updateDraft({ audienceSegments: [...draft.audienceSegments, newSegment] });
              };
              
              // Add all recommendations at once (batch update to avoid stale state)
              const addAllRecommendations = () => {
                const newSegments = availableRecs.map(rec => ({
                  id: rec.id,
                  type: rec.type,
                  name: rec.name,
                  description: rec.description,
                  bid: rec.bidRange.recommended,
                  suggestedBid: rec.bidRange.recommended,
                  bidRange: { min: rec.bidRange.min, max: rec.bidRange.max },
                }));
                updateDraft({ audienceSegments: [...draft.audienceSegments, ...newSegments] });
              };
              
              return (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Recommended Audiences</p>
                      <p className="text-xs text-amber-600">Based on your landing page configuration</p>
                    </div>
                  </div>
                  {allRecsAdded ? (
                    <button
                      onClick={() => {
                        const recIds = recommendations.map(r => r.id);
                        updateDraft({ audienceSegments: draft.audienceSegments.filter(s => !recIds.includes(s.id)) });
                      }}
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
                  {allRecsAdded && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      All recommendations added
                    </span>
                  )}
                </div>
              </div>
              );
            })()}
            
            {/* Audience Targeting - Bucket Layout */}
            <div className="grid grid-cols-12 gap-4 items-start">
              {/* Left Panel - Add Targets */}
              <div className="col-span-5 space-y-3" id="brand-targeting-left">
                {/* Re-engagement Bucket */}
                <div className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setBrandTargetingCategory(brandTargetingCategory === "reengagement" ? null : "reengagement")}
                    className="w-full p-3 bg-gray-50 text-left flex items-center justify-between hover:bg-gray-100"
                  >
                    <span className="font-medium text-gray-900">Re-engagement</span>
                    <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform", brandTargetingCategory === "reengagement" && "rotate-180")} />
                  </button>
                  {brandTargetingCategory === "reengagement" && (
                    <div className="p-4 space-y-3 bg-white">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Action</label>
                        <select value={reengAction} onChange={(e) => { setReengAction(e.target.value); setReengTargetType(""); setReengTargetValue(""); setReengBid(""); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                          <option value="">Select action...</option>
                          <option value="viewed_products">Viewed Products</option>
                          <option value="purchased_products">Purchased Products</option>
                          <option value="added_to_cart">Added to Cart</option>
                        </select>
                      </div>
                      <div className={cn(!reengAction && "opacity-40 pointer-events-none")}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Lookback Window</label>
                        <select value={reengLookback} onChange={(e) => setReengLookback(e.target.value)} disabled={!reengAction} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white disabled:bg-gray-50">
                          <option value="14">14 days</option>
                          <option value="30">30 days</option>
                          <option value="60">60 days</option>
                          <option value="90">90 days</option>
                          <option value="365">365 days</option>
                        </select>
                      </div>
                      <div className={cn(!reengAction && "opacity-40 pointer-events-none")}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Target Type</label>
                        <select value={reengTargetType} onChange={(e) => { setReengTargetType(e.target.value); setReengTargetValue(""); setReengBid(""); }} disabled={!reengAction} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white disabled:bg-gray-50">
                          <option value="">Select type...</option>
                          <option value="brand">Brand</option>
                          <option value="category">Category</option>
                        </select>
                      </div>
                      <div className={cn(!reengTargetType && "opacity-40 pointer-events-none")}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{reengTargetType === "brand" ? "Brand" : reengTargetType === "category" ? "Category" : "Select Value"}</label>
                        <select value={reengTargetValue} onChange={(e) => { setReengTargetValue(e.target.value); if (e.target.value && reengAction && reengTargetType) { const r = getBrandBidRange(reengAction, reengTargetType); setReengBid(r.recommended.toFixed(2)); } }} disabled={!reengTargetType} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white disabled:bg-gray-50">
                          <option value="">Select {reengTargetType || "value"}...</option>
                          {reengTargetType === "brand" && brands.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                          {reengTargetType === "category" && categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                      </div>
                      <button onClick={stageReengagementCondition} disabled={!reengAction || !reengTargetType || !reengTargetValue} className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-600 flex items-center justify-center gap-1.5">
                        <Plus className="w-3.5 h-3.5" />
                        Add to Segment
                      </button>
                    </div>
                  )}
                </div>

                {/* Demographic Bucket */}
                <div className="border rounded-lg overflow-hidden">
                  <button onClick={() => setBrandTargetingCategory(brandTargetingCategory === "demographic" ? null : "demographic")} className="w-full p-3 bg-gray-50 text-left flex items-center justify-between hover:bg-gray-100">
                    <span className="font-medium text-gray-900">Demographic</span>
                    <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform", brandTargetingCategory === "demographic" && "rotate-180")} />
                  </button>
                  {brandTargetingCategory === "demographic" && (
                    <div className="p-4 space-y-3 bg-white">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                        <select value={demoType} onChange={(e) => { setDemoType(e.target.value); setDemoValue(""); setDemoBid(""); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                          <option value="">Select type...</option>
                          <option value="age">Age Range</option>
                          <option value="gender">Gender</option>
                          <option value="income">Income Level</option>
                        </select>
                      </div>
                      <div className={cn(!demoType && "opacity-40 pointer-events-none")}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{demoType === "age" ? "Age Range" : demoType === "gender" ? "Gender" : demoType === "income" ? "Income Level" : "Value"}</label>
                        <select value={demoValue} onChange={(e) => { setDemoValue(e.target.value); if (e.target.value && demoType) { const r = getBrandBidRange("", "", demoType); setDemoBid(r.recommended.toFixed(2)); } }} disabled={!demoType} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white disabled:bg-gray-50">
                          <option value="">Select value...</option>
                          {demoType === "age" && <><option value="18_24">18-24</option><option value="25_34">25-34</option><option value="35_44">35-44</option><option value="45_54">45-54</option><option value="55_plus">55+</option></>}
                          {demoType === "gender" && <><option value="male">Male</option><option value="female">Female</option></>}
                          {demoType === "income" && <><option value="low">Low Income</option><option value="medium">Medium Income</option><option value="high">High Income</option></>}
                          {!demoType && <option value="" disabled>Select type first</option>}
                        </select>
                      </div>
                      <button onClick={stageDemographicCondition} disabled={!demoType || !demoValue} className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-600 flex items-center justify-center gap-1.5">
                        <Plus className="w-3.5 h-3.5" />
                        Add to Segment
                      </button>
                    </div>
                  )}
                </div>

                {/* In-Market Bucket */}
                <div className="border rounded-lg overflow-hidden">
                  <button onClick={() => setBrandTargetingCategory(brandTargetingCategory === "in_market" ? null : "in_market")} className="w-full p-3 bg-gray-50 text-left flex items-center justify-between hover:bg-gray-100">
                    <span className="font-medium text-gray-900">In-Market</span>
                    <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform", brandTargetingCategory === "in_market" && "rotate-180")} />
                  </button>
                  {brandTargetingCategory === "in_market" && (
                    <div className="p-4 space-y-3 bg-white">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                        <select value={inMarketCategory} onChange={(e) => { setInMarketCategory(e.target.value); setInMarketSubcategory(""); if (e.target.value) { const r = getBrandBidRange("in_market", e.target.value); setInMarketBid(r.recommended.toFixed(2)); } else { setInMarketBid(""); } }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                          <option value="">Select category...</option>
                          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                      </div>
                      <div className={cn(!inMarketCategory && "opacity-40 pointer-events-none")}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Subcategory <span className="text-gray-400">(optional)</span></label>
                        <select value={inMarketSubcategory} onChange={(e) => setInMarketSubcategory(e.target.value)} disabled={!inMarketCategory} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white disabled:bg-gray-50">
                          <option value="">All subcategories</option>
                          {inMarketCategory && (() => {
                            const cat = categories.find(c => c.id === inMarketCategory);
                            return (cat?.subcategories || []).map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>);
                          })()}
                        </select>
                      </div>
                      <button onClick={stageInMarketCondition} disabled={!inMarketCategory} className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-600 flex items-center justify-center gap-1.5">
                        <Plus className="w-3.5 h-3.5" />
                        Add to Segment
                      </button>
                    </div>
                  )}
                </div>

                {/* Staging Area: Segment Builder */}
                <div className={cn(
                  "border-2 rounded-lg transition-all",
                  stagedConditions.length > 0 
                    ? "border-primary-400 bg-primary-50/50" 
                    : "border-dashed border-gray-300 bg-gray-50/50"
                )}>
                  <div className="px-3 py-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700">
                      Segment Builder {stagedConditions.length > 0 && `(${stagedConditions.length} condition${stagedConditions.length !== 1 ? "s" : ""})`}
                    </span>
                    {stagedConditions.length > 0 && (
                      <button 
                        onClick={() => { setStagedConditions([]); setSegmentBid(""); }}
                        className="text-[10px] text-gray-400 hover:text-red-500"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  
                  {stagedConditions.length === 0 ? (
                    <div className="px-3 pb-3">
                      <p className="text-[11px] text-gray-400 text-center py-2">
                        Use the buckets above to add conditions. Multiple conditions will be ANDed together.
                      </p>
                    </div>
                  ) : (
                    <div className="px-3 pb-3 space-y-2">
                      {/* Condition chips */}
                      <div className="flex flex-wrap gap-1.5">
                        {stagedConditions.map((cond, idx) => (
                          <div key={idx} className="flex items-center">
                            {idx > 0 && (
                              <span className="text-[9px] font-bold text-primary-600 bg-primary-100 px-1.5 py-0.5 rounded mr-1.5">AND</span>
                            )}
                            <div className="flex items-center gap-1 px-2 py-1 bg-white border border-primary-300 rounded-full text-[11px]">
                              <span className="text-[9px] px-1 py-0.5 rounded bg-primary-100 text-primary-700 font-medium uppercase">
                                {cond.type === "in_market" ? "IM" : cond.type === "reengagement" ? "RE" : "DM"}
                              </span>
                              <span className="text-gray-800 font-medium truncate max-w-[120px]">{cond.name}</span>
                              <button
                                onClick={() => removeStagedCondition(idx)}
                                className="ml-0.5 text-gray-400 hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Bid input + Add Segment button */}
                      <div className="flex items-center gap-2 pt-1">
                        <div className="relative flex-1">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={segmentBid}
                            onChange={(e) => setSegmentBid(e.target.value)}
                            placeholder={getStagedBidRange().recommended.toFixed(2)}
                            className="w-full pl-6 pr-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                          {getStagedBidRange().min.toFixed(2)}-{getStagedBidRange().max.toFixed(2)}
                        </span>
                        <button
                          onClick={commitStagedSegment}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 whitespace-nowrap shrink-0"
                        >
                          Add Segment →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel - Added Segments */}
              <div className="col-span-7">
                <div className="border rounded-lg overflow-hidden flex flex-col h-fit max-h-[520px]">
                  <div className="p-3 bg-gray-50 border-b flex items-center justify-between">
                    <span className="font-medium text-gray-900">{draft.audienceSegments.length} Segment{draft.audienceSegments.length !== 1 ? "s" : ""} Added</span>
                    <div className="flex items-center gap-2">
                      {draft.audienceSegments.length > 0 && (
                        <>
                          <div className="relative">
                            <button onClick={() => setShowBrandBulkBidMenu(!showBrandBulkBidMenu)} className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                              Apply bid to all <ChevronDown className="w-3 h-3" />
                            </button>
                            {showBrandBulkBidMenu && (
                              <div className="absolute right-0 top-full mt-1 w-64 bg-white border rounded-lg shadow-lg z-20">
                                <div className="p-2 border-b">
                                  <div className="text-xs font-medium text-gray-700 mb-1">Custom CPM Bid (USD)</div>
                                  <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">$</span>
                                      <input type="text" inputMode="decimal" value={brandCustomBulkBid} onChange={(e) => setBrandCustomBulkBid(e.target.value)} className="w-full pl-6 pr-2 py-1 border rounded text-sm" />
                                    </div>
                                    <button onClick={() => applyBrandBulkBid("custom")} className="px-2 py-1 bg-primary-500 text-white rounded text-xs font-medium hover:bg-primary-600">Apply</button>
                                  </div>
                                </div>
                                <button onClick={() => applyBrandBulkBid("aggressive")} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between">
                                  <span>Aggressive Bid</span><span className="text-xs text-gray-500">Max for each target</span>
                                </button>
                                <button onClick={() => applyBrandBulkBid("recommended")} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between border-t">
                                  <span>Recommended Bid</span><span className="text-xs text-gray-500">Optimal for each target</span>
                                </button>
                              </div>
                            )}
                          </div>
                          <span className="text-gray-300">|</span>
                          <button onClick={() => updateDraft({ audienceSegments: [] })} className="text-xs text-red-500 hover:text-red-700">Clear all</button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3">
                    {draft.audienceSegments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <Users className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-sm">No segments added</p>
                        <p className="text-xs">Build a segment using the buckets on the left, then add it</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {draft.audienceSegments.map(seg => (
                          <div key={seg.id} className="p-2.5 bg-primary-50 border border-primary-200 rounded-lg">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                {seg.conditions && seg.conditions.length > 1 ? (
                                  /* Compound segment: show ANDed conditions */
                                  <div>
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-bold uppercase">AND Group</span>
                                      <span className="text-[10px] text-gray-400">{seg.conditions.length} conditions</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {seg.conditions.map((cond, idx) => (
                                        <div key={idx} className="flex items-center">
                                          {idx > 0 && (
                                            <span className="text-[8px] font-bold text-primary-500 mx-1">AND</span>
                                          )}
                                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white border border-primary-200 rounded text-[10px]">
                                            <span className="text-[8px] px-1 py-0.5 rounded bg-primary-100 text-primary-700 font-medium uppercase">
                                              {cond.type === "in_market" ? "IM" : cond.type === "reengagement" ? "RE" : "DM"}
                                            </span>
                                            <span className="text-gray-700 truncate max-w-[100px]">{cond.name}</span>
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  /* Simple single-condition segment */
                                  <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-100 text-primary-700 font-medium uppercase">{seg.type === "in_market" ? "In-Market" : seg.type}</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900 truncate">{seg.name}</p>
                                    {seg.description && <p className="text-xs text-gray-500">{seg.description}</p>}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="text-right">
                                  <div className="relative">
                                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">$</span>
                                    <input type="text" inputMode="decimal" value={seg.bid.toFixed(2)} onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) updateBrandSegmentBid(seg.id, v); }} className="w-16 pl-4 pr-1 py-1 border rounded text-xs text-right" />
                                  </div>
                                  <span className="text-[9px] text-gray-400">{seg.bidRange.min.toFixed(2)}-{seg.bidRange.max.toFixed(2)}</span>
                                </div>
                                <button onClick={() => removeBrandSegment(seg.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
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

          {/* 2. Slot Targeting (CPM only) */}
          {draft.pricingModel === "cpm" && (
            <div className="mb-6 pb-6 border-b">
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
                      onSlotTargetingModeChange(mode.value as "all" | "include" | "exclude");
                      if (mode.value === "all") {
                        updateDraft({ slotIds: [], excludedSlotIds: [] });
                      }
                    }}
                    className={cn(
                      "flex-1 p-3 rounded-lg border-2 text-left transition-all",
                      slotTargetingMode === mode.value
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="text-sm font-medium text-gray-900">{mode.label}</div>
                    <div className="text-xs text-gray-500">{mode.desc}</div>
                  </button>
                ))}
              </div>
              
              {/* CPT Booking Conflict Warning - Minimized by default */}
              {slotsWithCptBookings.length > 0 && (
                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setShowAllCptConflicts(!showAllCptConflicts)}
                    className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-amber-100/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-800">CPT Bookings Detected</span>
                      <span className="text-xs px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full font-medium">
                        {slotsWithCptBookings.length} slot{slotsWithCptBookings.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <ChevronDown className={cn("w-4 h-4 text-amber-600 transition-transform", showAllCptConflicts && "rotate-180")} />
                  </button>
                  {showAllCptConflicts && (
                    <div className="px-4 pb-3 pt-1 border-t border-amber-200">
                      <p className="text-xs text-amber-600 mb-2">
                        Your CPM ads won&apos;t serve on these slots during booked periods:
                      </p>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {slotsWithCptBookings.map(conflict => (
                          <div 
                            key={conflict.slotId} 
                            className="flex items-center justify-between py-1.5 px-2.5 bg-white rounded border border-amber-200"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs text-amber-800 font-medium truncate">
                                {conflict.pageName}
                              </span>
                              <ChevronRight className="w-3 h-3 text-amber-400 shrink-0" />
                              <span className="text-xs text-amber-700 truncate">
                                {conflict.slotName}
                              </span>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full shrink-0 ml-2">
                              {conflict.dates.length} day{conflict.dates.length > 1 ? "s" : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Slot Selection - Left/Right Layout */}
              {slotTargetingMode !== "all" && (
                <div className="grid grid-cols-12 gap-3">
                  {/* Left: Available Slots */}
                  <div className="col-span-7 border rounded-lg overflow-hidden">
                    {/* Filters */}
                    <div className="bg-gray-50 p-2 border-b flex gap-2 items-center">
                      <select
                        value={slotPageFilter}
                        onChange={(e) => setSlotPageFilter(e.target.value)}
                        className="w-36 px-2 py-1 border border-gray-300 rounded text-xs"
                      >
                        <option value="all">All Pages</option>
                        {pages.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <div className="flex-1 relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search..."
                          value={slotSearchQuery}
                          onChange={(e) => setSlotSearchQuery(e.target.value)}
                          className="w-full pl-7 pr-2 py-1 border border-gray-300 rounded text-xs"
                        />
                      </div>
                    </div>
                    
                    {/* Zones List - For CPM, show zones instead of individual slots */}
                    <div className="max-h-48 overflow-y-auto">
                      {pages
                        .filter(p => slotPageFilter === "all" || p.id === slotPageFilter)
                        .map(page => {
                          const pageSlots = slots
                            .filter(s => s.pageId === page.id)
                            .filter(s => !slotSearchQuery || (s.zone || s.name).toLowerCase().includes(slotSearchQuery.toLowerCase()));
                          
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
                          
                          const toggleAllPageSlots = () => {
                            const pageSlotIds = pageSlots.map(s => s.id);
                            if (slotTargetingMode === "include") {
                              const newIds = allPageSelected 
                                ? draft.slotIds.filter(id => !pageSlotIds.includes(id))
                                : [...new Set([...draft.slotIds, ...pageSlotIds])];
                              updateDraft({ slotIds: newIds });
                            } else {
                              const newIds = allPageSelected
                                ? draft.excludedSlotIds.filter(id => !pageSlotIds.includes(id))
                                : [...new Set([...draft.excludedSlotIds, ...pageSlotIds])];
                              updateDraft({ excludedSlotIds: newIds });
                            }
                          };
                          
                          return (
                            <div key={page.id}>
                              <div className="px-2 py-1 bg-gray-100 text-xs font-medium text-gray-600 sticky top-0 flex justify-between items-center border-b">
                                <span>{page.name}</span>
                                <button onClick={toggleAllPageSlots} className="text-xs text-primary-600 hover:underline">
                                  {allPageSelected ? "−" : "+"}All
                                </button>
                              </div>
                              {/* Show zones instead of individual slots */}
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
                                    className={cn(
                                      "px-2 py-1.5 flex items-center gap-2 cursor-pointer border-b last:border-b-0 text-xs",
                                      isZoneSelected && slotTargetingMode === "include" && "bg-primary-50",
                                      isZoneSelected && slotTargetingMode === "exclude" && "bg-red-50"
                                    )}
                                  >
                                    <div className={cn(
                                      "w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0",
                                      isZoneSelected && slotTargetingMode === "include" && "bg-primary-500 border-primary-500",
                                      isZoneSelected && slotTargetingMode === "exclude" && "bg-red-500 border-red-500",
                                      !isZoneSelected && "border-gray-300"
                                    )}>
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
                  <div className={cn(
                    "col-span-5 border rounded-lg overflow-hidden",
                    slotTargetingMode === "include" ? "border-primary-200" : "border-red-200"
                  )}>
                    <div className={cn(
                      "px-3 py-2 border-b flex items-center justify-between",
                      slotTargetingMode === "include" ? "bg-primary-50" : "bg-red-50"
                    )}>
                      <span className={cn(
                        "text-xs font-medium",
                        slotTargetingMode === "include" ? "text-primary-700" : "text-red-700"
                      )}>
                        {slotTargetingMode === "include" ? "Included Zones" : "Excluded Zones"}
                      </span>
                      {((slotTargetingMode === "include" && draft.slotIds.length > 0) || 
                        (slotTargetingMode === "exclude" && draft.excludedSlotIds.length > 0)) && (
                        <button
                          onClick={() => {
                            if (slotTargetingMode === "include") {
                              updateDraft({ slotIds: [] });
                              onSlotGroupMultipliersChange({});
                            } else {
                              updateDraft({ excludedSlotIds: [] });
                            }
                          }}
                          className="text-xs text-gray-500 hover:text-red-600"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className={cn(
                      "overflow-y-auto p-2",
                      slotTargetingMode === "include" ? "max-h-72" : "max-h-48"
                    )}>
                      {((slotTargetingMode === "include" && draft.slotIds.length === 0) || 
                        (slotTargetingMode === "exclude" && draft.excludedSlotIds.length === 0)) ? (
                        <div className="text-center py-6 text-gray-400 text-xs">
                          <Layers className="w-6 h-6 mx-auto mb-2 opacity-50" />
                          No zones {slotTargetingMode === "include" ? "selected" : "excluded"}
                        </div>
                      ) : slotTargetingMode === "include" ? (
                        /* Include mode: group by page with per-group multiplier */
                        <div className="space-y-3">
                          {(() => {
                            const selectedSlots = slots.filter(s => draft.slotIds.includes(s.id));
                            // Group by page
                            const groupedByPage: Record<string, { page: typeof pages[0]; zones: Record<string, string[]> ; totalViews: number }> = {};
                            
                            selectedSlots.forEach(slot => {
                              const page = pages.find(p => p.id === slot.pageId);
                              if (!page) return;
                              if (!groupedByPage[page.id]) {
                                groupedByPage[page.id] = { page, zones: {}, totalViews: 0 };
                              }
                              const zoneName = slot.zone || slot.name;
                              if (!groupedByPage[page.id].zones[zoneName]) {
                                groupedByPage[page.id].zones[zoneName] = [];
                              }
                              groupedByPage[page.id].zones[zoneName].push(slot.id);
                              groupedByPage[page.id].totalViews += slot.avgDailyViews;
                            });
                            
                            return Object.entries(groupedByPage).map(([pageId, { page, zones, totalViews }]) => {
                              const zoneCount = Object.keys(zones).length;
                              // Recommended multiplier: higher for premium/low-inventory pages, lower for high-traffic
                              const recommended = totalViews > 5000000 ? 5 : totalViews > 1000000 ? 10 : totalViews > 500000 ? 15 : 25;
                              const currentMultiplier = slotGroupMultipliers[pageId] ?? String(recommended);
                              
                              return (
                                <div key={pageId} className="bg-primary-50 rounded-lg overflow-hidden border border-primary-200">
                                  {/* Page header with multiplier */}
                                  <div className="px-3 py-2 flex items-center justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-gray-900 truncate">{page.name}</span>
                                        <span className="text-[10px] text-gray-400 shrink-0">{zoneCount} zone{zoneCount !== 1 ? "s" : ""}</span>
                                      </div>
                                      <span className="text-[10px] text-gray-400">
                                        {totalViews >= 1000000 ? `${(totalViews / 1000000).toFixed(1)}M` : `${Math.round(totalViews / 1000)}K`} views/day
                                      </span>
                                    </div>
                                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                                      <div className="relative">
                                        <input
                                          type="text"
                                          inputMode="decimal"
                                          value={currentMultiplier}
                                          onChange={(e) => {
                                            onSlotGroupMultipliersChange({
                                              ...slotGroupMultipliers,
                                              [pageId]: e.target.value,
                                            });
                                          }}
                                          className="w-14 px-1.5 py-1 border border-amber-300 rounded text-xs text-right pr-4 bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                                        />
                                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-amber-600 text-[10px]">%</span>
                                      </div>
                                      <span className="text-[9px] text-amber-600">Rec: {recommended}%</span>
                                    </div>
                                  </div>
                                  {/* Zone list */}
                                  <div className="border-t border-primary-200">
                                    {Object.entries(zones).map(([zoneName, zoneSlotIds]) => (
                                      <div key={zoneName} className="px-3 py-1 flex items-center justify-between text-[11px] border-b last:border-b-0 border-primary-100">
                                        <span className="text-gray-600 truncate">{zoneName}</span>
                                        <button
                                          onClick={() => {
                                            const newSlotIds = draft.slotIds.filter(i => !zoneSlotIds.includes(i));
                                            updateDraft({ slotIds: newSlotIds });
                                            // If page has no more slots, remove its multiplier
                                            const remainingSlotsForPage = slots.filter(s => s.pageId === pageId && newSlotIds.includes(s.id));
                                            if (remainingSlotsForPage.length === 0) {
                                              const newMultipliers = { ...slotGroupMultipliers };
                                              delete newMultipliers[pageId];
                                              onSlotGroupMultipliersChange(newMultipliers);
                                            }
                                          }}
                                          className="ml-2 text-gray-400 hover:text-red-600 shrink-0"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      ) : (
                        /* Exclude mode: flat list as before */
                        <div className="space-y-1">
                          {(() => {
                            const selectedIds = draft.excludedSlotIds;
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
                            
                            return Object.entries(groupedByPageZone).map(([key, { page, zone, slotIds }]) => (
                              <div 
                                key={key}
                                className="flex items-center justify-between px-2 py-1.5 rounded text-xs bg-red-100"
                              >
                                <div className="truncate flex-1">
                                  <span className="text-gray-500">{page?.name}:</span> {zone}
                                </div>
                                <button
                                  onClick={() => {
                                    updateDraft({ excludedSlotIds: draft.excludedSlotIds.filter(i => !slotIds.includes(i)) });
                                  }}
                                  className="ml-2 text-gray-400 hover:text-red-600"
                                >
                                  ×
                                </button>
                              </div>
                            ));
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Slot Multiplier - only for exclude mode (include mode has per-group multipliers above) */}
              {slotTargetingMode === "exclude" && draft.excludedSlotIds.length > 0 && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-amber-900 mb-1">Slot Multiplier</h4>
                      <p className="text-xs text-amber-700 mb-3">
                        {`Excluding ${draft.excludedSlotIds.length} slot${draft.excludedSlotIds.length !== 1 ? "s" : ""} may benefit from a bid adjustment`}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-amber-800">Add</span>
                          <div className="relative">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={slotMultiplier}
                              onChange={(e) => onSlotMultiplierChange(e.target.value)}
                              className="w-16 px-2 py-1.5 border border-amber-300 rounded-lg text-sm text-right pr-6 bg-white"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-600 text-sm">%</span>
                          </div>
                          <span className="text-sm text-amber-800">to all target bids</span>
                        </div>
                        <div className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">
                          Recommended: {recommendedSlotMultiplier}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. Frequency Capping - Compact */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-medium text-gray-700">Frequency Capping</h3>
                {!draft.frequencyCapEnabled && (
                  <span className="text-xs text-gray-400">Unlimited views per user</span>
                )}
              </div>
              <Toggle
                checked={draft.frequencyCapEnabled}
                onChange={(checked) => updateDraft({ frequencyCapEnabled: checked })}
                label=""
              />
            </div>
            
            {draft.frequencyCapEnabled && (
              <div className="flex items-center gap-2 mt-3 p-2 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Max</span>
                <input
                  type="number"
                  value={draft.maxViews}
                  onChange={(e) => updateDraft({ maxViews: parseInt(e.target.value) || 1 })}
                  min={1}
                  className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center bg-white"
                />
                <span className="text-sm text-gray-600">views per</span>
                <select
                  value={draft.frequencyPeriod}
                  onChange={(e) => updateDraft({ frequencyPeriod: e.target.value })}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="hourly">Hour</option>
                  <option value="daily">Day</option>
                  <option value="weekly">Week</option>
                </select>
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
