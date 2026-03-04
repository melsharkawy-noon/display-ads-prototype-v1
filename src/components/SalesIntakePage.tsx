"use client";

import React, { useMemo, useCallback } from "react";
import { useIntake } from "@/context/IntakeContext";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils";
import {
  BookingStatus,
  AdvertiserType,
  AdAssetType,
  AD_ASSET_TYPES,
  COMMERCIAL_CATEGORIES,
  DELAYED_PAYMENT_OPTIONS,
  FIXED_CPM_ASSUMPTION,
  AED_TO_USD_RATE,
  HIGH_BUDGET_THRESHOLD,
  MIN_BUDGET_USD,
  ActivityLogEntry,
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
  FileText,
  Upload,
  Send,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  Eye,
  TrendingUp,
  Link2,
  AlertTriangle,
  BarChart3,
  ClipboardList,
  Palette,
  Paperclip,
  Shield,
  Activity,
  Copy,
  Check,
} from "lucide-react";

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: "text-gray-600", bg: "bg-gray-100" },
  pending_approval: { label: "Pending Brand Approval", color: "text-amber-700", bg: "bg-amber-50" },
  approved: { label: "Approved by Brand", color: "text-green-700", bg: "bg-green-50" },
  rejected: { label: "Rejected", color: "text-red-700", bg: "bg-red-50" },
  ready_for_ops: { label: "Ready for Ops", color: "text-primary-700", bg: "bg-primary-50" },
  converted: { label: "Converted to Campaign", color: "text-green-700", bg: "bg-green-50" },
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

// ── Validation ──────────────────────────────────────────────────────────────

interface ValidationErrors {
  bookingName?: string;
  partnerLeCode?: string;
  brandCode?: string;
  advertiserType?: string;
  advertiserCountry?: string;
  campaignCountry?: string;
  commercialPoc?: string;
  finalBudget?: string;
  adAssetTypes?: string;
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

    if (intake.advertiserType === "1P" && !intake.commercialPoc.trim()) {
      errors.commercialPoc = "Commercial POC is required for 1P bookings";
    }

    if (!intake.finalBudget || intake.finalBudget <= 0) {
      errors.finalBudget = "Budget is required";
    } else {
      const netBudget = intake.finalBudget * (1 - (intake.discountPercent || 0) / 100);
      const netUsd = intake.currency === "AED" ? netBudget * AED_TO_USD_RATE : netBudget;
      if (netUsd < MIN_BUDGET_USD) {
        errors.finalBudget = `Minimum net budget is $${MIN_BUDGET_USD} USD${intake.currency === "AED" ? ` (≈ ${Math.ceil(MIN_BUDGET_USD / AED_TO_USD_RATE)} AED)` : ""}`;
      }
    }

    if (intake.adAssetTypes.length === 0) errors.adAssetTypes = "Select at least one ad asset type";

    const isValid = Object.keys(errors).length === 0;
    return { errors, isValid };
  }, [intake]);
}

// ── Validation Summary ──────────────────────────────────────────────────────

function ValidationSummary({ errors }: { errors: ValidationErrors }) {
  const items = Object.values(errors);
  if (items.length === 0) return null;
  return (
    <Alert variant="warning" title={`${items.length} issue${items.length > 1 ? "s" : ""} to fix`}>
      <ul className="list-disc pl-4 space-y-0.5">
        {items.map((msg, i) => (
          <li key={i}>{msg}</li>
        ))}
      </ul>
    </Alert>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

interface SalesIntakePageProps {
  onConvertToCampaign: () => void;
  onOpenBrandPreview: () => void;
  onBackToList: () => void;
}

export function SalesIntakePage({ onConvertToCampaign, onOpenBrandPreview, onBackToList }: SalesIntakePageProps) {
  const { intake, updateIntake } = useIntake();
  const { errors, isValid } = useValidation();
  const [showErrors, setShowErrors] = React.useState(false);

  const statusCfg = STATUS_CONFIG[intake.status] || STATUS_CONFIG.draft;
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

  const canSendForApproval = isValid && intake.status === "draft";
  const canConvert =
    (intake.status === "approved" || intake.status === "ready_for_ops") && isValid;

  const addLogEntry = useCallback(
    (action: string, actor: string = "sales.user@noon.com", detail?: string) => {
      const entry: ActivityLogEntry = {
        id: Date.now().toString(),
        timestamp: new Date(),
        action,
        actor,
        detail,
      };
      updateIntake({ activityLog: [...intake.activityLog, entry] });
    },
    [intake.activityLog, updateIntake]
  );

  const handleSendForApproval = () => {
    if (!isValid) {
      setShowErrors(true);
      return;
    }
    const link = `https://ads.noon.com/intake/approve/${intake.id}?token=${Date.now().toString(36)}`;
    updateIntake({ status: "pending_approval", approvalLink: link });
    addLogEntry("Sent for brand approval", "sales.user@noon.com");
    setShowErrors(false);
  };

  const handleApprove = () => {
    updateIntake({
      status: "approved",
      approvedAt: new Date(),
      approvedBy: "brand.contact@partner.com",
    });
    addLogEntry("Approved by brand", "brand.contact@partner.com");
  };

  const handleReject = () => {
    updateIntake({ status: "rejected" });
    addLogEntry("Rejected by brand", "brand.contact@partner.com");
  };

  const handleMarkReady = () => {
    updateIntake({ status: "ready_for_ops" });
    addLogEntry("Marked ready for ops", "sales.user@noon.com");
  };

  const handleConvert = () => {
    if (!isValid) {
      setShowErrors(true);
      return;
    }
    updateIntake({ status: "converted" });
    addLogEntry("Converted to managed campaign", "ops.user@noon.com");
    onConvertToCampaign();
  };

  const [copiedLink, setCopiedLink] = React.useState(false);
  const copyApprovalLink = () => {
    navigator.clipboard.writeText(intake.approvalLink).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const inlineError = (field: keyof ValidationErrors) =>
    showErrors && errors[field] ? errors[field] : undefined;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onBackToList}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sales Requests
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Sales Intake</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create a booking intake for brand approval and ops handoff
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium",
              statusCfg.bg,
              statusCfg.color
            )}
          >
            {statusCfg.label}
          </span>
          <span className="text-xs text-gray-400 font-mono">{intake.id}</span>
        </div>
      </div>

      {/* Validation Summary (shown on attempted submit) */}
      {showErrors && !isValid && <ValidationSummary errors={errors} />}

      <div className="grid grid-cols-12 gap-6">
        {/* ── Left Column: Form Sections ───────────────────────── */}
        <div className="col-span-8 space-y-6">
          {/* SECTION 1 — Booking Overview */}
          <Card>
            <div className="p-5 border-b border-gray-100 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-gray-900">Booking Overview</h2>
            </div>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Booking Name"
                  required
                  placeholder="e.g., Samsung Galaxy S25 Launch"
                  value={intake.bookingName}
                  onChange={(e) => updateIntake({ bookingName: e.target.value })}
                  error={inlineError("bookingName")}
                />
                <Input
                  label="Sales Email"
                  value={intake.salesEmail}
                  disabled
                  helper="Auto-filled from your account"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Partner LE Code"
                  required
                  placeholder="e.g., LE-00123"
                  value={intake.partnerLeCode}
                  onChange={(e) => updateIntake({ partnerLeCode: e.target.value })}
                  error={inlineError("partnerLeCode")}
                />
                <Select
                  label="Brand Code"
                  required
                  value={intake.brandCode}
                  onChange={(e) => updateIntake({ brandCode: e.target.value })}
                  placeholder="Select brand..."
                  options={brands.map((b) => ({ value: b.id, label: b.name }))}
                  error={inlineError("brandCode")}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Advertiser Type"
                  required
                  value={intake.advertiserType}
                  onChange={(e) =>
                    updateIntake({ advertiserType: e.target.value as AdvertiserType })
                  }
                  placeholder="Select type..."
                  options={ADVERTISER_TYPE_OPTIONS}
                  error={inlineError("advertiserType")}
                />
                <Select
                  label="Advertiser Registered Country"
                  required
                  value={intake.advertiserCountry}
                  onChange={(e) => updateIntake({ advertiserCountry: e.target.value })}
                  placeholder="Select country..."
                  options={COUNTRY_OPTIONS}
                  error={inlineError("advertiserCountry")}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Campaign Country"
                  required
                  value={intake.campaignCountry}
                  onChange={(e) => updateIntake({ campaignCountry: e.target.value })}
                  placeholder="Select country..."
                  options={COUNTRY_OPTIONS}
                  error={inlineError("campaignCountry")}
                />
                <Input
                  label="Brand Business"
                  placeholder="e.g., Consumer Electronics"
                  value={intake.brandBusiness}
                  onChange={(e) => updateIntake({ brandBusiness: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Commercial Category"
                  value={intake.commercialCategory}
                  onChange={(e) => updateIntake({ commercialCategory: e.target.value })}
                  placeholder="Select category..."
                  options={COMMERCIAL_CATEGORIES.map((c) => ({ value: c, label: c }))}
                />
                {is1P && (
                  <Input
                    label="Commercial POC"
                    required
                    placeholder="e.g., john.doe@noon.com"
                    value={intake.commercialPoc}
                    onChange={(e) => updateIntake({ commercialPoc: e.target.value })}
                    helper="Required for 1P / endemic bookings"
                    error={inlineError("commercialPoc")}
                  />
                )}
              </div>
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
                <Input
                  label="Final Budget (excl. tax & discounts)"
                  required
                  type="number"
                  min={0}
                  placeholder="0"
                  value={intake.finalBudget || ""}
                  onChange={(e) =>
                    updateIntake({ finalBudget: parseFloat(e.target.value) || 0 })
                  }
                  error={inlineError("finalBudget")}
                />
                <Input
                  label="Expected Discount %"
                  required
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0"
                  value={intake.discountPercent || ""}
                  onChange={(e) =>
                    updateIntake({ discountPercent: parseFloat(e.target.value) || 0 })
                  }
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Currency <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="flex gap-2">
                    {(["USD", "AED"] as const).map((cur) => (
                      <button
                        key={cur}
                        onClick={() => updateIntake({ currency: cur })}
                        className={cn(
                          "flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors",
                          intake.currency === cur
                            ? "border-primary-500 bg-primary-50 text-primary-700"
                            : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                        )}
                      >
                        {cur}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Delayed Payment Interest"
                  value={intake.delayedPayment}
                  onChange={(e) => updateIntake({ delayedPayment: e.target.value })}
                  options={DELAYED_PAYMENT_OPTIONS.map((d) => ({ value: d, label: d }))}
                />
                <Input
                  label="Invoicing Method"
                  placeholder="e.g., PO-based, monthly"
                  value={intake.invoicingMethod}
                  onChange={(e) => updateIntake({ invoicingMethod: e.target.value })}
                />
              </div>

              {/* Budget Summary Box */}
              {intake.finalBudget > 0 && (
                <div
                  className={cn(
                    "rounded-xl p-4 mt-2",
                    budgetCalcs.belowMinimum
                      ? "bg-gradient-to-r from-red-50 to-amber-50 border border-red-200"
                      : "bg-gradient-to-r from-primary-50 to-blue-50"
                  )}
                >
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Budget Summary
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-xs text-gray-500 block">Gross Budget</span>
                      <span className="text-lg font-bold text-gray-900">
                        {intake.currency === "USD" ? "$" : ""}
                        {budgetCalcs.gross.toLocaleString()}
                        {intake.currency === "AED" ? " AED" : ""}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Discount</span>
                      <span className="text-lg font-bold text-amber-600">
                        {budgetCalcs.disc}%
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Net Budget</span>
                      <span
                        className={cn(
                          "text-lg font-bold",
                          budgetCalcs.belowMinimum ? "text-red-600" : "text-green-600"
                        )}
                      >
                        {intake.currency === "USD" ? "$" : ""}
                        {budgetCalcs.net.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        {intake.currency === "AED" ? " AED" : ""}
                      </span>
                    </div>
                  </div>
                  {budgetCalcs.belowMinimum && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-red-600">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>
                        Net budget (${budgetCalcs.netUsd.toFixed(0)} USD) is below the $
                        {MIN_BUDGET_USD} minimum required for campaign creation
                      </span>
                    </div>
                  )}
                  {intake.currency === "AED" && !budgetCalcs.belowMinimum && (
                    <p className="text-[11px] text-gray-400 mt-2">
                      Approx. $
                      {budgetCalcs.netUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
                      USD at mocked rate 1 AED = {AED_TO_USD_RATE} USD
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SECTION 3 — Campaign Meta */}
          <Card>
            <div className="p-5 border-b border-gray-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-gray-900">Campaign Meta</h2>
            </div>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ad Asset Types <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {AD_ASSET_TYPES.map((assetType) => {
                    const isSelected = intake.adAssetTypes.includes(assetType);
                    const isOnDeck = assetType === "Display – On Deck";
                    return (
                      <button
                        key={assetType}
                        onClick={() => {
                          const next = isSelected
                            ? intake.adAssetTypes.filter((t) => t !== assetType)
                            : [...intake.adAssetTypes, assetType];
                          updateIntake({ adAssetTypes: next as AdAssetType[] });
                        }}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm text-left transition-colors",
                          isSelected
                            ? "border-primary-500 bg-primary-50 text-primary-700"
                            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                        )}
                      >
                        <div
                          className={cn(
                            "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                            isSelected
                              ? "bg-primary-600 border-primary-600"
                              : "bg-white border-gray-300"
                          )}
                        >
                          {isSelected && (
                            <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                          )}
                        </div>
                        <span className="flex-1">{assetType}</span>
                        {isOnDeck && (
                          <span className="text-[10px] bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded font-medium">
                            Operationalized
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {showErrors && errors.adAssetTypes && (
                  <p className="text-xs text-red-500 mt-1.5">{errors.adAssetTypes}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Only &quot;Display – On Deck&quot; will be converted into a campaign. Other
                  selections are captured for reference.
                </p>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Does the client need creative services?
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Indicate if noon&apos;s design team should produce ad creatives
                    </p>
                  </div>
                  <Toggle
                    checked={intake.needsCreativeServices}
                    onChange={(v) => updateIntake({ needsCreativeServices: v })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 4 — Media Brief Upload */}
          <Card>
            <div className="p-5 border-b border-gray-100 flex items-center gap-2">
              <Paperclip className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-gray-900">Media Brief Upload</h2>
            </div>
            <CardContent>
              {intake.mediaBriefUploaded ? (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {intake.mediaBriefFileName}
                      </p>
                      <p className="text-xs text-gray-500">Uploaded successfully</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const name = `Campaign_Brief_${intake.bookingName.replace(/\s+/g, "_") || "upload"}_v2.pdf`;
                        updateIntake({ mediaBriefFileName: name });
                      }}
                      className="text-xs text-primary-600 hover:underline"
                    >
                      Replace
                    </button>
                    <button
                      onClick={() =>
                        updateIntake({ mediaBriefUploaded: false, mediaBriefFileName: "" })
                      }
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    const name = `Campaign_Brief_${intake.bookingName.replace(/\s+/g, "_") || "upload"}.pdf`;
                    updateIntake({ mediaBriefUploaded: true, mediaBriefFileName: name });
                  }}
                  className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center gap-3 hover:border-primary-400 hover:bg-primary-50/30 transition-colors group"
                >
                  <Upload className="w-8 h-8 text-gray-400 group-hover:text-primary-500 transition-colors" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700 group-hover:text-primary-700">
                      Click to upload Campaign Media Briefing
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PDF, DOCX, or PPTX up to 25 MB</p>
                  </div>
                </button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column: Status / Forecast / Approval / Ops ── */}
        <div className="col-span-4 space-y-5">
          {/* Status Badge */}
          <Card>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </span>
              </div>
              <div className={cn("px-4 py-3 rounded-lg text-center", statusCfg.bg)}>
                <span className={cn("text-sm font-semibold", statusCfg.color)}>
                  {statusCfg.label}
                </span>
              </div>
              {intake.approvedAt && (
                <p className="text-xs text-gray-400 text-center">
                  Approved {intake.approvedAt.toLocaleDateString()} by {intake.approvedBy}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Forecast Preview */}
          {intake.finalBudget > 0 && intake.campaignCountry && (
            <Card>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Forecast Preview
                  </span>
                </div>
                {budgetCalcs.belowMinimum ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm bg-red-50 text-red-700">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>
                      Budget below ${MIN_BUDGET_USD} minimum — forecast unavailable
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Est. Impressions</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatNumber(budgetCalcs.estImpressions)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Assumed CPM</span>
                      <span className="text-sm font-medium text-gray-700">
                        ${FIXED_CPM_ASSUMPTION.toFixed(2)}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                        budgetCalcs.isFeasible
                          ? "bg-green-50 text-green-700"
                          : "bg-amber-50 text-amber-700"
                      )}
                    >
                      {budgetCalcs.isFeasible ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Looks feasible
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4" />
                          Manual review recommended
                        </>
                      )}
                    </div>
                  </div>
                )}
                <p className="text-[10px] text-gray-400 pt-1 border-t border-gray-100">
                  Forecast uses a fixed ${FIXED_CPM_ASSUMPTION} CPM assumption. Actual performance
                  will vary.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Brand Approval Panel */}
          <Card>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Send className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Brand Approval
                </span>
              </div>

              {/* Draft: Send for Approval */}
              {intake.status === "draft" && (
                <>
                  <div>
                    <span className="text-xs font-medium text-gray-600 block mb-2">
                      Brand-Editable Fields
                    </span>
                    <div className="space-y-1.5">
                      {[
                        { key: "finalBudget", label: "Budget" },
                        { key: "adAssetTypes", label: "Ad Asset Types" },
                        { key: "bookingName", label: "Booking Name" },
                        { key: "brandBusiness", label: "Brand Business" },
                      ].map(({ key, label }) => (
                        <Checkbox
                          key={key}
                          checked={intake.brandEditableFields.includes(key)}
                          onChange={(checked) => {
                            const next = checked
                              ? [...intake.brandEditableFields, key]
                              : intake.brandEditableFields.filter((f) => f !== key);
                            updateIntake({ brandEditableFields: next });
                          }}
                          label={label}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1.5">
                      Ticked fields can be edited by the brand during approval
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    disabled={!canSendForApproval}
                    onClick={handleSendForApproval}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send for Approval
                  </Button>
                  {!isValid && (
                    <button
                      onClick={() => setShowErrors(true)}
                      className="w-full text-xs text-amber-600 hover:text-amber-700 text-center"
                    >
                      {Object.keys(errors).length} validation issue
                      {Object.keys(errors).length > 1 ? "s" : ""} — click to show
                    </button>
                  )}
                </>
              )}

              {/* Approval Link + Preview */}
              {intake.approvalLink && intake.status !== "draft" && (
                <div className="space-y-2">
                  <span className="text-xs font-medium text-gray-600 block">Approval Link</span>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                    <Link2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-600 truncate flex-1 font-mono">
                      {intake.approvalLink}
                    </span>
                    <button
                      onClick={copyApprovalLink}
                      className="flex-shrink-0 text-gray-400 hover:text-primary-600 transition-colors"
                    >
                      {copiedLink ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <button
                    onClick={onOpenBrandPreview}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-primary-300 bg-primary-50 text-primary-700 text-sm font-medium hover:bg-primary-100 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Preview as Brand
                  </button>
                </div>
              )}

              {/* Pending Approval Actions */}
              {intake.status === "pending_approval" && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 font-medium">Simulate Brand Response</p>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={handleApprove}>
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                      Mark as Approved
                    </Button>
                    <Button size="sm" variant="danger" className="flex-1" onClick={handleReject}>
                      <XCircle className="w-3.5 h-3.5 mr-1.5" />
                      Reject
                    </Button>
                  </div>
                </div>
              )}

              {/* Approved — Mark Ready */}
              {intake.status === "approved" && (
                <div className="pt-2 border-t border-gray-100">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    onClick={handleMarkReady}
                  >
                    <ArrowRight className="w-3.5 h-3.5 mr-1.5" />
                    Mark Ready for Ops
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ops Action */}
          {(intake.status === "approved" || intake.status === "ready_for_ops") && (
            <Card className="border-primary-300 ring-2 ring-primary-100">
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Palette className="w-4 h-4 text-primary-500" />
                  <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">
                    Ops Action
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  This booking is approved. Convert it to a Managed Campaign to configure slots,
                  targeting, and creatives.
                </p>
                {!isValid && (
                  <Alert variant="warning">
                    Intake has validation issues that must be resolved before conversion.
                  </Alert>
                )}
                {intake.currency === "AED" && (
                  <Alert variant="warning">
                    Budget is in AED. Managed campaigns use USD. The budget will be prefilled as-is
                    — ops to convert to USD manually if needed.
                  </Alert>
                )}
                <Button className="w-full" size="lg" disabled={!canConvert} onClick={handleConvert}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Convert to Campaign
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Activity Log */}
          <Card>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Activity Log
                </span>
              </div>
              <div className="space-y-0">
                {intake.activityLog
                  .slice()
                  .reverse()
                  .map((entry, i) => (
                    <div key={entry.id} className="flex gap-3 py-2">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full mt-1.5",
                            i === 0 ? "bg-primary-500" : "bg-gray-300"
                          )}
                        />
                        {i < intake.activityLog.length - 1 && (
                          <div className="w-px flex-1 bg-gray-200 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 font-medium">{entry.action}</p>
                        <p className="text-xs text-gray-400">
                          {entry.timestamp.toLocaleString()} &middot; {entry.actor}
                        </p>
                        {entry.detail && (
                          <p className="text-xs text-gray-500 mt-0.5">{entry.detail}</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
