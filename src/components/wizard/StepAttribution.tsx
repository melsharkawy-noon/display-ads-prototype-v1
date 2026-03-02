"use client";

import { useState } from "react";
import { useCampaign } from "@/context/CampaignContext";
import { WizardLayout } from "@/components/layout/WizardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Chip } from "@/components/ui/Chip";
import { brands, categories, partners } from "@/lib/mock-data";
import { Search, Info } from "lucide-react";

interface StepAttributionProps {
  onBack: () => void;
  onNext: () => void;
}

export function StepAttribution({ onBack, onNext }: StepAttributionProps) {
  const { draft, updateDraft, markStepComplete } = useCampaign();
  
  const [partnerSearch, setPartnerSearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");

  const filteredPartners = partners.filter((p) =>
    p.name.toLowerCase().includes(partnerSearch.toLowerCase()) ||
    p.id.includes(partnerSearch)
  );

  // Auto-derive from landing page config
  const derivedBrands = draft.landingPageMode === "builder" ? draft.builderConfig.brands : [];
  const derivedCategories = draft.landingPageMode === "builder" ? draft.builderConfig.categories : [];

  // Use derived values if attribution is empty
  const currentBrands = draft.attributionBrands.length > 0 ? draft.attributionBrands : derivedBrands;
  const currentCategories = draft.attributionCategories.length > 0 ? draft.attributionCategories : derivedCategories;

  const addPartner = (partnerId: string) => {
    if (!draft.partnerIds.includes(partnerId)) {
      updateDraft({ partnerIds: [...draft.partnerIds, partnerId] });
    }
    setPartnerSearch("");
  };

  const removePartner = (partnerId: string) => {
    updateDraft({ partnerIds: draft.partnerIds.filter((p) => p !== partnerId) });
  };

  const addBrand = (brandId: string) => {
    if (!currentBrands.includes(brandId)) {
      updateDraft({ attributionBrands: [...currentBrands, brandId] });
    }
    setBrandSearch("");
  };

  const removeBrand = (brandId: string) => {
    updateDraft({ attributionBrands: currentBrands.filter((b) => b !== brandId) });
  };

  const addCategory = (categoryId: string) => {
    if (!currentCategories.includes(categoryId)) {
      updateDraft({ attributionCategories: [...currentCategories, categoryId] });
    }
    setCategorySearch("");
  };

  const removeCategory = (categoryId: string) => {
    updateDraft({ attributionCategories: currentCategories.filter((c) => c !== categoryId) });
  };

  const handleNext = () => {
    // Save derived values to draft if not already set
    if (draft.attributionBrands.length === 0 && derivedBrands.length > 0) {
      updateDraft({ attributionBrands: derivedBrands });
    }
    if (draft.attributionCategories.length === 0 && derivedCategories.length > 0) {
      updateDraft({ attributionCategories: derivedCategories });
    }
    markStepComplete(9);
    onNext();
  };

  return (
    <WizardLayout
      title="Display - Create Campaign (Managed)"
      subtitle="Configure attribution settings for reporting"
      onBack={onBack}
      onNext={handleNext}
      onSave={() => console.log("Save draft")}
      nextDisabled={draft.partnerIds.length === 0}
    >
      <div className="space-y-6">
        <Alert variant="info">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              These values were auto-derived from your landing page configuration.
              Please review and adjust if needed.
            </span>
          </div>
        </Alert>

        {/* Partner IDs */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Partner IDs for Attribution Access <span className="text-red-500">*</span>
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              These partners will see this campaign&apos;s performance in their attribution reports.
            </p>

            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by partner ID or name..."
                value={partnerSearch}
                onChange={(e) => setPartnerSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {partnerSearch && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-auto z-10">
                  {filteredPartners.map((partner) => (
                    <button
                      key={partner.id}
                      onClick={() => addPartner(partner.id)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm flex justify-between"
                    >
                      <span>{partner.name}</span>
                      <span className="text-gray-400">ID: {partner.id}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {draft.partnerIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {draft.partnerIds.map((partnerId) => {
                  const partner = partners.find((p) => p.id === partnerId);
                  return (
                    <Chip key={partnerId} variant="primary" onRemove={() => removePartner(partnerId)}>
                      {partner?.name || partnerId} (ID: {partnerId})
                    </Chip>
                  );
                })}
              </div>
            )}

            <p className="text-sm text-gray-500 mt-3">
              {draft.partnerIds.length} partner{draft.partnerIds.length !== 1 ? "s" : ""} selected
            </p>
          </CardContent>
        </Card>

        {/* Brands for Attribution */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Brands for Attribution <span className="text-red-500">*</span>
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Conversions will be attributed to these brands
            </p>

            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search brands..."
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {brandSearch && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-auto z-10">
                  {brands
                    .filter((b) => b.name.toLowerCase().includes(brandSearch.toLowerCase()))
                    .map((brand) => (
                      <button
                        key={brand.id}
                        onClick={() => addBrand(brand.id)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
                      >
                        {brand.name}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {currentBrands.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {currentBrands.map((brandId) => {
                  const brand = brands.find((b) => b.id === brandId);
                  return (
                    <Chip key={brandId} variant="brand" onRemove={() => removeBrand(brandId)}>
                      {brand?.name || brandId}
                    </Chip>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Categories for Attribution */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Categories for Attribution <span className="text-red-500">*</span>
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Conversions will be attributed to these categories
            </p>

            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {categorySearch && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-auto z-10">
                  {categories
                    .filter((c) => c.name.toLowerCase().includes(categorySearch.toLowerCase()))
                    .map((category) => (
                      <button
                        key={category.id}
                        onClick={() => addCategory(category.id)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
                      >
                        {category.name}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {currentCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {currentCategories.map((categoryId) => {
                  const category = categories.find((c) => c.id === categoryId);
                  return (
                    <Chip key={categoryId} variant="category" onRemove={() => removeCategory(categoryId)}>
                      {category?.name || categoryId}
                    </Chip>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Alert variant="warning">
          Ensure these match the actual products being promoted to avoid incorrect attribution in reports.
        </Alert>
      </div>
    </WizardLayout>
  );
}
