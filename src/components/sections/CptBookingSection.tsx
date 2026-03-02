"use client";

import { memo, useState, useEffect, useMemo } from "react";
import { useCampaign } from "@/context/CampaignContext";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { cn, formatNumber, formatCurrency } from "@/lib/utils";
import {
  Calendar,
  Clock,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  Info,
  X,
} from "lucide-react";
import { slots, bookedTimeSlots, pages } from "@/lib/mock-data";
import { countries } from "@/lib/mock-data";

// Helper function to generate calendar days for a given month
const getCalendarDays = (month: Date): (Date | null)[] => {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const days: (Date | null)[] = [];
  
  // Pad start with nulls for days before the 1st
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push(null);
  }
  
  // Fill in the actual days of the month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(month.getFullYear(), month.getMonth(), d));
  }
  
  // Pad end to complete the grid (optional, for consistent 6-row layout)
  while (days.length % 7 !== 0) {
    days.push(null);
  }
  
  return days;
};

// Hours available for booking (12 AM to 12 AM = 24 hours, midnight to midnight)
const BOOKING_HOURS = Array.from({ length: 24 }, (_, i) => {
  return {
    value: i,
    label: `${i.toString().padStart(2, "0")}:00`,
    display: i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`,
  };
});

interface CptBookingSectionProps {
  sectionRef: (el: HTMLElement | null) => void;
  selectedSlots: typeof slots;
  slotsReserved: boolean;
  onSlotsReservedChange: (reserved: boolean) => void;
}

export const CptBookingSection = memo(function CptBookingSection({
  sectionRef,
  selectedSlots,
  slotsReserved,
  onSlotsReservedChange,
}: CptBookingSectionProps) {
  const { draft, updateDraft } = useCampaign();

  // Today's date (normalized to midnight for comparisons)
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Get selected country data
  const selectedCountry = countries.find(c => c.code === draft.country);

  // CPT Calendar state
  const [cptCalendarMonth, setCptCalendarMonth] = useState(new Date());
  const [selectedCptHours, setSelectedCptHours] = useState<Record<string, number[]>>({}); // { "2026-02-14": [9, 10, 11], ... }
  const [expandedCptDay, setExpandedCptDay] = useState<string | null>(null); // Date string for expanded hour view
  const [cptBookingMode, setCptBookingMode] = useState<"daily" | "hourly">("daily"); // Daily (9AM-9AM) or hourly booking
  const [cptStartDate, setCptStartDate] = useState<Date | null>(null);
  const [cptEndDate, setCptEndDate] = useState<Date | null>(null);
  const [showCptStartPicker, setShowCptStartPicker] = useState(false);
  const [showCptEndPicker, setShowCptEndPicker] = useState(false);

  // State for expanding CPT booking conflicts
  const [showAllCptConflicts, setShowAllCptConflicts] = useState(false);

  // Check if date/time is booked
  const isTimeSlotBooked = (slotId: string, date: string, startTime: string, endTime: string) => {
    const bookings = bookedTimeSlots[slotId]?.[date];
    if (!bookings) return false;
    // Simplified check - in real app would do proper time overlap check
    return bookings.length > 0;
  };

  // Calculate CPT total hours and cost
  const cptTotalHours = useMemo(() => {
    return Object.values(selectedCptHours).reduce((sum, hours) => sum + hours.length, 0);
  }, [selectedCptHours]);

  const cptTotalCost = useMemo(() => {
    if (draft.pricingModel !== "cpt" || selectedSlots.length === 0) return 0;
    return cptTotalHours * selectedSlots[0].cptRateUsd;
  }, [draft.pricingModel, selectedSlots, cptTotalHours]);

  // Update draft dates based on CPT selection
  useEffect(() => {
    if (draft.pricingModel === "cpt" && Object.keys(selectedCptHours).length > 0) {
      const dates = Object.keys(selectedCptHours).sort();
      const firstDate = dates[0];
      const lastDate = dates[dates.length - 1];
      const firstHour = Math.min(...selectedCptHours[firstDate]);
      const lastHour = Math.max(...selectedCptHours[lastDate]);
      
      updateDraft({
        startDate: new Date(firstDate),
        startTime: `${firstHour.toString().padStart(2, "0")}:00`,
        endDate: new Date(lastDate),
        endTime: `${((lastHour + 1) % 24).toString().padStart(2, "0")}:00`,
        budget: cptTotalCost,
      });
    }
  }, [selectedCptHours, cptTotalCost, draft.pricingModel]);

  // Sync selectedCptHours when in daily booking mode (all 24 hours for each day in range)
  useEffect(() => {
    if (cptBookingMode !== "daily" || !cptStartDate || !cptEndDate) return;

    const newHoursSelection: Record<string, number[]> = {};
    const checkDate = new Date(cptStartDate);
    while (checkDate <= cptEndDate) {
      const dateStr = checkDate.toISOString().split("T")[0];
      newHoursSelection[dateStr] = Array.from({ length: 24 }, (_, i) => i);
      checkDate.setDate(checkDate.getDate() + 1);
    }

    if (JSON.stringify(newHoursSelection) !== JSON.stringify(selectedCptHours)) {
      setSelectedCptHours(newHoursSelection);
    }
  }, [cptBookingMode, cptStartDate, cptEndDate]);

  return (
    <section 
      ref={sectionRef}
      id="cpt-calendar" 
      className="scroll-mt-36"
    >
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold text-gray-900">Campaign Details</h2>
            {slotsReserved && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 border border-green-300 rounded-full">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-green-700">Slots Reserved</span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-6">Set your campaign name and book time slots</p>
          
          {/* Campaign Name */}
          <div className="mb-6">
            <Input
              label="Campaign Name"
              placeholder="e.g., Summer Sale 2026"
              value={draft.campaignName}
              onChange={(e) => updateDraft({ campaignName: e.target.value })}
              required
            />
          </div>

          {/* Slot Info Header */}
          <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Booking Slot</h3>
              <p className="text-xs text-gray-500">
                {pages.find(p => p.id === selectedSlots[0]?.pageId)?.name} → {selectedSlots[0]?.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right border-r pr-3">
                <div className="text-lg font-bold text-gray-900">${selectedSlots[0]?.cptRateUsd}</div>
                <div className="text-xs text-gray-500">per hour</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-primary-600">${formatNumber(selectedSlots[0]?.cptRateUsd * 24)}</div>
                <div className="text-xs text-gray-500">per day (9AM-9AM)</div>
              </div>
            </div>
          </div>

          {/* Booking Mode Toggle */}
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => {
                setCptBookingMode("daily");
                setSelectedCptHours({});
                setExpandedCptDay(null);
              }}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                cptBookingMode === "daily"
                  ? "bg-primary-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              <Clock className="w-4 h-4 inline mr-1.5" />
              Daily Booking
            </button>
            <button
              onClick={() => {
                setCptBookingMode("hourly");
                setCptStartDate(null);
                setCptEndDate(null);
              }}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                cptBookingMode === "hourly"
                  ? "bg-primary-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              <Calendar className="w-4 h-4 inline mr-1.5" />
              Hourly Booking
            </button>
            <span className="text-xs text-gray-500 ml-2">
              {cptBookingMode === "daily" ? "Book full days (9 AM - 9 AM next day)" : "Select specific hours"}
            </span>
          </div>

          {/* Daily Booking Mode */}
          {cptBookingMode === "daily" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date (9 AM)</label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={cptStartDate ? cptStartDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : ""}
                      placeholder="Select start date"
                      onClick={() => setShowCptStartPicker(!showCptStartPicker)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm cursor-pointer focus:ring-2 focus:ring-primary-500"
                    />
                    <Calendar 
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer" 
                      onClick={() => setShowCptStartPicker(!showCptStartPicker)}
                    />
                    {showCptStartPicker && (
                      <div className="absolute bottom-full left-0 mb-1 bg-white border rounded-lg shadow-lg p-4 z-50 w-72">
                        <div className="flex items-center justify-between mb-3">
                          <button onClick={() => setCptCalendarMonth(new Date(cptCalendarMonth.getFullYear(), cptCalendarMonth.getMonth() - 1))} className="p-1 hover:bg-gray-100 rounded">
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="font-medium text-sm">
                            {cptCalendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                          </span>
                          <button onClick={() => setCptCalendarMonth(new Date(cptCalendarMonth.getFullYear(), cptCalendarMonth.getMonth() + 1))} className="p-1 hover:bg-gray-100 rounded">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                            <div key={d} className="text-gray-500 font-medium py-1">{d}</div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {getCalendarDays(cptCalendarMonth).map((date, idx) => {
                            if (!date) return <div key={idx} className="p-2" />;
                            const isPast = date < today;
                            const isSelected = cptStartDate?.toDateString() === date.toDateString();
                            // Check if fully booked
                            const dateStr = date.toISOString().split("T")[0];
                            const slotBookings = bookedTimeSlots[selectedSlots[0]?.id] || {};
                            const dayBookings = slotBookings[dateStr] || [];
                            const isFullyBooked = dayBookings.length === 24;
                            
                            return (
                              <button
                                key={idx}
                                disabled={isPast || isFullyBooked}
                                onClick={() => {
                                  setCptStartDate(date);
                                  if (cptEndDate && date > cptEndDate) {
                                    setCptEndDate(null);
                                  }
                                  setShowCptStartPicker(false);
                                }}
                                className={cn(
                                  "p-2 text-xs rounded transition-colors",
                                  isPast && "text-gray-300 cursor-not-allowed",
                                  isFullyBooked && "bg-red-50 text-red-300 cursor-not-allowed",
                                  isSelected && "bg-primary-500 text-white",
                                  !isPast && !isFullyBooked && !isSelected && "hover:bg-gray-100"
                                )}
                              >
                                {date.getDate()}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date (9 AM)</label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={cptEndDate ? cptEndDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : ""}
                      placeholder="Select end date"
                      onClick={() => cptStartDate && setShowCptEndPicker(!showCptEndPicker)}
                      className={cn(
                        "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500",
                        !cptStartDate ? "bg-gray-50 cursor-not-allowed" : "cursor-pointer"
                      )}
                      disabled={!cptStartDate}
                    />
                    <Calendar 
                      className={cn(
                        "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4",
                        !cptStartDate ? "text-gray-300" : "text-gray-400 cursor-pointer"
                      )}
                      onClick={() => cptStartDate && setShowCptEndPicker(!showCptEndPicker)}
                    />
                    {showCptEndPicker && cptStartDate && (
                      <div className="absolute bottom-full left-0 mb-1 bg-white border rounded-lg shadow-lg p-4 z-50 w-72">
                        <div className="flex items-center justify-between mb-3">
                          <button onClick={() => setCptCalendarMonth(new Date(cptCalendarMonth.getFullYear(), cptCalendarMonth.getMonth() - 1))} className="p-1 hover:bg-gray-100 rounded">
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="font-medium text-sm">
                            {cptCalendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                          </span>
                          <button onClick={() => setCptCalendarMonth(new Date(cptCalendarMonth.getFullYear(), cptCalendarMonth.getMonth() + 1))} className="p-1 hover:bg-gray-100 rounded">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                            <div key={d} className="text-gray-500 font-medium py-1">{d}</div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {getCalendarDays(cptCalendarMonth).map((date, idx) => {
                            if (!date) return <div key={idx} className="p-2" />;
                            const isPast = date < cptStartDate;
                            const isSelected = cptEndDate?.toDateString() === date.toDateString();
                            const isStartDate = cptStartDate?.toDateString() === date.toDateString();
                            
                            return (
                              <button
                                key={idx}
                                disabled={isPast}
                                onClick={() => {
                                  setCptEndDate(date);
                                  setShowCptEndPicker(false);
                                }}
                                className={cn(
                                  "p-2 text-xs rounded transition-colors",
                                  isPast && "text-gray-300 cursor-not-allowed",
                                  isSelected && "bg-primary-500 text-white",
                                  isStartDate && !isSelected && "bg-green-100 text-green-700 ring-1 ring-green-300",
                                  !isPast && !isSelected && !isStartDate && "hover:bg-gray-100"
                                )}
                              >
                                {date.getDate()}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  {!cptStartDate && <p className="text-xs text-gray-400 mt-1">Select start date first</p>}
                </div>
              </div>

              {/* Conflict Detection */}
              {cptStartDate && cptEndDate && (() => {
                // Check for conflicts in the date range
                const conflicts: { date: string; hours: number }[] = [];
                const slotBookings = bookedTimeSlots[selectedSlots[0]?.id] || {};
                
                let checkDate = new Date(cptStartDate);
                while (checkDate <= cptEndDate) {
                  const dateStr = checkDate.toISOString().split("T")[0];
                  const dayBookings = slotBookings[dateStr] || [];
                  if (dayBookings.length > 0) {
                    conflicts.push({ date: dateStr, hours: dayBookings.length });
                  }
                  checkDate.setDate(checkDate.getDate() + 1);
                }
                
                const totalDays = Math.ceil((cptEndDate.getTime() - cptStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                const hasConflicts = conflicts.length > 0;
                
                return (
                  <div className={cn(
                    "p-4 rounded-lg border",
                    hasConflicts ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"
                  )}>
                    {hasConflicts ? (
                      <>
                        <div className="flex items-start gap-2 mb-3">
                          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-amber-800">Booking Conflicts Detected</p>
                            <p className="text-sm text-amber-600 mt-0.5">
                              {conflicts.length} of {totalDays} days have existing bookings
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1.5 ml-7">
                          {conflicts.slice(0, 5).map(c => (
                            <div key={c.date} className="flex items-center justify-between text-sm">
                              <span className="text-amber-700">
                                {new Date(c.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                              </span>
                              <span className="text-amber-600 font-medium">
                                {c.hours === 24 ? "Fully booked" : `${c.hours} hours booked`}
                              </span>
                            </div>
                          ))}
                          {conflicts.length > 5 && (
                            <p className="text-xs text-amber-600">+{conflicts.length - 5} more days with conflicts</p>
                          )}
                        </div>
                        <p className="text-xs text-amber-600 mt-3 ml-7">
                          Consider using Hourly Booking mode to book around existing reservations.
                        </p>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-800">All {totalDays} Days Available</p>
                          <p className="text-sm text-green-600">No conflicts found in selected date range</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Daily Booking Summary */}
              {cptStartDate && cptEndDate && (() => {
                const totalDays = Math.ceil((cptEndDate.getTime() - cptStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                const totalHours = totalDays * 24;
                const totalCost = totalHours * (selectedSlots[0]?.cptRateUsd || 0);
                const estViews = totalDays * (selectedSlots[0]?.viewsPerDay || 50000);
                
                return (
                  <div className="p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-primary-600 font-medium">Total Booking</div>
                        <div className="text-lg font-bold text-primary-900">
                          {totalDays} day{totalDays !== 1 ? "s" : ""} ({totalHours} hours)
                        </div>
                        <div className="text-xs text-primary-600 mt-1">
                          {cptStartDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} 9AM → {cptEndDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} 9AM
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-primary-500 mb-0.5">
                          {totalDays} days × ${selectedSlots[0]?.cptRateUsd * 24}/day
                        </div>
                        <div className="text-2xl font-bold text-primary-900">{formatCurrency(totalCost)}</div>
                        <div className="text-xs text-primary-600">Est. {formatNumber(estViews)} views</div>
                      </div>
                    </div>
                    {/* Reserve slots button */}
                    {!slotsReserved && (
                      <div className="mt-4 pt-4 border-t border-primary-200">
                        <button
                          onClick={() => onSlotsReservedChange(true)}
                          className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Reserve These Slots
                        </button>
                        <p className="text-[10px] text-primary-600 text-center mt-1.5">Hold your booking while you complete landing page & creatives</p>
                      </div>
                    )}
                    {slotsReserved && (
                      <div className="mt-4 pt-4 border-t border-primary-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-700 font-medium">Slots reserved</span>
                        </div>
                        <button
                          onClick={() => onSlotsReservedChange(false)}
                          className="text-xs text-red-600 hover:text-red-700 hover:underline"
                        >
                          Release slots
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Hourly Booking Mode */}
          {cptBookingMode === "hourly" && (
            <div className="grid grid-cols-2 gap-6">
              {/* Left: Calendar (Day Selection) */}
              <div>
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setCptCalendarMonth(new Date(cptCalendarMonth.getFullYear(), cptCalendarMonth.getMonth() - 1))}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </button>
                  <span className="text-sm font-semibold">
                    {cptCalendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </span>
                  <button
                    onClick={() => setCptCalendarMonth(new Date(cptCalendarMonth.getFullYear(), cptCalendarMonth.getMonth() + 1))}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Calendar Grid */}
                <div className="border rounded-lg overflow-hidden">
                  {/* Day Headers */}
                  <div className="grid grid-cols-7 bg-gray-50 border-b">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => (
                      <div key={day} className="p-2 text-xs font-medium text-gray-500 text-center">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  {(() => {
                    const firstDay = new Date(cptCalendarMonth.getFullYear(), cptCalendarMonth.getMonth(), 1);
                    const lastDay = new Date(cptCalendarMonth.getFullYear(), cptCalendarMonth.getMonth() + 1, 0);
                    const todayDate = new Date();
                    todayDate.setHours(0, 0, 0, 0);
                    
                    const days: (Date | null)[] = [];
                    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
                    for (let d = 1; d <= lastDay.getDate(); d++) {
                      days.push(new Date(cptCalendarMonth.getFullYear(), cptCalendarMonth.getMonth(), d));
                    }
                    while (days.length % 7 !== 0) days.push(null);

                    return (
                      <div className="grid grid-cols-7">
                        {days.map((date, idx) => {
                          if (!date) return <div key={idx} className="p-2 bg-gray-50" />;
                          
                          const dateStr = date.toISOString().split("T")[0];
                          const isPast = date < todayDate;
                          const isToday = date.getTime() === todayDate.getTime();
                          const isExpanded = expandedCptDay === dateStr;
                          const selectedHours = selectedCptHours[dateStr] || [];
                          const hasSelection = selectedHours.length > 0;
                          const isFullDay = selectedHours.length === 24;
                          
                          const slotBookings = bookedTimeSlots[selectedSlots[0]?.id] || {};
                          const dayBookings = slotBookings[dateStr] || [];
                          const bookedHoursCount = dayBookings.length;
                          const isFullyBooked = bookedHoursCount === 24;
                          const isPartiallyBooked = bookedHoursCount > 0 && bookedHoursCount < 24;

                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                if (isPast || isFullyBooked) return;
                                setExpandedCptDay(isExpanded ? null : dateStr);
                              }}
                              disabled={isPast || isFullyBooked}
                              className={cn(
                                "p-2 text-center transition-all relative border-b border-r",
                                isPast && "bg-gray-100 text-gray-400 cursor-not-allowed",
                                isFullyBooked && "bg-red-50 text-red-400 cursor-not-allowed",
                                isExpanded && "bg-primary-100 ring-2 ring-primary-500 ring-inset",
                                !isPast && !isFullyBooked && !isExpanded && "hover:bg-gray-50 cursor-pointer",
                                isFullDay && "bg-primary-500 text-white hover:bg-primary-600",
                                hasSelection && !isFullDay && "bg-primary-100"
                              )}
                            >
                              <span className={cn(
                                "text-sm font-medium",
                                isToday && !isFullDay && "text-primary-600"
                              )}>
                                {date.getDate()}
                              </span>
                              {(hasSelection || isPartiallyBooked) && (
                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                                  {hasSelection && (
                                    <div className={cn("w-1.5 h-1.5 rounded-full", isFullDay ? "bg-white" : "bg-primary-500")} />
                                  )}
                                  {isPartiallyBooked && <div className="w-1.5 h-1.5 rounded-full bg-red-400" />}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-primary-500" />
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <span>Booked</span>
                  </div>
                </div>
              </div>

              {/* Right: Hour Selection Panel */}
              <div className="border rounded-lg bg-gray-50 p-4">
                {expandedCptDay ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {new Date(expandedCptDay + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">{selectedCountry?.timezone || "Local"} time</p>
                      </div>
                      <button
                        onClick={() => {
                          const slotBookings = bookedTimeSlots[selectedSlots[0]?.id] || {};
                          const dayBookings = slotBookings[expandedCptDay] || [];
                          const bookedHours = dayBookings.map(b => parseInt(b.split("-")[0].split(":")[0]));
                          const todayDate = new Date();
                          const expandedDate = new Date(expandedCptDay);
                          const isToday = expandedDate.toISOString().split("T")[0] === todayDate.toISOString().split("T")[0];
                          const availableHours = BOOKING_HOURS
                            .filter(h => !bookedHours.includes(h.value))
                            .filter(h => !isToday || h.value > todayDate.getHours())
                            .map(h => h.value);
                          
                          const currentSelection = selectedCptHours[expandedCptDay] || [];
                          if (currentSelection.length === availableHours.length && availableHours.length > 0) {
                            setSelectedCptHours(prev => {
                              const { [expandedCptDay]: _, ...rest } = prev;
                              return rest;
                            });
                          } else {
                            setSelectedCptHours(prev => ({ ...prev, [expandedCptDay]: availableHours }));
                          }
                        }}
                        className="text-xs font-medium text-primary-600 hover:text-primary-700"
                      >
                        {(() => {
                          const slotBookings = bookedTimeSlots[selectedSlots[0]?.id] || {};
                          const dayBookings = slotBookings[expandedCptDay] || [];
                          const bookedHours = dayBookings.map(b => parseInt(b.split("-")[0].split(":")[0]));
                          const todayDate = new Date();
                          const expandedDate = new Date(expandedCptDay);
                          const isToday = expandedDate.toISOString().split("T")[0] === todayDate.toISOString().split("T")[0];
                          const availableHours = BOOKING_HOURS
                            .filter(h => !bookedHours.includes(h.value))
                            .filter(h => !isToday || h.value > todayDate.getHours());
                          const currentSelection = selectedCptHours[expandedCptDay] || [];
                          return currentSelection.length === availableHours.length && availableHours.length > 0 ? "Deselect All" : "Book Available";
                        })()}
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {BOOKING_HOURS.map(hourInfo => {
                        const slotBookings = bookedTimeSlots[selectedSlots[0]?.id] || {};
                        const dayBookings = slotBookings[expandedCptDay] || [];
                        const isBooked = dayBookings.some(b => parseInt(b.split("-")[0].split(":")[0]) === hourInfo.value);
                        const isSelected = selectedCptHours[expandedCptDay]?.includes(hourInfo.value);
                        const todayDate = new Date();
                        const expandedDate = new Date(expandedCptDay);
                        const isPast = expandedDate < new Date(todayDate.toISOString().split("T")[0]) || 
                          (expandedDate.getTime() === new Date(todayDate.toISOString().split("T")[0]).getTime() && hourInfo.value <= todayDate.getHours());

                        return (
                          <button
                            key={hourInfo.value}
                            disabled={isBooked || isPast}
                            onClick={() => {
                              if (isBooked || isPast) return;
                              setSelectedCptHours(prev => {
                                const current = prev[expandedCptDay] || [];
                                if (current.includes(hourInfo.value)) {
                                  const filtered = current.filter(h => h !== hourInfo.value);
                                  if (filtered.length === 0) {
                                    const { [expandedCptDay]: _, ...rest } = prev;
                                    return rest;
                                  }
                                  return { ...prev, [expandedCptDay]: filtered };
                                } else {
                                  return { ...prev, [expandedCptDay]: [...current, hourInfo.value].sort((a, b) => a - b) };
                                }
                              });
                            }}
                            className={cn(
                              "py-2 px-1 rounded text-xs font-medium transition-all",
                              isBooked && "bg-red-100 text-red-400 cursor-not-allowed line-through",
                              isPast && !isBooked && "bg-gray-200 text-gray-400 cursor-not-allowed",
                              isSelected && "bg-primary-500 text-white shadow-sm",
                              !isBooked && !isPast && !isSelected && "bg-white hover:bg-primary-50 text-gray-700 border"
                            )}
                          >
                            {hourInfo.display}
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                    <Calendar className="w-10 h-10 mb-3 opacity-50" />
                    <p className="text-sm font-medium">Select a day</p>
                    <p className="text-xs mt-1">Click on a date to choose hours</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hourly Booking Summary */}
          {cptBookingMode === "hourly" && cptTotalHours > 0 && (
            <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-primary-600 font-medium">Total Booking</div>
                  <div className="text-lg font-bold text-primary-900">
                    {cptTotalHours} hour{cptTotalHours !== 1 ? "s" : ""} • {Object.keys(selectedCptHours).length} day{Object.keys(selectedCptHours).length !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-primary-500 mb-0.5">
                    {cptTotalHours} hrs × ${selectedSlots[0]?.cptRateUsd}/hr
                  </div>
                  <div className="text-2xl font-bold text-primary-900">{formatCurrency(cptTotalCost)}</div>
                </div>
              </div>
              {/* Reserve slots button */}
              {!slotsReserved && (
                <div className="mt-4 pt-4 border-t border-primary-200">
                  <button
                    onClick={() => onSlotsReservedChange(true)}
                    className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Reserve These Slots
                  </button>
                  <p className="text-[10px] text-primary-600 text-center mt-1.5">Hold your booking while you complete landing page & creatives</p>
                </div>
              )}
              {slotsReserved && (
                <div className="mt-4 pt-4 border-t border-primary-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">Slots reserved</span>
                  </div>
                  <button
                    onClick={() => onSlotsReservedChange(false)}
                    className="text-xs text-red-600 hover:text-red-700 hover:underline"
                  >
                    Release slots
                  </button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
});
