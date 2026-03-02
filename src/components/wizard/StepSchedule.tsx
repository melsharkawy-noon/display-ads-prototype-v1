"use client";

import { useState, useMemo } from "react";
import { useCampaign } from "@/context/CampaignContext";
import { WizardLayout } from "@/components/layout/WizardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { cn, formatCurrency, formatDate, getDaysBetween, formatNumber } from "@/lib/utils";
import { slots, bookedDates } from "@/lib/mock-data";
import { ChevronLeft, ChevronRight, AlertTriangle, CheckCircle } from "lucide-react";

interface StepScheduleProps {
  onBack: () => void;
  onNext: () => void;
}

export function StepSchedule({ onBack, onNext }: StepScheduleProps) {
  const { draft, updateDraft, markStepComplete } = useCampaign();
  const isCPD = draft.pricingModel === "cpd";
  const selectedSlot = slots.find((s) => s.id === draft.slotIds[0]);
  const selectedSlots = slots.filter((s) => draft.slotIds.includes(s.id));
  const daysSelected = draft.startDate && draft.endDate 
    ? getDaysBetween(draft.startDate, draft.endDate) 
    : draft.startDate ? 1 : 0;
  
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 1, 1)); // Feb 2026
  const [selectingEnd, setSelectingEnd] = useState(false);

  // Get booked dates for all selected slots
  const slotBookedDates = useMemo(() => {
    const allBooked: { date: string; slotId: string; slotName: string }[] = [];
    draft.slotIds.forEach((slotId) => {
      const dates = bookedDates[slotId] || [];
      const slot = slots.find((s) => s.id === slotId);
      dates.forEach((date) => {
        allBooked.push({ date, slotId, slotName: slot?.name || slotId });
      });
    });
    return allBooked;
  }, [draft.slotIds]);

  // Check if a date is booked (returns booking info)
  const getDateBookings = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return slotBookedDates.filter((b) => b.date === dateStr);
  };

  // Check if a date has any CPD booking
  const isDateBooked = (date: Date) => {
    return getDateBookings(date).length > 0;
  };

  // Check if date is in selected range
  const isDateInRange = (date: Date) => {
    if (!draft.startDate) return false;
    if (!draft.endDate) return date.getTime() === draft.startDate.getTime();
    return date >= draft.startDate && date <= draft.endDate;
  };

  // Calculate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    
    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];
    
    // Previous month padding
    for (let i = startPadding - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month, -i),
        isCurrentMonth: false,
      });
    }
    
    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }
    
    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }
    
    return days;
  }, [currentMonth]);

  // Check for conflicts in selected range
  const conflicts = useMemo(() => {
    if (!draft.startDate || !draft.endDate) return [];
    const conflictList: string[] = [];
    let current = new Date(draft.startDate);
    while (current <= draft.endDate) {
      if (isDateBooked(current)) {
        conflictList.push(current.toISOString().split("T")[0]);
      }
      current = new Date(current.getTime() + 86400000);
    }
    return conflictList;
  }, [draft.startDate, draft.endDate, slotBookedDates]);

  // Calculate total cost for CPD
  const totalCost = selectedSlot ? daysSelected * selectedSlot.cpdRateUsd : 0;
  
  // Calculate estimated total reach for CPM
  const estimatedTotalReach = selectedSlots.reduce((sum, s) => sum + s.avgDailyViews, 0) * daysSelected;

  const handleDateClick = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) return; // Can't select past dates
    if (isCPD && isDateBooked(date)) return; // Can't select booked dates in CPD mode

    if (!draft.startDate || (draft.startDate && draft.endDate)) {
      // Start new selection (no start date, or both dates already set)
      updateDraft({ startDate: date, endDate: null, noEndDate: false });
      setSelectingEnd(true);
    } else if (draft.startDate && !draft.endDate) {
      // Have start date but no end date - set end date
      if (date >= draft.startDate) {
        updateDraft({ endDate: date, noEndDate: false });
      } else {
        // Clicked date is before start, swap them
        updateDraft({ startDate: date, endDate: draft.startDate, noEndDate: false });
      }
      setSelectingEnd(false);
    }
  };

  const handleNext = () => {
    if (isCPD && conflicts.length > 0) return;
    // Save estimated reach for use in later steps
    updateDraft({ estimatedTotalReach });
    markStepComplete(3);
    onNext();
  };

  return (
    <WizardLayout
      title="Display - Create Campaign (Managed)"
      subtitle={isCPD ? "Book your campaign dates" : "Set your campaign dates and review inventory forecast"}
      onBack={onBack}
      onNext={handleNext}
      onSave={() => console.log("Save draft")}
      nextDisabled={!draft.startDate || (isCPD && conflicts.length > 0)}
    >
      <div className="grid grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="col-span-2">
          <Card>
            <CardContent className="p-5">
              {isCPD && selectedSlot && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Selected Slot</div>
                  <div className="font-semibold text-gray-900">{selectedSlot.name}</div>
                  <div className="text-sm text-primary-600">
                    {formatCurrency(selectedSlot.cpdRateUsd)} / day
                  </div>
                </div>
              )}

              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">
                  {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </h3>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map(({ date, isCurrentMonth }, idx) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isToday = date.toDateString() === today.toDateString();
                  const isPast = date < today;
                  const dateBookings = getDateBookings(date);
                  const isBooked = dateBookings.length > 0;
                  const isInRange = isDateInRange(date);
                  const isStart = draft.startDate && date.toDateString() === draft.startDate.toDateString();
                  const isEnd = draft.endDate && date.toDateString() === draft.endDate.toDateString();

                  return (
                    <div key={idx} className="relative group">
                      <button
                        onClick={() => handleDateClick(date)}
                        disabled={isPast || (isCPD && isBooked)}
                        className={cn(
                          "calendar-day w-full",
                          !isCurrentMonth && "text-gray-300",
                          isCurrentMonth && !isPast && "text-gray-700",
                          isPast && "disabled",
                          isBooked && isCPD && "booked",
                          isBooked && !isCPD && "bg-orange-50 text-orange-700",
                          isToday && "today",
                          isInRange && !isBooked && "selected",
                          (isStart || isEnd) && "ring-2 ring-primary-600"
                        )}
                      >
                        {date.getDate()}
                        {/* CPD booking indicator dot */}
                        {isBooked && !isCPD && (
                          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-orange-500 rounded-full" />
                        )}
                      </button>
                      {/* Tooltip for CPD bookings */}
                      {isBooked && isCurrentMonth && !isPast && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          <div className="font-medium mb-0.5">CPD Booked:</div>
                          {dateBookings.slice(0, 2).map((b, i) => (
                            <div key={i} className="text-gray-300">{b.slotName}</div>
                          ))}
                          {dateBookings.length > 2 && (
                            <div className="text-gray-400">+{dateBookings.length - 2} more</div>
                          )}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-primary-500" />
                  <span className="text-gray-600">Selected</span>
                </div>
                {isCPD && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-100 border border-red-200" />
                    <span className="text-gray-600">Unavailable</span>
                  </div>
                )}
                {!isCPD && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-orange-50 border border-orange-200 relative">
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-500 rounded-full" />
                    </div>
                    <span className="text-gray-600">Has CPD booking</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 border-primary-500" />
                  <span className="text-gray-600">Today</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary panel */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Selection</h3>
              
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">Start Date</div>
                  <div className="font-medium text-gray-900">
                    {draft.startDate ? formatDate(draft.startDate) : "Select a date"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">End Date</div>
                  <div className="font-medium text-gray-900">
                    {draft.endDate ? formatDate(draft.endDate) : "Select a date"}
                  </div>
                </div>
                {!isCPD && (
                  <div className="pt-2">
                    <Checkbox
                      checked={draft.noEndDate}
                      onChange={(checked) => {
                        updateDraft({ noEndDate: checked, endDate: null });
                        // When unchecking "no end date" and we have a start date, 
                        // enable end date selection mode
                        if (!checked && draft.startDate) {
                          setSelectingEnd(true);
                        }
                      }}
                      label="No end date"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* CPD Cost Summary */}
          {isCPD && draft.startDate && draft.endDate && (
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Booking Summary</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Duration</span>
                    <span className="font-medium">{daysSelected} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Daily Rate</span>
                    <span className="font-medium">{formatCurrency(selectedSlot?.cpdRateUsd || 0)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2 flex justify-between">
                    <span className="font-semibold text-gray-900">Total Cost</span>
                    <span className="font-semibold text-primary-600 text-lg">{formatCurrency(totalCost)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Conflict Alert */}
          {isCPD && conflicts.length > 0 && (
            <Alert variant="error" title="Booking Conflict">
              <p className="mb-2">{conflicts.length} date(s) in your selection are already booked:</p>
              <ul className="text-sm space-y-1">
                {conflicts.slice(0, 3).map((date) => (
                  <li key={date}>• {date}</li>
                ))}
                {conflicts.length > 3 && <li>• and {conflicts.length - 3} more...</li>}
              </ul>
            </Alert>
          )}

          {/* Success indicator */}
          {isCPD && draft.startDate && draft.endDate && conflicts.length === 0 && (
            <Alert variant="success">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                All selected dates are available
              </div>
            </Alert>
          )}

          {/* CPD Bookings Info for CPM */}
          {!isCPD && draft.startDate && slotBookedDates.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold text-gray-900 mb-3">CPD Bookings</h3>
                <p className="text-sm text-gray-500 mb-3">
                  These dates have exclusive CPD bookings. Your CPM campaign will have reduced inventory on these days.
                </p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {slotBookedDates.slice(0, 5).map((booking, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm p-2 bg-orange-50 rounded-lg">
                      <span className="text-orange-800">{booking.date}</span>
                      <span className="text-orange-600 text-xs truncate ml-2 max-w-[120px]">{booking.slotName}</span>
                    </div>
                  ))}
                  {slotBookedDates.length > 5 && (
                    <div className="text-xs text-gray-500 text-center pt-1">
                      +{slotBookedDates.length - 5} more bookings
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* CPM Inventory Forecast */}
          {!isCPD && draft.startDate && (
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Estimated Reach</h3>
                
                <div className="space-y-4">
                  {/* Total Available Impressions */}
                  <div className="p-4 bg-primary-50 rounded-lg">
                    <div className="text-xs text-primary-600 uppercase tracking-wide mb-1">
                      Total Available Impressions
                    </div>
                    <div className="text-3xl font-bold text-primary-700">
                      {formatNumber(selectedSlots.reduce((sum, s) => sum + s.avgDailyViews, 0) * daysSelected)}
                    </div>
                    <div className="text-sm text-primary-600 mt-1">
                      across {selectedSlots.length} slot{selectedSlots.length > 1 ? "s" : ""} over {daysSelected} day{daysSelected > 1 ? "s" : ""}
                    </div>
                  </div>

                  {/* Breakdown by slot */}
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Daily breakdown</div>
                    <div className="space-y-2">
                      {selectedSlots.map((slot) => (
                        <div key={slot.id} className="flex justify-between text-sm">
                          <span className="text-gray-600 truncate pr-2">{slot.name}</span>
                          <span className="font-medium text-gray-900">{formatNumber(slot.avgDailyViews)}/day</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Competition notice */}
                  {slotBookedDates.length > 0 && (
                    <Alert variant="info">
                      <div className="text-sm">
                        <strong>Note:</strong> {slotBookedDates.length} CPD booking{slotBookedDates.length > 1 ? "s" : ""} during this period may reduce available inventory on specific days.
                      </div>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </WizardLayout>
  );
}
