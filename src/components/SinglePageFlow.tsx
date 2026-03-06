"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useCampaign } from "@/context/CampaignContext";
import { Card, CardContent } from "@/components/ui/Card";
import { RadioCard } from "@/components/ui/RadioCard";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";
import { Button } from "@/components/ui/Button";
import { cn, formatNumber, formatCurrency } from "@/lib/utils";
import { CreativesSection } from "@/components/sections/CreativesSection";
import LandingPageSection from "@/components/sections/LandingPageSection";
import { SellerTargetingSection } from "@/components/sections/SellerTargetingSection";
import { BrandTargetingSection } from "@/components/sections/BrandTargetingSection";
import BiddingSection from "@/components/sections/BiddingSection";
import { CptBookingSection } from "@/components/sections/CptBookingSection";
import { 
  countries, 
  marketplaces,
  pages,
  slots, 
  brands, 
  categories, 
  sellers as sellersList, 
  fulfillmentOptions, 
  products,
  bookedTimeSlots 
} from "@/lib/mock-data";
import { SlotType, Marketplace } from "@/lib/types";
import {
  Building2,
  Store,
  Globe,
  Calendar,
  DollarSign,
  Target,
  BarChart3,
  Image,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  AlertCircle,
  Clock,
  Filter,
  Search,
  Package,
  ShoppingBag,
  ExternalLink,
  Users,
  Layers,
  Info,
  X,
} from "lucide-react";

// Section IDs for navigation - dynamic based on pricing model
const getCPMSections = () => [
  { id: "entry", label: "Entry", icon: Building2 },
  { id: "campaign-type", label: "Type", icon: Users },
  { id: "pricing-model", label: "Pricing", icon: DollarSign },
  { id: "schedule", label: "Details", icon: Calendar },
  { id: "landing", label: "Landing", icon: ExternalLink },
  { id: "targeting", label: "Targeting", icon: Target },
  { id: "bidding", label: "Bidding", icon: BarChart3 },
  { id: "creatives", label: "Creatives", icon: Image },
];

const getCPTSections = () => [
  { id: "entry", label: "Entry", icon: Building2 },
  { id: "campaign-type", label: "Type", icon: Users },
  { id: "pricing-model", label: "Pricing", icon: DollarSign },
  { id: "cpt-calendar", label: "Details", icon: Clock },
  { id: "landing", label: "Landing", icon: ExternalLink },
  { id: "creatives", label: "Creatives", icon: Image },
];

const getSellerSections = () => [
  { id: "entry", label: "Entry", icon: Building2 },
  { id: "seller-schedule", label: "Details", icon: Calendar },
  { id: "landing", label: "Landing", icon: ExternalLink },
  { id: "seller-targeting", label: "Targeting", icon: Target },
  { id: "creatives", label: "Creatives", icon: Image },
];

// Helper function to generate calendar days for a given month
const getCalendarDays = (month: Date): (Date | null)[] => {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const days: (Date | null)[] = [];
  
  // Pad start with nulls for days before the 1st
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push(null);
  }
  
  // Fill in the actual days of the month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(month.getFullYear(), month.getMonth(), d));
  }
  
  // Pad end to complete the grid (optional, for consistent 6-row layout)
  while (days.length % 7 !== 0) {
    days.push(null);
  }
  
  return days;
};

// Hours available for booking (12 AM to 12 AM = 24 hours, midnight to midnight)
const BOOKING_HOURS = Array.from({ length: 24 }, (_, i) => {
  return {
    value: i,
    label: `${i.toString().padStart(2, "0")}:00`,
    display: i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`,
  };
});

interface SinglePageFlowProps {
  onCampaignSubmit?: () => void;
}

export function SinglePageFlow({ onCampaignSubmit }: SinglePageFlowProps) {
  const { draft, updateDraft } = useCampaign();
  const isBookingLinked = !!draft.linkedBookingId;
  const [activeSection, setActiveSection] = useState("entry");
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Local state for form inputs
  const [budgetStr, setBudgetStr] = useState(draft.budget.toString());
  const [bidAmountStr, setBidAmountStr] = useState(draft.bidAmount.toString());
  
  // Credits state - mock available credits per currency
  const [useCredits, setUseCredits] = useState(false);
  const availableCredits: Record<string, number> = {
    USD: 5000,
    AED: 18500,
    SAR: 19000,
    EGP: 155000,
  };
  
  // CPT slot reservation state
  const [slotsReserved, setSlotsReserved] = useState(false);
  
  // (URL validation, CPT calendar, landing page builder, creative, and template states
  // have been moved into their respective section components)
  
  // Date picker state
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [datePickerMonth, setDatePickerMonth] = useState(new Date());
  
  // Slot targeting mode (shared with BrandTargetingSection for computed values)
  const [slotTargetingMode, setSlotTargetingMode] = useState<"all" | "include" | "exclude">("all");
  
  // Slot filter state (for pricing model slot selection)
  const [slotPageFilter, setSlotPageFilter] = useState<string>("all");
  const [slotSearchQuery, setSlotSearchQuery] = useState("");
  
  // Seller schedule date pickers
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [endCalendarMonth, setEndCalendarMonth] = useState(new Date());
  
  // (Seller/brand targeting form state moved into SellerTargetingSection and BrandTargetingSection)
  
  // Slot multiplier for brand targeting
  const [slotMultiplier, setSlotMultiplier] = useState("0");
  // Per-group (page-level) multipliers for include mode: Record<pageId, multiplier string>
  const [slotGroupMultipliers, setSlotGroupMultipliers] = useState<Record<string, string>>({});
  
  // Today's date (normalized to midnight for comparisons)
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  
  // (Product page reset effects moved to LandingPageSection)

  // Get sections based on entry type and pricing model
  const SECTIONS = useMemo(() => {
    if (draft.entryType === "seller") return getSellerSections();
    return draft.pricingModel === "cpt" ? getCPTSections() : getCPMSections();
  }, [draft.entryType, draft.pricingModel]);

  // Track if we're programmatically scrolling (to avoid scroll spy conflicts)
  const isScrollingRef = useRef(false);

  // Get selected country data
  const selectedCountry = countries.find(c => c.code === draft.country);

  // Get slot dimensions for selected country
  const getSlotDimensions = (slot: typeof slots[0]) => {
    if (slot.dimensionsByCountry && draft.country) {
      return slot.dimensionsByCountry[draft.country] || slot.dimensions;
    }
    return slot.dimensions;
  };

  // Filter slots based on pricing model
  const availableSlots = slots;
  const selectedSlots = slots.filter(s => draft.slotIds.includes(s.id));
  const excludedSlots = slots.filter(s => draft.excludedSlotIds.includes(s.id));

  // Group slots by type for creatives
  const slotsByType = useMemo(() => {
    const groups: Record<SlotType, typeof slots> = {
      mobile_hero: [],
      mobile_slim: [],
      desktop_hero: [],
      desktop_slim: [],
    };
    
    const relevantSlots = draft.pricingModel === "cpt" 
      ? selectedSlots 
      : slots.filter(s => !draft.excludedSlotIds.includes(s.id));
    
    relevantSlots.forEach(slot => {
      if (groups[slot.slotType]) {
        groups[slot.slotType].push(slot);
      }
    });
    
    return groups;
  }, [draft.pricingModel, draft.slotIds, draft.excludedSlotIds, selectedSlots]);

  // Check which creative sizes are missing
  const missingCreativeSizes = useMemo(() => {
    const missing: SlotType[] = [];
    const allSlotTypes: SlotType[] = ["mobile_hero", "mobile_slim", "desktop_hero", "desktop_slim"];
    
    allSlotTypes.forEach(type => {
      const hasCreative = draft.creatives.some(c => c.slotType === type && c.assetUrl);
      if (!hasCreative && slotsByType[type].length > 0) {
        missing.push(type);
      }
    });
    
    return missing;
  }, [draft.creatives, slotsByType]);

  // Estimated reach calculation - accounts for slot targeting mode
  const estimatedReach = useMemo(() => {
    let total = 0;
    let relevantSlots: typeof slots = [];
    
    if (draft.pricingModel === "cpt") {
      relevantSlots = selectedSlots;
    } else {
      // CPM slot targeting modes
      if (slotTargetingMode === "all") {
        relevantSlots = slots;
      } else if (slotTargetingMode === "include") {
        // Only included slots (if none selected, assume all)
        relevantSlots = draft.slotIds.length > 0 
          ? slots.filter(s => draft.slotIds.includes(s.id))
          : slots;
      } else {
        // Exclude mode - all except excluded
        relevantSlots = slots.filter(s => !draft.excludedSlotIds.includes(s.id));
      }
    }
    
    relevantSlots.forEach(slot => {
      total += slot.avgDailyViews;
    });
    
    // Adjust for targeting
    const totalRules = draft.segments.reduce((sum, s) => sum + s.rules.length, 0);
    const targetingFactor = totalRules === 0 ? 1.0 : totalRules <= 2 ? 0.6 : totalRules <= 4 ? 0.3 : 0.1;
    const frequencyFactor = draft.frequencyCapEnabled ? Math.min(1, draft.maxViews / 5) : 1.0;
    
    return Math.round(total * targetingFactor * frequencyFactor);
  }, [draft.pricingModel, draft.slotIds, draft.excludedSlotIds, draft.segments, draft.frequencyCapEnabled, draft.maxViews, selectedSlots, slotTargetingMode]);

  // Handle slot selection/exclusion
  const toggleSlotSelection = (slotId: string) => {
    if (draft.pricingModel === "cpt") {
      // CPT: Single select
      updateDraft({ slotIds: [slotId] });
    } else {
      // CPM: Multi-select (handled in targeting)
      const current = draft.slotIds;
      const newIds = current.includes(slotId)
        ? current.filter(id => id !== slotId)
        : [...current, slotId];
      updateDraft({ slotIds: newIds });
    }
  };

  const toggleSlotExclusion = (slotId: string) => {
    const current = draft.excludedSlotIds;
    const newIds = current.includes(slotId)
      ? current.filter(id => id !== slotId)
      : [...current, slotId];
    updateDraft({ excludedSlotIds: newIds });
  };
  
  // Check for CPT bookings on selected/included slots during campaign duration
  const slotsWithCptBookings = useMemo(() => {
    if (!draft.startDate || draft.pricingModel !== "cpm") return [];
    
    const endDate = draft.noEndDate ? new Date(draft.startDate.getTime() + 30 * 24 * 60 * 60 * 1000) : draft.endDate;
    if (!endDate) return [];
    
    const slotsToCheck = slotTargetingMode === "all" 
      ? slots 
      : slotTargetingMode === "include" 
        ? slots.filter(s => draft.slotIds.includes(s.id))
        : slots.filter(s => !draft.excludedSlotIds.includes(s.id));
    
    const conflicts: { slotId: string; slotName: string; pageName: string; dates: string[] }[] = [];
    
    slotsToCheck.forEach(slot => {
      const slotBookings = bookedTimeSlots[slot.id];
      if (!slotBookings) return;
      
      const bookedDates: string[] = [];
      const currentDate = new Date(draft.startDate!);
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split("T")[0];
        if (slotBookings[dateStr]) {
          bookedDates.push(dateStr);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      if (bookedDates.length > 0) {
        const page = pages.find(p => p.id === slot.pageId);
        conflicts.push({ 
          slotId: slot.id, 
          slotName: slot.name, 
          pageName: page?.name || slot.pageId,
          dates: bookedDates 
        });
      }
    });
    
    return conflicts;
  }, [draft.startDate, draft.endDate, draft.noEndDate, draft.pricingModel, draft.slotIds, draft.excludedSlotIds, slotTargetingMode]);
  
  // (Landing page builder helpers, filteredProducts, and CPT conflict state moved to child components)

  // (handleCreativeUpload and removeCreative moved to CreativesSection)

  // Calculate CPT total hours and cost from draft dates (set by CptBookingSection)
  const cptTotalHours = useMemo(() => {
    if (draft.pricingModel !== "cpt" || !draft.startDate || !draft.endDate) return 0;
    const totalDays = Math.ceil((draft.endDate.getTime() - draft.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return totalDays * 24;
  }, [draft.pricingModel, draft.startDate, draft.endDate]);

  const cptTotalCost = useMemo(() => {
    if (draft.pricingModel !== "cpt" || selectedSlots.length === 0) return 0;
    return cptTotalHours * selectedSlots[0].cptRateUsd;
  }, [draft.pricingModel, selectedSlots, cptTotalHours]);

  // Visible sections based on flow state
  // Landing page is optional - it doesn't block subsequent sections
  const visibleSections = useMemo(() => {
    const sections = ["entry"];
    
    if (draft.entryType === "seller") {
      // Seller flow: Schedule -> Landing -> Targeting -> Bidding -> Creatives
      sections.push("seller-schedule");
      
      if (draft.campaignName && draft.startDate && draft.budget >= 100) {
        sections.push("landing");
        // Landing page is optional - always show targeting/creatives
        sections.push("seller-targeting");
        sections.push("creatives");
      }
    } else if (draft.entryType === "brand") {
      sections.push("campaign-type");
      
      if (draft.campaignType) {
        sections.push("pricing-model");
        
        if (draft.pricingModel === "cpm") {
          sections.push("schedule");
          
          if (draft.startDate && draft.budget >= 100) {
            sections.push("landing");
            // Landing page is optional - always show targeting/bidding/creatives
            sections.push("targeting");
            sections.push("bidding");
            sections.push("creatives");
          }
        } else if (draft.pricingModel === "cpt" && draft.slotIds.length > 0) {
          sections.push("cpt-calendar");
          
          if (cptTotalHours > 0) {
            sections.push("landing");
            // Landing page is optional - always show creatives
            sections.push("creatives");
          }
        }
      }
    }
    
    return sections;
  }, [draft, cptTotalHours]);

  // Scroll spy to update active section
  useEffect(() => {
    const handleScroll = () => {
      // Skip scroll spy during programmatic scrolling
      if (isScrollingRef.current) return;
      
      const headerOffset = 150;
      
      // Only check visible sections
      const sectionsToCheck = SECTIONS.filter(s => visibleSections.includes(s.id));
      
      // Find the section that's currently in view
      let activeId = sectionsToCheck[0]?.id || "entry";
      
      for (const section of sectionsToCheck) {
        const element = sectionRefs.current[section.id];
        if (element) {
          const rect = element.getBoundingClientRect();
          // If the top of the section is above the header offset, it's potentially active
          if (rect.top <= headerOffset) {
            activeId = section.id;
          }
        }
      }
      
      setActiveSection(activeId);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial call to set correct active section
    return () => window.removeEventListener("scroll", handleScroll);
  }, [SECTIONS, visibleSections]);

  const scrollToSection = (sectionId: string) => {
    const element = sectionRefs.current[sectionId];
    if (element) {
      // Set flag to prevent scroll spy during programmatic scroll
      isScrollingRef.current = true;
      setActiveSection(sectionId);
      
      const offset = 120;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({ top: elementPosition - offset, behavior: "smooth" });
      
      // Reset flag after scroll animation completes
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 800);
    }
  };

  // (CPT hours sync useEffect moved to CptBookingSection)

  // Check if landing page has content (for audience recommendations)
  const hasLandingPageContent = draft.landingPageUrl || 
    draft.builderConfig.products.length > 0 || 
    draft.builderConfig.categories.length > 0 ||
    draft.builderConfig.brands.length > 0;


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-14 z-40 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Campaign Type Dropdown */}
              <select
                value={draft.entryType || ""}
                onChange={(e) => {
                  const value = e.target.value as "seller" | "brand";
                  if (value === "seller") {
                    updateDraft({ entryType: "seller", ownerType: "self_serve", landingPageMode: "builder", pricingModel: "cpm" });
                  } else {
                    updateDraft({ entryType: "brand", ownerType: "ops_managed" });
                  }
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white min-w-[140px]"
              >
                <option value="">Select Type...</option>
                <option value="seller">Self-Serve Campaign</option>
                <option value="brand">Managed Campaign</option>
              </select>
              <div className="border-l pl-4">
                <p className="text-sm font-medium text-gray-900">
                  {!draft.entryType ? "Select campaign type to begin" : draft.entryType === "seller" ? "Self-Serve Campaign" : "Managed Campaign"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">Save Draft</Button>
              <Button size="sm" disabled={draft.entryType === "seller" ? visibleSections.length < 6 : visibleSections.length < 8} onClick={() => onCampaignSubmit?.()}>Submit Campaign</Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar - Compact Navigation */}
          <aside className="w-48 flex-shrink-0">
            <div className="sticky top-28 space-y-4">
              {/* Country Selector */}
              <div className="bg-white rounded-xl shadow-sm border p-3">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Country</label>
                <select
                  value={draft.country}
                  onChange={(e) => updateDraft({ country: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white font-medium"
                >
                  {countries.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
                <div className="mt-2 text-xs text-gray-500">
                  Currency: <span className="font-medium text-gray-700">{selectedCountry?.currency || "AED"}</span>
                </div>
              </div>

              {/* Navigation */}
              <nav className="bg-white rounded-xl shadow-sm border p-2 space-y-1">
                {SECTIONS.map((section) => {
                  const Icon = section.icon;
                  const isVisible = visibleSections.includes(section.id);
                  const isActive = activeSection === section.id;
                  
                  // Calculate if section is completed (before active section in the visible list)
                  const sectionIndex = visibleSections.indexOf(section.id);
                  const activeIndex = visibleSections.indexOf(activeSection);
                  const isCompleted = isVisible && sectionIndex >= 0 && activeIndex >= 0 && sectionIndex < activeIndex;
                  
                  return (
                    <div key={section.id} className="relative group">
                      <button
                        onClick={() => {
                          if (isVisible) {
                            scrollToSection(section.id);
                          }
                        }}
                        disabled={!isVisible}
                        className={cn(
                          "w-full px-3 py-2 rounded-lg flex items-center gap-2 transition-all text-left",
                          isActive && "bg-primary-500 text-white shadow-md",
                          isCompleted && !isActive && "bg-green-50 text-green-700",
                          !isActive && !isCompleted && isVisible && "hover:bg-gray-100 text-gray-600",
                          !isVisible && "opacity-30 cursor-not-allowed text-gray-300"
                        )}
                      >
                        {isCompleted && !isActive ? (
                          <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        ) : (
                          <Icon className="w-4 h-4 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium truncate">{section.label}</span>
                      </button>
                    </div>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 space-y-6 overflow-hidden">
            {/* Section 1: Entry Point - Now minimal since selection is in header */}
            <section 
              ref={el => { sectionRefs.current["entry"] = el; }}
              id="entry" 
              className="scroll-mt-36"
            >
              {!draft.entryType ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Building2 className="w-6 h-6 text-gray-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Select Campaign Type</h2>
                    <p className="text-sm text-gray-500">Use the dropdown in the header to select whether you're creating a Self-Serve or Managed campaign</p>
                  </CardContent>
                </Card>
              ) : (
                <Card className={draft.entryType === "brand" ? "border-primary-200 bg-primary-50/30" : "border-amber-200 bg-amber-50/30"}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {draft.entryType === "brand" ? (
                        <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary-600" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                          <Store className="w-5 h-5 text-amber-600" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {draft.entryType === "brand" ? "Managed Campaign" : "Self-Serve Campaign"}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {draft.entryType === "brand" 
                            ? "Endemic or Non-Endemic campaigns with advanced targeting" 
                            : "Self-serve display campaigns for marketplace sellers"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* ==================== SELLER FLOW SECTIONS ==================== */}
            
            {/* Seller Schedule Section */}
            {visibleSections.includes("seller-schedule") && (
              <section 
                ref={el => { sectionRefs.current["seller-schedule"] = el; }}
                id="seller-schedule" 
                className="scroll-mt-36"
              >
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">Campaign Details</h2>
                    <p className="text-sm text-gray-500 mb-6">Set your campaign name, schedule, and daily budget</p>
                    
                    {/* Campaign Name */}
                    <div className="mb-6">
                      <Input
                        label="Campaign Name"
                        placeholder="e.g., Summer Sale 2026"
                        value={draft.campaignName}
                        onChange={(e) => updateDraft({ campaignName: e.target.value })}
                        required
                      />
                    </div>
                    
                    {/* Date Selection */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                        <div className="relative">
                          <input
                            type="text"
                            readOnly
                            value={draft.startDate ? draft.startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                            placeholder="Select date"
                            onClick={() => setShowStartPicker(!showStartPicker)}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm cursor-pointer focus:ring-2 focus:ring-primary-500"
                          />
                          <Calendar 
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer" 
                            onClick={() => setShowStartPicker(!showStartPicker)}
                          />
                          {showStartPicker && (
                            <div className="absolute bottom-full left-0 mb-1 bg-white border rounded-lg shadow-lg p-4 z-50">
                              <div className="flex items-center justify-between mb-3">
                                <button onClick={() => setCalendarMonth(new Date(calendarMonth.setMonth(calendarMonth.getMonth() - 1)))} className="p-1 hover:bg-gray-100 rounded">
                                  <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="font-medium text-sm">
                                  {calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                </span>
                                <button onClick={() => setCalendarMonth(new Date(calendarMonth.setMonth(calendarMonth.getMonth() + 1)))} className="p-1 hover:bg-gray-100 rounded">
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                                  <div key={d} className="text-gray-500 font-medium py-1">{d}</div>
                                ))}
                              </div>
                              <div className="grid grid-cols-7 gap-1">
                                {getCalendarDays(calendarMonth).map((date, idx) => {
                                  if (!date) return <div key={idx} className="p-2" />;
                                  const isPast = date < today;
                                  const isSelected = draft.startDate?.toDateString() === date.toDateString();
                                  return (
                                    <button
                                      key={idx}
                                      disabled={isPast}
                                      onClick={() => {
                                        updateDraft({ startDate: date });
                                        setShowStartPicker(false);
                                      }}
                                      className={cn(
                                        "p-2 text-xs rounded hover:bg-primary-50 transition-colors",
                                        isPast && "text-gray-300 cursor-not-allowed",
                                        isSelected && "bg-primary-500 text-white hover:bg-primary-600",
                                        !isPast && !isSelected && "hover:bg-gray-100"
                                      )}
                                    >
                                      {date.getDate()}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                        <div className="relative">
                          <input
                            type="text"
                            readOnly
                            value={draft.noEndDate ? "No end date" : (draft.endDate ? draft.endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "")}
                            placeholder="Select date"
                            onClick={() => !draft.noEndDate && setShowEndPicker(!showEndPicker)}
                            className={cn(
                              "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500",
                              draft.noEndDate ? "bg-gray-50 text-gray-500" : "cursor-pointer"
                            )}
                          />
                          <Calendar 
                            className={cn(
                              "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4",
                              draft.noEndDate ? "text-gray-300" : "text-gray-400 cursor-pointer"
                            )}
                            onClick={() => !draft.noEndDate && setShowEndPicker(!showEndPicker)}
                          />
                          {showEndPicker && !draft.noEndDate && (
                            <div className="absolute bottom-full left-0 mb-1 bg-white border rounded-lg shadow-lg p-4 z-50">
                              <div className="flex items-center justify-between mb-3">
                                <button onClick={() => setEndCalendarMonth(new Date(endCalendarMonth.setMonth(endCalendarMonth.getMonth() - 1)))} className="p-1 hover:bg-gray-100 rounded">
                                  <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="font-medium text-sm">
                                  {endCalendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                </span>
                                <button onClick={() => setEndCalendarMonth(new Date(endCalendarMonth.setMonth(endCalendarMonth.getMonth() + 1)))} className="p-1 hover:bg-gray-100 rounded">
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                                  <div key={d} className="text-gray-500 font-medium py-1">{d}</div>
                                ))}
                              </div>
                              <div className="grid grid-cols-7 gap-1">
                                {getCalendarDays(endCalendarMonth).map((date, idx) => {
                                  if (!date) return <div key={idx} className="p-2" />;
                                  const minDate = draft.startDate || today;
                                  const isPast = date < minDate;
                                  const isSelected = draft.endDate?.toDateString() === date.toDateString();
                                  const isStartDate = draft.startDate?.toDateString() === date.toDateString();
                                  return (
                                    <button
                                      key={idx}
                                      disabled={isPast}
                                      onClick={() => {
                                        updateDraft({ endDate: date });
                                        setShowEndPicker(false);
                                      }}
                                      className={cn(
                                        "p-2 text-xs rounded transition-colors",
                                        isPast && "text-gray-300 cursor-not-allowed",
                                        isSelected && "bg-primary-500 text-white hover:bg-primary-600",
                                        isStartDate && !isSelected && "bg-green-100 text-green-700 ring-1 ring-green-300",
                                        !isPast && !isSelected && !isStartDate && "hover:bg-gray-100"
                                      )}
                                    >
                                      {date.getDate()}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                        <label className="flex items-center gap-2 mt-2">
                          <input
                            type="checkbox"
                            checked={draft.noEndDate}
                            onChange={(e) => {
                              if (e.target.checked) {
                                updateDraft({ noEndDate: true, endDate: undefined });
                              } else {
                                updateDraft({ noEndDate: false });
                              }
                            }}
                            className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-600">No end date (ongoing)</span>
                        </label>
                      </div>
                    </div>
                    
                    {/* Daily Budget - Local Currency */}
                    {(() => {
                      const sellerCountry = countries.find(c => c.code === draft.country);
                      const sellerCurrency = sellerCountry?.currency || "AED";
                      const minBudget = 100; // Minimum 100 in local currency
                      const credits = availableCredits[sellerCurrency] || 0;
                      
                      return (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Daily Budget ({sellerCurrency})</label>
                            <div className="flex items-center gap-3">
                              <div className="relative flex-1 max-w-xs">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">{sellerCurrency}</span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={budgetStr}
                                  onChange={(e) => setBudgetStr(e.target.value)}
                                  onBlur={() => {
                                    const parsed = parseFloat(budgetStr);
                                    if (!isNaN(parsed) && parsed >= 0) {
                                      updateDraft({ budget: parsed, budgetType: "daily", dailyBudget: parsed });
                                    } else {
                                      setBudgetStr(draft.budget.toString());
                                    }
                                  }}
                                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                                  placeholder="1000"
                                />
                              </div>
                              <span className="text-sm text-gray-500">per day</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1.5">Minimum {sellerCurrency} {minBudget} per day</p>
                          </div>
                          
                          {/* Credits Option - Compact */}
                          <div className="flex items-center gap-3 mt-3 p-2 bg-green-50 border border-green-200 rounded-lg max-w-md">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={useCredits}
                                onChange={(e) => setUseCredits(e.target.checked)}
                                className="w-4 h-4 rounded border-green-300 text-green-600 focus:ring-green-500"
                              />
                              <span className="text-xs text-green-700">Use credits</span>
                            </label>
                            <span className="text-xs text-green-600">|</span>
                            <span className="text-xs font-medium text-green-700">
                              {sellerCurrency} {credits.toLocaleString()} available
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Seller Landing Page - rendered here for correct order */}
            {draft.entryType === "seller" && visibleSections.includes("landing") && (
              <LandingPageSection
                sectionRef={el => { sectionRefs.current["landing"] = el; }}
              />
            )}

            {/* Seller Targeting Section */}
            {visibleSections.includes("seller-targeting") && (
              <SellerTargetingSection
                sectionRef={el => { sectionRefs.current["seller-targeting"] = el; }}
              />
            )}

            {/* Seller Bidding Competitiveness */}
            {draft.entryType === "seller" && visibleSections.includes("creatives") && draft.audienceSegments.length > 0 && (
              <BiddingSection
                sectionRef={el => { sectionRefs.current["seller-bidding"] = el; }}
                slotMultiplier={slotMultiplier}
                slotGroupMultipliers={slotGroupMultipliers}
                slotTargetingMode={slotTargetingMode}
                estimatedReach={estimatedReach}
              />
            )}

            {/* Seller Creatives */}
            {draft.entryType === "seller" && visibleSections.includes("creatives") && (
              <CreativesSection
                sectionRef={el => { sectionRefs.current["creatives"] = el; }}
                selectedSlots={selectedSlots}
                missingCreativeSizes={missingCreativeSizes}
              />
            )}

            {/* Seller Submit Section */}
            {draft.entryType === "seller" && visibleSections.includes("creatives") && (() => {
              // Get currency from selected country
              const sellerCountry = countries.find(c => c.code === draft.country);
              const sellerCurrency = sellerCountry?.currency || "AED";
              const credits = availableCredits[sellerCurrency] || 0;
              
              // Calculate estimated views for seller
              const targetBids = draft.audienceSegments.map(s => s.bid);
              const avgBid = targetBids.length > 0 ? targetBids.reduce((a, b) => a + b, 0) / targetBids.length : 10;
              const lowThreshold = sellerCurrency === "EGP" ? 90 : 11;
              const highThreshold = sellerCurrency === "EGP" ? 180 : 22;
              const winRate = avgBid < lowThreshold ? 30 : avgBid < highThreshold ? 60 : 85;
              const estDailyViews = Math.round(Math.min(estimatedReach, (draft.budget / Math.max(avgBid, 1)) * 1000) * (winRate / 100));
              
              // Calculate campaign duration
              const hasDuration = draft.startDate && draft.endDate && !draft.noEndDate;
              const campaignDays = hasDuration 
                ? Math.ceil((draft.endDate!.getTime() - draft.startDate!.getTime()) / (1000 * 60 * 60 * 24)) + 1
                : null;
              const estTotalViews = campaignDays ? estDailyViews * campaignDays : null;
              
              return (
                <Card className="bg-gradient-to-r from-amber-50 to-white border-amber-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-3">Ready to submit?</h3>
                        <div className="grid grid-cols-5 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 block text-xs">Daily Budget</span>
                            <span className="font-semibold text-gray-900">{sellerCurrency} {formatNumber(draft.budget)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block text-xs">Start Date</span>
                            <span className="font-semibold text-gray-900">
                              {draft.startDate ? draft.startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block text-xs">End Date</span>
                            <span className="font-semibold text-gray-900">
                              {draft.noEndDate ? "No end date" : draft.endDate ? draft.endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block text-xs">Targets</span>
                            <span className="font-semibold text-gray-900">{draft.audienceSegments.length} audience{draft.audienceSegments.length !== 1 ? "s" : ""}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block text-xs">{hasDuration ? `Est. Total Views (${campaignDays}d)` : "Est. Daily Views"}</span>
                            <span className="font-semibold text-amber-600">
                              {hasDuration ? formatNumber(estTotalViews || 0) : formatNumber(estDailyViews)}
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Credits for Seller */}
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg ml-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useCredits}
                            onChange={(e) => setUseCredits(e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-green-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-xs text-green-700">Use credits</span>
                        </label>
                        <span className="text-xs text-green-600">|</span>
                        <span className="text-xs font-medium text-green-700">{sellerCurrency} {credits.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-amber-200">
                      <Button variant="outline">Save Draft</Button>
                      <Button onClick={() => onCampaignSubmit?.()}>Submit Campaign</Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* ==================== BRAND FLOW SECTIONS ==================== */}

            {/* Section 2: Endemic or Non-Endemic */}
            {visibleSections.includes("campaign-type") && (
              <section 
                ref={el => { sectionRefs.current["campaign-type"] = el; }}
                id="campaign-type" 
                className="scroll-mt-36"
              >
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Campaign Type</h2>
                    <p className="text-sm text-gray-500 mb-6">Select whether this is an endemic or non-endemic campaign</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <RadioCard
                        selected={draft.campaignType === "internal"}
                        onClick={() => updateDraft({ campaignType: "internal" })}
                        title="Endemic"
                        description="Campaign for marketplace brands and products with landing page builder access"
                      >
                        <div className="flex items-center gap-2 mt-2 text-primary-600">
                          <Building2 className="w-5 h-5" />
                          <span className="text-sm font-medium">Endemic</span>
                        </div>
                      </RadioCard>
                      <RadioCard
                        selected={draft.campaignType === "third_party"}
                        onClick={() => updateDraft({ campaignType: "third_party" })}
                        title="Non-Endemic"
                        description="Campaign for external advertisers not selling on the marketplace"
                      >
                        <div className="flex items-center gap-2 mt-2 text-amber-600">
                          <Globe className="w-5 h-5" />
                          <span className="text-sm font-medium">Non-Endemic</span>
                        </div>
                      </RadioCard>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Section 3: CPM or CPT */}
            {visibleSections.includes("pricing-model") && (
              <section 
                ref={el => { sectionRefs.current["pricing-model"] = el; }}
                id="pricing-model" 
                className="scroll-mt-36"
              >
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Pricing Model</h2>
                    <p className="text-sm text-gray-500 mb-6">Choose how you want to pay for this campaign</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <RadioCard
                        selected={draft.pricingModel === "cpm"}
                        onClick={() => updateDraft({ pricingModel: "cpm", slotIds: [], excludedSlotIds: [] })}
                        title="CPM - Cost Per Mille"
                        description="Pay per 1,000 impressions. Auction-based pricing with flexible slot selection."
                      >
                        <div className="flex items-center gap-2 mt-2 text-blue-600">
                          <BarChart3 className="w-5 h-5" />
                          <span className="text-sm font-medium">Impression-based</span>
                        </div>
                      </RadioCard>
                      <RadioCard
                        selected={draft.pricingModel === "cpt"}
                        onClick={() => updateDraft({ pricingModel: "cpt", slotIds: [], excludedSlotIds: [] })}
                        title="CPT - Cost Per Time"
                        description="Book specific slots by the hour. Guaranteed placement for your selected time."
                      >
                        <div className="flex items-center gap-2 mt-2 text-purple-600">
                          <Clock className="w-5 h-5" />
                          <span className="text-sm font-medium">Time-based</span>
                        </div>
                      </RadioCard>
                    </div>

                    {/* CPT Slot Selection */}
                    {draft.pricingModel === "cpt" && (
                      <div className="mt-6 pt-6 border-t">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Select Slot to Book</h3>
                        <p className="text-sm text-gray-500 mb-4">Choose country, marketplace, page, then slot for time-based booking</p>
                        
                        {/* Location & Filters Row */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <Select
                            label="Marketplace"
                            value={draft.marketplace}
                            onChange={(e) => updateDraft({ marketplace: e.target.value as Marketplace })}
                            options={marketplaces.map(m => ({ value: m.id, label: `${m.icon} ${m.name}` }))}
                          />
                          <Select
                            label="Page"
                            value={slotPageFilter}
                            onChange={(e) => setSlotPageFilter(e.target.value)}
                            options={[
                              { value: "all", label: "All Pages" },
                              ...pages.map(p => ({ value: p.id, label: p.name }))
                            ]}
                          />
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Search</label>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                placeholder="Filter..."
                                value={slotSearchQuery}
                                onChange={(e) => setSlotSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Slots List */}
                        <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                          {pages
                            .filter(p => slotPageFilter === "all" || p.id === slotPageFilter)
                            .map(page => {
                              const pageSlots = slots
                                .filter(s => s.pageId === page.id)
                                .filter(s => !slotSearchQuery || s.name.toLowerCase().includes(slotSearchQuery.toLowerCase()));
                              
                              if (pageSlots.length === 0) return null;
                              
                              const hasSelectedSlot = pageSlots.some(s => draft.slotIds.includes(s.id));
                              
                              return (
                                <div key={page.id}>
                                  <div className={cn(
                                    "px-3 py-2 bg-gray-50 text-xs font-medium text-gray-600 sticky top-0 border-b",
                                    hasSelectedSlot && "bg-primary-50 text-primary-700"
                                  )}>
                                    {page.name}
                                  </div>
                                  {pageSlots.map(slot => {
                                    const isSelected = draft.slotIds.includes(slot.id);
                                    const dailyRate = slot.cptRateUsd * 24;
                                    const dailyViews = slot.avgDailyViews;
                                    return (
                                      <div
                                        key={slot.id}
                                        onClick={() => toggleSlotSelection(slot.id)}
                                        className={cn(
                                          "px-3 py-2.5 cursor-pointer transition-all flex items-center justify-between border-b last:border-b-0",
                                          isSelected ? "bg-primary-100" : "hover:bg-gray-50"
                                        )}
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className={cn(
                                            "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                                            isSelected ? "border-primary-500 bg-primary-500" : "border-gray-300"
                                          )}>
                                            {isSelected && <CheckCircle className="w-2.5 h-2.5 text-white" />}
                                          </div>
                                          <span className="text-sm text-gray-900">{slot.name}</span>
                                          <span className="text-xs text-gray-400">{getSlotDimensions(slot)}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                          <span className="text-xs text-gray-500">
                                            {dailyViews >= 1000000 ? `${(dailyViews / 1000000).toFixed(1)}M` : `${Math.round(dailyViews / 1000)}K`} views/day
                                          </span>
                                          <span className="text-sm font-semibold text-primary-600">${formatNumber(dailyRate)}/day</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>
            )}

            {/* CPT Campaign Details Section */}
            {visibleSections.includes("cpt-calendar") && draft.pricingModel === "cpt" && (
              <CptBookingSection
                sectionRef={el => { sectionRefs.current["cpt-calendar"] = el; }}
                selectedSlots={selectedSlots}
                slotsReserved={slotsReserved}
                onSlotsReservedChange={setSlotsReserved}
              />
            )}

            {/* CPM Campaign Details Section */}
            {visibleSections.includes("schedule") && draft.pricingModel === "cpm" && (
              <section 
                ref={el => { sectionRefs.current["schedule"] = el; }}
                id="schedule" 
                className="scroll-mt-36"
              >
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">Campaign Details</h2>
                    <p className="text-sm text-gray-500 mb-6">Set your campaign name, schedule, and budget</p>

                    {isBookingLinked && (
                      <div className="mb-6 p-4 bg-primary-50/50 border border-primary-200 rounded-lg">
                        <p className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-3">Linked Booking</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Booking Code</label>
                            <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-mono text-gray-700">{draft.linkedBookingId}</div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Booking Name</label>
                            <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 truncate">{draft.linkedBookingName}</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Campaign Name */}
                    <div className="mb-6">
                      <Input
                        label="Campaign Name"
                        placeholder="e.g., Summer Sale 2026"
                        value={draft.campaignName}
                        onChange={(e) => updateDraft({ campaignName: e.target.value })}
                        required
                      />
                    </div>

                    {/* Marketplace Row */}
                    <div className="mb-6">
                      <Select
                        label="Marketplace"
                        value={draft.marketplace}
                        onChange={(e) => updateDraft({ marketplace: e.target.value as Marketplace })}
                        options={marketplaces.map(m => ({ value: m.id, label: `${m.icon} ${m.name}` }))}
                        required
                      />
                    </div>

                    {/* Dates Row with Custom Calendar */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {/* Start Date */}
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Start Date <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowStartDatePicker(!showStartDatePicker);
                            setShowEndDatePicker(false);
                            if (draft.startDate) setDatePickerMonth(draft.startDate);
                          }}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-left flex items-center justify-between bg-white"
                        >
                          <span className={draft.startDate ? "text-gray-900" : "text-gray-400"}>
                            {draft.startDate ? draft.startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Select date"}
                          </span>
                          <Calendar className="w-4 h-4 text-gray-400" />
                        </button>
                        
                        {showStartDatePicker && (
                          <div className="absolute bottom-full left-0 mb-1 z-50 bg-white border rounded-lg shadow-lg p-3 w-72">
                            {/* Month Nav */}
                            <div className="flex items-center justify-between mb-3">
                              <button onClick={() => setDatePickerMonth(new Date(datePickerMonth.getFullYear(), datePickerMonth.getMonth() - 1))} className="p-1 hover:bg-gray-100 rounded">
                                <ChevronRight className="w-4 h-4 rotate-180" />
                              </button>
                              <span className="text-sm font-medium">{datePickerMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
                              <button onClick={() => setDatePickerMonth(new Date(datePickerMonth.getFullYear(), datePickerMonth.getMonth() + 1))} className="p-1 hover:bg-gray-100 rounded">
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                            {/* Day Headers */}
                            <div className="grid grid-cols-7 mb-1">
                              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                                <div key={d} className="text-xs text-gray-500 text-center py-1">{d}</div>
                              ))}
                            </div>
                            {/* Days */}
                            <div className="grid grid-cols-7 gap-1">
                              {(() => {
                                const firstDay = new Date(datePickerMonth.getFullYear(), datePickerMonth.getMonth(), 1);
                                const lastDay = new Date(datePickerMonth.getFullYear(), datePickerMonth.getMonth() + 1, 0);
                                const today = new Date(); today.setHours(0,0,0,0);
                                const days: (Date | null)[] = [];
                                for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
                                for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(datePickerMonth.getFullYear(), datePickerMonth.getMonth(), d));
                                
                                return days.map((date, idx) => {
                                  if (!date) return <div key={idx} />;
                                  const isSelected = draft.startDate?.toDateString() === date.toDateString();
                                  const isPast = date < today;
                                  return (
                                    <button
                                      key={idx}
                                      disabled={isPast}
                                      onClick={() => {
                                        updateDraft({ startDate: date });
                                        setShowStartDatePicker(false);
                                      }}
                                      className={cn(
                                        "w-8 h-8 text-sm rounded-full",
                                        isSelected && "bg-primary-500 text-white",
                                        !isSelected && !isPast && "hover:bg-gray-100",
                                        isPast && "text-gray-300 cursor-not-allowed"
                                      )}
                                    >
                                      {date.getDate()}
                                    </button>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* End Date */}
                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          End Date {!draft.noEndDate && <span className="text-red-500">*</span>}
                        </label>
                        <button
                          type="button"
                          disabled={draft.noEndDate}
                          onClick={() => {
                            if (!draft.noEndDate) {
                              setShowEndDatePicker(!showEndDatePicker);
                              setShowStartDatePicker(false);
                              if (draft.endDate) setDatePickerMonth(draft.endDate);
                              else if (draft.startDate) setDatePickerMonth(draft.startDate);
                            }
                          }}
                          className={cn(
                            "w-full px-3 py-2.5 border rounded-lg text-left flex items-center justify-between",
                            draft.noEndDate ? "bg-gray-50 border-gray-200 cursor-not-allowed" : "border-gray-300 bg-white focus:ring-2 focus:ring-primary-500"
                          )}
                        >
                          <span className={draft.endDate && !draft.noEndDate ? "text-gray-900" : "text-gray-400"}>
                            {draft.noEndDate ? "No end date" : draft.endDate ? draft.endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Select date"}
                          </span>
                          <Calendar className="w-4 h-4 text-gray-400" />
                        </button>
                        
                        {/* No end date checkbox */}
                        <label className="flex items-center gap-2 mt-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={draft.noEndDate}
                            onChange={(e) => {
                              updateDraft({ noEndDate: e.target.checked, endDate: e.target.checked ? null : draft.endDate });
                              setShowEndDatePicker(false);
                            }}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-600">No end date (ongoing)</span>
                        </label>
                        
                        {showEndDatePicker && !draft.noEndDate && (
                          <div className="absolute bottom-full left-0 mb-1 z-50 bg-white border rounded-lg shadow-lg p-3 w-72">
                            {/* Month Nav */}
                            <div className="flex items-center justify-between mb-3">
                              <button onClick={() => setDatePickerMonth(new Date(datePickerMonth.getFullYear(), datePickerMonth.getMonth() - 1))} className="p-1 hover:bg-gray-100 rounded">
                                <ChevronRight className="w-4 h-4 rotate-180" />
                              </button>
                              <span className="text-sm font-medium">{datePickerMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
                              <button onClick={() => setDatePickerMonth(new Date(datePickerMonth.getFullYear(), datePickerMonth.getMonth() + 1))} className="p-1 hover:bg-gray-100 rounded">
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                            {/* Day Headers */}
                            <div className="grid grid-cols-7 mb-1">
                              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                                <div key={d} className="text-xs text-gray-500 text-center py-1">{d}</div>
                              ))}
                            </div>
                            {/* Days */}
                            <div className="grid grid-cols-7 gap-1">
                              {(() => {
                                const firstDay = new Date(datePickerMonth.getFullYear(), datePickerMonth.getMonth(), 1);
                                const lastDay = new Date(datePickerMonth.getFullYear(), datePickerMonth.getMonth() + 1, 0);
                                const today = new Date(); today.setHours(0,0,0,0);
                                const days: (Date | null)[] = [];
                                for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
                                for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(datePickerMonth.getFullYear(), datePickerMonth.getMonth(), d));
                                
                                return days.map((date, idx) => {
                                  if (!date) return <div key={idx} />;
                                  const isSelected = draft.endDate?.toDateString() === date.toDateString();
                                  const isStartDate = draft.startDate?.toDateString() === date.toDateString();
                                  const isBeforeStart = draft.startDate && date < draft.startDate;
                                  const isPast = date < today;
                                  const isDisabled = isPast || isBeforeStart;
                                  
                                  return (
                                    <button
                                      key={idx}
                                      disabled={isDisabled}
                                      onClick={() => {
                                        updateDraft({ endDate: date });
                                        setShowEndDatePicker(false);
                                      }}
                                      className={cn(
                                        "w-8 h-8 text-sm rounded-full relative",
                                        isSelected && "bg-primary-500 text-white",
                                        isStartDate && !isSelected && "ring-2 ring-primary-400 ring-offset-1 bg-primary-100 text-primary-700",
                                        !isSelected && !isStartDate && !isDisabled && "hover:bg-gray-100",
                                        isDisabled && "text-gray-300 cursor-not-allowed"
                                      )}
                                      title={isStartDate ? "Start date" : undefined}
                                    >
                                      {date.getDate()}
                                    </button>
                                  );
                                });
                              })()}
                            </div>
                            {draft.startDate && (
                              <div className="mt-3 pt-3 border-t text-xs text-gray-500 flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full ring-2 ring-primary-400 bg-primary-100" />
                                <span>Start date: {draft.startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Budget & Pacing Section - Compact Layout */}
                    <div className="border-t pt-6">
                      <h3 className="text-sm font-medium text-gray-700 mb-4">Budget & Pacing</h3>
                      
                      <div className="grid grid-cols-12 gap-4">
                        {/* Left: Budget Type & Amount */}
                        <div className="col-span-6">
                          {/* Budget Type Toggle - Total first */}
                          <div className="flex gap-2 mb-3">
                            <button
                              onClick={() => updateDraft({ budgetType: "total" })}
                              className={cn(
                                "px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                                draft.budgetType === "total"
                                  ? "border-primary-500 bg-primary-50 text-primary-700"
                                  : "border-gray-200 text-gray-600 hover:border-gray-300"
                              )}
                            >
                              Total Budget
                            </button>
                            <button
                              onClick={() => updateDraft({ budgetType: "daily" })}
                              className={cn(
                                "px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                                draft.budgetType === "daily"
                                  ? "border-primary-500 bg-primary-50 text-primary-700"
                                  : "border-gray-200 text-gray-600 hover:border-gray-300"
                              )}
                            >
                              Daily Budget
                            </button>
                          </div>
                          
                          {/* Budget Input Row with Pacing Dropdown */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={budgetStr}
                                onChange={(e) => setBudgetStr(e.target.value)}
                                onBlur={() => {
                                  const num = parseFloat(budgetStr);
                                  if (!isNaN(num) && num >= 100) {
                                    updateDraft({ budget: num, dailyBudget: draft.budgetType === "daily" ? num : draft.dailyBudget, totalBudget: draft.budgetType === "total" ? num : draft.totalBudget });
                                  } else if (!isNaN(num) && num > 0 && num < 100) {
                                    setBudgetStr("100");
                                    updateDraft({ budget: 100, dailyBudget: draft.budgetType === "daily" ? 100 : draft.dailyBudget, totalBudget: draft.budgetType === "total" ? 100 : draft.totalBudget });
                                  }
                                }}
                                className={cn(
                                  "w-full pl-7 pr-3 py-2 border rounded-lg text-lg font-semibold",
                                  parseFloat(budgetStr) > 0 && parseFloat(budgetStr) < 100 ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-primary-500"
                                )}
                                placeholder="1000"
                              />
                            </div>
                            <span className="text-sm text-gray-500 whitespace-nowrap">
                              {draft.budgetType === "daily" ? "per day" : "total"}
                            </span>
                          </div>
                          {parseFloat(budgetStr) > 0 && parseFloat(budgetStr) < 100 && (
                            <p className="text-xs text-red-500 mt-1">Minimum budget is $100</p>
                          )}
                          
                          {/* Pacing Row */}
                          <div className="mt-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Pacing:</span>
                              <select
                                value={draft.pacing}
                                onChange={(e) => updateDraft({ pacing: e.target.value as "even" | "asap" })}
                                className="px-2 py-1 border border-gray-300 rounded text-xs bg-white"
                              >
                                <option value="even">Even</option>
                                <option value="asap">ASAP</option>
                              </select>
                              <span className="text-[10px] text-gray-400">
                                {draft.pacing === "even" ? "Spread spend evenly throughout day" : "Spend budget as fast as possible"}
                              </span>
                            </div>
                          </div>
                          
                          {/* Credits Option - Compact */}
                          <div className="flex items-center gap-3 mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={useCredits}
                                onChange={(e) => setUseCredits(e.target.checked)}
                                className="w-4 h-4 rounded border-green-300 text-green-600 focus:ring-green-500"
                              />
                              <span className="text-xs text-green-700">Use credits</span>
                            </label>
                            <span className="text-xs text-green-600">|</span>
                            <span className="text-xs font-medium text-green-700">
                              ${availableCredits.USD.toLocaleString()} available
                            </span>
                          </div>
                        </div>
                        
                        {/* Right: Budget Summary */}
                        <div className="col-span-6">
                          {draft.budget >= 100 && (() => {
                            const hasDates = draft.startDate && draft.endDate && !draft.noEndDate;
                            const campaignDays = hasDates
                              ? Math.ceil((draft.endDate!.getTime() - draft.startDate!.getTime()) / (1000 * 60 * 60 * 24)) + 1
                              : null;
                            const isDaily = draft.budgetType === "daily";
                            const dailySpend = isDaily ? draft.budget : (campaignDays ? draft.budget / campaignDays : null);
                            const maxTotal = isDaily ? (campaignDays ? draft.budget * campaignDays : null) : draft.budget;
                            const creditsAvailable = availableCredits.USD;
                            const creditApplied = useCredits ? Math.min(creditsAvailable, maxTotal || draft.budget) : 0;
                            const finalCost = (maxTotal || draft.budget) - creditApplied;
                            
                            return (
                              <div className="p-3 bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg h-full">
                                <div className="text-xs text-gray-500 mb-2.5 font-medium">Budget Summary</div>
                                <div className="space-y-1.5">
                                  {/* Input amount */}
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">{isDaily ? "Daily Budget:" : "Total Budget:"}</span>
                                    <span className="font-semibold text-gray-900">${formatNumber(draft.budget)}</span>
                                  </div>
                                  
                                  {/* Duration */}
                                  {campaignDays && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600">Duration:</span>
                                      <span className="font-medium text-gray-900">{campaignDays} day{campaignDays !== 1 ? "s" : ""}</span>
                                    </div>
                                  )}
                                  
                                  {/* Derived value: daily from total, or total from daily */}
                                  {isDaily && maxTotal && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600">Max Total Spend:</span>
                                      <span className="font-semibold text-gray-900">${formatNumber(maxTotal)}</span>
                                    </div>
                                  )}
                                  {!isDaily && dailySpend && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600">Est. Daily Spend:</span>
                                      <span className="font-medium text-gray-900">~${formatNumber(Math.round(dailySpend))}/day</span>
                                    </div>
                                  )}
                                  {!isDaily && !campaignDays && !draft.noEndDate && (
                                    <div className="text-[11px] text-gray-400 italic">Set an end date to see daily estimate</div>
                                  )}
                                  
                                  {/* No end date note */}
                                  {draft.noEndDate && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-600">End Date:</span>
                                      <span className="text-xs text-gray-400 italic">Ongoing (no end date)</span>
                                    </div>
                                  )}
                                  
                                  {/* Final cost (with inline credits info) */}
                                  <div className="border-t border-primary-200 pt-1.5 mt-1">
                                    {useCredits && creditApplied > 0 && (
                                      <div className="flex justify-between text-[11px] text-green-700 mb-1">
                                        <span>Credits: -${formatNumber(creditApplied)}</span>
                                        <span className="text-gray-400">${formatNumber(creditsAvailable - creditApplied)} remaining</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between text-sm">
                                      <span className="font-semibold text-gray-800">
                                        {useCredits && creditApplied > 0 ? "Out-of-Pocket:" : campaignDays ? "Max Total:" : isDaily ? "Daily Cost:" : "Total Cost:"}
                                      </span>
                                      <span className={cn(
                                        "font-bold",
                                        useCredits && creditApplied > 0 ? "text-green-600" : "text-primary-600"
                                      )}>
                                        {finalCost <= 0 && useCredits ? (
                                          <span className="text-green-500">$0 (Covered)</span>
                                        ) : (
                                          <>${formatNumber(Math.max(0, finalCost))}</>
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Section 4: Landing Page (Brand flow) */}
            {draft.entryType !== "seller" && visibleSections.includes("landing") && (
              <LandingPageSection
                sectionRef={el => { sectionRefs.current["landing"] = el; }}
              />
            )}

            {/* Section 5: Targeting */}
            {visibleSections.includes("targeting") && (
              <BrandTargetingSection
                sectionRef={el => { sectionRefs.current["targeting"] = el; }}
                estimatedReach={estimatedReach}
                slotsWithCptBookings={slotsWithCptBookings}
                slotMultiplier={slotMultiplier}
                onSlotMultiplierChange={setSlotMultiplier}
                slotGroupMultipliers={slotGroupMultipliers}
                onSlotGroupMultipliersChange={setSlotGroupMultipliers}
                slotTargetingMode={slotTargetingMode}
                onSlotTargetingModeChange={setSlotTargetingMode}
              />
            )}

            {/* Section 6: Bidding Competitiveness */}
            {visibleSections.includes("bidding") && draft.pricingModel === "cpm" && (
              <BiddingSection
                sectionRef={el => { sectionRefs.current["bidding"] = el; }}
                slotMultiplier={slotMultiplier}
                slotGroupMultipliers={slotGroupMultipliers}
                slotTargetingMode={slotTargetingMode}
                estimatedReach={estimatedReach}
              />
            )}

            {/* Section 7: Creatives (Brand flow) */}
            {draft.entryType !== "seller" && visibleSections.includes("creatives") && (
              <CreativesSection
                sectionRef={el => { sectionRefs.current["creatives"] = el; }}
                selectedSlots={selectedSlots}
                missingCreativeSizes={missingCreativeSizes}
              />
            )}

            {/* Submit Section (Brand flow only) */}
            {draft.entryType !== "seller" && visibleSections.includes("creatives") && (
              <Card className="bg-gradient-to-r from-primary-50 to-white border-primary-200">
                <CardContent className="p-6">
                  {isBookingLinked && (
                    <div className="flex items-center gap-4 mb-4 px-3 py-2 bg-white/80 border border-primary-200 rounded-lg text-sm">
                      <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">Booking</span>
                      <span className="font-mono text-gray-700">{draft.linkedBookingId}</span>
                      <span className="text-gray-400">&middot;</span>
                      <span className="text-gray-700 truncate">{draft.linkedBookingName}</span>
                    </div>
                  )}
                  {draft.pricingModel === "cpt" ? (
                    /* CPT Submit Review */
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-3">
                            {slotsReserved ? "Slots Reserved - Complete your campaign" : "Ready to submit?"}
                          </h3>
                          <div className="grid grid-cols-5 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 block text-xs">Hours Booked</span>
                              <span className="font-semibold text-gray-900">{cptTotalHours} hours</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block text-xs">Start Date</span>
                              <span className="font-semibold text-gray-900">
                                {draft.startDate ? draft.startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 block text-xs">End Date</span>
                              <span className="font-semibold text-gray-900">
                                {draft.endDate ? draft.endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 block text-xs">Total Cost</span>
                              <span className="font-semibold text-primary-600">{formatCurrency(cptTotalCost)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block text-xs">Est. Views</span>
                              <span className="font-semibold text-gray-900">
                                {selectedSlots[0] ? formatNumber(cptTotalHours * Math.round(selectedSlots[0].avgDailyViews / 24)) : "—"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {/* Credits for CPT */}
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={useCredits}
                                onChange={(e) => setUseCredits(e.target.checked)}
                                className="w-3.5 h-3.5 rounded border-green-300 text-green-600 focus:ring-green-500"
                              />
                              <span className="text-xs text-green-700">Use credits</span>
                            </label>
                            <span className="text-xs text-green-600">|</span>
                            <span className="text-xs font-medium text-green-700">${availableCredits.USD.toLocaleString()} available</span>
                          </div>
                          {useCredits && cptTotalCost > 0 && (
                            <div className="text-xs text-right">
                              <span className="text-gray-500">After credits: </span>
                              <span className="font-medium text-gray-900">
                                {cptTotalCost > availableCredits.USD 
                                  ? formatCurrency(cptTotalCost - availableCredits.USD)
                                  : "$0 (covered by credits)"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-3 border-t border-primary-100">
                        {slotsReserved ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-green-700 font-medium">Slots reserved until you complete the campaign</span>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">Reserve slots first to hold your booking while completing landing page & creatives</p>
                        )}
                        <div className="flex gap-3">
                          {!slotsReserved ? (
                            <>
                              <Button variant="outline" onClick={() => setSlotsReserved(true)}>
                                Reserve Slots
                              </Button>
                              <Button onClick={() => onCampaignSubmit?.()}>Submit Campaign</Button>
                            </>
                          ) : (
                            <>
                              <Button variant="outline" onClick={() => setSlotsReserved(false)}>
                                Release Slots
                              </Button>
                              <Button>Finalize Campaign</Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* CPM Submit Review */
                    (() => {
                      // Calculate estimated views for CPM
                      const targetBids = draft.audienceSegments.map(s => s.bid);
                      const avgBid = targetBids.length > 0 ? targetBids.reduce((a, b) => a + b, 0) / targetBids.length : draft.bidAmount || 5;
                      // For include mode, compute average of group multipliers; for exclude, use single multiplier
                      const slotMultiplierValue = (() => {
                        if (slotTargetingMode === "include" && Object.keys(slotGroupMultipliers).length > 0) {
                          const vals = Object.values(slotGroupMultipliers).map(v => parseFloat(v) || 0);
                          return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                        }
                        return parseFloat(slotMultiplier) || 0;
                      })();
                      const effectiveAvgBid = avgBid * (1 + slotMultiplierValue / 100);
                      const winRate = effectiveAvgBid < 3 ? 30 : effectiveAvgBid < 6 ? 60 : 85;
                      
                      // Calculate campaign duration
                      const hasDuration = draft.startDate && draft.endDate && !draft.noEndDate;
                      const campaignDays = hasDuration 
                        ? Math.ceil((draft.endDate!.getTime() - draft.startDate!.getTime()) / (1000 * 60 * 60 * 24)) + 1
                        : null;
                      
                      // Derive effective daily budget regardless of budgetType
                      const effectiveDailyBudget = draft.budgetType === "daily"
                        ? draft.budget
                        : (campaignDays ? draft.budget / campaignDays : draft.budget);
                      
                      const estDailyViews = Math.round(Math.min(estimatedReach, (effectiveDailyBudget / Math.max(effectiveAvgBid, 1)) * 1000) * (winRate / 100));
                      const estTotalViews = campaignDays ? estDailyViews * campaignDays : null;
                      const maxTotalSpend = draft.budgetType === "daily" ? (campaignDays ? draft.budget * campaignDays : draft.budget) : draft.budget;
                      
                      // Estimated spend based on win rate & effective bids
                      const estDailySpend = effectiveAvgBid > 0 ? (estDailyViews * effectiveAvgBid) / 1000 : 0;
                      const estTotalSpend = campaignDays ? estDailySpend * campaignDays : estDailySpend;
                      const creditsAvail = availableCredits.USD;
                      const creditApplied = useCredits ? Math.min(creditsAvail, estTotalSpend) : 0;
                      const outOfPocket = Math.max(0, estTotalSpend - creditApplied);
                      
                      return (
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-3">Ready to submit?</h3>
                          <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                            <div>
                              <span className="text-gray-500 block text-xs">{draft.budgetType === "daily" ? "Daily Budget" : "Total Budget"}</span>
                              <span className="font-semibold text-gray-900">${formatNumber(draft.budget)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block text-xs">Schedule</span>
                              <span className="font-semibold text-gray-900">
                                {draft.startDate ? draft.startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                                {" → "}
                                {draft.noEndDate ? "Ongoing" : draft.endDate ? draft.endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 block text-xs">{hasDuration ? `Est. Views (${campaignDays}d)` : "Est. Daily Views"}</span>
                              <span className="font-semibold text-primary-600">
                                {hasDuration ? formatNumber(estTotalViews || 0) : formatNumber(estDailyViews)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 block text-xs">Win Rate</span>
                              <span className="font-semibold text-gray-900">~{winRate}%</span>
                            </div>
                          </div>
                          
                          {/* Estimated Spend Summary */}
                          <div className="p-3 bg-gray-50 rounded-lg mb-3">
                            <div className="flex items-center justify-between gap-4 text-sm">
                              <div className="flex items-center gap-4">
                                <div>
                                  <span className="text-gray-500 text-xs block">Est. Spend{campaignDays ? ` (${campaignDays}d)` : "/day"}</span>
                                  <span className="font-semibold text-gray-900">${formatNumber(Math.round(campaignDays ? estTotalSpend : estDailySpend))}</span>
                                </div>
                                {campaignDays && (
                                  <div>
                                    <span className="text-gray-500 text-xs block">Budget Cap</span>
                                    <span className="font-semibold text-gray-900">${formatNumber(maxTotalSpend)}</span>
                                  </div>
                                )}
                                {draft.audienceSegments.length > 0 && (
                                  <div>
                                    <span className="text-gray-500 text-xs block">Avg Bid (eff.)</span>
                                    <span className="font-semibold text-gray-900">${effectiveAvgBid.toFixed(2)} CPM</span>
                                  </div>
                                )}
                              </div>
                              {/* Credits + Out of pocket */}
                              <div className="flex items-center gap-3 shrink-0">
                                <div className="flex items-center gap-2 px-2.5 py-1 bg-green-50 border border-green-200 rounded-lg">
                                  <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={useCredits}
                                      onChange={(e) => setUseCredits(e.target.checked)}
                                      className="w-3 h-3 rounded border-green-300 text-green-600 focus:ring-green-500"
                                    />
                                    <span className="text-[11px] text-green-700">Credits</span>
                                  </label>
                                  <span className="text-[11px] font-medium text-green-700">${creditsAvail.toLocaleString()}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-gray-500 text-xs block">Out-of-Pocket</span>
                                  <span className={cn(
                                    "font-bold",
                                    useCredits && creditApplied > 0 ? "text-green-600" : "text-gray-900"
                                  )}>
                                    {outOfPocket <= 0 && useCredits ? "$0" : `$${formatNumber(Math.round(outOfPocket))}`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Action buttons */}
                          <div className="flex items-center justify-end gap-3 pt-3 border-t border-primary-100">
                            <Button variant="outline">Save Draft</Button>
                            <Button onClick={() => onCampaignSubmit?.()}>Submit Campaign</Button>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
