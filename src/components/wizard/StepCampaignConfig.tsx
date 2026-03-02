"use client";

import { useCampaign } from "@/context/CampaignContext";
import { WizardLayout } from "@/components/layout/WizardLayout";
import { RadioCard } from "@/components/ui/RadioCard";
import { Card, CardContent } from "@/components/ui/Card";
import { Building2, Users } from "lucide-react";

interface StepCampaignConfigProps {
  onNext: () => void;
}

export function StepCampaignConfig({ onNext }: StepCampaignConfigProps) {
  const { draft, updateDraft, markStepComplete } = useCampaign();

  const handleNext = () => {
    markStepComplete(0);
    onNext();
  };

  return (
    <WizardLayout
      title="Display - Create Campaign (Managed)"
      subtitle="Configure your managed campaign settings"
      onNext={handleNext}
      onSave={() => console.log("Save draft")}
    >
      <div className="space-y-8">
        {/* Campaign Type */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Campaign Type <span className="text-red-500">*</span>
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Select who this campaign is for
            </p>

            <div className="grid grid-cols-2 gap-4">
              <RadioCard
                selected={draft.campaignType === "internal"}
                onClick={() => updateDraft({ campaignType: "internal" })}
                title="Internal Campaign"
                description="Campaign for internal business units or initiatives"
              >
                <div className="flex items-center gap-2 text-purple-600">
                  <Building2 className="w-5 h-5" />
                  <span className="text-sm font-medium">Internal</span>
                </div>
              </RadioCard>

              <RadioCard
                selected={draft.campaignType === "third_party"}
                onClick={() => updateDraft({ campaignType: "third_party" })}
                title="Third-Party Campaign"
                description="Campaign on behalf of external advertiser/partner"
              >
                <div className="flex items-center gap-2 text-blue-600">
                  <Users className="w-5 h-5" />
                  <span className="text-sm font-medium">Third-Party</span>
                </div>
              </RadioCard>
            </div>
          </CardContent>
        </Card>

      </div>
    </WizardLayout>
  );
}
