"use client";

import React, { useMemo, useCallback, useRef, useEffect } from "react";
import { useIntake } from "@/context/IntakeContext";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils";
import {
  BookingStatus,
  BookingCampaignStatus,
  AdvertiserType,
  ActorType,
  COMMERCIAL_CATEGORIES,
  DELAYED_PAYMENT_OPTIONS,
  MEDIA_PLAN_CHANNELS,
  MEDIA_PLAN_AD_TYPES,
  FIXED_CPM_ASSUMPTION,
  AED_TO_USD_RATE,
  HIGH_BUDGET_THRESHOLD,
  MIN_BUDGET_USD,
  ActivityLogEntry,
  MediaPlanRow,
  createMediaPlanRow,
  deriveConversionStatus,
} from "@/lib/types";
import { brands } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Alert } from "@/components/ui/Alert";
import {
  Send,
  CheckCircle,
  XCircle,
  ArrowLeft,
  DollarSign,
  Eye,
  TrendingUp,
  Link2,
  AlertTriangle,
  BookOpen,
  Palette,
  Shield,
  Activity,
  Copy,
  Check,
  Plus,
  Trash2,
  Calendar,
  FileText,
  PlusCircle,
  Layers,
  ExternalLink,
  MapPin,
  Users,
  Save,
  Hash,
} from "lucide-react";

// ── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: "text-gray-600", bg: "bg-gray-100" },
  pending_approval: { label: "Pending Brand Approval", color: "text-amber-700", bg: "bg-amber-50" },
  approved: { label: "Approved by Brand", color: "text-blue-700", bg: "bg-blue-50" },
  rejected: { label: "Rejected", color: "text-red-700", bg: "bg-red-50" },
  in_planning: { label: "Planning", color: "text-purple-700", bg: "bg-purple-50" },
  partially_converted: { label: "Partially Converted", color: "text-orange-700", bg: "bg-orange-50" },
  fully_converted: { label: "Fully Converted", color: "text-green-700", bg: "bg-green-50" },
};

const CAMPAIGN_STATUS_CONFIG: Record<BookingCampaignStatus, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: "text-gray-600", bg: "bg-gray-100" },
  active: { label: "Active", color: "text-green-700", bg: "bg-green-50" },
  paused: { label: "Paused", color: "text-amber-700", bg: "bg-amber-50" },
  completed: { label: "Completed", color: "text-blue-700", bg: "bg-blue-50" },
  archived: { label: "Archived", color: "text-gray-500", bg: "bg-gray-50" },
};

const COUNTRY_OPTIONS = [
  { value: "AE", label: "UAE" },
  { value: "SA", label: "KSA" },
  { value: "EG", label: "Egypt" },
  { value: "OTHER", label: "Other" },
];

const ADVERTISER_TYPE_OPTIONS: { value: AdvertiserType; label: string }[] = [
  { value: "1P", label: "1P (First Party)" },
  { value: "3P", label: "3P (Third Party)" },
  { value: "marketplace", label: "Marketplace" },
];

// ── Validation ───────────────────────────────────────────────────────────────

interface ValidationErrors {
  bookingName?: string;
  partnerLeCode?: string;
  brandCode?: string;
  advertiserType?: string;
  advertiserCountry?: string;
  campaignCountry?: string;
  commercialPoc?: string;
  finalBudget?: string;
}

function useValidation() {
  const { intake } = useIntake();
  return useMemo(() => {
    const errors: ValidationErrors = {};
    if (!intake.bookingName.trim()) errors.bookingName = "Booking name is required";
    if (!intake.partnerLeCode.trim()) errors.partnerLeCode = "LE Code is required";
    if (!intake.brandCode) errors.brandCode = "Brand is required";
    if (!intake.advertiserType) errors.advertiserType = "Advertiser type is required";
    if (!intake.advertiserCountry) errors.advertiserCountry = "Advertiser country is required";
    if (!intake.campaignCountry) errors.campaignCountry = "Campaign country is required";
    if (intake.advertiserType === "1P" && !intake.commercialPoc.trim())
      errors.commercialPoc = "Commercial POC is required for 1P bookings";
    if (!intake.finalBudget || intake.finalBudget <= 0) {
      errors.finalBudget = "Budget is required";
    } else {
      const netBudget = intake.finalBudget * (1 - (intake.discountPercent || 0) / 100);
      const netUsd = intake.currency === "AED" ? netBudget * AED_TO_USD_RATE : netBudget;
      if (netUsd < MIN_BUDGET_USD)
        errors.finalBudget = `Minimum net budget is $${MIN_BUDGET_USD} USD${intake.currency === "AED" ? ` (≈ ${Math.ceil(MIN_BUDGET_USD / AED_TO_USD_RATE)} AED)` : ""}`;
    }
    return { errors, isValid: Object.keys(errors).length === 0 };
  }, [intake]);
}

function ValidationSummary({ errors }: { errors: ValidationErrors }) {
  const items = Object.values(errors);
  if (items.length === 0) return null;
  return (
    <Alert variant="warning" title={`${items.length} issue${items.length > 1 ? "s" : ""} to fix`}>
      <ul className="list-disc pl-4 space-y-0.5">
        {items.map((msg, i) => <li key={i}>{msg}</li>)}
      </ul>
    </Alert>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

interface BookingDetailPageProps {
  onAddCampaign: () => void;
  onOpenBrandPreview: () => void;
  onBackToList: () => void;
}

export function BookingDetailPage({ onAddCampaign, onOpenBrandPreview, onBackToList }: BookingDetailPageProps) {
  const { intake, updateIntake, saveBooking, removeCampaignFromBooking } = useIntake();
  const { errors, isValid } = useValidation();
  const [showErrors, setShowErrors] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState<{ campaignId: string; campaignName: string } | null>(null);
  const [actorType, setActorType] = React.useState<ActorType>("ops");
  const [isDirty, setIsDirty] = React.useState(false);
  const [justSaved, setJustSaved] = React.useState(false);

  const snapshotRef = useRef(JSON.stringify(intake));
  useEffect(() => {
    snapshotRef.current = JSON.stringify(intake);
    setIsDirty(false);
  }, [intake.id]);

  const handleFieldUpdate = useCallback(
    (updates: Partial<typeof intake>) => {
      updateIntake(updates);
      setIsDirty(true);
      setJustSaved(false);
    },
    [updateIntake]
  );

  const handleSave = useCallback(() => {
    saveBooking(actorType, "Booking details updated");
    setIsDirty(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
  }, [saveBooking, actorType]);

  const { status: derivedStatus, overallocated } = useMemo(
    () => deriveConversionStatus(intake),
    [intake]
  );
  const statusCfg = STATUS_CONFIG[derivedStatus] || STATUS_CONFIG.draft;
  const is1P = intake.advertiserType === "1P";

  const budgetCalcs = useMemo(() => {
    const gross = intake.finalBudget || 0;
    const disc = Math.max(0, Math.min(100, intake.discountPercent || 0));
    const net = gross * (1 - disc / 100);
    const netUsd = intake.currency === "AED" ? net * AED_TO_USD_RATE : net;
    const estImpressions = netUsd > 0 ? Math.round((netUsd / FIXED_CPM_ASSUMPTION) * 1000) : 0;
    const isFeasible = netUsd >= MIN_BUDGET_USD && netUsd <= HIGH_BUDGET_THRESHOLD;
    const belowMinimum = netUsd > 0 && netUsd < MIN_BUDGET_USD;
    return { gross, disc, net, netUsd, estImpressions, isFeasible, belowMinimum };
  }, [intake.finalBudget, intake.discountPercent, intake.currency]);

  const campaignRollup = useMemo(() => {
    const camps = intake.campaigns;
    const totalBudget = camps.reduce((s, c) => s + c.budget, 0);
    const totalImpressions = camps.reduce((s, c) => s + c.impressions, 0);
    const totalSpend = camps.reduce((s, c) => s + c.spend, 0);
    const remaining = budgetCalcs.net - totalBudget;
    return { count: camps.length, totalBudget, totalImpressions, totalSpend, remaining };
  }, [intake.campaigns, budgetCalcs.net]);

  const canSendForApproval = isValid && intake.status === "draft";
  const canAddCampaign =
    derivedStatus === "approved" ||
    derivedStatus === "in_planning" ||
    derivedStatus === "partially_converted";

  const addLogEntry = useCallback(
    (action: string, actor: string = "sales.user@noon.com", aType: ActorType = "sales", detail?: string) => {
      const entry: ActivityLogEntry = {
        id: Date.now().toString(), timestamp: new Date(), action, actor, actorType: aType, detail,
      };
      updateIntake({ activityLog: [...intake.activityLog, entry] });
    },
    [intake.activityLog, updateIntake]
  );

  const handleSendForApproval = () => {
    if (!isValid) { setShowErrors(true); return; }
    const link = `https://ads.noon.com/booking/approve/${intake.id}?token=${Date.now().toString(36)}`;
    updateIntake({ status: "pending_approval", approvalLink: link });
    addLogEntry("Sent for brand approval", "sales.user@noon.com", "sales");
    setShowErrors(false);
    setIsDirty(false);
  };

  const handleApprove = () => {
    updateIntake({ status: "approved", approvedAt: new Date(), approvedBy: "brand.contact@partner.com" });
    addLogEntry("Approved by brand", "brand.contact@partner.com", "brand");
  };

  const handleReject = () => {
    updateIntake({ status: "rejected" });
    addLogEntry("Rejected by brand", "brand.contact@partner.com", "brand");
  };

  const [copiedLink, setCopiedLink] = React.useState(false);
  const copyApprovalLink = () => {
    navigator.clipboard.writeText(intake.approvalLink).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const inlineError = (field: keyof ValidationErrors) =>
    showErrors && errors[field] ? errors[field] : undefined;

  const addMediaPlanRow = () => {
    handleFieldUpdate({ mediaPlan: [...intake.mediaPlan, createMediaPlanRow()] });
  };
  const updateMediaPlanRow = (id: string, updates: Partial<MediaPlanRow>) => {
    handleFieldUpdate({ mediaPlan: intake.mediaPlan.map((r) => (r.id === id ? { ...r, ...updates } : r)) });
  };
  const removeMediaPlanRow = (id: string) => {
    handleFieldUpdate({ mediaPlan: intake.mediaPlan.filter((r) => r.id !== id) });
  };
  const mediaPlanTotalPercent = intake.mediaPlan.reduce((s, r) => s + (r.sharePercent || 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={onBackToList} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-1.5 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Bookings
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {intake.bookingName || "Untitled Booking"}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
              <Hash className="w-3 h-3" />{intake.id}
            </span>
            <span className="text-sm text-gray-500">Manage booking details, media plan, and campaigns</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Actor toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden text-xs">
            {(["sales", "ops"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActorType(t)}
                className={cn(
                  "px-3 py-1.5 font-medium transition-colors",
                  actorType === t
                    ? "bg-primary-50 text-primary-700 border-primary-200"
                    : "text-gray-500 hover:bg-gray-50"
                )}
              >
                {t === "sales" ? "Sales" : "Ops"}
              </button>
            ))}
          </div>
          <span className={cn("px-3 py-1.5 rounded-full text-sm font-medium", statusCfg.bg, statusCfg.color)}>
            {statusCfg.label}
          </span>
        </div>
      </div>

      {/* Save Bar */}
      {isDirty && (
        <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
          <span className="text-sm text-amber-800 font-medium">You have unsaved changes</span>
          <Button size="sm" onClick={handleSave}>
            <Save className="w-3.5 h-3.5 mr-1.5" />
            Save Changes
          </Button>
        </div>
      )}
      {justSaved && !isDirty && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium">
          <CheckCircle className="w-4 h-4" />
          Changes saved &middot; Logged as {actorType === "sales" ? "Sales" : "Ops"} edit
        </div>
      )}

      {showErrors && !isValid && <ValidationSummary errors={errors} />}

      {/* Overallocation warning */}
      {overallocated && (
        <Alert variant="warning" title="Budget overallocated">
          Campaign budgets (${campaignRollup.totalBudget.toLocaleString()}) exceed the booking net budget (${Math.round(budgetCalcs.net).toLocaleString()}). Review campaign allocations.
        </Alert>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* ── Left Column ─────────────────────────────────────── */}
        <div className="col-span-8 space-y-6">
          {/* SECTION 1 — Booking Overview */}
          <Card>
            <div className="p-5 border-b border-gray-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-gray-900">Booking Overview</h2>
            </div>
            <CardContent className="space-y-4">
              {/* Booking Code (read-only) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Booking Code</label>
                  <div className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm font-mono">
                    {intake.id}
                  </div>
                </div>
                <Input label="Sales Email" value={intake.salesEmail} disabled helper="Auto-filled from your account" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Booking Name" required placeholder="e.g., Samsung Galaxy S25 Launch" value={intake.bookingName} onChange={(e) => handleFieldUpdate({ bookingName: e.target.value })} error={inlineError("bookingName")} />
                <Input label="Partner LE Code" required placeholder="e.g., LE-00123" value={intake.partnerLeCode} onChange={(e) => handleFieldUpdate({ partnerLeCode: e.target.value })} error={inlineError("partnerLeCode")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Brand Code" required value={intake.brandCode} onChange={(e) => { handleFieldUpdate({ brandCode: e.target.value }); }} placeholder="Select brand..." options={brands.map((b) => ({ value: b.id, label: b.name }))} error={inlineError("brandCode")} />
                <Select label="Advertiser Type" required value={intake.advertiserType} onChange={(e) => handleFieldUpdate({ advertiserType: e.target.value as AdvertiserType })} placeholder="Select type..." options={ADVERTISER_TYPE_OPTIONS} error={inlineError("advertiserType")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Advertiser Registered Country" required value={intake.advertiserCountry} onChange={(e) => handleFieldUpdate({ advertiserCountry: e.target.value })} placeholder="Select country..." options={COUNTRY_OPTIONS} error={inlineError("advertiserCountry")} />
                <Select label="Campaign Country" required value={intake.campaignCountry} onChange={(e) => handleFieldUpdate({ campaignCountry: e.target.value })} placeholder="Select country..." options={COUNTRY_OPTIONS} error={inlineError("campaignCountry")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Brand Business" placeholder="e.g., Consumer Electronics" value={intake.brandBusiness} onChange={(e) => handleFieldUpdate({ brandBusiness: e.target.value })} />
                <Select label="Commercial Category" value={intake.commercialCategory} onChange={(e) => handleFieldUpdate({ commercialCategory: e.target.value })} placeholder="Select category..." options={COMMERCIAL_CATEGORIES.map((c) => ({ value: c, label: c }))} />
              </div>
              {is1P && (
                <Input label="Commercial POC" required placeholder="e.g., john.doe@noon.com" value={intake.commercialPoc} onChange={(e) => handleFieldUpdate({ commercialPoc: e.target.value })} helper="Required for 1P / endemic bookings" error={inlineError("commercialPoc")} />
              )}
            </CardContent>
          </Card>

          {/* SECTION 2 — Budget & Commercial Terms */}
          <Card>
            <div className="p-5 border-b border-gray-100 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-gray-900">Budget & Commercial Terms</h2>
            </div>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Input label="Final Budget (excl. tax & discounts)" required type="number" min={0} placeholder="0" value={intake.finalBudget || ""} onChange={(e) => handleFieldUpdate({ finalBudget: parseFloat(e.target.value) || 0 })} error={inlineError("finalBudget")} />
                <Input label="Expected Discount %" required type="number" min={0} max={100} placeholder="0" value={intake.discountPercent || ""} onChange={(e) => handleFieldUpdate({ discountPercent: parseFloat(e.target.value) || 0 })} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency <span className="text-red-500 ml-1">*</span></label>
                  <div className="flex gap-2">
                    {(["USD", "AED"] as const).map((cur) => (
                      <button key={cur} onClick={() => handleFieldUpdate({ currency: cur })} className={cn("flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors", intake.currency === cur ? "border-primary-500 bg-primary-50 text-primary-700" : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50")}>
                        {cur}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Delayed Payment Interest" value={intake.delayedPayment} onChange={(e) => handleFieldUpdate({ delayedPayment: e.target.value })} options={DELAYED_PAYMENT_OPTIONS.map((d) => ({ value: d, label: d }))} />
                <Input label="Invoicing Method" placeholder="e.g., PO-based, monthly" value={intake.invoicingMethod} onChange={(e) => handleFieldUpdate({ invoicingMethod: e.target.value })} />
              </div>
              {intake.finalBudget > 0 && (
                <div className={cn("rounded-xl p-4 mt-2", overallocated ? "bg-gradient-to-r from-red-50 to-amber-50 border border-red-200" : budgetCalcs.belowMinimum ? "bg-gradient-to-r from-red-50 to-amber-50 border border-red-200" : "bg-gradient-to-r from-primary-50 to-blue-50")}>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Budget Summary</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-xs text-gray-500 block">Gross Budget</span>
                      <span className="text-lg font-bold text-gray-900">{intake.currency === "USD" ? "$" : ""}{budgetCalcs.gross.toLocaleString()}{intake.currency === "AED" ? " AED" : ""}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Discount</span>
                      <span className="text-lg font-bold text-amber-600">{budgetCalcs.disc}%</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Net Budget</span>
                      <span className={cn("text-lg font-bold", budgetCalcs.belowMinimum ? "text-red-600" : "text-green-600")}>{intake.currency === "USD" ? "$" : ""}{budgetCalcs.net.toLocaleString(undefined, { maximumFractionDigits: 2 })}{intake.currency === "AED" ? " AED" : ""}</span>
                    </div>
                  </div>
                  {budgetCalcs.belowMinimum && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-red-600">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>Net budget (${budgetCalcs.netUsd.toFixed(0)} USD) is below the ${MIN_BUDGET_USD} minimum</span>
                    </div>
                  )}
                  {intake.currency === "AED" && !budgetCalcs.belowMinimum && (
                    <p className="text-[11px] text-gray-400 mt-2">Approx. ${budgetCalcs.netUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} USD at mocked rate</p>
                  )}
                  {/* Allocation progress */}
                  {campaignRollup.count > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200/60">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <span className="text-xs text-gray-500 block">Allocated</span>
                          <span className={cn("text-sm font-semibold", overallocated ? "text-red-600" : "text-gray-900")}>${campaignRollup.totalBudget.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">Campaigns</span>
                          <span className="text-sm font-semibold text-gray-900">{campaignRollup.count}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">{overallocated ? "Over by" : "Unallocated"}</span>
                          <span className={cn("text-sm font-semibold", overallocated ? "text-red-600" : campaignRollup.remaining > 0 ? "text-amber-600" : "text-green-600")}>
                            ${Math.abs(campaignRollup.remaining).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-2">
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all", overallocated ? "bg-red-500" : campaignRollup.remaining <= 0 ? "bg-green-500" : "bg-primary-500")}
                            style={{ width: `${Math.min(100, budgetCalcs.net > 0 ? (campaignRollup.totalBudget / budgetCalcs.net) * 100 : 0)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {budgetCalcs.net > 0 ? Math.round((campaignRollup.totalBudget / budgetCalcs.net) * 100) : 0}% of net budget allocated
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SECTION 3 — Media Plan Input */}
          <Card>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-500" />
                <h2 className="text-lg font-semibold text-gray-900">Media Plan</h2>
              </div>
              <button onClick={addMediaPlanRow} className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors">
                <Plus className="w-4 h-4" />
                Add Row
              </button>
            </div>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5"><Calendar className="w-3.5 h-3.5 inline mr-1.5" />Tentative Start Date</label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" value={intake.tentativeStartDate ? intake.tentativeStartDate.toISOString().split("T")[0] : ""} onChange={(e) => handleFieldUpdate({ tentativeStartDate: e.target.value ? new Date(e.target.value) : null })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5"><Calendar className="w-3.5 h-3.5 inline mr-1.5" />Tentative End Date</label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" value={intake.tentativeEndDate ? intake.tentativeEndDate.toISOString().split("T")[0] : ""} onChange={(e) => handleFieldUpdate({ tentativeEndDate: e.target.value ? new Date(e.target.value) : null })} />
                </div>
              </div>

              {intake.mediaPlan.length > 0 ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-3 py-2.5 font-medium text-gray-600">Channel / Asset</th>
                        <th className="text-left px-3 py-2.5 font-medium text-gray-600">Ad Type</th>
                        <th className="text-center px-3 py-2.5 font-medium text-gray-600 w-24">Share %</th>
                        <th className="text-center px-3 py-2.5 font-medium text-gray-600 w-28">Value</th>
                        <th className="text-left px-3 py-2.5 font-medium text-gray-600">Audience Notes</th>
                        <th className="w-10 px-2 py-2.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {intake.mediaPlan.map((row) => (
                        <tr key={row.id} className="border-b border-gray-100 last:border-b-0">
                          <td className="px-3 py-2">
                            <select value={row.channel} onChange={(e) => updateMediaPlanRow(row.id, { channel: e.target.value })} className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary-500">
                              <option value="">Select channel...</option>
                              {MEDIA_PLAN_CHANNELS.map((ch) => <option key={ch} value={ch}>{ch}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <select value={row.adType} onChange={(e) => updateMediaPlanRow(row.id, { adType: e.target.value })} className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary-500">
                              <option value="">—</option>
                              {MEDIA_PLAN_AD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input type="number" min={0} max={100} value={row.sharePercent || ""} onChange={(e) => { const pct = parseFloat(e.target.value) || 0; const val = budgetCalcs.net > 0 ? (pct / 100) * budgetCalcs.net : 0; updateMediaPlanRow(row.id, { sharePercent: pct, shareValue: Math.round(val) }); }} className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary-500" placeholder="0" />
                          </td>
                          <td className="px-3 py-2 text-center text-sm font-medium text-gray-700">{row.shareValue > 0 ? `$${row.shareValue.toLocaleString()}` : "—"}</td>
                          <td className="px-3 py-2">
                            <input type="text" value={row.audienceNotes} onChange={(e) => updateMediaPlanRow(row.id, { audienceNotes: e.target.value })} className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500" placeholder="e.g., Top spenders..." />
                          </td>
                          <td className="px-2 py-2">
                            <button onClick={() => removeMediaPlanRow(row.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50/80 border-t border-gray-200">
                        <td className="px-3 py-2 text-sm font-medium text-gray-600" colSpan={2}>Total</td>
                        <td className={cn("px-3 py-2 text-sm font-bold text-center", mediaPlanTotalPercent > 100 ? "text-red-600" : mediaPlanTotalPercent === 100 ? "text-green-600" : "text-gray-900")}>{mediaPlanTotalPercent}%</td>
                        <td className="px-3 py-2 text-sm font-bold text-center text-gray-900">${intake.mediaPlan.reduce((s, r) => s + r.shareValue, 0).toLocaleString()}</td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                  <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-3">No media plan rows yet</p>
                  <button onClick={addMediaPlanRow} className="text-sm text-primary-600 hover:text-primary-700 font-medium">+ Add your first planning row</button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5"><MapPin className="w-3.5 h-3.5 inline mr-1.5" />Planning Notes</label>
                <textarea rows={3} value={intake.planningNotes} onChange={(e) => handleFieldUpdate({ planningNotes: e.target.value })} placeholder="Preferred placements, pages, date exclusions, special instructions..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5"><Users className="w-3.5 h-3.5 inline mr-1.5" />Audience Targeting Notes</label>
                <textarea rows={2} value={intake.audienceNotes} onChange={(e) => handleFieldUpdate({ audienceNotes: e.target.value })} placeholder="e.g., Top spenders, Noon One customers, Credit card users..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none" />
              </div>
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Does the client need creative services?</span>
                    <p className="text-xs text-gray-400 mt-0.5">Indicate if noon&apos;s design team should produce ad creatives</p>
                  </div>
                  <Toggle checked={intake.needsCreativeServices} onChange={(v) => handleFieldUpdate({ needsCreativeServices: v })} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 4 — Campaigns Under This Booking */}
          <Card>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary-500" />
                <h2 className="text-lg font-semibold text-gray-900">Campaigns</h2>
                {intake.campaigns.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-full">{intake.campaigns.length}</span>
                )}
              </div>
              {canAddCampaign && (
                <button onClick={onAddCampaign} className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors">
                  <PlusCircle className="w-4 h-4" />
                  Add Campaign
                </button>
              )}
            </div>
            <CardContent>
              {intake.campaigns.length === 0 ? (
                <div className="py-8 text-center">
                  <Layers className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-1">No campaigns created yet</p>
                  <p className="text-xs text-gray-400">
                    {canAddCampaign ? "Add a campaign to start executing this booking" : "Campaigns can be added once the booking is approved"}
                  </p>
                  {canAddCampaign && (
                    <button onClick={onAddCampaign} className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium">+ Add Campaign</button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-5 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                    <div className="flex items-center gap-1.5"><span className="text-gray-500">Allocated:</span><span className={cn("font-semibold", overallocated ? "text-red-600" : "text-gray-900")}>${campaignRollup.totalBudget.toLocaleString()}</span></div>
                    <div className="flex items-center gap-1.5"><span className="text-gray-500">Impressions:</span><span className="font-semibold text-gray-900">{formatNumber(campaignRollup.totalImpressions)}</span></div>
                    <div className="flex items-center gap-1.5"><span className="text-gray-500">Spend:</span><span className="font-semibold text-gray-900">${campaignRollup.totalSpend.toLocaleString()}</span></div>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className="text-gray-500">{overallocated ? "Over:" : "Remaining:"}</span>
                      <span className={cn("font-semibold", overallocated ? "text-red-600" : campaignRollup.remaining > 0 ? "text-amber-600" : "text-green-600")}>
                        ${Math.abs(campaignRollup.remaining).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                  {intake.campaigns.map((c) => {
                    const campCfg = CAMPAIGN_STATUS_CONFIG[c.status] || CAMPAIGN_STATUS_CONFIG.draft;
                    const healthPct = c.budget > 0 ? Math.min(100, (c.spend / c.budget) * 100) : 0;
                    const healthColor = healthPct > 90 ? "bg-red-400" : healthPct > 70 ? "bg-amber-400" : "bg-green-400";
                    return (
                      <div key={c.id} className="flex items-center gap-4 px-4 py-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 text-sm truncate">{c.campaignName}</span>
                            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium", campCfg.bg, campCfg.color)}>{campCfg.label}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="uppercase font-medium">{c.pricingModel}</span>
                            <span>&middot;</span>
                            <span>${c.budget.toLocaleString()}</span>
                            {c.startDate && (
                              <><span>&middot;</span><span>{c.startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}{c.endDate ? ` – ${c.endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}</span></>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <div className="text-center"><span className="text-gray-500 block">Impr.</span><span className="font-semibold text-gray-900">{formatNumber(c.impressions)}</span></div>
                          <div className="text-center"><span className="text-gray-500 block">Clicks</span><span className="font-semibold text-gray-900">{formatNumber(c.clicks)}</span></div>
                          <div className="text-center"><span className="text-gray-500 block">CTR</span><span className="font-semibold text-gray-900">{c.ctr.toFixed(1)}%</span></div>
                          <div className="text-center min-w-[60px]">
                            <span className="text-gray-500 block">Delivery</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className={cn("h-full rounded-full", healthColor)} style={{ width: `${healthPct}%` }} /></div>
                              <span className="font-semibold text-gray-700">{Math.round(healthPct)}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button className="p-1.5 rounded hover:bg-gray-100 text-primary-600" title="View Campaign"><ExternalLink className="w-3.5 h-3.5" /></button>
                          <button
                            className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete Campaign"
                            onClick={() => setDeleteConfirm({ campaignId: c.id, campaignName: c.campaignName })}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column ─────────────────────────────────── */}
        <div className="col-span-4 space-y-5">
          {/* Status (auto-derived) */}
          <Card>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</span>
              </div>
              <div className={cn("px-4 py-3 rounded-lg text-center", statusCfg.bg)}>
                <span className={cn("text-sm font-semibold", statusCfg.color)}>{statusCfg.label}</span>
              </div>
              {intake.approvedAt && (
                <p className="text-xs text-gray-400 text-center">Approved {intake.approvedAt.toLocaleDateString()} by {intake.approvedBy}</p>
              )}
              {overallocated && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Campaign budgets exceed booking budget</span>
                </div>
              )}
              {derivedStatus !== "draft" && derivedStatus !== "pending_approval" && derivedStatus !== "rejected" && (
                <p className="text-[10px] text-gray-400 text-center">
                  Status auto-derived from campaign allocation
                </p>
              )}
            </CardContent>
          </Card>

          {/* Forecast */}
          {intake.finalBudget > 0 && intake.campaignCountry && (
            <Card>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Forecast Preview</span>
                </div>
                {budgetCalcs.belowMinimum ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm bg-red-50 text-red-700">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>Budget below ${MIN_BUDGET_USD} minimum — forecast unavailable</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Est. Impressions</span>
                      <span className="text-lg font-bold text-gray-900">{formatNumber(budgetCalcs.estImpressions)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Assumed CPM</span>
                      <span className="text-sm font-medium text-gray-700">${FIXED_CPM_ASSUMPTION.toFixed(2)}</span>
                    </div>
                    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-sm", budgetCalcs.isFeasible ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700")}>
                      {budgetCalcs.isFeasible ? <><CheckCircle className="w-4 h-4" /> Looks feasible</> : <><AlertTriangle className="w-4 h-4" /> Manual review recommended</>}
                    </div>
                  </div>
                )}
                <p className="text-[10px] text-gray-400 pt-1 border-t border-gray-100">Forecast uses a fixed ${FIXED_CPM_ASSUMPTION} CPM assumption.</p>
              </CardContent>
            </Card>
          )}

          {/* Brand Approval Panel */}
          <Card>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Send className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Brand Approval</span>
              </div>
              {intake.status === "draft" && (
                <>
                  <div>
                    <span className="text-xs font-medium text-gray-600 block mb-2">Brand-Editable Fields</span>
                    <div className="space-y-1.5">
                      {[{ key: "finalBudget", label: "Budget" }, { key: "bookingName", label: "Booking Name" }, { key: "brandBusiness", label: "Brand Business" }].map(({ key, label }) => (
                        <Checkbox key={key} checked={intake.brandEditableFields.includes(key)} onChange={(checked) => { const next = checked ? [...intake.brandEditableFields, key] : intake.brandEditableFields.filter((f) => f !== key); handleFieldUpdate({ brandEditableFields: next }); }} label={label} />
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1.5">Ticked fields can be edited by the brand during approval</p>
                  </div>
                  <Button className="w-full" disabled={!canSendForApproval} onClick={handleSendForApproval}>
                    <Send className="w-4 h-4 mr-2" /> Send for Approval
                  </Button>
                  {!isValid && (
                    <button onClick={() => setShowErrors(true)} className="w-full text-xs text-amber-600 hover:text-amber-700 text-center">
                      {Object.keys(errors).length} validation issue{Object.keys(errors).length > 1 ? "s" : ""} — click to show
                    </button>
                  )}
                </>
              )}
              {intake.approvalLink && intake.status !== "draft" && (
                <div className="space-y-2">
                  <span className="text-xs font-medium text-gray-600 block">Approval Link</span>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                    <Link2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-600 truncate flex-1 font-mono">{intake.approvalLink}</span>
                    <button onClick={copyApprovalLink} className="flex-shrink-0 text-gray-400 hover:text-primary-600 transition-colors">
                      {copiedLink ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <button onClick={onOpenBrandPreview} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-primary-300 bg-primary-50 text-primary-700 text-sm font-medium hover:bg-primary-100 transition-colors">
                    <Eye className="w-4 h-4" /> Preview as Brand
                  </button>
                </div>
              )}
              {intake.status === "pending_approval" && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 font-medium">Simulate Brand Response</p>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={handleApprove}><CheckCircle className="w-3.5 h-3.5 mr-1.5" />Approve</Button>
                    <Button size="sm" variant="danger" className="flex-1" onClick={handleReject}><XCircle className="w-3.5 h-3.5 mr-1.5" />Reject</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Campaign CTA */}
          {canAddCampaign && (
            <Card className="border-primary-300 ring-2 ring-primary-100">
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Palette className="w-4 h-4 text-primary-500" />
                  <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">Ops Action</span>
                </div>
                <p className="text-sm text-gray-600">
                  Create a new campaign under this booking. Budget and name can be configured independently.
                </p>
                {intake.currency === "AED" && (
                  <Alert variant="warning">Booking budget is in AED. Campaign builder uses USD — convert manually if needed.</Alert>
                )}
                <Button className="w-full" size="lg" onClick={onAddCampaign}>
                  <PlusCircle className="w-4 h-4 mr-2" /> Add Campaign
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Activity Log */}
          <Card>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Activity Log</span>
              </div>
              <div className="space-y-0">
                {intake.activityLog.slice().reverse().map((entry, i) => (
                  <div key={entry.id} className="flex gap-3 py-2">
                    <div className="flex flex-col items-center">
                      <div className={cn("w-2 h-2 rounded-full mt-1.5", i === 0 ? "bg-primary-500" : "bg-gray-300")} />
                      {i < intake.activityLog.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 font-medium">{entry.action}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{entry.timestamp.toLocaleString()}</span>
                        <span>&middot;</span>
                        <span>{entry.actor}</span>
                        {entry.actorType && (
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-medium",
                            entry.actorType === "sales" ? "bg-blue-50 text-blue-600" :
                            entry.actorType === "ops" ? "bg-purple-50 text-purple-600" :
                            entry.actorType === "brand" ? "bg-violet-50 text-violet-600" :
                            "bg-gray-50 text-gray-500"
                          )}>
                            {entry.actorType === "sales" ? "Sales" : entry.actorType === "ops" ? "Ops" : entry.actorType === "brand" ? "Brand" : "System"}
                          </span>
                        )}
                      </div>
                      {entry.detail && <p className="text-xs text-gray-500 mt-0.5">{entry.detail}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Campaign Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Campaign</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-1">
              Are you sure you want to delete <span className="font-medium">&ldquo;{deleteConfirm.campaignName}&rdquo;</span>?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              This will remove the campaign from the Booking and recalculate the allocation status.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  removeCampaignFromBooking(intake.id, deleteConfirm.campaignId, actorType);
                  setDeleteConfirm(null);
                }}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
