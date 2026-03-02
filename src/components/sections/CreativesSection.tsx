"use client";

import { useState, memo } from "react";
import { useCampaign } from "@/context/CampaignContext";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { SLOT_DIMENSIONS, SlotType, Creative } from "@/lib/types";
import { slots } from "@/lib/mock-data";
import {
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Image,
  Layers,
  Package,
  Sparkles,
  Loader2,
  RefreshCw,
  Upload,
} from "lucide-react";

interface CreativesSectionProps {
  sectionRef: (el: HTMLElement | null) => void;
  selectedSlots: typeof slots;
  missingCreativeSizes: SlotType[];
}

export const CreativesSection = memo(function CreativesSection({
  sectionRef,
  selectedSlots,
  missingCreativeSizes,
}: CreativesSectionProps) {
  const { draft, updateDraft } = useCampaign();

  // Creative mode state
  const [creativeMode, setCreativeMode] = useState<"upload" | "template">("upload");
  const [selectedPreviewCreative, setSelectedPreviewCreative] = useState<Creative | null>(null);

  // Template builder state
  const [templateLogo, setTemplateLogo] = useState<string>("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 32'%3E%3Ctext x='0' y='26' font-family='Arial, sans-serif' font-size='28' font-weight='bold' fill='%231428A0'%3ESAMSUNG%3C/text%3E%3C/svg%3E");
  const [templateHeadline, setTemplateHeadline] = useState<string>("Galaxy S24 Ultra - Now Available");
  const [templateHeadlineAr, setTemplateHeadlineAr] = useState<string>("جالاكسي S24 الترا - متوفر الآن");
  const [templateImage, setTemplateImage] = useState<string>("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 400'%3E%3Cdefs%3E%3ClinearGradient id='phoneGrad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23374151'/%3E%3Cstop offset='100%25' style='stop-color:%231f2937'/%3E%3C/linearGradient%3E%3ClinearGradient id='screenGrad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23818cf8'/%3E%3Cstop offset='50%25' style='stop-color:%23c084fc'/%3E%3Cstop offset='100%25' style='stop-color:%23f472b6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect x='20' y='10' width='160' height='380' rx='24' fill='url(%23phoneGrad)'/%3E%3Crect x='28' y='20' width='144' height='360' rx='18' fill='url(%23screenGrad)'/%3E%3Ccircle cx='100' cy='40' r='6' fill='%231f2937' opacity='0.5'/%3E%3Crect x='70' y='355' width='60' height='5' rx='2' fill='%23374151'/%3E%3Ccircle cx='155' cy='50' r='8' fill='%231f2937'/%3E%3Ccircle cx='155' cy='70' r='5' fill='%231f2937'/%3E%3Ctext x='100' y='200' text-anchor='middle' font-family='Arial' font-size='16' font-weight='bold' fill='white'%3EGalaxy S24%3C/text%3E%3Ctext x='100' y='225' text-anchor='middle' font-family='Arial' font-size='12' fill='white' opacity='0.8'%3EUltra%3C/text%3E%3C/svg%3E");
  const [templateBackgroundColor] = useState<string>("#FFFFFF");
  const [templatePreviewDevice, setTemplatePreviewDevice] = useState<"mobile" | "desktop">("mobile");

  // AI full-creative generation state
  const [imageSourceMode, setImageSourceMode] = useState<"upload" | "ai">("upload");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGeneratedBanners, setAiGeneratedBanners] = useState<string[]>([]);
  const [aiSelectedIndex, setAiSelectedIndex] = useState<number>(0);

  // Build mock full-banner SVGs that incorporate logo placeholder + headline
  const generateAiBanners = () => {
    if (!aiPrompt.trim() && !templateHeadline) return;
    setAiGenerating(true);
    setAiGeneratedBanners([]);
    const hl = encodeURIComponent(templateHeadline || "Your Headline");
    setTimeout(() => {
      const banners = [
        // Dark/purple gradient - full banner with logo area + headline + product
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 706 320'%3E%3Cdefs%3E%3ClinearGradient id='a1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%231e1b4b'/%3E%3Cstop offset='100%25' style='stop-color:%234c1d95'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='706' height='320' fill='url(%23a1)'/%3E%3Ccircle cx='580' cy='160' r='120' fill='%237c3aed' opacity='0.3'/%3E%3Ccircle cx='620' cy='140' r='80' fill='%238b5cf6' opacity='0.2'/%3E%3Crect x='40' y='30' width='120' height='28' rx='4' fill='white' opacity='0.9'/%3E%3Ctext x='100' y='50' text-anchor='middle' font-family='Arial' font-size='14' font-weight='bold' fill='%231e1b4b'%3ELOGO%3C/text%3E%3Ctext x='40' y='120' font-family='Arial' font-size='28' font-weight='bold' fill='white'%3E${hl}%3C/text%3E%3Ctext x='40' y='155' font-family='Arial' font-size='14' fill='%23c4b5fd'%3EShop now on noon%3C/text%3E%3Crect x='40' y='175' width='100' height='36' rx='18' fill='%23fbbf24'/%3E%3Ctext x='90' y='198' text-anchor='middle' font-family='Arial' font-size='13' font-weight='bold' fill='%231e1b4b'%3EShop Now%3C/text%3E%3Crect x='460' y='40' width='160' height='240' rx='20' fill='%23374151'/%3E%3Crect x='470' y='55' width='140' height='210' rx='14' fill='%23818cf8'/%3E%3Ctext x='540' y='170' text-anchor='middle' font-family='Arial' font-size='12' fill='white' opacity='0.6'%3EProduct%3C/text%3E%3Ctext x='680' y='310' text-anchor='end' font-family='Arial' font-size='8' fill='white' opacity='0.4'%3EAd%3C/text%3E%3C/svg%3E`,
        // Clean white/blue - professional
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 706 320'%3E%3Crect width='706' height='320' fill='%23f8fafc'/%3E%3Crect x='0' y='0' width='706' height='4' fill='%233b82f6'/%3E%3Crect x='420' y='0' width='286' height='320' fill='%23eff6ff'/%3E%3Crect x='40' y='35' width='120' height='28' rx='4' fill='%231e40af'/%3E%3Ctext x='100' y='54' text-anchor='middle' font-family='Arial' font-size='13' font-weight='bold' fill='white'%3ELOGO%3C/text%3E%3Ctext x='40' y='120' font-family='Arial' font-size='26' font-weight='bold' fill='%230f172a'%3E${hl}%3C/text%3E%3Ctext x='40' y='155' font-family='Arial' font-size='14' fill='%2364748b'%3EExclusive offers on noon%3C/text%3E%3Crect x='40' y='180' width='110' height='36' rx='18' fill='%233b82f6'/%3E%3Ctext x='95' y='203' text-anchor='middle' font-family='Arial' font-size='13' font-weight='bold' fill='white'%3EShop Now%3C/text%3E%3Crect x='470' y='50' width='150' height='220' rx='16' fill='white' stroke='%23e2e8f0'/%3E%3Ctext x='545' y='165' text-anchor='middle' font-family='Arial' font-size='12' fill='%2394a3b8'%3EProduct%3C/text%3E%3C/svg%3E`,
        // Bold yellow/black - high energy
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 706 320'%3E%3Crect width='706' height='320' fill='%23fbbf24'/%3E%3Cpolygon points='400,0 706,0 706,320 300,320' fill='%23111827'/%3E%3Crect x='40' y='30' width='120' height='28' rx='4' fill='%23111827'/%3E%3Ctext x='100' y='49' text-anchor='middle' font-family='Arial' font-size='13' font-weight='bold' fill='%23fbbf24'%3ELOGO%3C/text%3E%3Ctext x='40' y='120' font-family='Arial' font-size='28' font-weight='900' fill='%23111827'%3E${hl}%3C/text%3E%3Ctext x='40' y='155' font-family='Arial' font-size='14' font-weight='bold' fill='%2392400e'%3ELimited time offer%3C/text%3E%3Crect x='40' y='175' width='110' height='36' rx='18' fill='%23111827'/%3E%3Ctext x='95' y='198' text-anchor='middle' font-family='Arial' font-size='13' font-weight='bold' fill='%23fbbf24'%3EShop Now%3C/text%3E%3Crect x='470' y='40' width='160' height='240' rx='18' fill='%231f2937'/%3E%3Crect x='480' y='55' width='140' height='210' rx='12' fill='%23fbbf24' opacity='0.3'/%3E%3Ctext x='550' y='165' text-anchor='middle' font-family='Arial' font-size='12' fill='%239ca3af'%3EProduct%3C/text%3E%3C/svg%3E`,
        // Gradient teal - modern
        `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 706 320'%3E%3Cdefs%3E%3ClinearGradient id='a4' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23042f2e'/%3E%3Cstop offset='100%25' style='stop-color:%230f766e'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='706' height='320' fill='url(%23a4)'/%3E%3Ccircle cx='600' cy='80' r='200' fill='%2314b8a6' opacity='0.15'/%3E%3Crect x='40' y='30' width='120' height='28' rx='4' fill='%2314b8a6'/%3E%3Ctext x='100' y='49' text-anchor='middle' font-family='Arial' font-size='13' font-weight='bold' fill='white'%3ELOGO%3C/text%3E%3Ctext x='40' y='120' font-family='Arial' font-size='26' font-weight='bold' fill='white'%3E${hl}%3C/text%3E%3Ctext x='40' y='155' font-family='Arial' font-size='14' fill='%235eead4'%3EDiscover more on noon%3C/text%3E%3Crect x='40' y='175' width='110' height='36' rx='18' fill='%23fbbf24'/%3E%3Ctext x='95' y='198' text-anchor='middle' font-family='Arial' font-size='13' font-weight='bold' fill='%23042f2e'%3EShop Now%3C/text%3E%3Crect x='470' y='45' width='155' height='230' rx='18' fill='%23115e59'/%3E%3Crect x='480' y='58' width='135' height='205' rx='14' fill='%2314b8a6' opacity='0.4'/%3E%3Ctext x='548' y='165' text-anchor='middle' font-family='Arial' font-size='12' fill='%23ccfbf1'%3EProduct%3C/text%3E%3C/svg%3E`,
      ];
      setAiGeneratedBanners(banners);
      setAiSelectedIndex(0);
      setAiGenerating(false);
    }, 2500);
  };

  // Whether this is a brand flow with CPT pricing (affects slot filtering in upload mode)
  const isBrandCpt = draft.entryType === "brand" && draft.pricingModel === "cpt";
  const showStatusBadge = draft.entryType === "seller" || draft.pricingModel === "cpm";

  const handleCreativeUpload = (slotType: SlotType, language: "en" | "ar") => {
    const platform = slotType.startsWith("mobile") ? "mobile" : "desktop";
    const dimensions = SLOT_DIMENSIONS.find(d => d.type === slotType)?.dimensions.default || "";

    const newCreative: Creative = {
      id: `creative_${Date.now()}`,
      slotType,
      platform,
      language,
      format: "image/png",
      assetUrl: `https://picsum.photos/seed/${Date.now()}/${dimensions.split("x")[0]}/${dimensions.split("x")[1]}`,
      fileName: `banner_${slotType}_${language}.png`,
      dimensions: draft.country === "EG" && slotType === "desktop_hero" ? "1440x200" : dimensions,
    };

    updateDraft({ creatives: [...draft.creatives, newCreative] });
  };

  const removeCreative = (creativeId: string) => {
    updateDraft({ creatives: draft.creatives.filter(c => c.id !== creativeId) });
  };

  // Render a creative upload card for a given slot dimension
  const renderUploadCard = (slotDim: typeof SLOT_DIMENSIONS[number]) => {
    // For CPT brand, check if this slot type is in selected slots
    if (isBrandCpt) {
      const showForCpt = selectedSlots.some(s => s.slotType === slotDim.type);
      if (!showForCpt) return (
        <div key={slotDim.type} className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-6 flex items-center justify-center min-h-[120px]">
          <span className="text-xs text-gray-400">No {slotDim.label} slots selected</span>
        </div>
      );
    }

    const allCreatives = draft.creatives.filter(c => c.slotType === slotDim.type);
    const dimensions = draft.country === "EG" && slotDim.type === "desktop_hero"
      ? slotDim.dimensions.EG || slotDim.dimensions.default
      : slotDim.dimensions.default;
    const enCount = allCreatives.filter(c => c.language === "en").length;
    const arCount = allCreatives.filter(c => c.language === "ar").length;
    const isComplete = enCount > 0 && arCount > 0;
    const isMobile = slotDim.type.includes("mobile");

    return (
      <div key={slotDim.type} className={cn(
        "rounded-lg border overflow-hidden transition-all",
        isComplete ? "border-green-300 shadow-sm shadow-green-100" : "border-gray-200"
      )}>
        <div className={cn(
          "px-3 py-2 flex items-center justify-between",
          isComplete ? "bg-green-50" : "bg-gray-50"
        )}>
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-6 h-6 rounded-md flex items-center justify-center",
              isMobile ? "bg-purple-100" : "bg-blue-100"
            )}>
              {isMobile ? (
                <svg className="w-3.5 h-3.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="7" y="2" width="10" height="20" rx="2" strokeWidth="2" /></svg>
              ) : (
                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="2" y="4" width="20" height="14" rx="2" strokeWidth="2" /></svg>
              )}
            </div>
            <div>
              <span className="text-sm font-medium text-gray-900">{slotDim.label}</span>
              <span className="text-xs text-gray-400 ml-2">{dimensions}</span>
            </div>
          </div>
          {isComplete && <CheckCircle className="w-4 h-4 text-green-500" />}
        </div>
        <div className="p-3 space-y-2.5 bg-white">
          {[{ code: "en", label: "English", flag: "EN" }, { code: "ar", label: "العربية", flag: "AR" }].map(lang => {
            const langCreatives = allCreatives.filter(c => c.language === lang.code);
            return (
              <div key={lang.code} className="flex items-center gap-2.5">
                <span className={cn(
                  "text-xs font-semibold w-7 h-5 shrink-0 rounded flex items-center justify-center",
                  lang.code === "en" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                )}>{lang.flag}</span>
                <div className="flex items-center gap-1.5 flex-1">
                  {langCreatives.map(creative => (
                    <div
                      key={creative.id}
                      className={cn(
                        "relative group cursor-pointer rounded-md transition-all",
                        selectedPreviewCreative?.id === creative.id && "ring-2 ring-primary-500 ring-offset-1"
                      )}
                      onClick={() => setSelectedPreviewCreative(creative)}
                    >
                      <div className="w-16 h-10 bg-gray-100 border rounded-md overflow-hidden">
                        <img src={creative.assetUrl || ""} alt="" className="w-full h-full object-cover" />
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeCreative(creative.id); }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center shadow-md transition-opacity z-10"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                  {langCreatives.length < 4 && (
                    <button
                      onClick={() => handleCreativeUpload(slotDim.type, lang.code as "en" | "ar")}
                      className="w-16 h-10 rounded-md border-2 border-dashed border-gray-200 hover:border-primary-400 hover:bg-primary-50 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <section
      ref={sectionRef}
      id="creatives"
      className="scroll-mt-36"
    >
      <Card>
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Creative Assets</h2>
              <p className="text-sm text-gray-500">
                {creativeMode === "upload" ? "Upload banners for each placement (max 4 per language)" : "Build ads from your logo and product images"}
              </p>
            </div>
            {showStatusBadge && (
              <div className="flex items-center gap-2">
                {creativeMode === "upload" && (
                  missingCreativeSizes.length === 0 ? (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      Complete
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                      <AlertCircle className="w-3 h-3" />
                      {missingCreativeSizes.length} missing
                    </span>
                  )
                )}
                {creativeMode === "template" && templateLogo && templateImage && templateHeadline && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    Ready
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setCreativeMode("upload")}
              className={cn(
                "flex-1 px-4 py-3 rounded-lg border-2 text-left transition-all",
                creativeMode === "upload"
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  creativeMode === "upload" ? "bg-primary-100" : "bg-gray-100"
                )}>
                  <Image className={cn("w-5 h-5", creativeMode === "upload" ? "text-primary-600" : "text-gray-500")} />
                </div>
                <div>
                  <p className={cn("font-medium", creativeMode === "upload" ? "text-primary-700" : "text-gray-700")}>Upload Own Banners</p>
                  <p className="text-xs text-gray-500">Upload pre-designed banners for each size</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => setCreativeMode("template")}
              className={cn(
                "flex-1 px-4 py-3 rounded-lg border-2 text-left transition-all",
                creativeMode === "template"
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  creativeMode === "template" ? "bg-primary-100" : "bg-gray-100"
                )}>
                  <Layers className={cn("w-5 h-5", creativeMode === "template" ? "text-primary-600" : "text-gray-500")} />
                </div>
                <div>
                  <p className={cn("font-medium", creativeMode === "template" ? "text-primary-700" : "text-gray-700")}>Use Template Builder</p>
                  <p className="text-xs text-gray-500">Add logo, headline & image - we create all sizes</p>
                </div>
              </div>
            </button>
          </div>

          {creativeMode === "template" ? (
            /* Template Builder */
            <div>
              {/* Creative approach toggle: Manual vs AI */}
              <div className="flex items-center gap-2 mb-5">
                <button
                  onClick={() => { setImageSourceMode("upload"); setAiGeneratedBanners([]); }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                    imageSourceMode === "upload"
                      ? "bg-white border-primary-300 text-primary-700 shadow-sm ring-1 ring-primary-200"
                      : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                  )}
                >
                  <Upload className="w-4 h-4" />
                  Manual Template
                </button>
                <button
                  onClick={() => setImageSourceMode("ai")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                    imageSourceMode === "ai"
                      ? "bg-gradient-to-r from-violet-500 to-purple-600 border-transparent text-white shadow-sm"
                      : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                  )}
                >
                  <Sparkles className="w-4 h-4" />
                  AI Generate Full Creative
                </button>
              </div>

            <div className="grid grid-cols-12 gap-6">
              {/* Left: Template Inputs */}
              <div className="col-span-5 space-y-5">
                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Brand Logo</label>
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors overflow-hidden",
                        templateLogo ? "border-primary-300 bg-white" : "border-gray-300 hover:border-primary-400 bg-gray-50"
                      )}
                      onClick={() => {
                        setTemplateLogo("https://www.noon.com/_next/static/media/noon-logo-yellow.e498c550.svg");
                      }}
                    >
                      {templateLogo ? (
                        <img src={templateLogo} alt="Logo" className="w-full h-full object-contain p-2" />
                      ) : (
                        <Plus className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-2">PNG or SVG, transparent background recommended</p>
                      {templateLogo && (
                        <button onClick={() => setTemplateLogo("")} className="text-xs text-red-600 hover:text-red-700">Remove logo</button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Headlines */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Headline</label>
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">EN</span>
                        <span className="text-xs text-gray-400">English</span>
                      </div>
                      <input
                        type="text"
                        value={templateHeadline}
                        onChange={(e) => setTemplateHeadline(e.target.value)}
                        placeholder="e.g., Shop the Best Deals"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        maxLength={40}
                      />
                      <p className="text-xs text-gray-400 text-right mt-1">{templateHeadline.length}/40</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-green-100 text-green-700">AR</span>
                        <span className="text-xs text-gray-400">العربية</span>
                      </div>
                      <input
                        type="text"
                        value={templateHeadlineAr}
                        onChange={(e) => setTemplateHeadlineAr(e.target.value)}
                        placeholder="e.g., تسوق أفضل العروض"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right"
                        dir="rtl"
                        maxLength={40}
                      />
                      <p className="text-xs text-gray-400 text-right mt-1">{templateHeadlineAr.length}/40</p>
                    </div>
                  </div>
                </div>

                {/* Product Image (manual mode only) */}
                {imageSourceMode === "upload" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                  <div
                    className={cn(
                      "aspect-video rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors overflow-hidden",
                      templateImage ? "border-primary-300 bg-white" : "border-gray-300 hover:border-primary-400 bg-gray-50"
                    )}
                    onClick={() => {
                      setTemplateImage("https://f.nooncdn.com/p/v1631876456/N28111306V_1.jpg");
                    }}
                  >
                    {templateImage ? (
                      <img src={templateImage} alt="Product" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1.5" />
                        <p className="text-sm text-gray-500">Click to upload</p>
                        <p className="text-xs text-gray-400">JPG, PNG, MP4 up to 10MB</p>
                      </div>
                    )}
                  </div>
                  {templateImage && (
                    <button onClick={() => setTemplateImage("")} className="text-xs text-red-600 hover:text-red-700 mt-2">Remove image</button>
                  )}
                </div>
                )}

                {/* AI Full Creative Generation (ai mode only) */}
                {imageSourceMode === "ai" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Describe Your Ad</label>
                  <p className="text-xs text-gray-400 mb-2">AI will generate a complete banner ad using your logo, headline, and this description.</p>

                  {/* Context chips - show what AI will incorporate */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {templateLogo && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                        <CheckCircle className="w-2.5 h-2.5" /> Logo
                      </span>
                    )}
                    {templateHeadline && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                        <CheckCircle className="w-2.5 h-2.5" /> EN Headline
                      </span>
                    )}
                    {templateHeadlineAr && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                        <CheckCircle className="w-2.5 h-2.5" /> AR Headline
                      </span>
                    )}
                    {!templateLogo && !templateHeadline && (
                      <span className="text-[10px] text-amber-600">Fill in logo &amp; headline above for best results</span>
                    )}
                  </div>

                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g., 'Sleek dark background with purple ambient lighting, Samsung Galaxy S24 Ultra floating at an angle, premium feel, neon accents'"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-1 focus:ring-violet-400 focus:border-violet-400"
                  />

                  <button
                    onClick={generateAiBanners}
                    disabled={(!aiPrompt.trim() && !templateHeadline) || aiGenerating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 mt-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-violet-600 hover:to-purple-700 transition-all"
                  >
                    {aiGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating full ad creatives...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Ad Creatives
                      </>
                    )}
                  </button>

                  {/* Generated banner results */}
                  {aiGeneratedBanners.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600">Select a creative</span>
                        <button
                          onClick={generateAiBanners}
                          disabled={aiGenerating}
                          className="flex items-center gap-1 text-[11px] text-violet-600 hover:text-violet-700 font-medium disabled:opacity-50"
                        >
                          <RefreshCw className={cn("w-3 h-3", aiGenerating && "animate-spin")} />
                          Regenerate
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {aiGeneratedBanners.map((banner, idx) => (
                          <div
                            key={idx}
                            onClick={() => setAiSelectedIndex(idx)}
                            className={cn(
                              "rounded-lg border-2 cursor-pointer overflow-hidden transition-all",
                              aiSelectedIndex === idx
                                ? "border-violet-500 ring-2 ring-violet-200"
                                : "border-gray-200 hover:border-gray-300"
                            )}
                          >
                            <img src={banner} alt={`Creative ${idx + 1}`} className="w-full" style={{ aspectRatio: "706/320" }} />
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => { setAiGeneratedBanners([]); setAiPrompt(""); setAiSelectedIndex(0); }}
                        className="text-xs text-red-600 hover:text-red-700 mt-2"
                      >
                        Clear generated creatives
                      </button>
                    </div>
                  )}
                </div>
                )}
              </div>

              {/* Right: Template Preview */}
              <div className="col-span-7">
                <div className="bg-gray-50 rounded-xl border p-4 sticky top-28">
                  {/* Preview Toggle */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-700">Live Preview</span>
                    <div className="flex gap-1 bg-white rounded-lg p-1 border shadow-sm">
                      <button
                        onClick={() => setTemplatePreviewDevice("mobile")}
                        className={cn(
                          "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                          templatePreviewDevice === "mobile" ? "bg-primary-500 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
                        )}
                      >
                        Mobile
                      </button>
                      <button
                        onClick={() => setTemplatePreviewDevice("desktop")}
                        className={cn(
                          "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                          templatePreviewDevice === "desktop" ? "bg-primary-500 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
                        )}
                      >
                        Desktop
                      </button>
                    </div>
                  </div>

                  {/* Preview content: AI full-creative vs Manual template */}
                  <div className="space-y-4">
                    {imageSourceMode === "ai" ? (
                      /* AI Full Creative Preview */
                      aiGeneratedBanners.length > 0 ? (
                        <>
                          {/* Show selected banner at hero aspect ratio */}
                          <div>
                            <p className="text-xs text-gray-500 mb-2 font-medium">
                              {templatePreviewDevice === "mobile" ? "Mobile Hero (706×320)" : "Desktop Hero (1008×200)"}
                            </p>
                            <div className="rounded-xl overflow-hidden shadow-lg border relative">
                              <img
                                src={aiGeneratedBanners[aiSelectedIndex]}
                                alt="AI Generated Creative"
                                className="w-full"
                                style={{ aspectRatio: templatePreviewDevice === "mobile" ? "706/320" : "1008/200" }}
                              />
                              <div className="absolute top-2 right-2 text-[8px] px-1.5 py-0.5 bg-black/50 text-white rounded font-medium">Ad</div>
                              <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[9px] px-2 py-0.5 bg-violet-600/80 text-white rounded-full font-medium">
                                <Sparkles className="w-2.5 h-2.5" /> AI Generated
                              </div>
                            </div>
                          </div>

                          {/* Show slim variant */}
                          <div>
                            <p className="text-xs text-gray-500 mb-2 font-medium">
                              {templatePreviewDevice === "mobile" ? "Mobile Slim (800×200)" : "Desktop Slim (1440×200)"}
                            </p>
                            <div className="rounded-xl overflow-hidden shadow-lg border relative">
                              <img
                                src={aiGeneratedBanners[aiSelectedIndex]}
                                alt="AI Generated Creative (Slim)"
                                className="w-full object-cover"
                                style={{ aspectRatio: templatePreviewDevice === "mobile" ? "800/200" : "1440/200" }}
                              />
                              <div className="absolute top-1 right-1 text-[7px] px-1 py-0.5 bg-black/50 text-white rounded font-medium">Ad</div>
                            </div>
                          </div>

                          {/* Sizes Info */}
                          <div className="bg-violet-50 rounded-lg p-3 border border-violet-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="w-4 h-4 text-violet-500" />
                              <span className="text-sm font-medium text-violet-800">AI-generated for all sizes</span>
                            </div>
                            <p className="text-xs text-violet-600 mb-2">
                              Full ad creative with logo, headline &amp; product — auto-adapted to each banner size.
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {["Mobile Hero 706×320", "Mobile Slim 800×200", "Desktop Hero 1008×200", "Desktop Slim 1440×200"].map(size => (
                                <span key={size} className="text-xs px-2 py-1 bg-white text-violet-700 rounded border border-violet-200">
                                  {size}
                                </span>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        /* AI empty state */
                        <div className="rounded-xl border-2 border-dashed border-violet-200 bg-violet-50/50 flex flex-col items-center justify-center py-16 text-center">
                          <Sparkles className="w-10 h-10 text-violet-300 mb-3" />
                          <p className="text-sm font-medium text-violet-700 mb-1">AI Full Creative</p>
                          <p className="text-xs text-violet-500 max-w-xs">
                            Fill in your logo &amp; headline, describe your vision, then hit &ldquo;Generate Ad Creatives&rdquo; to produce full banner ads.
                          </p>
                        </div>
                      )
                    ) : (
                      /* Manual Template Preview */
                      <>
                        {templatePreviewDevice === "mobile" ? (
                          <>
                            {/* Mobile Hero Preview */}
                            <div>
                              <p className="text-xs text-gray-500 mb-2 font-medium">Mobile Hero (706×320)</p>
                              <div
                                className="rounded-xl overflow-hidden shadow-lg border relative"
                                style={{ backgroundColor: templateBackgroundColor, aspectRatio: "706/320" }}
                              >
                                <div className="w-full h-full flex items-center p-5">
                                  <div className="flex-1 flex flex-col justify-center pr-4">
                                    {templateLogo && (
                                      <img src={templateLogo} alt="Logo" className="h-8 w-auto object-contain mb-3" />
                                    )}
                                    <p className="text-base font-bold leading-tight text-gray-900">
                                      {templateHeadline || "Your headline here"}
                                    </p>
                                  </div>
                                  <div className="w-2/5 h-full flex items-center justify-center">
                                    {templateImage ? (
                                      <img src={templateImage} alt="Product" className="max-h-full max-w-full object-contain drop-shadow-lg" />
                                    ) : (
                                      <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center">
                                        <Package className="w-8 h-8 text-gray-300" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="absolute top-2 right-2 text-[8px] px-1.5 py-0.5 bg-black/50 text-white rounded font-medium">Ad</div>
                              </div>
                            </div>

                            {/* Mobile Slim Preview */}
                            <div>
                              <p className="text-xs text-gray-500 mb-2 font-medium">Mobile Slim (800×200)</p>
                              <div
                                className="rounded-xl overflow-hidden shadow-lg border relative"
                                style={{ backgroundColor: templateBackgroundColor, aspectRatio: "800/200" }}
                              >
                                <div className="w-full h-full flex items-center px-5">
                                  {templateLogo && (
                                    <img src={templateLogo} alt="Logo" className="h-6 w-auto object-contain mr-4" />
                                  )}
                                  <p className="text-sm font-bold flex-1 text-gray-900">
                                    {templateHeadline || "Your headline here"}
                                  </p>
                                  {templateImage && (
                                    <img src={templateImage} alt="Product" className="h-full py-2 object-contain drop-shadow-md" />
                                  )}
                                </div>
                                <div className="absolute top-1 right-1 text-[7px] px-1 py-0.5 bg-black/50 text-white rounded font-medium">Ad</div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Desktop Hero Preview */}
                            <div>
                              <p className="text-xs text-gray-500 mb-2 font-medium">Desktop Hero (1008×200)</p>
                              <div
                                className="rounded-xl overflow-hidden shadow-lg border relative"
                                style={{ backgroundColor: templateBackgroundColor, aspectRatio: "1008/200" }}
                              >
                                <div className="w-full h-full flex items-center px-6">
                                  <div className="flex-1 flex items-center gap-5">
                                    {templateLogo && (
                                      <img src={templateLogo} alt="Logo" className="h-10 w-auto object-contain" />
                                    )}
                                    <p className="text-xl font-bold text-gray-900">
                                      {templateHeadline || "Your headline here"}
                                    </p>
                                  </div>
                                  {templateImage && (
                                    <img src={templateImage} alt="Product" className="h-full py-3 object-contain drop-shadow-lg" />
                                  )}
                                </div>
                                <div className="absolute top-2 right-2 text-[8px] px-1.5 py-0.5 bg-black/50 text-white rounded font-medium">Ad</div>
                              </div>
                            </div>

                            {/* Desktop Slim Preview */}
                            <div>
                              <p className="text-xs text-gray-500 mb-2 font-medium">Desktop Slim (1440×200)</p>
                              <div
                                className="rounded-xl overflow-hidden shadow-lg border relative"
                                style={{ backgroundColor: templateBackgroundColor, aspectRatio: "1440/200" }}
                              >
                                <div className="w-full h-full flex items-center px-8">
                                  <div className="flex-1 flex items-center gap-6">
                                    {templateLogo && (
                                      <img src={templateLogo} alt="Logo" className="h-12 w-auto object-contain" />
                                    )}
                                    <p className="text-2xl font-bold text-gray-900">
                                      {templateHeadline || "Your headline here"}
                                    </p>
                                  </div>
                                  {templateImage && (
                                    <img src={templateImage} alt="Product" className="h-full py-4 object-contain drop-shadow-lg" />
                                  )}
                                </div>
                                <div className="absolute top-2 right-2 text-[8px] px-1.5 py-0.5 bg-black/50 text-white rounded font-medium">Ad</div>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Sizes Generated Info */}
                        <div className="bg-white rounded-lg p-3 border">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium text-gray-700">Auto-generated for all sizes</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {["Mobile Hero 706×320", "Mobile Slim 800×200", "Desktop Hero 1008×200", "Desktop Slim 1440×200"].map(size => (
                              <span key={size} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                {size}
                              </span>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-5">
              {/* Left: Creative Upload Cards - 2x2 Grid */}
              <div className="col-span-8 space-y-3">
                {/* Row 1: Hero Banners */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    SLOT_DIMENSIONS.find(d => d.type === "mobile_hero"),
                    SLOT_DIMENSIONS.find(d => d.type === "desktop_hero")
                  ].filter(Boolean).map(slotDim => slotDim ? renderUploadCard(slotDim) : null)}
                </div>

                {/* Row 2: Slim Banners */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    SLOT_DIMENSIONS.find(d => d.type === "mobile_slim"),
                    SLOT_DIMENSIONS.find(d => d.type === "desktop_slim")
                  ].filter(Boolean).map(slotDim => slotDim ? renderUploadCard(slotDim) : null)}
                </div>
              </div>

              {/* Right: Preview Panel */}
              <div className="col-span-4">
                <div className="sticky top-28">
                  <div className="border rounded-xl overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100 shadow-sm">
                    <div className="px-4 py-3 bg-white border-b flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-800">Live Preview</span>
                      {selectedPreviewCreative && (
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          selectedPreviewCreative.slotType?.includes("mobile") ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                        )}>
                          {selectedPreviewCreative.slotType?.includes("mobile") ? "Mobile" : "Desktop"}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      {selectedPreviewCreative ? (
                        <div className="space-y-3">
                          {/* Device Mockup */}
                          <div className={cn(
                            "mx-auto",
                            selectedPreviewCreative.slotType?.includes("mobile") ? "max-w-[200px]" : "max-w-full"
                          )}>
                            {selectedPreviewCreative.slotType?.includes("mobile") ? (
                              /* Mobile Mockup - Noon App Style */
                              <div className="bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl">
                                <div className="bg-white rounded-[2rem] overflow-hidden">
                                  {/* Dynamic Island */}
                                  <div className="h-6 bg-white flex items-center justify-center relative">
                                    <div className="absolute w-24 h-6 bg-gray-900 rounded-b-2xl flex items-center justify-center">
                                      <div className="w-2 h-2 rounded-full bg-gray-700" />
                                    </div>
                                  </div>
                                  {/* Noon Header Bar */}
                                  <div className="h-10 bg-yellow-400 flex items-center justify-between px-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-5 h-5 bg-white rounded flex items-center justify-center">
                                        <span className="text-[8px] font-bold text-yellow-500">☰</span>
                                      </div>
                                      <span className="text-sm font-bold text-gray-900">noon</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-5 h-5 bg-white/20 rounded" />
                                      <div className="w-5 h-5 bg-white/20 rounded" />
                                    </div>
                                  </div>
                                  {/* Search Bar */}
                                  <div className="px-2 py-1.5 bg-gray-50">
                                    <div className="h-6 bg-white rounded-full border border-gray-200 flex items-center px-2">
                                      <div className="w-3 h-3 rounded-full bg-gray-300" />
                                      <div className="w-16 h-2 bg-gray-200 rounded ml-2" />
                                    </div>
                                  </div>
                                  {/* Ad Banner with Tag */}
                                  <div className="relative px-2 py-1">
                                    <img
                                      src={selectedPreviewCreative.assetUrl || ""}
                                      alt=""
                                      className="w-full rounded-lg shadow-sm"
                                    />
                                    <span className="absolute top-2 right-3 text-[8px] px-1 py-0.5 bg-black/60 text-white rounded font-medium">Ad</span>
                                  </div>
                                  {/* Product Grid */}
                                  <div className="p-2 space-y-1.5">
                                    <div className="grid grid-cols-2 gap-1.5">
                                      <div className="h-16 bg-gray-100 rounded-lg" />
                                      <div className="h-16 bg-gray-100 rounded-lg" />
                                    </div>
                                  </div>
                                  {/* Home indicator */}
                                  <div className="h-5 flex items-center justify-center pb-1">
                                    <div className="w-1/3 h-1 bg-gray-300 rounded-full" />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              /* Desktop Mockup - Noon Website Style */
                              <div className="bg-gray-800 rounded-xl p-1 shadow-2xl">
                                <div className="bg-gray-700 rounded-t-lg h-6 flex items-center px-2 gap-1.5">
                                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                                  <div className="flex-1 mx-4">
                                    <div className="h-3.5 bg-gray-600 rounded-md flex items-center justify-center">
                                      <span className="text-[8px] text-gray-400">noon.com</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="bg-white rounded-b-lg overflow-hidden">
                                  {/* Noon Header */}
                                  <div className="h-8 bg-yellow-400 flex items-center justify-between px-3">
                                    <span className="text-sm font-bold text-gray-900">noon</span>
                                    <div className="flex-1 mx-3">
                                      <div className="h-4 bg-white rounded-full" />
                                    </div>
                                    <div className="flex gap-2">
                                      <div className="w-4 h-4 bg-white/30 rounded" />
                                      <div className="w-4 h-4 bg-white/30 rounded" />
                                    </div>
                                  </div>
                                  {/* Ad Banner with Tag */}
                                  <div className="relative">
                                    <img
                                      src={selectedPreviewCreative.assetUrl || ""}
                                      alt=""
                                      className="w-full"
                                    />
                                    <span className="absolute top-1 right-1 text-[8px] px-1 py-0.5 bg-black/60 text-white rounded font-medium">Ad</span>
                                  </div>
                                  <div className="p-2 space-y-1.5">
                                    <div className="h-2 bg-gray-200 rounded-full w-3/4" />
                                    <div className="h-2 bg-gray-200 rounded-full w-1/2" />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Creative Info */}
                          <div className="text-center pt-2 border-t">
                            <p className="text-sm font-medium text-gray-800">
                              {SLOT_DIMENSIONS.find(d => d.type === selectedPreviewCreative.slotType)?.label}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {selectedPreviewCreative.language === "en" ? "English" : "العربية"} • {selectedPreviewCreative.dimensions}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="h-56 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-3">
                              <Image className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-600">No preview selected</p>
                            <p className="text-xs text-gray-400 mt-1">Click a creative to see it here</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
});
