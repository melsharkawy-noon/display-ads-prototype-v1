"use client";

import { useState, useEffect } from "react";
import { useCampaign } from "@/context/CampaignContext";
import { WizardLayout } from "@/components/layout/WizardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Alert } from "@/components/ui/Alert";
import { slots } from "@/lib/mock-data";
import { Creative } from "@/lib/types";
import { Smartphone, Monitor, Image, Plus, X, CheckCircle, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepCreativesProps {
  onBack: () => void;
  onNext: () => void;
}

type Platform = "mobile" | "desktop";
type Language = "en" | "ar";

const MAX_CREATIVES_PER_VARIANT = 3;

export function StepCreatives({ onBack, onNext }: StepCreativesProps) {
  const { draft, updateDraft, markStepComplete } = useCampaign();
  
  const [activePlatform, setActivePlatform] = useState<Platform>("mobile");
  const [activeLanguage, setActiveLanguage] = useState<Language>("en");
  const [selectedCreativeId, setSelectedCreativeId] = useState<string | null>(null);

  const selectedSlots = slots.filter((s) => draft.slotIds.includes(s.id));
  const primarySlot = selectedSlots[0];

  // Get creatives for current platform/language
  const getCurrentCreatives = () => {
    return draft.creatives.filter(
      (c) => c.platform === activePlatform && c.language === activeLanguage
    );
  };

  const currentCreatives = getCurrentCreatives();

  // Auto-select first creative when switching variants or when creatives change
  useEffect(() => {
    if (currentCreatives.length > 0) {
      // If currently selected creative is not in current list, select the first one
      if (!selectedCreativeId || !currentCreatives.find(c => c.id === selectedCreativeId)) {
        setSelectedCreativeId(currentCreatives[0].id);
      }
    } else {
      setSelectedCreativeId(null);
    }
  }, [activePlatform, activeLanguage, currentCreatives.length]);

  // Get selected creative for preview
  const selectedCreative = currentCreatives.find(c => c.id === selectedCreativeId) || currentCreatives[0];

  // Check if can add more creatives
  const canAddMore = currentCreatives.length < MAX_CREATIVES_PER_VARIANT;

  // Add a new creative
  const addCreative = () => {
    if (!canAddMore) return;
    
    const newCreative: Creative = {
      id: `creative-${Date.now()}`,
      platform: activePlatform,
      language: activeLanguage,
      format: primarySlot?.dimensions || "706x320",
      assetUrl: `https://picsum.photos/seed/${Date.now()}/706/320`,
      fileName: `banner_${activePlatform}_${activeLanguage}_${currentCreatives.length + 1}.png`,
    };
    updateDraft({ creatives: [...draft.creatives, newCreative] });
    setSelectedCreativeId(newCreative.id);
  };

  // Remove a creative
  const removeCreative = (creativeId: string) => {
    updateDraft({
      creatives: draft.creatives.filter((c) => c.id !== creativeId),
    });
    // If removing selected creative, select another one
    if (creativeId === selectedCreativeId) {
      const remaining = currentCreatives.filter(c => c.id !== creativeId);
      setSelectedCreativeId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Count creatives per group
  const getGroupCount = (platform: Platform, language: Language) => {
    return draft.creatives.filter(
      (c) => c.platform === platform && c.language === language
    ).length;
  };

  // Total creatives
  const totalCreatives = draft.creatives.length;

  // Check if all groups have at least one creative
  const groups = [
    { platform: "mobile" as Platform, language: "en" as Language },
    { platform: "mobile" as Platform, language: "ar" as Language },
    { platform: "desktop" as Platform, language: "en" as Language },
    { platform: "desktop" as Platform, language: "ar" as Language },
  ];
  const completeGroups = groups.filter((g) => getGroupCount(g.platform, g.language) > 0).length;

  const handleNext = () => {
    markStepComplete(5);
    onNext();
  };

  return (
    <WizardLayout
      title="Display - Create Campaign (Managed)"
      subtitle="Upload your creative banners"
      onBack={onBack}
      onNext={handleNext}
      onSave={() => console.log("Save draft")}
      nextDisabled={totalCreatives === 0}
    >
      <div className="grid grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="col-span-2">
          <Card>
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Creative Banners <span className="text-red-500">*</span>
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Upload up to {MAX_CREATIVES_PER_VARIANT} banners per variant for A/B testing
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {!canAddMore && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full">
                      <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-xs font-medium text-green-700">Variant full</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Layers className="w-4 h-4 text-gray-400" />
                    {totalCreatives} total
                  </div>
                </div>
              </div>

              {/* Platform Tabs */}
              <div className="mb-4">
                <Tabs
                  variant="pills"
                  tabs={[
                    { id: "mobile", label: "Mobile", icon: <Smartphone className="w-4 h-4" /> },
                    { id: "desktop", label: "Desktop", icon: <Monitor className="w-4 h-4" /> },
                  ]}
                  activeTab={activePlatform}
                  onChange={(id) => setActivePlatform(id as Platform)}
                />
              </div>

              {/* Language Tabs */}
              <div className="mb-6">
                <div className="text-sm font-medium text-gray-700 mb-2">Language Version</div>
                <div className="flex gap-2">
                  {(["en", "ar"] as Language[]).map((lang) => {
                    const count = getGroupCount(activePlatform, lang);
                    return (
                      <button
                        key={lang}
                        onClick={() => setActiveLanguage(lang)}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all flex items-center gap-2",
                          activeLanguage === lang
                            ? "border-primary-500 bg-primary-50 text-primary-700"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        )}
                      >
                        {lang === "en" ? "English" : "Arabic"}
                        {count > 0 && (
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-xs font-bold",
                            activeLanguage === lang
                              ? "bg-primary-200 text-primary-800"
                              : "bg-gray-200 text-gray-600"
                          )}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slot Info */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">
                    {primarySlot?.name || "Banner"} — <strong>{primarySlot?.dimensions || "706×320"}</strong>
                  </span>
                  <span className="text-gray-500">Max size: {primarySlot?.maxFileSizeMb || 20} MB</span>
                </div>
              </div>

              {/* Creatives Grid */}
              <div className="grid grid-cols-3 gap-4">
                {/* Existing Creatives */}
                {currentCreatives.map((creative, index) => {
                  const isSelected = creative.id === selectedCreativeId;
                  return (
                    <div
                      key={creative.id}
                      onClick={() => setSelectedCreativeId(creative.id)}
                      className={cn(
                        "relative group aspect-[706/320] bg-gray-100 rounded-xl overflow-hidden border-2 cursor-pointer transition-all",
                        isSelected 
                          ? "border-primary-500 ring-2 ring-primary-200" 
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <img
                        src={creative.assetUrl || ""}
                        alt={creative.fileName || ""}
                        className="w-full h-full object-cover"
                      />
                      {/* Overlay with info */}
                      <div className={cn(
                        "absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity",
                        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      )}>
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <div className="text-white text-xs truncate">{creative.fileName}</div>
                        </div>
                      </div>
                      {/* Creative number badge */}
                      <div className={cn(
                        "absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-medium",
                        isSelected ? "bg-primary-500 text-white" : "bg-black/50 text-white"
                      )}>
                        #{index + 1}
                      </div>
                      {/* Selected indicator */}
                      {isSelected && (
                        <div className="absolute top-2 right-10 p-1 bg-primary-500 rounded-full">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {/* Remove button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCreative(creative.id);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}

                {/* Add Creative Button - Only show if under limit */}
                {canAddMore && (
                  <div
                    onClick={addCreative}
                    className="aspect-[706/320] border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-all"
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-2">
                      <Plus className="w-5 h-5 text-gray-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-600">Add Creative</span>
                    <span className="text-xs text-gray-400 mt-0.5">
                      {currentCreatives.length} of {MAX_CREATIVES_PER_VARIANT}
                    </span>
                  </div>
                )}
              </div>

              {/* Coverage Matrix */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-gray-700">Coverage by Variant</div>
                  <div className="text-xs text-gray-500">Max {MAX_CREATIVES_PER_VARIANT} per variant</div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {groups.map((group) => {
                    const count = getGroupCount(group.platform, group.language);
                    const isActive = group.platform === activePlatform && group.language === activeLanguage;
                    const isFull = count >= MAX_CREATIVES_PER_VARIANT;
                    return (
                      <button
                        key={`${group.platform}-${group.language}`}
                        onClick={() => {
                          setActivePlatform(group.platform);
                          setActiveLanguage(group.language);
                        }}
                        className={cn(
                          "p-3 rounded-lg text-center transition-all border-2",
                          isActive
                            ? "border-primary-500 bg-primary-50"
                            : isFull
                            ? "border-green-300 bg-green-50"
                            : count > 0
                            ? "border-blue-200 bg-blue-50"
                            : "border-gray-200 bg-gray-50",
                          "hover:border-gray-300"
                        )}
                      >
                        <div className="text-lg mb-0.5">
                          {group.platform === "mobile" ? "📱" : "🖥️"}
                        </div>
                        <div className="text-xs font-medium text-gray-700">
                          {group.language.toUpperCase()}
                        </div>
                        <div className={cn(
                          "text-xs mt-1 font-medium",
                          isFull ? "text-green-600" : count > 0 ? "text-blue-600" : "text-gray-400"
                        )}>
                          {count}/{MAX_CREATIVES_PER_VARIANT}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Live Preview</h3>
                <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                  {activePlatform === "mobile" ? "📱 Mobile" : "🖥️ Desktop"}
                </span>
              </div>
              
              {/* Device Preview */}
              {activePlatform === "mobile" ? (
                /* Mobile Preview */
                <div className="bg-gray-100 rounded-[24px] p-2 max-w-[220px] mx-auto border border-gray-300">
                  <div className="bg-white rounded-[20px] overflow-hidden">
                    {/* Status bar */}
                    <div className="bg-[#FCEC50] px-3 py-2 flex items-center gap-2">
                      <div className="w-5 h-5 bg-[#404553] rounded flex items-center justify-center">
                        <span className="text-[#FCEC50] text-[8px] font-bold">n</span>
                      </div>
                      <div className="flex-1 h-2 bg-white/30 rounded" />
                    </div>
                    
                    {/* Search bar placeholder */}
                    <div className="px-3 py-2">
                      <div className="bg-gray-100 rounded-lg h-7 flex items-center px-2">
                        <div className="w-3 h-3 rounded-full border border-gray-300" />
                      </div>
                    </div>
                    
                    {/* Banner Slot - This is where the creative goes */}
                    <div className="px-3 pb-2">
                      <div className="relative rounded-xl overflow-hidden border-2 border-primary-400 bg-gray-50">
                        {selectedCreative ? (
                          <img
                            src={selectedCreative.assetUrl || ""}
                            alt="Banner preview"
                            className="w-full aspect-[706/320] object-cover"
                          />
                        ) : (
                          <div className="w-full aspect-[706/320] flex items-center justify-center">
                            <div className="text-center">
                              <Image className="w-5 h-5 text-gray-300 mx-auto mb-1" />
                              <span className="text-[9px] text-gray-400">Your banner here</span>
                            </div>
                          </div>
                        )}
                        <div className="absolute top-1 right-1 px-1 py-0.5 bg-primary-500 rounded text-[7px] text-white font-medium">
                          AD
                        </div>
                      </div>
                    </div>
                    
                    {/* Category pills */}
                    <div className="px-3 py-2 border-t">
                      <div className="flex gap-1.5 overflow-hidden">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="w-10 h-10 bg-gray-100 rounded-full flex-shrink-0" />
                        ))}
                      </div>
                    </div>
                    
                    {/* Product grid placeholder */}
                    <div className="px-3 pb-3">
                      <div className="h-2 bg-gray-100 rounded w-20 mb-2" />
                      <div className="grid grid-cols-3 gap-1.5">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="aspect-[3/4] bg-gray-100 rounded-lg" />
                        ))}
                      </div>
                    </div>
                    
                    {/* Bottom nav */}
                    <div className="bg-gray-50 px-4 py-2 flex justify-center">
                      <div className="h-1 w-16 bg-gray-300 rounded-full" />
                    </div>
                  </div>
                </div>
              ) : (
                /* Desktop Preview */
                <div className="bg-gray-100 rounded-2xl p-1.5 border border-gray-300">
                  <div className="bg-white rounded-xl overflow-hidden">
                    {/* Browser top bar */}
                    <div className="bg-[#FCEC50] px-3 py-2 flex items-center gap-3">
                      <div className="w-5 h-5 bg-[#404553] rounded flex items-center justify-center">
                        <span className="text-[#FCEC50] text-[8px] font-bold">n</span>
                      </div>
                      <div className="flex-1 h-3 bg-white/40 rounded max-w-[180px]" />
                    </div>
                    
                    {/* Main content area */}
                    <div className="p-3">
                      {/* Banner Slot - Hero position */}
                      <div className="relative rounded-xl overflow-hidden border-2 border-primary-400 bg-gray-50 mb-3">
                        {selectedCreative ? (
                          <img
                            src={selectedCreative.assetUrl || ""}
                            alt="Banner preview"
                            className="w-full aspect-[706/320] object-cover"
                          />
                        ) : (
                          <div className="w-full aspect-[706/320] flex items-center justify-center">
                            <div className="text-center">
                              <Image className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                              <span className="text-xs text-gray-400">Your banner here</span>
                            </div>
                          </div>
                        )}
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-primary-500 rounded text-[8px] text-white font-medium">
                          AD
                        </div>
                      </div>
                      
                      {/* Category pills */}
                      <div className="flex gap-2 mb-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div key={i} className="w-8 h-8 bg-gray-100 rounded-full flex-shrink-0" />
                        ))}
                      </div>
                      
                      {/* Product grid placeholder */}
                      <div className="h-1.5 bg-gray-100 rounded w-24 mb-2" />
                      <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="aspect-[3/4] bg-gray-100 rounded-lg" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Thumbnail selector */}
              {currentCreatives.length > 1 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-xs text-gray-500 mb-2">Select creative to preview</div>
                  <div className="flex gap-2 justify-center">
                    {currentCreatives.map((creative, index) => (
                      <button
                        key={creative.id}
                        onClick={() => setSelectedCreativeId(creative.id)}
                        className={cn(
                          "relative w-14 aspect-[706/320] rounded-lg overflow-hidden border-2 transition-all",
                          creative.id === selectedCreativeId
                            ? "border-primary-500 ring-1 ring-primary-300"
                            : "border-gray-200 hover:border-gray-300 opacity-60 hover:opacity-100"
                        )}
                      >
                        <img
                          src={creative.assetUrl || ""}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={cn(
                            "text-[9px] font-bold px-1 py-0.5 rounded",
                            creative.id === selectedCreativeId
                              ? "bg-primary-500 text-white"
                              : "bg-black/50 text-white"
                          )}>
                            {index + 1}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* File info */}
              {selectedCreative && (
                <div className="mt-4 p-2 bg-gray-50 rounded-lg text-center">
                  <div className="text-xs font-medium text-gray-700 truncate">
                    {selectedCreative.fileName}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {selectedCreative.format} • {selectedCreative.language.toUpperCase()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Upload Status</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Variants covered</span>
                  <span className={cn(
                    "font-medium",
                    completeGroups === 4 ? "text-green-600" : "text-amber-600"
                  )}>
                    {completeGroups} of 4
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total creatives</span>
                  <span className="font-medium text-gray-900">{totalCreatives}</span>
                </div>
              </div>

              {completeGroups < 4 && (
                <Alert variant="warning" className="mt-3">
                  Upload at least one creative for each variant for full coverage.
                </Alert>
              )}

              {completeGroups === 4 && (
                <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  All variants have creatives
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </WizardLayout>
  );
}
