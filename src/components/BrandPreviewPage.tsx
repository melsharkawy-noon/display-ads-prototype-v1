"use client";

import React, { useMemo } from "react";
import { useIntake } from "@/context/IntakeContext";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils";
import {
  AdAssetType,
  AD_ASSET_TYPES,
  COMMERCIAL_CATEGORIES,
  FIXED_CPM_ASSUMPTION,
  AED_TO_USD_RATE,
  MIN_BUDGET_USD,
  HIGH_BUDGET_THRESHOLD,
  ActivityLogEntry,
} from "@/lib/types";
import { brands } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import {
  X,
  Lock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  ClipboardList,
  BarChart3,
  Paperclip,
  FileText,
  Check,
  Save,
} from "lucide-react";

interface BrandPreviewPageProps {
  onClose: () => void;
}

export function BrandPreviewPage({ onClose }: BrandPreviewPageProps) {
  const { intake, updateIntake } = useIntake();

  const editable = new Set(intake.brandEditableFields);
  const isPending = intake.status === "pending_approval";

  const brandName = brands.find((b) => b.id === intake.brandCode)?.name || intake.brandCode;
  const countryLabel = (code: string) =>
    ({ AE: "UAE", SA: "KSA", EG: "Egypt", OTHER: "Other" })[code] || code;
  const advTypeLabel = (t: string) =>
    ({ "1P": "1P (First Party)", "3P": "3P (Third Party)", marketplace: "Marketplace" })[t] || t;

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

  const [hasSaved, setHasSaved] = React.useState(false);

  const addLogEntry = (action: string, actor: string = "brand.contact@partner.com") => {
    const entry: ActivityLogEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      action,
      actor,
    };
    updateIntake({ activityLog: [...intake.activityLog, entry] });
  };

  const handleSaveChanges = () => {
    addLogEntry("Brand saved edits to booking");
    setHasSaved(true);
    setTimeout(() => setHasSaved(false), 2000);
  };

  const handleApprove = () => {
    updateIntake({
      status: "approved",
      approvedAt: new Date(),
      approvedBy: "brand.contact@partner.com",
    });
    addLogEntry("Approved by brand");
  };

  const handleReject = () => {
    updateIntake({ status: "rejected" });
    addLogEntry("Rejected by brand");
  };

  const ReadOnlyField = ({
    label,
    value,
    required,
  }: {
    label: string;
    value: string;
    required?: boolean;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        <Lock className="w-3 h-3 inline-block ml-1.5 text-gray-400" />
      </label>
      <div className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm">
        {value || <span className="text-gray-400 italic">Not provided</span>}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] bg-gray-50 overflow-y-auto">
      {/* Brand View Banner */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-sm">Brand Approval View</span>
              <span className="text-violet-200 text-xs ml-3">
                This is how the brand sees the booking request
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors"
          >
            <X className="w-4 h-4" />
            Close Preview
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Approval Request</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review the details below and approve or reject this booking.
            {editable.size > 0 && " Fields you can edit are highlighted."}
          </p>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs text-gray-400 font-mono">{intake.id}</span>
            <span className="text-xs text-gray-400">&middot;</span>
            <span className="text-xs text-gray-500">
              Submitted by {intake.salesEmail} on {intake.createdAt.toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left: Details */}
          <div className="col-span-8 space-y-6">
            {/* Section 1: Booking Overview */}
            <Card>
              <div className="p-5 border-b border-gray-100 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary-500" />
                <h2 className="text-lg font-semibold text-gray-900">Booking Overview</h2>
              </div>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {editable.has("bookingName") ? (
                    <Input
                      label="Booking Name"
                      required
                      value={intake.bookingName}
                      onChange={(e) => updateIntake({ bookingName: e.target.value })}
                    />
                  ) : (
                    <ReadOnlyField label="Booking Name" value={intake.bookingName} required />
                  )}
                  <ReadOnlyField label="Sales Contact" value={intake.salesEmail} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <ReadOnlyField label="Partner LE Code" value={intake.partnerLeCode} required />
                  <ReadOnlyField label="Brand" value={brandName} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <ReadOnlyField
                    label="Advertiser Type"
                    value={advTypeLabel(intake.advertiserType)}
                    required
                  />
                  <ReadOnlyField
                    label="Advertiser Country"
                    value={countryLabel(intake.advertiserCountry)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <ReadOnlyField
                    label="Campaign Country"
                    value={countryLabel(intake.campaignCountry)}
                    required
                  />
                  {editable.has("brandBusiness") ? (
                    <Input
                      label="Brand Business"
                      value={intake.brandBusiness}
                      onChange={(e) => updateIntake({ brandBusiness: e.target.value })}
                    />
                  ) : (
                    <ReadOnlyField label="Brand Business" value={intake.brandBusiness} />
                  )}
                </div>
                {intake.commercialCategory && (
                  <ReadOnlyField label="Commercial Category" value={intake.commercialCategory} />
                )}
              </CardContent>
            </Card>

            {/* Section 2: Budget */}
            <Card>
              <div className="p-5 border-b border-gray-100 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary-500" />
                <h2 className="text-lg font-semibold text-gray-900">Budget & Commercial Terms</h2>
              </div>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {editable.has("finalBudget") ? (
                    <Input
                      label="Final Budget"
                      required
                      type="number"
                      min={0}
                      value={intake.finalBudget || ""}
                      onChange={(e) =>
                        updateIntake({ finalBudget: parseFloat(e.target.value) || 0 })
                      }
                    />
                  ) : (
                    <ReadOnlyField
                      label="Final Budget"
                      value={`${intake.currency === "USD" ? "$" : ""}${intake.finalBudget.toLocaleString()}${intake.currency === "AED" ? " AED" : ""}`}
                      required
                    />
                  )}
                  <ReadOnlyField label="Discount" value={`${intake.discountPercent}%`} />
                  <ReadOnlyField label="Currency" value={intake.currency} />
                </div>

                {/* Budget Summary */}
                {intake.finalBudget > 0 && (
                  <div
                    className={cn(
                      "rounded-xl p-4",
                      budgetCalcs.belowMinimum
                        ? "bg-red-50 border border-red-200"
                        : "bg-gradient-to-r from-primary-50 to-blue-50"
                    )}
                  >
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="text-xs text-gray-500 block">Gross</span>
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
                  </div>
                )}

                {intake.delayedPayment && intake.delayedPayment !== "None" && (
                  <ReadOnlyField label="Payment Terms" value={intake.delayedPayment} />
                )}
              </CardContent>
            </Card>

            {/* Section 3: Campaign Meta */}
            <Card>
              <div className="p-5 border-b border-gray-100 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary-500" />
                <h2 className="text-lg font-semibold text-gray-900">Campaign Meta</h2>
              </div>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ad Asset Types
                    {!editable.has("adAssetTypes") && (
                      <Lock className="w-3 h-3 inline-block ml-1.5 text-gray-400" />
                    )}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {AD_ASSET_TYPES.map((assetType) => {
                      const isSelected = intake.adAssetTypes.includes(assetType);
                      const canToggle = editable.has("adAssetTypes");
                      return (
                        <button
                          key={assetType}
                          disabled={!canToggle}
                          onClick={() => {
                            if (!canToggle) return;
                            const next = isSelected
                              ? intake.adAssetTypes.filter((t) => t !== assetType)
                              : [...intake.adAssetTypes, assetType];
                            updateIntake({ adAssetTypes: next as AdAssetType[] });
                          }}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm text-left transition-colors",
                            isSelected
                              ? "border-primary-500 bg-primary-50 text-primary-700"
                              : "border-gray-200 bg-white text-gray-500",
                            !canToggle && "opacity-75 cursor-default",
                            canToggle && !isSelected && "hover:bg-gray-50 cursor-pointer"
                          )}
                        >
                          <div
                            className={cn(
                              "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0",
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
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <ReadOnlyField
                    label="Creative Services Needed"
                    value={intake.needsCreativeServices ? "Yes" : "No"}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 4: Media Brief */}
            {intake.mediaBriefUploaded && (
              <Card>
                <div className="p-5 border-b border-gray-100 flex items-center gap-2">
                  <Paperclip className="w-5 h-5 text-primary-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Media Brief</h2>
                </div>
                <CardContent>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <FileText className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-700">{intake.mediaBriefFileName}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Forecast + Actions */}
          <div className="col-span-4 space-y-5">
            {/* Forecast */}
            {intake.finalBudget > 0 && (
              <Card>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Estimated Reach
                    </span>
                  </div>
                  {budgetCalcs.belowMinimum ? (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm bg-red-50 text-red-700">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      Budget below minimum
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            {isPending && (
              <Card className="border-violet-300 ring-2 ring-violet-100">
                <CardContent className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900">Your Decision</h3>
                  <p className="text-xs text-gray-500">
                    Review the booking details and approve or reject this request.
                  </p>

                  {editable.size > 0 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={handleSaveChanges}
                    >
                      {hasSaved ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-green-500" />
                          Changes Saved
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5 mr-1.5" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button size="sm" className="flex-1" onClick={handleApprove}>
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                      Approve
                    </Button>
                    <Button size="sm" variant="danger" className="flex-1" onClick={handleReject}>
                      <XCircle className="w-3.5 h-3.5 mr-1.5" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {intake.status === "approved" && (
              <Card className="border-green-300">
                <CardContent>
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-semibold">Approved</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Approved on {intake.approvedAt?.toLocaleDateString()} by {intake.approvedBy}
                  </p>
                </CardContent>
              </Card>
            )}

            {intake.status === "rejected" && (
              <Card className="border-red-300">
                <CardContent>
                  <div className="flex items-center gap-2 text-red-700">
                    <XCircle className="w-5 h-5" />
                    <span className="text-sm font-semibold">Rejected</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    This booking has been rejected.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Legend */}
            <div className="px-3 py-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-xs font-medium text-gray-600 block mb-2">Field Legend</span>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Lock className="w-3 h-3 text-gray-400" />
                  <span>Locked — set by sales, cannot be changed</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-3 h-3 border-2 border-primary-500 rounded" />
                  <span>Editable — you can modify this field</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
