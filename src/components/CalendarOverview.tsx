"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  TrendingUp,
  Clock,
  DollarSign,
  Eye,
  AlertTriangle,
  CheckCircle,
  Info,
  Layers,
  Filter,
  X
} from "lucide-react";

// Available pages and slots for filtering
const availablePages = [
  { id: "homepage", name: "Homepage" },
  { id: "search", name: "Search" },
  { id: "electronics", name: "Electronics" },
  { id: "fashion", name: "Fashion" },
  { id: "babies", name: "Babies & Toys" },
  { id: "cart", name: "Cart" },
];

const availableSlots: { id: string; name: string; pageId: string }[] = [
  { id: "homepage_hero_1", name: "Hero Banner 1", pageId: "homepage" },
  { id: "homepage_hero_2", name: "Hero Banner 2", pageId: "homepage" },
  { id: "homepage_sfu_1", name: "Second Fold Unit 1", pageId: "homepage" },
  { id: "search_hero_1", name: "Hero Banner 1", pageId: "search" },
  { id: "search_hero_2", name: "Hero Banner 2", pageId: "search" },
  { id: "electronics_hero_1", name: "Hero Banner 1", pageId: "electronics" },
  { id: "electronics_hero_2", name: "Hero Banner 2", pageId: "electronics" },
  { id: "electronics_sfu_1", name: "Second Fold Unit 1", pageId: "electronics" },
  { id: "fashion_hero_1", name: "Hero Banner 1", pageId: "fashion" },
  { id: "fashion_hero_2", name: "Hero Banner 2", pageId: "fashion" },
  { id: "babies_hero_1", name: "Hero Banner 1", pageId: "babies" },
  { id: "cart_hero_1", name: "Hero Banner 1", pageId: "cart" },
];

// Mock data for CPT bookings and CPM campaigns
const mockCptBookings = [
  { id: "cpt1", slotId: "homepage_hero_1", slotName: "Hero Banner 1", pageName: "Homepage", pageId: "homepage", date: new Date(2026, 1, 10), hours: 24, advertiser: "Samsung", spend: 4800 },
  { id: "cpt2", slotId: "homepage_hero_2", slotName: "Hero Banner 2", pageName: "Homepage", pageId: "homepage", date: new Date(2026, 1, 10), hours: 12, advertiser: "Apple", spend: 2400 },
  { id: "cpt3", slotId: "homepage_hero_1", slotName: "Hero Banner 1", pageName: "Homepage", pageId: "homepage", date: new Date(2026, 1, 11), hours: 24, advertiser: "Samsung", spend: 4800 },
  { id: "cpt4", slotId: "electronics_hero_1", slotName: "Hero Banner 1", pageName: "Electronics", pageId: "electronics", date: new Date(2026, 1, 12), hours: 24, advertiser: "Sony", spend: 3600 },
  { id: "cpt5", slotId: "homepage_hero_1", slotName: "Hero Banner 1", pageName: "Homepage", pageId: "homepage", date: new Date(2026, 1, 12), hours: 24, advertiser: "Samsung", spend: 4800 },
  { id: "cpt6", slotId: "homepage_hero_2", slotName: "Hero Banner 2", pageName: "Homepage", pageId: "homepage", date: new Date(2026, 1, 12), hours: 24, advertiser: "Nike", spend: 4800 },
  { id: "cpt7", slotId: "search_hero_1", slotName: "Hero Banner 1", pageName: "Search", pageId: "search", date: new Date(2026, 1, 14), hours: 24, advertiser: "Adidas", spend: 3200 },
  { id: "cpt8", slotId: "homepage_hero_1", slotName: "Hero Banner 1", pageName: "Homepage", pageId: "homepage", date: new Date(2026, 1, 15), hours: 24, advertiser: "LG", spend: 4800 },
  { id: "cpt9", slotId: "homepage_hero_2", slotName: "Hero Banner 2", pageName: "Homepage", pageId: "homepage", date: new Date(2026, 1, 15), hours: 24, advertiser: "Dyson", spend: 4800 },
  { id: "cpt10", slotId: "electronics_hero_1", slotName: "Hero Banner 1", pageName: "Electronics", pageId: "electronics", date: new Date(2026, 1, 15), hours: 24, advertiser: "Bose", spend: 3600 },
  { id: "cpt11", slotId: "electronics_hero_2", slotName: "Hero Banner 2", pageName: "Electronics", pageId: "electronics", date: new Date(2026, 1, 15), hours: 24, advertiser: "JBL", spend: 3600 },
  { id: "cpt12", slotId: "homepage_hero_1", slotName: "Hero Banner 1", pageName: "Homepage", pageId: "homepage", date: new Date(2026, 1, 20), hours: 24, advertiser: "Microsoft", spend: 4800 },
  { id: "cpt13", slotId: "cart_hero_1", slotName: "Hero Banner 1", pageName: "Cart", pageId: "cart", date: new Date(2026, 1, 22), hours: 8, advertiser: "Amazon", spend: 1600 },
  // More bookings in March
  { id: "cpt14", slotId: "homepage_hero_1", slotName: "Hero Banner 1", pageName: "Homepage", pageId: "homepage", date: new Date(2026, 2, 5), hours: 24, advertiser: "Google", spend: 4800 },
  { id: "cpt15", slotId: "fashion_hero_1", slotName: "Hero Banner 1", pageName: "Fashion", pageId: "fashion", date: new Date(2026, 2, 8), hours: 24, advertiser: "Zara", spend: 3200 },
];

const mockCpmCampaigns = [
  { id: "cpm1", name: "Samsung Galaxy Launch", advertiser: "Samsung", startDate: new Date(2026, 1, 5), endDate: new Date(2026, 1, 20), dailyBudget: 5000, status: "active" },
  { id: "cpm2", name: "Nike Spring Sale", advertiser: "Nike", startDate: new Date(2026, 1, 8), endDate: new Date(2026, 1, 15), dailyBudget: 3000, status: "active" },
  { id: "cpm3", name: "Apple iPad Promo", advertiser: "Apple", startDate: new Date(2026, 1, 10), endDate: new Date(2026, 1, 25), dailyBudget: 8000, status: "active" },
  { id: "cpm4", name: "Adidas Running", advertiser: "Adidas", startDate: new Date(2026, 1, 12), endDate: new Date(2026, 1, 28), dailyBudget: 2500, status: "active" },
  { id: "cpm5", name: "Sony Audio Launch", advertiser: "Sony", startDate: new Date(2026, 1, 14), endDate: new Date(2026, 1, 21), dailyBudget: 4000, status: "active" },
  { id: "cpm6", name: "LG Electronics", advertiser: "LG", startDate: new Date(2026, 1, 18), endDate: new Date(2026, 1, 28), dailyBudget: 3500, status: "scheduled" },
  { id: "cpm7", name: "Dyson Vacuum Sale", advertiser: "Dyson", startDate: new Date(2026, 1, 20), endDate: new Date(2026, 2, 5), dailyBudget: 2000, status: "scheduled" },
  { id: "cpm8", name: "Microsoft Surface", advertiser: "Microsoft", startDate: new Date(2026, 1, 22), endDate: null, dailyBudget: 6000, status: "scheduled" },
];

// Helper to check if date falls within campaign range
const isDateInCampaign = (date: Date, campaign: typeof mockCpmCampaigns[0]) => {
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const startOnly = new Date(campaign.startDate.getFullYear(), campaign.startDate.getMonth(), campaign.startDate.getDate());
  const endOnly = campaign.endDate 
    ? new Date(campaign.endDate.getFullYear(), campaign.endDate.getMonth(), campaign.endDate.getDate())
    : new Date(2099, 11, 31);
  return dateOnly >= startOnly && dateOnly <= endOnly;
};

// Helper to check if dates match (day only)
const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() && 
         d1.getMonth() === d2.getMonth() && 
         d1.getDate() === d2.getDate();
};

export function CalendarOverview() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 1, 1)); // Feb 2026
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    // Start of the week containing Feb 4, 2026
    const d = new Date(2026, 1, 4);
    const day = d.getDay();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  
  // CPT Filters
  const [filterPage, setFilterPage] = useState<string>("all");
  const [filterSlot, setFilterSlot] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const today = new Date(2026, 1, 4); // Feb 4, 2026

  // Get slots for selected page
  const filteredSlots = useMemo(() => {
    if (filterPage === "all") return availableSlots;
    return availableSlots.filter(s => s.pageId === filterPage);
  }, [filterPage]);

  // Reset slot filter when page changes
  const handlePageFilterChange = (pageId: string) => {
    setFilterPage(pageId);
    setFilterSlot("all");
  };

  // Generate calendar days for the month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const days: (Date | null)[] = [];

    // Add padding for days before the 1st
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  }, [currentMonth]);

  // Generate week days
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), currentWeekStart.getDate() + i));
    }
    return days;
  }, [currentWeekStart]);

  // Get data for each day (with optional filtering for CPT)
  const getDayData = (date: Date, applyFilters: boolean = true) => {
    let cptBookingsForDay = mockCptBookings.filter(b => isSameDay(b.date, date));
    
    // Apply CPT filters if enabled
    if (applyFilters) {
      if (filterPage !== "all") {
        cptBookingsForDay = cptBookingsForDay.filter(b => b.pageId === filterPage);
      }
      if (filterSlot !== "all") {
        cptBookingsForDay = cptBookingsForDay.filter(b => b.slotId === filterSlot);
      }
    }
    
    const cpmCampaignsForDay = mockCpmCampaigns.filter(c => isDateInCampaign(date, c));
    
    const totalCptSlots = cptBookingsForDay.length;
    const totalCptSpend = cptBookingsForDay.reduce((sum, b) => sum + b.spend, 0);
    const totalCpmBudget = cpmCampaignsForDay.reduce((sum, c) => sum + c.dailyBudget, 0);
    const totalCpmCampaigns = cpmCampaignsForDay.length;

    // Calculate load level
    const cptLoad = totalCptSlots >= 4 ? "high" : totalCptSlots >= 2 ? "medium" : totalCptSlots > 0 ? "low" : "none";
    const cpmLoad = totalCpmCampaigns >= 5 ? "high" : totalCpmCampaigns >= 3 ? "medium" : totalCpmCampaigns > 0 ? "low" : "none";

    // Check if this specific slot is available (no bookings)
    const isSlotAvailable = filterSlot !== "all" ? totalCptSlots === 0 : true;

    return {
      cptBookings: cptBookingsForDay,
      cpmCampaigns: cpmCampaignsForDay,
      totalCptSlots,
      totalCptSpend,
      totalCpmBudget,
      totalCpmCampaigns,
      cptLoad,
      cpmLoad,
      isSlotAvailable,
    };
  };

  // Get selected day data
  const selectedDayData = selectedDate ? getDayData(selectedDate) : null;

  // Month navigation
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Week navigation
  const prevWeek = () => {
    setCurrentWeekStart(new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), currentWeekStart.getDate() - 7));
  };

  const nextWeek = () => {
    setCurrentWeekStart(new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), currentWeekStart.getDate() + 7));
  };

  const goToThisWeek = () => {
    const day = today.getDay();
    setCurrentWeekStart(new Date(today.getFullYear(), today.getMonth(), today.getDate() - day));
  };

  // Calculate monthly totals
  const monthlyStats = useMemo(() => {
    let totalCptSlots = 0;
    let totalCptSpend = 0;
    let totalCpmBudget = 0;
    let uniqueCpmCampaigns = new Set<string>();
    let highLoadDays = 0;

    calendarDays.forEach(date => {
      if (!date) return;
      const dayData = getDayData(date);
      totalCptSlots += dayData.totalCptSlots;
      totalCptSpend += dayData.totalCptSpend;
      totalCpmBudget += dayData.totalCpmBudget;
      dayData.cpmCampaigns.forEach(c => uniqueCpmCampaigns.add(c.id));
      if (dayData.cptLoad === "high" || dayData.cpmLoad === "high") {
        highLoadDays++;
      }
    });

    return {
      totalCptSlots,
      totalCptSpend,
      totalCpmBudget,
      uniqueCpmCampaigns: uniqueCpmCampaigns.size,
      highLoadDays,
    };
  }, [calendarDays]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sub Header */}
      <header className="bg-white border-b sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">Traffic & Booking Overview</span>
              
              {/* CPT Filters */}
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    showFilters || filterPage !== "all" || filterSlot !== "all"
                      ? "bg-blue-50 border-blue-200 text-blue-600"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  CPT Filter
                  {(filterPage !== "all" || filterSlot !== "all") && (
                    <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                      {(filterPage !== "all" ? 1 : 0) + (filterSlot !== "all" ? 1 : 0)}
                    </span>
                  )}
                </button>
                
                {showFilters && (
                  <div className="flex items-center gap-2">
                    <select
                      value={filterPage}
                      onChange={(e) => handlePageFilterChange(e.target.value)}
                      className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
                    >
                      <option value="all">All Pages</option>
                      {availablePages.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <select
                      value={filterSlot}
                      onChange={(e) => setFilterSlot(e.target.value)}
                      className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
                    >
                      <option value="all">All Slots</option>
                      {filteredSlots.map(s => (
                        <option key={s.id} value={s.id}>
                          {filterPage === "all" ? `${availablePages.find(p => p.id === s.pageId)?.name} - ${s.name}` : s.name}
                        </option>
                      ))}
                    </select>
                    {(filterPage !== "all" || filterSlot !== "all") && (
                      <button
                        onClick={() => { setFilterPage("all"); setFilterSlot("all"); }}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("month")}
                  className={`px-3 py-1.5 text-sm ${viewMode === "month" ? "bg-primary-50 text-primary-600 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  Month
                </button>
                <button
                  onClick={() => setViewMode("week")}
                  className={`px-3 py-1.5 text-sm ${viewMode === "week" ? "bg-primary-50 text-primary-600 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  Week
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Monthly Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">CPT Slot Bookings</p>
                  <p className="text-xl font-bold text-gray-900">{monthlyStats.totalCptSlots}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">CPT Revenue</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(monthlyStats.totalCptSpend)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active CPM Campaigns</p>
                  <p className="text-xl font-bold text-gray-900">{monthlyStats.uniqueCpmCampaigns}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">CPM Budget (Month)</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(monthlyStats.totalCpmBudget)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">High Load Days</p>
                  <p className="text-xl font-bold text-gray-900">{monthlyStats.highLoadDays}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Calendar */}
          <div className="col-span-8">
            <Card>
              <CardContent className="p-6">
                {viewMode === "month" ? (
                  <>
                    {/* Month View Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <h2 className="text-xl font-semibold text-gray-900 min-w-[180px] text-center">
                          {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                        </h2>
                        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                      <button 
                        onClick={() => setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))}
                        className="px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        Today
                      </button>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-6 mb-4 pb-4 border-b">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-xs text-gray-600">CPT Bookings</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500" />
                        <span className="text-xs text-gray-600">CPM Campaigns</span>
                      </div>
                      {filterSlot !== "all" && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span className="text-xs text-green-600">Slot Available</span>
                        </div>
                      )}
                      <div className="flex items-center gap-4 ml-auto">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-green-400" />
                          <span className="text-xs text-gray-500">Low</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-amber-400" />
                          <span className="text-xs text-gray-500">Medium</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-red-400" />
                          <span className="text-xs text-gray-500">High</span>
                        </div>
                      </div>
                    </div>

                    {/* Day Headers */}
                    <div className="grid grid-cols-7 mb-2">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                        <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Month Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((date, idx) => {
                        if (!date) {
                          return <div key={idx} className="aspect-square" />;
                        }

                        const dayData = getDayData(date);
                        const isToday = isSameDay(date, today);
                        const isSelected = selectedDate && isSameDay(date, selectedDate);
                        const isPast = date < today;

                        const cptColor = dayData.cptLoad === "high" ? "bg-red-400" : 
                                         dayData.cptLoad === "medium" ? "bg-amber-400" : 
                                         dayData.cptLoad === "low" ? "bg-green-400" : "bg-gray-200";
                        const cpmColor = dayData.cpmLoad === "high" ? "bg-red-400" : 
                                         dayData.cpmLoad === "medium" ? "bg-amber-400" : 
                                         dayData.cpmLoad === "low" ? "bg-green-400" : "bg-gray-200";

                        // Show green highlight when filtering by slot and it's available
                        const showAvailable = filterSlot !== "all" && dayData.isSlotAvailable && !isPast;

                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedDate(date)}
                            className={`
                              relative aspect-square p-1.5 rounded-lg border transition-all text-left flex flex-col
                              ${isSelected ? "border-primary-500 bg-primary-50 ring-2 ring-primary-200" : "border-transparent hover:border-gray-200 hover:bg-gray-50"}
                              ${isToday ? "bg-blue-50" : ""}
                              ${isPast ? "opacity-60" : ""}
                              ${showAvailable ? "bg-green-50 border-green-200" : ""}
                            `}
                          >
                            <span className={`text-sm font-medium ${isToday ? "text-primary-600" : showAvailable ? "text-green-700" : "text-gray-700"}`}>
                              {date.getDate()}
                            </span>
                            
                            {/* Available badge when filtering */}
                            {showAvailable && (
                              <div className="absolute top-1 right-1">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                              </div>
                            )}
                            
                            {/* Traffic indicators */}
                            <div className="flex-1 flex flex-col justify-end gap-1 mt-1">
                              {/* CPT indicator */}
                              {dayData.totalCptSlots > 0 && (
                                <div className="flex items-center gap-1">
                                  <div className={`w-1.5 h-1.5 rounded-full ${cptColor}`} />
                                  <span className="text-[10px] text-blue-600 font-medium">{dayData.totalCptSlots} CPT</span>
                                </div>
                              )}
                              {/* CPM indicator */}
                              {dayData.totalCpmCampaigns > 0 && (
                                <div className="flex items-center gap-1">
                                  <div className={`w-1.5 h-1.5 rounded-full ${cpmColor}`} />
                                  <span className="text-[10px] text-purple-600 font-medium">{dayData.totalCpmCampaigns} CPM</span>
                                </div>
                              )}
                            </div>

                            {/* High load warning */}
                            {!showAvailable && (dayData.cptLoad === "high" || dayData.cpmLoad === "high") && (
                              <div className="absolute top-1 right-1">
                                <AlertTriangle className="w-3 h-3 text-amber-500" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Week View Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <button onClick={prevWeek} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <h2 className="text-xl font-semibold text-gray-900 min-w-[240px] text-center">
                          {weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </h2>
                        <button onClick={nextWeek} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                      <button 
                        onClick={goToThisWeek}
                        className="px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        This Week
                      </button>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-6 mb-4 pb-4 border-b">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-xs text-gray-600">CPT Bookings</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500" />
                        <span className="text-xs text-gray-600">CPM Campaigns</span>
                      </div>
                      {filterSlot !== "all" && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span className="text-xs text-green-600">Slot Available</span>
                        </div>
                      )}
                    </div>

                    {/* Week View Grid */}
                    <div className="grid grid-cols-7 gap-2">
                      {weekDays.map((date, idx) => {
                        const dayData = getDayData(date);
                        const isToday = isSameDay(date, today);
                        const isSelected = selectedDate && isSameDay(date, selectedDate);
                        const isPast = date < today;
                        const showAvailable = filterSlot !== "all" && dayData.isSlotAvailable && !isPast;

                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedDate(date)}
                            className={`
                              p-3 rounded-lg border transition-all text-left
                              ${isSelected ? "border-primary-500 bg-primary-50 ring-2 ring-primary-200" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}
                              ${isToday ? "bg-blue-50 border-blue-200" : ""}
                              ${isPast ? "opacity-60" : ""}
                              ${showAvailable ? "bg-green-50 border-green-300" : ""}
                            `}
                          >
                            {/* Day Header */}
                            <div className="text-center mb-3 pb-2 border-b">
                              <p className="text-xs text-gray-500 uppercase">
                                {date.toLocaleDateString("en-US", { weekday: "short" })}
                              </p>
                              <p className={`text-lg font-bold ${isToday ? "text-primary-600" : showAvailable ? "text-green-700" : "text-gray-900"}`}>
                                {date.getDate()}
                              </p>
                              {showAvailable && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded mt-1">
                                  <CheckCircle className="w-2.5 h-2.5" />
                                  Available
                                </span>
                              )}
                            </div>

                            {/* Day Stats */}
                            <div className="space-y-2">
                              {/* CPT */}
                              <div className={`p-2 rounded ${dayData.totalCptSlots > 0 ? "bg-blue-50" : "bg-gray-50"}`}>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500">CPT</span>
                                  <span className={`text-sm font-semibold ${dayData.totalCptSlots > 0 ? "text-blue-600" : "text-gray-400"}`}>
                                    {dayData.totalCptSlots}
                                  </span>
                                </div>
                                {dayData.totalCptSlots > 0 && (
                                  <p className="text-[10px] text-blue-500 mt-0.5">{formatCurrency(dayData.totalCptSpend)}</p>
                                )}
                              </div>

                              {/* CPM */}
                              <div className={`p-2 rounded ${dayData.totalCpmCampaigns > 0 ? "bg-purple-50" : "bg-gray-50"}`}>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500">CPM</span>
                                  <span className={`text-sm font-semibold ${dayData.totalCpmCampaigns > 0 ? "text-purple-600" : "text-gray-400"}`}>
                                    {dayData.totalCpmCampaigns}
                                  </span>
                                </div>
                                {dayData.totalCpmCampaigns > 0 && (
                                  <p className="text-[10px] text-purple-500 mt-0.5">{formatCurrency(dayData.totalCpmBudget)}/d</p>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Day Details Panel */}
          <div className="col-span-4">
            <Card className="sticky top-28">
              <CardContent className="p-6">
                {/* Active Filter Info */}
                {(filterPage !== "all" || filterSlot !== "all") && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs font-medium text-blue-700 mb-1">Filtering CPT by:</p>
                    <div className="flex flex-wrap gap-1">
                      {filterPage !== "all" && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                          {availablePages.find(p => p.id === filterPage)?.name}
                        </span>
                      )}
                      {filterSlot !== "all" && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                          {availableSlots.find(s => s.id === filterSlot)?.name}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {selectedDate ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">
                        {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                      </h3>
                      <div className="flex items-center gap-2">
                        {isSameDay(selectedDate, today) && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">Today</span>
                        )}
                        {filterSlot !== "all" && selectedDayData?.isSlotAvailable && selectedDate >= today && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Available
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Slot Availability Status */}
                    {filterSlot !== "all" && (
                      <div className={`mb-4 p-3 rounded-lg ${selectedDayData?.isSlotAvailable ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                        <div className="flex items-center gap-2">
                          {selectedDayData?.isSlotAvailable ? (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-500" />
                              <div>
                                <p className="text-sm font-medium text-green-700">Slot is available</p>
                                <p className="text-xs text-green-600">
                                  {availableSlots.find(s => s.id === filterSlot)?.name} on {availablePages.find(p => p.id === filterPage)?.name || "this page"} can be booked
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-5 h-5 text-red-500" />
                              <div>
                                <p className="text-sm font-medium text-red-700">Slot is booked</p>
                                <p className="text-xs text-red-600">
                                  {selectedDayData?.cptBookings[0]?.advertiser} has this slot booked
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="text-xs text-blue-600 font-medium">CPT Slots</span>
                        </div>
                        <p className="text-xl font-bold text-blue-700">{selectedDayData?.totalCptSlots || 0}</p>
                        <p className="text-xs text-blue-600">{formatCurrency(selectedDayData?.totalCptSpend || 0)} revenue</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Layers className="w-4 h-4 text-purple-600" />
                          <span className="text-xs text-purple-600 font-medium">CPM Campaigns</span>
                        </div>
                        <p className="text-xl font-bold text-purple-700">{selectedDayData?.totalCpmCampaigns || 0}</p>
                        <p className="text-xs text-purple-600">{formatCurrency(selectedDayData?.totalCpmBudget || 0)} budget</p>
                      </div>
                    </div>

                    {/* CPT Bookings List */}
                    {selectedDayData && selectedDayData.cptBookings.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-500" />
                          CPT Slot Bookings
                          {(filterPage !== "all" || filterSlot !== "all") && (
                            <span className="text-xs text-gray-400">(filtered)</span>
                          )}
                        </h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {selectedDayData.cptBookings.map(booking => (
                            <div key={booking.id} className="p-2.5 bg-white border rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{booking.pageName} → {booking.slotName}</p>
                                  <p className="text-xs text-gray-500">{booking.advertiser} • {booking.hours}h</p>
                                </div>
                                <span className="text-sm font-semibold text-blue-600">{formatCurrency(booking.spend)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* CPM Campaigns List */}
                    {selectedDayData && selectedDayData.cpmCampaigns.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                          <Layers className="w-4 h-4 text-purple-500" />
                          Active CPM Campaigns
                        </h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {selectedDayData.cpmCampaigns.map(campaign => (
                            <div key={campaign.id} className="p-2.5 bg-white border rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{campaign.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {campaign.advertiser} • 
                                    {campaign.endDate 
                                      ? ` ${campaign.startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${campaign.endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                                      : " No end date"
                                    }
                                  </p>
                                </div>
                                <span className="text-sm font-semibold text-purple-600">{formatCurrency(campaign.dailyBudget)}/d</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {selectedDayData && selectedDayData.totalCptSlots === 0 && selectedDayData.totalCpmCampaigns === 0 && (
                      <div className="text-center py-8">
                        <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
                        <p className="text-gray-500">
                          {filterSlot !== "all" ? "This slot is available!" : "No campaigns scheduled for this day"}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {filterSlot !== "all" ? "You can book this slot for CPT" : "Low competition for ad placements"}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Info className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Select a day to view details</p>
                    <p className="text-xs text-gray-400 mt-1">Click on any date in the calendar</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
