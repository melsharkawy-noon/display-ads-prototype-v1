"use client";

import { useCampaign } from "@/context/CampaignContext";
import { WizardLayout } from "@/components/layout/WizardLayout";
import { Select } from "@/components/ui/Select";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { countries } from "@/lib/mock-data";
import { DollarSign, Calendar, Check } from "lucide-react";

interface StepCountryPricingProps {
  onBack: () => void;
  onNext: () => void;
}

export function StepCountryPricing({ onBack, onNext }: StepCountryPricingProps) {
  const { draft, updateDraft, markStepComplete } = useCampaign();

  const handleNext = () => {
    markStepComplete(1);
    onNext();
  };

  return (
    <WizardLayout
      title="Display - Create Campaign (Managed)"
      subtitle="Select the market and pricing structure"
      onBack={onBack}
      onNext={handleNext}
      onSave={() => console.log("Save draft")}
      nextDisabled={!draft.country || !draft.pricingModel}
    >
      <div className="space-y-8">
        {/* Country Selection */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              1. Country <span className="text-red-500">*</span>
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Campaign inventory and availability depends on country
            </p>

            <div className="max-w-md">
              <Select
                value={draft.country}
                onChange={(e) => updateDraft({ country: e.target.value, slotIds: [], pageIds: [] })}
                options={countries.map((c) => ({
                  value: c.code,
                  label: `${c.flag}  ${c.name}`,
                }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing Model */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              2. Pricing Model <span className="text-red-500">*</span>
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Choose how you want to pay for this campaign
            </p>

            <div className="grid grid-cols-2 gap-4">
              {/* CPM Card */}
              <div
                onClick={() => updateDraft({ pricingModel: "cpm", slotIds: [] })}
                className={cn(
                  "relative p-5 rounded-xl border-2 cursor-pointer transition-all",
                  draft.pricingModel === "cpm"
                    ? "border-primary-500 bg-primary-50/50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                {draft.pricingModel === "cpm" && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">CPM (Cost Per Mille)</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Pay per 1,000 impressions. Bid-based auction; runs alongside other campaigns.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="w-4 h-4" />
                    <span>Multi-slot supported</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="w-4 h-4" />
                    <span>Flexible budget</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="w-4 h-4" />
                    <span>Soft availability check</span>
                  </div>
                </div>
              </div>

              {/* CPD Card */}
              <div
                onClick={() => updateDraft({ pricingModel: "cpd", slotIds: [] })}
                className={cn(
                  "relative p-5 rounded-xl border-2 cursor-pointer transition-all",
                  draft.pricingModel === "cpd"
                    ? "border-primary-500 bg-primary-50/50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                {draft.pricingModel === "cpd" && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">CPD (Cost Per Day)</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Book exclusive daily slot ownership. Fixed rate; guaranteed 100% share of voice.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Check className="w-4 h-4" />
                    <span>Single slot only</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600">
                    <Check className="w-4 h-4" />
                    <span>Fixed daily rate</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600">
                    <Check className="w-4 h-4" />
                    <span>Hard availability check</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </WizardLayout>
  );
}
