"use client";

import { useCampaign } from "@/context/CampaignContext";
import { WizardLayout } from "@/components/layout/WizardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { countries } from "@/lib/mock-data";

interface StepGeneralSettingsProps {
  onBack: () => void;
  onNext: () => void;
}

export function StepGeneralSettings({ onBack, onNext }: StepGeneralSettingsProps) {
  const { draft, updateDraft, markStepComplete } = useCampaign();

  const country = countries.find((c) => c.code === draft.country);

  const handleNext = () => {
    markStepComplete(8);
    onNext();
  };

  return (
    <WizardLayout
      title="Display - Create Campaign (Managed)"
      subtitle="Configure your campaign's basic settings"
      onBack={onBack}
      onNext={handleNext}
      onSave={() => console.log("Save draft")}
      nextDisabled={!draft.campaignName}
    >
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            General Settings <span className="text-red-500">*</span>
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Set your campaign name and review settings
          </p>

          <div className="grid grid-cols-2 gap-6 max-w-2xl">
            <Input
              label="Campaign Name"
              placeholder="Enter campaign name"
              value={draft.campaignName}
              onChange={(e) => updateDraft({ campaignName: e.target.value })}
              required
            />

            <Input
              label="Marketplace"
              value={country?.name || "NOON"}
              disabled
              helper="Based on your country selection"
            />
          </div>

          {/* Summary of schedule (already set) */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Campaign Schedule (Already Configured)</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Start Date:</span>
                <span className="ml-2 font-medium">
                  {draft.startDate?.toLocaleDateString() || "Not set"}
                </span>
              </div>
              <div>
                <span className="text-gray-500">End Date:</span>
                <span className="ml-2 font-medium">
                  {draft.noEndDate ? "No end date" : draft.endDate?.toLocaleDateString() || "Not set"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </WizardLayout>
  );
}
