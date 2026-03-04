export type EntryType = "seller" | "brand";
export type CampaignType = "internal" | "third_party";
export type PricingModel = "cpm" | "cpt"; // CPT = Cost Per Time (hourly booking)
export type OwnerType = "self_serve" | "ops_managed";
export type LandingPageMode = "external_url" | "direct_url" | "builder";
export type BudgetType = "daily" | "total";
export type Marketplace = "noon" | "supermall";

// Slot types with their dimensions per country
export type SlotType = "mobile_hero" | "mobile_slim" | "desktop_hero" | "desktop_slim";

export interface SlotDimensions {
  type: SlotType;
  label: string;
  dimensions: {
    default: string;
    EG?: string; // Egypt has different desktop hero size
  };
}

export const SLOT_DIMENSIONS: SlotDimensions[] = [
  { type: "mobile_hero", label: "Mobile Hero", dimensions: { default: "706x320" } },
  { type: "mobile_slim", label: "Mobile Slim", dimensions: { default: "800x200" } },
  { type: "desktop_hero", label: "Desktop Hero", dimensions: { default: "1008x200", EG: "1440x200" } },
  { type: "desktop_slim", label: "Desktop Slim", dimensions: { default: "1440x200" } },
];

export interface Country {
  code: string;
  name: string;
  flag: string;
  currency: string;
  timezone: string;
}

export interface Page {
  id: string;
  name: string;
  description: string;
}

export interface Slot {
  id: string;
  name: string; // Individual slot name (e.g., "Hero Banner 1") - used for CPT
  zone?: string; // Zone name for CPM grouping (e.g., "Hero Banners")
  pageId: string;
  slotType: SlotType;
  dimensions: string; // Base dimensions
  dimensionsByCountry?: Record<string, string>; // Country-specific dimensions
  position: string;
  avgDailyViews: number;
  viewsPerDay?: number; // Estimated views per day for this slot
  cptRateUsd: number; // Hourly rate for CPT
  minCpmUsd: number;
  supportedFormats: string[];
  maxFileSizeMb: number;
}

export interface Creative {
  id: string;
  slotType: SlotType;
  platform: "mobile" | "desktop";
  language: "en" | "ar";
  format: string;
  assetUrl: string | null;
  fileName: string | null;
  dimensions: string;
}

export interface TargetingRule {
  id: string;
  type: "reengagement" | "demographic";
  intent: "include" | "exclude";
  action: string;
  filterType: string;
  filterValue: string;
  lookbackDays?: number;
}

export interface TargetingSegment {
  id: string;
  operator: "AND" | "OR";
  rules: TargetingRule[];
}

export interface AudienceCondition {
  type: "reengagement" | "demographic" | "in_market";
  name: string;
  description?: string;
  lookback?: number;
  category?: string;
  subcategory?: string;
  intent?: string;
}

export interface AudienceSegment {
  id: string;
  type: "reengagement" | "demographic" | "in_market";
  name: string;
  description?: string;
  lookback?: number;
  category?: string;
  subcategory?: string;
  intent?: string;
  bid: number;
  suggestedBid: number;
  bidRange: { min: number; max: number };
  /** Compound segment: multiple ANDed conditions. If present, the top-level type/name are summaries. */
  conditions?: AudienceCondition[];
}

export interface AvailabilityResult {
  isAvailable: boolean;
  conflicts: Array<{
    date: string;
    startTime: string;
    endTime: string;
    campaignName: string;
    advertiser: string;
  }>;
  suggestedAlternatives: Array<{
    start: string;
    end: string;
    days: number;
  }>;
  forecast?: {
    totalCapacity: number;
    availableCapacity: number;
    fillRate: number;
    loadLevel: "low" | "medium" | "high";
  };
}

export interface CampaignDraft {
  // Entry Point
  entryType: EntryType;
  
  // Mode
  ownerType: OwnerType;
  campaignType: CampaignType;
  pricingModel: PricingModel;
  
  // Location
  country: string;
  marketplace: Marketplace;
  
  // Inventory
  pageIds: string[];
  slotIds: string[]; // For CPT: single slot; For CPM: can select/exclude in targeting
  excludedSlotIds: string[]; // For CPM: slots to exclude
  
  // Schedule with time (for CPT hourly booking)
  startDate: Date | null;
  startTime: string; // "HH:MM" format in local time
  endDate: Date | null;
  endTime: string; // "HH:MM" format in local time
  noEndDate: boolean;
  
  // Budget (always USD for managed campaigns)
  budget: number;
  
  // Reach Forecast (from schedule/slots)
  estimatedTotalReach: number;
  
  // Landing Page
  landingPageMode: LandingPageMode;
  landingPageUrl: string;
  builderConfig: {
    categories: string[];
    subcategories: string[];
    fulfillment: string[];
    brands: string[];
    sellers: string[];
    products: string[];
  };
  
  // Bidding (CPM only)
  bidAmount: number;
  slotBids: Record<string, number>;
  usePerSlotBidding: boolean;
  budgetType: BudgetType;
  dailyBudget: number;
  totalBudget: number;
  pacing: "even" | "asap";
  
  // Creatives
  creatives: Creative[];
  
  // Targeting & Serving
  segmentOperator: "AND" | "OR";
  segments: TargetingSegment[];
  audienceSegments: AudienceSegment[];
  
  // Frequency Cap
  frequencyCapEnabled: boolean;
  maxViews: number;
  frequencyPeriod: string;
  
  // General
  campaignName: string;
  
  // Attribution (Internal only)
  partnerIds: string[];
  attributionBrands: string[];
  attributionCategories: string[];
}

// ─── Sales Intake Types ─────────────────────────────────────────────────────

export type BookingStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "ready_for_ops";

export type AdvertiserType = "1P" | "3P" | "marketplace";
export type IntakeCurrency = "USD" | "AED";

export const AD_ASSET_TYPES = [
  "Display – On Deck",
  "Noon CRM (Social/Email/Push/WhatsApp)",
  "Digital Media (Google/Meta/TikTok/etc)",
  "ATL",
  "BTL",
  "Influencers",
  "Data & Management Fees",
] as const;

export type AdAssetType = (typeof AD_ASSET_TYPES)[number];

export const COMMERCIAL_CATEGORIES = [
  "Electronics",
  "Fashion",
  "Beauty & Personal Care",
  "Home & Living",
  "Grocery & Essentials",
  "Baby & Kids",
  "Sports & Outdoors",
  "Health & Wellness",
  "Automotive",
  "Entertainment & Media",
  "Financial Services",
  "Telecom",
  "FMCG",
  "Other",
] as const;

export const DELAYED_PAYMENT_OPTIONS = [
  "None",
  "Net 30",
  "Net 45",
  "Net 60",
  "Net 90",
] as const;

export interface ActivityLogEntry {
  id: string;
  timestamp: Date;
  action: string;
  actor: string;
  detail?: string;
}

export interface BookingIntake {
  id: string;
  bookingName: string;
  salesEmail: string;
  partnerLeCode: string;
  brandCode: string;
  advertiserType: AdvertiserType | "";
  advertiserCountry: string;
  campaignCountry: string;
  brandBusiness: string;
  commercialCategory: string;
  commercialPoc: string;

  finalBudget: number;
  discountPercent: number;
  currency: IntakeCurrency;
  delayedPayment: string;
  invoicingMethod: string;

  adAssetTypes: AdAssetType[];
  needsCreativeServices: boolean;

  mediaBriefFileName: string;
  mediaBriefUploaded: boolean;

  status: BookingStatus;
  approvalLink: string;
  brandEditableFields: string[];
  approvedAt: Date | null;
  approvedBy: string;
  activityLog: ActivityLogEntry[];

  createdAt: Date;
}

export const FIXED_CPM_ASSUMPTION = 5; // $5 CPM for V1 forecast
export const AED_TO_USD_RATE = 0.2723; // 1 AED ≈ 0.2723 USD (mocked)
export const HIGH_BUDGET_THRESHOLD = 500_000; // USD — triggers manual review
export const MIN_BUDGET_USD = 100; // Same threshold as campaign builder ($100 minimum)

export function createInitialBooking(): BookingIntake {
  const now = new Date();
  const id = `BK-${Date.now().toString(36).toUpperCase()}`;
  return {
    id,
    bookingName: "",
    salesEmail: "sales.user@noon.com",
    partnerLeCode: "",
    brandCode: "",
    advertiserType: "",
    advertiserCountry: "",
    campaignCountry: "",
    brandBusiness: "",
    commercialCategory: "",
    commercialPoc: "",
    finalBudget: 0,
    discountPercent: 0,
    currency: "USD",
    delayedPayment: "None",
    invoicingMethod: "",
    adAssetTypes: [],
    needsCreativeServices: false,
    mediaBriefFileName: "",
    mediaBriefUploaded: false,
    status: "draft",
    approvalLink: "",
    brandEditableFields: ["finalBudget", "adAssetTypes"],
    approvedAt: null,
    approvedBy: "",
    activityLog: [
      { id: "1", timestamp: now, action: "Created", actor: "sales.user@noon.com" },
    ],
    createdAt: now,
  };
}

// ─── Campaign Draft ─────────────────────────────────────────────────────────

export const initialDraft: CampaignDraft = {
  entryType: "brand",
  ownerType: "ops_managed",
  campaignType: "internal",
  pricingModel: "cpm",
  country: "AE",
  marketplace: "noon",
  pageIds: [],
  slotIds: [],
  excludedSlotIds: [],
  startDate: null,
  startTime: "09:00",
  endDate: null,
  endTime: "08:59",
  noEndDate: false,
  budget: 1000,
  estimatedTotalReach: 0,
  landingPageMode: "builder",
  landingPageUrl: "",
  builderConfig: {
    categories: [],
    subcategories: [],
    fulfillment: [],
    brands: [],
    sellers: [],
    products: [],
  },
  bidAmount: 5,
  slotBids: {},
  usePerSlotBidding: false,
  budgetType: "daily",
  dailyBudget: 1000,
  totalBudget: 10000,
  pacing: "even",
  creatives: [],
  segmentOperator: "AND",
  segments: [],
  audienceSegments: [],
  frequencyCapEnabled: false,
  maxViews: 3,
  frequencyPeriod: "daily",
  campaignName: "",
  partnerIds: [],
  attributionBrands: [],
  attributionCategories: [],
};
