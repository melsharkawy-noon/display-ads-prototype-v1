"use client";

import { useState } from "react";
import { useCampaign } from "@/context/CampaignContext";
import { WizardLayout } from "@/components/layout/WizardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Toggle } from "@/components/ui/Toggle";
import { cn, formatNumber } from "@/lib/utils";
import { TargetingSegment, TargetingRule } from "@/lib/types";
import {
  targetingActions,
  targetingFilters,
  lookbackOptions,
  categories,
  brands,
} from "@/lib/mock-data";
import { Plus, Trash2, Users, Target, Clock, ChevronDown, ChevronUp } from "lucide-react";

interface StepServingControlsProps {
  onBack: () => void;
  onNext: () => void;
}

export function StepServingControls({ onBack, onNext }: StepServingControlsProps) {
  const { draft, updateDraft, markStepComplete } = useCampaign();
  const [activeTab, setActiveTab] = useState<"targeting" | "frequency">("targeting");
  const [expandedSegments, setExpandedSegments] = useState<string[]>(["segment-1"]);

  // Initialize with default segment if empty
  const segments: TargetingSegment[] = draft.segments.length > 0
    ? draft.segments
    : [
        {
          id: "segment-1",
          operator: "AND",
          rules: [],
        },
      ];

  const updateSegments = (newSegments: TargetingSegment[]) => {
    updateDraft({ segments: newSegments });
  };

  const addSegment = () => {
    const newId = `segment-${Date.now()}`;
    const newSegment: TargetingSegment = {
      id: newId,
      operator: "AND",
      rules: [],
    };
    updateSegments([...segments, newSegment]);
    setExpandedSegments([...expandedSegments, newId]);
  };

  const removeSegment = (segmentId: string) => {
    updateSegments(segments.filter((s) => s.id !== segmentId));
    setExpandedSegments(expandedSegments.filter(id => id !== segmentId));
  };

  const toggleSegmentExpanded = (segmentId: string) => {
    setExpandedSegments(prev => 
      prev.includes(segmentId) 
        ? prev.filter(id => id !== segmentId)
        : [...prev, segmentId]
    );
  };

  const toggleSegmentOperator = (segmentId: string) => {
    updateSegments(
      segments.map((s) =>
        s.id === segmentId
          ? { ...s, operator: s.operator === "AND" ? "OR" : "AND" }
          : s
      )
    );
  };

  const addRule = (segmentId: string, type: "reengagement" | "demographic") => {
    const newRule: TargetingRule = {
      id: `rule-${Date.now()}`,
      type,
      intent: "include",
      action: type === "reengagement" ? "product_page_view" : "credit_card",
      filterType: type === "reengagement" ? "category" : "credit_card",
      filterValue: "",
      lookbackDays: type === "reengagement" ? 30 : undefined,
    };
    updateSegments(
      segments.map((s) =>
        s.id === segmentId ? { ...s, rules: [...s.rules, newRule] } : s
      )
    );
    // Expand segment when adding rule
    if (!expandedSegments.includes(segmentId)) {
      setExpandedSegments([...expandedSegments, segmentId]);
    }
  };

  const updateRule = (segmentId: string, ruleId: string, updates: Partial<TargetingRule>) => {
    updateSegments(
      segments.map((s) =>
        s.id === segmentId
          ? {
              ...s,
              rules: s.rules.map((r) =>
                r.id === ruleId ? { ...r, ...updates } : r
              ),
            }
          : s
      )
    );
  };

  const removeRule = (segmentId: string, ruleId: string) => {
    updateSegments(
      segments.map((s) =>
        s.id === segmentId
          ? { ...s, rules: s.rules.filter((r) => r.id !== ruleId) }
          : s
      )
    );
  };

  const getFilterOptions = (rule: TargetingRule) => {
    if (rule.type === "reengagement") {
      if (rule.filterType === "category") {
        return categories.map((c) => ({ value: c.id, label: c.name }));
      }
      if (rule.filterType === "brand") {
        return brands.map((b) => ({ value: b.id, label: b.name }));
      }
    }
    if (rule.type === "demographic") {
      const filters = targetingFilters.demographic[rule.action as keyof typeof targetingFilters.demographic];
      if (filters) {
        return filters.map((f) => ({ value: f.id, label: f.name }));
      }
    }
    return [];
  };

  // Calculate estimated views based on reach and targeting
  const totalRules = segments.reduce((sum, s) => sum + s.rules.length, 0);
  
  // Targeting reduction factor
  const targetingFactor = totalRules === 0 
    ? 1.0 
    : totalRules <= 2 
    ? 0.6
    : totalRules <= 4
    ? 0.3
    : 0.1;

  // Frequency cap reduction factor
  const frequencyFactor = draft.frequencyCapEnabled 
    ? Math.min(1, draft.maxViews / 5) // Assume avg user sees ad 5 times without cap
    : 1.0;

  const estimatedViews = Math.round(draft.estimatedTotalReach * targetingFactor * frequencyFactor);
  const reachLevel = totalRules === 0 ? "broad" : totalRules <= 2 ? "balanced" : "narrow";

  const handleNext = () => {
    markStepComplete(6);
    onNext();
  };

  return (
    <WizardLayout
      title="Display - Create Campaign (Managed)"
      subtitle="Control who sees your ads and how often"
      onBack={onBack}
      onNext={handleNext}
      onSave={() => console.log("Save draft")}
    >
      <div className="grid grid-cols-3 gap-6">
        {/* Main content - 2 columns */}
        <div className="col-span-2 space-y-4">
          {/* Tab Navigation */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setActiveTab("targeting")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all",
                activeTab === "targeting"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Target className="w-4 h-4" />
              Audience Targeting
            </button>
            <button
              onClick={() => setActiveTab("frequency")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all",
                activeTab === "frequency"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Clock className="w-4 h-4" />
              Frequency Capping
            </button>
          </div>

          {/* Targeting Tab */}
          {activeTab === "targeting" && (
            <div className="space-y-4">
              {/* Global Segment Operator */}
              {segments.length > 1 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700">Combine segments using:</span>
                      <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
                        <button
                          onClick={() => updateDraft({ segmentOperator: "AND" })}
                          className={cn(
                            "px-4 py-1.5 text-sm font-medium transition-colors",
                            draft.segmentOperator === "AND"
                              ? "bg-primary-600 text-white"
                              : "bg-white text-gray-600 hover:bg-gray-50"
                          )}
                        >
                          AND
                        </button>
                        <button
                          onClick={() => updateDraft({ segmentOperator: "OR" })}
                          className={cn(
                            "px-4 py-1.5 text-sm font-medium transition-colors",
                            draft.segmentOperator === "OR"
                              ? "bg-primary-600 text-white"
                              : "bg-white text-gray-600 hover:bg-gray-50"
                          )}
                        >
                          OR
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Segments */}
              {segments.map((segment, segmentIndex) => {
                const isExpanded = expandedSegments.includes(segment.id);
                return (
                  <div key={segment.id}>
                    {/* Segment connector */}
                    {segmentIndex > 0 && (
                      <div className="flex justify-center py-2">
                        <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-bold rounded-full">
                          {draft.segmentOperator}
                        </span>
                      </div>
                    )}

                    <Card className={cn("overflow-hidden", isExpanded && "ring-1 ring-primary-200")}>
                      {/* Segment Header - Always Visible */}
                      <div 
                        className="flex items-center justify-between p-4 bg-gray-50 border-b cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => toggleSegmentExpanded(segment.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                            segment.rules.length > 0 ? "bg-primary-100 text-primary-700" : "bg-gray-200 text-gray-500"
                          )}>
                            {segmentIndex + 1}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              Segment {segmentIndex + 1}
                            </div>
                            <div className="text-xs text-gray-500">
                              {segment.rules.length === 0 
                                ? "No rules (all users)" 
                                : `${segment.rules.length} rule${segment.rules.length > 1 ? "s" : ""} • ${segment.operator} logic`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {segments.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSegment(segment.id);
                              }}
                              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded"
                            >
                              Remove
                            </button>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Segment Content - Collapsible */}
                      {isExpanded && (
                        <CardContent className="p-4">
                          {/* Segment Operator */}
                          {segment.rules.length > 1 && (
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                              <span className="text-sm text-gray-600">Match rules using:</span>
                              <div className="inline-flex rounded-md border border-gray-200 overflow-hidden">
                                <button
                                  onClick={() => toggleSegmentOperator(segment.id)}
                                  className={cn(
                                    "px-3 py-1 text-xs font-medium transition-colors",
                                    segment.operator === "AND"
                                      ? "bg-primary-600 text-white"
                                      : "bg-white text-gray-600"
                                  )}
                                >
                                  ALL (AND)
                                </button>
                                <button
                                  onClick={() => toggleSegmentOperator(segment.id)}
                                  className={cn(
                                    "px-3 py-1 text-xs font-medium transition-colors",
                                    segment.operator === "OR"
                                      ? "bg-primary-600 text-white"
                                      : "bg-white text-gray-600"
                                  )}
                                >
                                  ANY (OR)
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Rules */}
                          <div className="space-y-3">
                            {segment.rules.length === 0 && (
                              <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                                No rules added yet. Add a rule to define your audience.
                              </div>
                            )}

                            {segment.rules.map((rule, ruleIndex) => (
                              <div key={rule.id} className="relative">
                                {/* Rule connector */}
                                {ruleIndex > 0 && (
                                  <div className="absolute -top-2 left-6 px-2 py-0.5 bg-white border border-primary-200 text-primary-600 text-xs font-medium rounded z-10">
                                    {segment.operator}
                                  </div>
                                )}

                                {/* Rule Card */}
                                <div className={cn(
                                  "bg-white border rounded-lg p-4 hover:border-primary-200 transition-colors",
                                  ruleIndex > 0 && "mt-4"
                                )}>
                                  <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                      <span className={cn(
                                        "px-2 py-0.5 rounded text-xs font-medium",
                                        rule.type === "reengagement" 
                                          ? "bg-blue-100 text-blue-700" 
                                          : "bg-purple-100 text-purple-700"
                                      )}>
                                        {rule.type === "reengagement" ? "Behavior" : "Demographic"}
                                      </span>
                                      <span className={cn(
                                        "px-2 py-0.5 rounded text-xs font-medium",
                                        rule.intent === "include" 
                                          ? "bg-green-100 text-green-700" 
                                          : "bg-red-100 text-red-700"
                                      )}>
                                        {rule.intent === "include" ? "Include" : "Exclude"}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => removeRule(segment.id, rule.id)}
                                      className="p-1 hover:bg-red-50 hover:text-red-600 rounded text-gray-400 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                  
                                  <div className="space-y-3">
                                    {/* Type & Intent Row */}
                                    <div className="grid grid-cols-2 gap-3">
                                      <Select
                                        label="Rule Type"
                                        value={rule.type}
                                        onChange={(e) =>
                                          updateRule(segment.id, rule.id, {
                                            type: e.target.value as "reengagement" | "demographic",
                                            action: e.target.value === "reengagement" ? "product_page_view" : "credit_card",
                                            filterType: e.target.value === "reengagement" ? "category" : "credit_card",
                                          })
                                        }
                                        options={[
                                          { value: "reengagement", label: "Behavioral / Reengagement" },
                                          { value: "demographic", label: "Demographic" },
                                        ]}
                                      />
                                      <Select
                                        label="Intent"
                                        value={rule.intent}
                                        onChange={(e) =>
                                          updateRule(segment.id, rule.id, {
                                            intent: e.target.value as "include" | "exclude",
                                          })
                                        }
                                        options={[
                                          { value: "include", label: "Include (target users who...)" },
                                          { value: "exclude", label: "Exclude (don't target users who...)" },
                                        ]}
                                      />
                                    </div>

                                    {/* Action Row */}
                                    <Select
                                      label="Action / Attribute"
                                      value={rule.action}
                                      onChange={(e) =>
                                        updateRule(segment.id, rule.id, { action: e.target.value })
                                      }
                                      options={
                                        rule.type === "reengagement"
                                          ? targetingActions.reengagement.map((a) => ({
                                              value: a.id,
                                              label: a.name,
                                            }))
                                          : targetingActions.demographic.map((a) => ({
                                              value: a.id,
                                              label: a.name,
                                            }))
                                      }
                                    />

                                    {/* Filter Row */}
                                    <div className="grid grid-cols-2 gap-3">
                                      {rule.type === "reengagement" && (
                                        <Select
                                          label="Filter By"
                                          value={rule.filterType}
                                          onChange={(e) =>
                                            updateRule(segment.id, rule.id, {
                                              filterType: e.target.value,
                                              filterValue: "",
                                            })
                                          }
                                          options={[
                                            { value: "category", label: "Category" },
                                            { value: "brand", label: "Brand" },
                                          ]}
                                        />
                                      )}
                                      <Select
                                        label={rule.type === "reengagement" ? "Value" : "Has"}
                                        value={rule.filterValue}
                                        onChange={(e) =>
                                          updateRule(segment.id, rule.id, { filterValue: e.target.value })
                                        }
                                        options={getFilterOptions(rule)}
                                        placeholder="Select value..."
                                        className={rule.type === "demographic" ? "col-span-2" : ""}
                                      />
                                    </div>

                                    {/* Lookback (Reengagement only) */}
                                    {rule.type === "reengagement" && (
                                      <Select
                                        label="Lookback Period"
                                        value={String(rule.lookbackDays || 30)}
                                        onChange={(e) =>
                                          updateRule(segment.id, rule.id, {
                                            lookbackDays: parseInt(e.target.value),
                                          })
                                        }
                                        options={lookbackOptions.map((o) => ({
                                          value: String(o.value),
                                          label: o.label,
                                        }))}
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}

                            {/* Add Rule Buttons */}
                            <div className="flex gap-2 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addRule(segment.id, "reengagement")}
                                className="flex-1"
                              >
                                <Plus className="w-3.5 h-3.5 mr-1" />
                                Add Behavioral Rule
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addRule(segment.id, "demographic")}
                                className="flex-1"
                              >
                                <Plus className="w-3.5 h-3.5 mr-1" />
                                Add Demographic Rule
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  </div>
                );
              })}

              {/* Add Segment Button */}
              <Button variant="secondary" onClick={addSegment} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add New Segment
              </Button>
            </div>
          )}

          {/* Frequency Tab */}
          {activeTab === "frequency" && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Frequency Capping</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Limit how often users see your ads to avoid ad fatigue
                    </p>
                  </div>
                  <Toggle
                    checked={draft.frequencyCapEnabled}
                    onChange={(checked) => updateDraft({ frequencyCapEnabled: checked })}
                    label=""
                  />
                </div>

                {draft.frequencyCapEnabled && (
                  <div className="space-y-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Maximum impressions
                          </label>
                          <Input
                            type="number"
                            value={draft.maxViews}
                            onChange={(e) => updateDraft({ maxViews: parseInt(e.target.value) || 1 })}
                            min={1}
                            max={100}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Time period
                          </label>
                          <Select
                            value={draft.frequencyPeriod}
                            onChange={(e) => updateDraft({ frequencyPeriod: e.target.value })}
                            options={[
                              { value: "hour", label: "Per Hour" },
                              { value: "daily", label: "Per Day" },
                              { value: "weekly", label: "Per Week" },
                              { value: "campaign", label: "Per Campaign" },
                            ]}
                          />
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mt-4">
                        Each user will see your ad a maximum of{" "}
                        <strong>{draft.maxViews} time{draft.maxViews > 1 ? "s" : ""}</strong>
                        {draft.frequencyPeriod === "hour" && " per hour"}
                        {draft.frequencyPeriod === "daily" && " per day"}
                        {draft.frequencyPeriod === "weekly" && " per week"}
                        {draft.frequencyPeriod === "campaign" && " during the campaign"}
                        .
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">Common presets</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { views: 3, period: "daily", label: "Standard" },
                          { views: 1, period: "daily", label: "Conservative" },
                          { views: 5, period: "weekly", label: "Awareness" },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            onClick={() => updateDraft({ 
                              maxViews: preset.views, 
                              frequencyPeriod: preset.period 
                            })}
                            className={cn(
                              "p-3 border rounded-lg text-left hover:border-primary-300 transition-colors",
                              draft.maxViews === preset.views && draft.frequencyPeriod === preset.period
                                ? "border-primary-500 bg-primary-50"
                                : "border-gray-200"
                            )}
                          >
                            <div className="font-medium text-gray-900 text-sm">{preset.label}</div>
                            <div className="text-xs text-gray-500">
                              {preset.views}x / {preset.period}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {!draft.frequencyCapEnabled && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="text-sm text-amber-800">
                      <strong>No frequency cap.</strong> Users may see your ad multiple times per session.
                      Enable capping to prevent ad fatigue and optimize spend.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right sidebar - Reach Preview */}
        <div className="space-y-4">
          {/* Estimated Views Card */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Estimated Performance</h3>

              {/* Total Available Reach */}
              <div className="p-3 bg-gray-50 rounded-lg mb-4">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Total available reach
                </div>
                <div className="text-lg font-bold text-gray-700">
                  {formatNumber(draft.estimatedTotalReach)}
                </div>
                <div className="text-xs text-gray-500">
                  impressions from slots & dates
                </div>
              </div>

              {/* Estimated Views after controls */}
              <div className="p-4 bg-primary-50 rounded-lg mb-4">
                <div className="text-xs text-primary-600 uppercase tracking-wide mb-1">
                  Expected impressions
                </div>
                <div className="text-2xl font-bold text-primary-700">
                  {formatNumber(estimatedViews)}
                </div>
                <div className="text-xs text-primary-600">
                  after serving controls
                </div>
              </div>

              {/* Factors affecting reach */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Targeting impact</span>
                  <span className={cn(
                    "font-medium",
                    targetingFactor === 1 ? "text-gray-500" : targetingFactor >= 0.5 ? "text-green-600" : "text-amber-600"
                  )}>
                    {targetingFactor === 1 ? "None" : `-${Math.round((1 - targetingFactor) * 100)}%`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Frequency cap impact</span>
                  <span className={cn(
                    "font-medium",
                    frequencyFactor === 1 ? "text-gray-500" : frequencyFactor >= 0.5 ? "text-green-600" : "text-amber-600"
                  )}>
                    {frequencyFactor === 1 ? "None" : `-${Math.round((1 - frequencyFactor) * 100)}%`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audience Reach Indicator */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-gray-500" />
                <h3 className="font-semibold text-gray-900">Audience Reach</h3>
              </div>

              {/* Reach Indicator */}
              <div className="mb-3">
                <div className="flex items-center gap-1 mb-2">
                  {["narrow", "balanced", "broad"].map((level) => (
                    <div
                      key={level}
                      className={cn(
                        "flex-1 h-2.5 rounded-full transition-colors",
                        level === "narrow" && (reachLevel === "narrow" || reachLevel === "balanced" || reachLevel === "broad") && "bg-amber-400",
                        level === "balanced" && (reachLevel === "balanced" || reachLevel === "broad") && "bg-green-400",
                        level === "broad" && reachLevel === "broad" && "bg-blue-400",
                        (reachLevel === "narrow" && level !== "narrow") && "bg-gray-200",
                        (reachLevel === "balanced" && level === "broad") && "bg-gray-200"
                      )}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Narrow</span>
                  <span>Balanced</span>
                  <span>Broad</span>
                </div>
              </div>

              <div className={cn(
                "text-center py-2 px-3 rounded-lg text-sm font-medium",
                reachLevel === "narrow" && "bg-amber-50 text-amber-700",
                reachLevel === "balanced" && "bg-green-50 text-green-700",
                reachLevel === "broad" && "bg-blue-50 text-blue-700"
              )}>
                {reachLevel === "narrow" && "Highly targeted audience"}
                {reachLevel === "balanced" && "Well-balanced targeting"}
                {reachLevel === "broad" && "Broad reach (all users)"}
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Controls Summary</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Segments</span>
                  <span className="font-medium">{segments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Targeting rules</span>
                  <span className="font-medium">{totalRules}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Frequency cap</span>
                  <span className="font-medium">
                    {draft.frequencyCapEnabled 
                      ? `${draft.maxViews}x / ${draft.frequencyPeriod}`
                      : "Disabled"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </WizardLayout>
  );
}
