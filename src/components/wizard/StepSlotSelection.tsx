"use client";

import { useCampaign } from "@/context/CampaignContext";
import { WizardLayout } from "@/components/layout/WizardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Alert } from "@/components/ui/Alert";
import { Chip } from "@/components/ui/Chip";
import { cn, formatNumber, formatCurrency } from "@/lib/utils";
import { pages, slots } from "@/lib/mock-data";
import { Monitor, Eye, X, Info } from "lucide-react";

interface StepSlotSelectionProps {
  onBack: () => void;
  onNext: () => void;
}

export function StepSlotSelection({ onBack, onNext }: StepSlotSelectionProps) {
  const { draft, updateDraft, markStepComplete } = useCampaign();
  const isCPD = draft.pricingModel === "cpd";

  const filteredSlots =
    draft.pageIds.length > 0
      ? slots.filter((s) => draft.pageIds.includes(s.pageId))
      : slots;

  const selectedSlots = slots.filter((s) => draft.slotIds.includes(s.id));
  const totalDailyViews = selectedSlots.reduce((sum, s) => sum + s.avgDailyViews, 0);

  const togglePage = (pageId: string) => {
    const newPageIds = draft.pageIds.includes(pageId)
      ? draft.pageIds.filter((p) => p !== pageId)
      : [...draft.pageIds, pageId];
    updateDraft({ pageIds: newPageIds });
  };

  const toggleSlot = (slotId: string) => {
    if (isCPD) {
      // CPD: single select only
      updateDraft({ slotIds: draft.slotIds.includes(slotId) ? [] : [slotId] });
    } else {
      // CPM: multi-select
      const newSlotIds = draft.slotIds.includes(slotId)
        ? draft.slotIds.filter((s) => s !== slotId)
        : [...draft.slotIds, slotId];
      updateDraft({ slotIds: newSlotIds });
    }
  };

  const handleNext = () => {
    markStepComplete(2);
    onNext();
  };

  return (
    <WizardLayout
      title="Display - Create Campaign (Managed)"
      subtitle={isCPD ? "Select a single slot for exclusive daily booking" : "Choose where your ads will appear"}
      onBack={onBack}
      onNext={handleNext}
      onSave={() => console.log("Save draft")}
      nextDisabled={draft.slotIds.length === 0}
    >
      <div className="space-y-6">
        {isCPD && (
          <Alert variant="info">
            CPD campaigns require exactly <strong>one slot</strong> selection for exclusive daily booking.
          </Alert>
        )}

        {/* Page Filter (CPM only) */}
        {!isCPD && (
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Filter by Page (Optional)
              </h3>
              <div className="flex flex-wrap gap-2">
                {pages.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => togglePage(page.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                      draft.pageIds.includes(page.id)
                        ? "bg-primary-100 text-primary-700 border-2 border-primary-300"
                        : "bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200"
                    )}
                  >
                    {page.name}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Slots */}
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              {isCPD ? "Available Slots" : "Select Slots"} <span className="text-red-500">*</span>
            </h3>

            <div className="space-y-3">
              {filteredSlots.map((slot) => {
                const isSelected = draft.slotIds.includes(slot.id);
                const page = pages.find((p) => p.id === slot.pageId);

                return (
                  <div
                    key={slot.id}
                    onClick={() => toggleSlot(slot.id)}
                    className={cn(
                      "p-4 rounded-xl border-2 cursor-pointer transition-all",
                      isSelected
                        ? "border-primary-500 bg-primary-50/50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {isCPD ? (
                          <div
                            className={cn(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                              isSelected ? "border-primary-500 bg-primary-500" : "border-gray-300"
                            )}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        ) : (
                          <Checkbox
                            checked={isSelected}
                            onChange={() => toggleSlot(slot.id)}
                          />
                        )}
                        <div>
                          <h4 className="font-medium text-gray-900">{slot.name}</h4>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Monitor className="w-4 h-4" />
                              {slot.dimensions}
                            </span>
                            <span>📍 {slot.position}</span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              ~{formatNumber(slot.avgDailyViews)} daily views
                            </span>
                          </div>
                          {page && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                              {page.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {isCPD ? (
                          <>
                            <div className="text-lg font-semibold text-gray-900">
                              {formatCurrency(slot.cpdRateUsd)}
                            </div>
                            <div className="text-xs text-gray-500">per day</div>
                          </>
                        ) : (
                          <>
                            <div className="text-sm font-semibold text-primary-600">
                              ${slot.minCpmUsd} min CPM
                            </div>
                            <div className="text-xs text-gray-500">minimum bid</div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selection Summary */}
        {draft.slotIds.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Selection Summary
              </h3>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">
                  {draft.slotIds.length} slot{draft.slotIds.length > 1 ? "s" : ""} selected
                </span>
                {!isCPD && (
                  <span className="text-sm text-gray-600">
                    📊 Combined daily reach: ~{formatNumber(totalDailyViews)} views
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedSlots.map((slot) => (
                  <Chip
                    key={slot.id}
                    variant="primary"
                    onRemove={() => toggleSlot(slot.id)}
                  >
                    {slot.name}
                  </Chip>
                ))}
              </div>
              {!isCPD && (
                <div className="p-3 bg-primary-50 rounded-lg text-sm">
                  <span className="text-primary-700">
                    💰 Required minimum bid: <strong>${Math.max(...selectedSlots.map(s => s.minCpmUsd))} CPM</strong>
                  </span>
                  <span className="text-primary-600 ml-1">(based on highest slot minimum)</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </WizardLayout>
  );
}
