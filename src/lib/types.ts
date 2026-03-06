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
  
  // Booking linkage (set when campaign is created from a Booking)
  linkedBookingId: string;
  linkedBookingName: string;
  
  // Attribution (Internal only)
  partnerIds: string[];
  attributionBrands: string[];
  attributionCategories: string[];
}

// ─── Booking Types ──────────────────────────────────────────────────────────

export type BookingStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "in_planning"
  | "partially_converted"
  | "fully_converted";

export type AdvertiserType = "1P" | "3P" | "marketplace";
export type IntakeCurrency = "USD" | "AED";

export const COMMERCIAL_CATEGORIES = [
  "Electronics", "Fashion", "Beauty & Personal Care", "Home & Living",
  "Grocery & Essentials", "Baby & Kids", "Sports & Outdoors", "Health & Wellness",
  "Automotive", "Entertainment & Media", "Financial Services", "Telecom", "FMCG", "Other",
] as const;

export const DELAYED_PAYMENT_OPTIONS = ["None", "Net 30", "Net 45", "Net 60", "Net 90"] as const;

export const MEDIA_PLAN_CHANNELS = [
  "On Deck (Display Ads)",
  "Social / CRM / Emailers",
  "ATL / BTL / Sponsorships",
  "Sponsored Ads",
  "Brand Ads",
  "Display Ads (Programmatic)",
  "Influencers",
  "Other",
] as const;

export const MEDIA_PLAN_AD_TYPES = [
  "Managed Display Ads",
  "Self Serve Ads",
] as const;

export type ActorType = "sales" | "ops" | "brand" | "system";

export interface ActivityLogEntry {
  id: string;
  timestamp: Date;
  action: string;
  actor: string;
  actorType?: ActorType;
  detail?: string;
}

export interface MediaPlanRow {
  id: string;
  channel: string;
  adType: string;
  sharePercent: number;
  shareValue: number;
  audienceNotes: string;
}

export type BookingCampaignStatus = "draft" | "active" | "paused" | "completed" | "archived";

export interface BookingCampaign {
  id: string;
  campaignName: string;
  status: BookingCampaignStatus;
  budget: number;
  pricingModel: "cpm" | "cpt";
  startDate: Date | null;
  endDate: Date | null;
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
  createdAt: Date;
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

  needsCreativeServices: boolean;

  // Media Plan (replaces file upload)
  mediaPlan: MediaPlanRow[];
  tentativeStartDate: Date | null;
  tentativeEndDate: Date | null;
  planningNotes: string;
  audienceNotes: string;

  // Child campaigns
  campaigns: BookingCampaign[];

  status: BookingStatus;
  approvalLink: string;
  brandEditableFields: string[];
  approvedAt: Date | null;
  approvedBy: string;
  activityLog: ActivityLogEntry[];

  createdAt: Date;
  lastUpdated: Date;
}

/** Derives the conversion-phase status from child campaigns and budget. */
export function deriveConversionStatus(
  booking: BookingIntake
): { status: BookingStatus; overallocated: boolean } {
  const preApprovalStatuses: BookingStatus[] = ["draft", "pending_approval", "rejected"];
  if (preApprovalStatuses.includes(booking.status)) {
    return { status: booking.status, overallocated: false };
  }
  const netBudget = booking.finalBudget * (1 - (booking.discountPercent || 0) / 100);
  const totalAllocated = booking.campaigns.reduce((s, c) => s + c.budget, 0);
  if (booking.campaigns.length === 0) return { status: "in_planning", overallocated: false };
  if (totalAllocated >= netBudget) {
    return { status: "fully_converted", overallocated: totalAllocated > netBudget };
  }
  return { status: "partially_converted", overallocated: false };
}

export const FIXED_CPM_ASSUMPTION = 5;
export const AED_TO_USD_RATE = 0.2723;
export const HIGH_BUDGET_THRESHOLD = 500_000;
export const MIN_BUDGET_USD = 100;

export function createMediaPlanRow(): MediaPlanRow {
  return { id: Date.now().toString(36), channel: "", adType: "", sharePercent: 0, shareValue: 0, audienceNotes: "" };
}

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
    needsCreativeServices: false,
    mediaPlan: [],
    tentativeStartDate: null,
    tentativeEndDate: null,
    planningNotes: "",
    audienceNotes: "",
    campaigns: [],
    status: "draft",
    approvalLink: "",
    brandEditableFields: ["finalBudget"],
    approvedAt: null,
    approvedBy: "",
    activityLog: [
      { id: "1", timestamp: now, action: "Booking created", actor: "sales.user@noon.com" },
    ],
    createdAt: now,
    lastUpdated: now,
  };
}

export function createMockBookings(): BookingIntake[] {
  const d = (daysAgo: number) => {
    const dt = new Date(); dt.setDate(dt.getDate() - daysAgo); return dt;
  };
  return [
    {
      id: "BK-SAMSUNG-Q1",
      bookingName: "Samsung Galaxy S25 Ultra Launch",
      salesEmail: "ahmed.khan@noon.com",
      partnerLeCode: "LE-00421",
      brandCode: "samsung",
      advertiserType: "1P",
      advertiserCountry: "AE",
      campaignCountry: "AE",
      brandBusiness: "Consumer Electronics",
      commercialCategory: "Electronics",
      commercialPoc: "sara.m@noon.com",
      finalBudget: 250000,
      discountPercent: 10,
      currency: "USD",
      delayedPayment: "Net 30",
      invoicingMethod: "PO-based",
      needsCreativeServices: true,
      mediaPlan: [
        { id: "mp1", channel: "On Deck (Display Ads)", adType: "Managed Display Ads", sharePercent: 60, shareValue: 135000, audienceNotes: "Top spenders, Noon One" },
        { id: "mp2", channel: "Social / CRM / Emailers", adType: "", sharePercent: 25, shareValue: 56250, audienceNotes: "Credit card users" },
        { id: "mp3", channel: "Influencers", adType: "", sharePercent: 15, shareValue: 33750, audienceNotes: "" },
      ],
      tentativeStartDate: d(-5),
      tentativeEndDate: d(-35),
      planningNotes: "Homepage hero + Electronics CLP. Exclude Fri prayer hours.",
      audienceNotes: "Top spenders, Noon One customers, Samsung brand visitors",
      campaigns: [
        { id: "C-SAM-1", campaignName: "S25 Ultra - Homepage Hero", status: "active", budget: 80000, pricingModel: "cpm", startDate: d(5), endDate: d(-25), impressions: 12400000, clicks: 186000, ctr: 1.5, spend: 62000, createdAt: d(5) },
        { id: "C-SAM-2", campaignName: "S25 Ultra - Electronics CLP", status: "active", budget: 55000, pricingModel: "cpm", startDate: d(5), endDate: d(-25), impressions: 8200000, clicks: 98400, ctr: 1.2, spend: 41000, createdAt: d(4) },
      ],
      status: "partially_converted",
      approvalLink: "https://ads.noon.com/booking/approve/BK-SAMSUNG-Q1?token=abc123",
      brandEditableFields: ["finalBudget"],
      approvedAt: d(2),
      approvedBy: "brand.manager@samsung.com",
      activityLog: [
        { id: "1", timestamp: d(7), action: "Booking created", actor: "ahmed.khan@noon.com" },
        { id: "2", timestamp: d(5), action: "Sent for brand approval", actor: "ahmed.khan@noon.com" },
        { id: "3", timestamp: d(2), action: "Approved by brand", actor: "brand.manager@samsung.com" },
        { id: "4", timestamp: d(1), action: "Campaign created: S25 Ultra - Homepage Hero", actor: "ops.team@noon.com" },
        { id: "5", timestamp: d(1), action: "Campaign created: S25 Ultra - Electronics CLP", actor: "ops.team@noon.com" },
      ],
      createdAt: d(7),
      lastUpdated: d(1),
    },
    {
      id: "BK-NIKE-SS26",
      bookingName: "Nike Summer Collection 2026",
      salesEmail: "fatima.al@noon.com",
      partnerLeCode: "LE-00889",
      brandCode: "nike",
      advertiserType: "3P",
      advertiserCountry: "AE",
      campaignCountry: "SA",
      brandBusiness: "Athletic Apparel",
      commercialCategory: "Fashion",
      commercialPoc: "",
      finalBudget: 150000,
      discountPercent: 5,
      currency: "USD",
      delayedPayment: "Net 45",
      invoicingMethod: "Monthly",
      needsCreativeServices: false,
      mediaPlan: [
        { id: "mp1", channel: "On Deck (Display Ads)", adType: "Managed Display Ads", sharePercent: 70, shareValue: 99750, audienceNotes: "" },
        { id: "mp2", channel: "ATL / BTL / Sponsorships", adType: "", sharePercent: 30, shareValue: 42750, audienceNotes: "" },
      ],
      tentativeStartDate: d(-10),
      tentativeEndDate: d(-40),
      planningNotes: "Fashion CLP + Homepage. Summer sale dates priority.",
      audienceNotes: "Fashion enthusiasts, 18-35 age group",
      campaigns: [],
      status: "pending_approval",
      approvalLink: "https://ads.noon.com/booking/approve/BK-NIKE-SS26?token=def456",
      brandEditableFields: ["finalBudget", "bookingName"],
      approvedAt: null,
      approvedBy: "",
      activityLog: [
        { id: "1", timestamp: d(3), action: "Booking created", actor: "fatima.al@noon.com" },
        { id: "2", timestamp: d(1), action: "Sent for brand approval", actor: "fatima.al@noon.com" },
      ],
      createdAt: d(3),
      lastUpdated: d(1),
    },
    {
      id: "BK-LOREAL-BF",
      bookingName: "L'Oréal Beauty Festival",
      salesEmail: "omar.s@noon.com",
      partnerLeCode: "LE-01102",
      brandCode: "loreal",
      advertiserType: "1P",
      advertiserCountry: "AE",
      campaignCountry: "AE",
      brandBusiness: "Beauty & Cosmetics",
      commercialCategory: "Beauty & Personal Care",
      commercialPoc: "hana.r@noon.com",
      finalBudget: 80000,
      discountPercent: 15,
      currency: "USD",
      delayedPayment: "None",
      invoicingMethod: "",
      needsCreativeServices: true,
      mediaPlan: [
        { id: "mp1", channel: "On Deck (Display Ads)", adType: "Managed Display Ads", sharePercent: 50, shareValue: 34000, audienceNotes: "Beauty buyers" },
        { id: "mp2", channel: "Influencers", adType: "", sharePercent: 30, shareValue: 20400, audienceNotes: "" },
        { id: "mp3", channel: "Social / CRM / Emailers", adType: "", sharePercent: 20, shareValue: 13600, audienceNotes: "" },
      ],
      tentativeStartDate: d(-7),
      tentativeEndDate: d(-21),
      planningNotes: "Beauty CLP hero slots. Homepage during sale days.",
      audienceNotes: "Top spenders in Beauty, Noon One customers",
      campaigns: [],
      status: "in_planning",
      approvalLink: "https://ads.noon.com/booking/approve/BK-LOREAL-BF?token=ghi789",
      brandEditableFields: ["finalBudget"],
      approvedAt: d(5),
      approvedBy: "marketing@loreal-me.com",
      activityLog: [
        { id: "1", timestamp: d(14), action: "Booking created", actor: "omar.s@noon.com" },
        { id: "2", timestamp: d(10), action: "Sent for brand approval", actor: "omar.s@noon.com" },
        { id: "3", timestamp: d(5), action: "Approved by brand", actor: "marketing@loreal-me.com" },
        { id: "4", timestamp: d(4), action: "Moved to planning", actor: "omar.s@noon.com" },
      ],
      createdAt: d(14),
      lastUpdated: d(4),
    },
    {
      id: "BK-ADIDAS-EG",
      bookingName: "Adidas Egypt Ramadan Push",
      salesEmail: "ahmed.khan@noon.com",
      partnerLeCode: "LE-00567",
      brandCode: "adidas",
      advertiserType: "3P",
      advertiserCountry: "EG",
      campaignCountry: "EG",
      brandBusiness: "Sportswear",
      commercialCategory: "Fashion",
      commercialPoc: "",
      finalBudget: 45000,
      discountPercent: 0,
      currency: "USD",
      delayedPayment: "Net 30",
      invoicingMethod: "PO-based",
      needsCreativeServices: false,
      mediaPlan: [],
      tentativeStartDate: null,
      tentativeEndDate: null,
      planningNotes: "",
      audienceNotes: "",
      campaigns: [],
      status: "draft",
      approvalLink: "",
      brandEditableFields: ["finalBudget"],
      approvedAt: null,
      approvedBy: "",
      activityLog: [
        { id: "1", timestamp: d(1), action: "Booking created", actor: "ahmed.khan@noon.com" },
      ],
      createdAt: d(1),
      lastUpdated: d(1),
    },
    {
      id: "BK-NESTLE-KSA",
      bookingName: "Nestlé KSA Always-On H1",
      salesEmail: "fatima.al@noon.com",
      partnerLeCode: "LE-00234",
      brandCode: "nestle",
      advertiserType: "1P",
      advertiserCountry: "SA",
      campaignCountry: "SA",
      brandBusiness: "FMCG / Food & Beverage",
      commercialCategory: "FMCG",
      commercialPoc: "ops.lead@noon.com",
      finalBudget: 320000,
      discountPercent: 8,
      currency: "USD",
      delayedPayment: "Net 60",
      invoicingMethod: "Monthly",
      needsCreativeServices: true,
      mediaPlan: [
        { id: "mp1", channel: "On Deck (Display Ads)", adType: "Managed Display Ads", sharePercent: 40, shareValue: 117760, audienceNotes: "Grocery top spenders" },
        { id: "mp2", channel: "Sponsored Ads", adType: "Self Serve Ads", sharePercent: 25, shareValue: 73600, audienceNotes: "" },
        { id: "mp3", channel: "Social / CRM / Emailers", adType: "", sharePercent: 20, shareValue: 58880, audienceNotes: "Noon One, Credit card users" },
        { id: "mp4", channel: "ATL / BTL / Sponsorships", adType: "", sharePercent: 15, shareValue: 44160, audienceNotes: "" },
      ],
      tentativeStartDate: d(25),
      tentativeEndDate: d(-155),
      planningNotes: "Homepage + Grocery CLP always-on. Heavy during Ramadan.",
      audienceNotes: "Grocery top spenders, Noon One, families",
      campaigns: [
        { id: "C-NES-1", campaignName: "Nestlé Ramadan - Homepage", status: "completed", budget: 50000, pricingModel: "cpm", startDate: d(25), endDate: d(0), impressions: 9800000, clicks: 127400, ctr: 1.3, spend: 49000, createdAt: d(18) },
        { id: "C-NES-2", campaignName: "Nestlé Ramadan - Grocery CLP", status: "active", budget: 35000, pricingModel: "cpm", startDate: d(20), endDate: d(-10), impressions: 5600000, clicks: 72800, ctr: 1.3, spend: 28000, createdAt: d(18) },
        { id: "C-NES-3", campaignName: "Nestlé Always-On Sponsored", status: "active", budget: 32000, pricingModel: "cpm", startDate: d(15), endDate: d(-155), impressions: 3200000, clicks: 38400, ctr: 1.2, spend: 16000, createdAt: d(15) },
      ],
      status: "fully_converted",
      approvalLink: "https://ads.noon.com/booking/approve/BK-NESTLE-KSA?token=jkl012",
      brandEditableFields: ["finalBudget"],
      approvedAt: d(20),
      approvedBy: "nestle.me@partner.com",
      activityLog: [
        { id: "1", timestamp: d(30), action: "Booking created", actor: "fatima.al@noon.com" },
        { id: "2", timestamp: d(28), action: "Sent for brand approval", actor: "fatima.al@noon.com" },
        { id: "3", timestamp: d(20), action: "Approved by brand", actor: "nestle.me@partner.com" },
        { id: "4", timestamp: d(18), action: "Campaign created: Nestlé Ramadan - Homepage", actor: "ops.team@noon.com" },
        { id: "5", timestamp: d(18), action: "Campaign created: Nestlé Ramadan - Grocery CLP", actor: "ops.team@noon.com" },
        { id: "6", timestamp: d(15), action: "Campaign created: Nestlé Always-On Sponsored", actor: "ops.team@noon.com" },
        { id: "7", timestamp: d(15), action: "Marked as fully converted", actor: "ops.team@noon.com" },
      ],
      createdAt: d(30),
      lastUpdated: d(15),
    },
    {
      id: "BK-RAMADAN-ELEC",
      bookingName: "Ramadan Electronics Push",
      salesEmail: "sara.m@noon.com",
      partnerLeCode: "LE-00550",
      brandCode: "samsung",
      advertiserType: "1P",
      advertiserCountry: "AE",
      campaignCountry: "AE",
      brandBusiness: "Consumer Electronics",
      commercialCategory: "Electronics",
      commercialPoc: "sara.m@noon.com",
      finalBudget: 10000,
      discountPercent: 0,
      currency: "USD",
      delayedPayment: "None",
      invoicingMethod: "PO-based",
      needsCreativeServices: false,
      mediaPlan: [
        { id: "mp1", channel: "On Deck (Display Ads)", adType: "Managed Display Ads", sharePercent: 40, shareValue: 4000, audienceNotes: "Homepage visitors" },
        { id: "mp2", channel: "Display Ads (Programmatic)", adType: "Managed Display Ads", sharePercent: 35, shareValue: 3500, audienceNotes: "Electronics CLP browsers" },
        { id: "mp3", channel: "Social / CRM / Emailers", adType: "Managed Display Ads", sharePercent: 25, shareValue: 2500, audienceNotes: "Retargeting pool" },
      ],
      tentativeStartDate: d(20),
      tentativeEndDate: d(-10),
      planningNotes: "Full Ramadan push across homepage, CLP, and retargeting.",
      audienceNotes: "Electronics top spenders, Noon One members",
      campaigns: [
        { id: "C-RAM-HP", campaignName: "Homepage Hero Campaign", status: "active", budget: 4000, pricingModel: "cpm", startDate: d(18), endDate: d(-10), impressions: 1800000, clicks: 21600, ctr: 1.2, spend: 3200, createdAt: d(18) },
        { id: "C-RAM-CLP", campaignName: "CLP Visibility Campaign", status: "active", budget: 3500, pricingModel: "cpm", startDate: d(18), endDate: d(-10), impressions: 1500000, clicks: 16500, ctr: 1.1, spend: 2800, createdAt: d(18) },
        { id: "C-RAM-RT", campaignName: "Retargeting Banner Campaign", status: "active", budget: 2500, pricingModel: "cpm", startDate: d(15), endDate: d(-10), impressions: 1100000, clicks: 14300, ctr: 1.3, spend: 2000, createdAt: d(15) },
      ],
      status: "fully_converted",
      approvalLink: "https://ads.noon.com/booking/approve/BK-RAMADAN-ELEC?token=ram123",
      brandEditableFields: ["finalBudget"],
      approvedAt: d(19),
      approvedBy: "electronics.buyer@partner.com",
      activityLog: [
        { id: "1", timestamp: d(22), action: "Booking created", actor: "sara.m@noon.com", actorType: "sales" as const },
        { id: "2", timestamp: d(21), action: "Sent for brand approval", actor: "sara.m@noon.com", actorType: "sales" as const },
        { id: "3", timestamp: d(19), action: "Approved by brand", actor: "electronics.buyer@partner.com", actorType: "brand" as const },
        { id: "4", timestamp: d(18), action: "Campaign added: Homepage Hero Campaign", actor: "ops.team@noon.com", actorType: "ops" as const },
        { id: "5", timestamp: d(18), action: "Campaign added: CLP Visibility Campaign", actor: "ops.team@noon.com", actorType: "ops" as const },
        { id: "6", timestamp: d(15), action: "Campaign added: Retargeting Banner Campaign", actor: "ops.team@noon.com", actorType: "ops" as const },
      ],
      createdAt: d(22),
      lastUpdated: d(15),
    },
    {
      id: "BK-NIVEA-REJ",
      bookingName: "Nivea Winter Skincare",
      salesEmail: "omar.s@noon.com",
      partnerLeCode: "LE-00998",
      brandCode: "nivea",
      advertiserType: "marketplace",
      advertiserCountry: "AE",
      campaignCountry: "AE",
      brandBusiness: "Personal Care",
      commercialCategory: "Beauty & Personal Care",
      commercialPoc: "",
      finalBudget: 25000,
      discountPercent: 0,
      currency: "AED",
      delayedPayment: "None",
      invoicingMethod: "",
      needsCreativeServices: false,
      mediaPlan: [],
      tentativeStartDate: null,
      tentativeEndDate: null,
      planningNotes: "",
      audienceNotes: "",
      campaigns: [],
      status: "rejected",
      approvalLink: "https://ads.noon.com/booking/approve/BK-NIVEA-REJ?token=mno345",
      brandEditableFields: ["finalBudget"],
      approvedAt: null,
      approvedBy: "",
      activityLog: [
        { id: "1", timestamp: d(10), action: "Booking created", actor: "omar.s@noon.com" },
        { id: "2", timestamp: d(8), action: "Sent for brand approval", actor: "omar.s@noon.com" },
        { id: "3", timestamp: d(6), action: "Rejected by brand", actor: "brand@nivea-me.com" },
      ],
      createdAt: d(10),
      lastUpdated: d(6),
    },
  ];
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
  linkedBookingId: "",
  linkedBookingName: "",
  partnerIds: [],
  attributionBrands: [],
  attributionCategories: [],
};
