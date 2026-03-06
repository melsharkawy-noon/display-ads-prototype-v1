"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { useIntake } from "@/context/IntakeContext";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils";
import { BookingStatus, BookingCampaignStatus, AED_TO_USD_RATE, deriveConversionStatus } from "@/lib/types";
import { brands } from "@/lib/mock-data";
import { Button } from "@/components/ui/Button";
import {
  Plus,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  ChevronUp,
  BookOpen,
  Eye,
  Pencil,
  AlertCircle,
  Filter,
  MoreHorizontal,
  PlusCircle,
  ExternalLink,
  BarChart3,
  DollarSign,
  TrendingUp,
  Layers,
  Trash2,
  AlertTriangle,
} from "lucide-react";

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string; dot: string }> = {
  draft: { label: "Draft", color: "text-gray-700", bg: "bg-gray-100", dot: "bg-gray-400" },
  pending_approval: { label: "Pending Approval", color: "text-amber-700", bg: "bg-amber-50", dot: "bg-amber-400" },
  approved: { label: "Approved", color: "text-blue-700", bg: "bg-blue-50", dot: "bg-blue-400" },
  rejected: { label: "Rejected", color: "text-red-700", bg: "bg-red-50", dot: "bg-red-400" },
  in_planning: { label: "In Planning", color: "text-purple-700", bg: "bg-purple-50", dot: "bg-purple-400" },
  partially_converted: { label: "Partially Converted", color: "text-orange-700", bg: "bg-orange-50", dot: "bg-orange-400" },
  fully_converted: { label: "Fully Converted", color: "text-green-700", bg: "bg-green-50", dot: "bg-green-500" },
};

const CAMPAIGN_STATUS_CONFIG: Record<BookingCampaignStatus, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: "text-gray-600", bg: "bg-gray-100" },
  active: { label: "Active", color: "text-green-700", bg: "bg-green-50" },
  paused: { label: "Paused", color: "text-amber-700", bg: "bg-amber-50" },
  completed: { label: "Completed", color: "text-blue-700", bg: "bg-blue-50" },
  archived: { label: "Archived", color: "text-gray-500", bg: "bg-gray-50" },
};

const COUNTRY_LABELS: Record<string, string> = { AE: "UAE", SA: "KSA", EG: "Egypt", OTHER: "Other" };
const ADV_TYPE_LABELS: Record<string, string> = { "1P": "1P", "3P": "3P", marketplace: "Marketplace" };

type SortField = "lastUpdated" | "netBudget" | "status";
type SortDir = "asc" | "desc";

interface BookingsListPageProps {
  onOpenBooking: (id: string) => void;
  onNewBooking: () => void;
  onAddCampaign: (bookingId: string) => void;
  autoExpandBookingId?: string | null;
  highlightCampaignId?: string | null;
  onClearHighlight?: () => void;
}

function isIncomplete(b: { bookingName: string; partnerLeCode: string; brandCode: string; advertiserType: string; advertiserCountry: string; campaignCountry: string; finalBudget: number }) {
  return !b.bookingName.trim() || !b.partnerLeCode.trim() || !b.brandCode || !b.advertiserType || !b.advertiserCountry || !b.campaignCountry || b.finalBudget <= 0;
}

export function BookingsListPage({ onOpenBooking, onNewBooking, onAddCampaign, autoExpandBookingId, highlightCampaignId, onClearHighlight }: BookingsListPageProps) {
  const { bookings, removeCampaignFromBooking } = useIntake();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "">("");
  const [countryFilter, setCountryFilter] = useState("");
  const [advTypeFilter, setAdvTypeFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("lastUpdated");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [fadingHighlight, setFadingHighlight] = useState<string | null>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ bookingId: string; campaignId: string; campaignName: string } | null>(null);

  useEffect(() => {
    if (autoExpandBookingId) {
      setExpandedRows((prev) => new Set(prev).add(autoExpandBookingId));
    }
    if (highlightCampaignId) {
      setFadingHighlight(highlightCampaignId);
      const scrollTimer = setTimeout(() => {
        highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 150);
      const fadeTimer = setTimeout(() => {
        setFadingHighlight(null);
        onClearHighlight?.();
      }, 4000);
      return () => { clearTimeout(scrollTimer); clearTimeout(fadeTimer); };
    }
  }, [autoExpandBookingId, highlightCampaignId, onClearHighlight]);

  const brandMap = useMemo(() => {
    const m: Record<string, string> = {};
    brands.forEach((b) => { m[b.id] = b.name; });
    return m;
  }, []);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  };

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filteredBookings = useMemo(() => {
    let list = [...bookings];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((b) =>
        b.bookingName.toLowerCase().includes(q) ||
        b.brandCode.toLowerCase().includes(q) ||
        (brandMap[b.brandCode] || "").toLowerCase().includes(q) ||
        b.partnerLeCode.toLowerCase().includes(q) ||
        b.salesEmail.toLowerCase().includes(q)
      );
    }
    if (statusFilter) list = list.filter((b) => b.status === statusFilter);
    if (countryFilter) list = list.filter((b) => b.campaignCountry === countryFilter);
    if (advTypeFilter) list = list.filter((b) => b.advertiserType === advTypeFilter);

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === "lastUpdated") cmp = a.lastUpdated.getTime() - b.lastUpdated.getTime();
      else if (sortField === "netBudget") {
        cmp = a.finalBudget * (1 - a.discountPercent / 100) - b.finalBudget * (1 - b.discountPercent / 100);
      } else if (sortField === "status") {
        const order: Record<BookingStatus, number> = { draft: 0, pending_approval: 1, approved: 2, in_planning: 3, partially_converted: 4, fully_converted: 5, rejected: 6 };
        cmp = order[a.status] - order[b.status];
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [bookings, searchQuery, statusFilter, countryFilter, advTypeFilter, sortField, sortDir, brandMap]);

  const hasFilters = searchQuery || statusFilter || countryFilter || advTypeFilter;
  const clearFilters = () => { setSearchQuery(""); setStatusFilter(""); setCountryFilter(""); setAdvTypeFilter(""); };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-gray-400" />;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3 text-primary-500" /> : <ChevronDown className="w-3 h-3 text-primary-500" />;
  };

  if (bookings.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <BookOpen className="w-8 h-8 text-primary-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No bookings yet</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
          Create your first booking to start planning campaigns.
        </p>
        <Button size="lg" onClick={onNewBooking}>
          <Plus className="w-4 h-4 mr-2" />
          Create your first booking
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">
            {bookings.length} booking{bookings.length !== 1 ? "s" : ""} &middot;{" "}
            {bookings.reduce((sum, b) => sum + b.campaigns.length, 0)} campaigns total
          </p>
        </div>
        <Button onClick={onNewBooking}>
          <Plus className="w-4 h-4 mr-2" />
          New Booking
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, brand, LE code, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as BookingStatus | "")} className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">All Statuses</option>
            {(Object.keys(STATUS_CONFIG) as BookingStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
          <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
        <select value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">All Countries</option>
          {Object.entries(COUNTRY_LABELS).map(([code, label]) => (
            <option key={code} value={code}>{label}</option>
          ))}
        </select>
        <select value={advTypeFilter} onChange={(e) => setAdvTypeFilter(e.target.value)} className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">All Types</option>
          {Object.entries(ADV_TYPE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        {hasFilters && (
          <button onClick={clearFilters} className="text-xs text-primary-600 hover:text-primary-700 hover:underline whitespace-nowrap">
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filteredBookings.length === 0 ? (
          <div className="py-16 text-center">
            <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600">No matching bookings</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
            <button onClick={clearFilters} className="mt-4 text-sm text-primary-600 hover:text-primary-700 hover:underline">
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="w-10 px-3 py-3" />
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Booking</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Brand</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">LE Code</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Country</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    <button onClick={() => toggleSort("netBudget")} className="flex items-center gap-1 hover:text-gray-900">
                      Net Budget <SortIcon field="netBudget" />
                    </button>
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Campaigns</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    <button onClick={() => toggleSort("status")} className="flex items-center gap-1 hover:text-gray-900">
                      Status <SortIcon field="status" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    <button onClick={() => toggleSort("lastUpdated")} className="flex items-center gap-1 hover:text-gray-900">
                      Updated <SortIcon field="lastUpdated" />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => {
                  const net = b.finalBudget * (1 - b.discountPercent / 100);
                  const { status: derivedStatus, overallocated } = deriveConversionStatus(b);
                  const statusCfg = STATUS_CONFIG[derivedStatus] || STATUS_CONFIG.draft;
                  const incomplete = b.status === "draft" && isIncomplete(b);
                  const isExpanded = expandedRows.has(b.id);
                  const totalCampaignBudget = b.campaigns.reduce((s, c) => s + c.budget, 0);
                  const totalImpressions = b.campaigns.reduce((s, c) => s + c.impressions, 0);
                  const totalSpend = b.campaigns.reduce((s, c) => s + c.spend, 0);
                  const remainingBudget = net - totalCampaignBudget;

                  return (
                    <React.Fragment key={b.id}>
                      <tr className={cn("border-b border-gray-100 hover:bg-gray-50/80 transition-colors", isExpanded && "bg-gray-50/50")}>
                        {/* Expand toggle */}
                        <td className="px-3 py-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleRow(b.id); }}
                            className={cn("p-1 rounded hover:bg-gray-200 transition-colors", b.campaigns.length === 0 && "opacity-30 cursor-default")}
                            disabled={b.campaigns.length === 0}
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                          </button>
                        </td>
                        <td className="px-4 py-3 cursor-pointer" onClick={() => onOpenBooking(b.id)}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 truncate max-w-[200px]">
                              {b.bookingName || <span className="text-gray-400 italic">Untitled</span>}
                            </span>
                            {incomplete && <span title="Missing required fields"><AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" /></span>}
                          </div>
                          <span className="text-xs text-gray-400 font-mono">{b.id}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{brandMap[b.brandCode] || b.brandCode || "—"}</td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs hidden lg:table-cell">{b.partnerLeCode || "—"}</td>
                        <td className="px-4 py-3 text-gray-700">{ADV_TYPE_LABELS[b.advertiserType] || "—"}</td>
                        <td className="px-4 py-3 text-gray-700">{COUNTRY_LABELS[b.campaignCountry] || b.campaignCountry || "—"}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                          {net > 0 ? `${b.currency === "USD" ? "$" : ""}${net.toLocaleString(undefined, { maximumFractionDigits: 0 })}${b.currency === "AED" ? " AED" : ""}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {b.campaigns.length > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                              <Layers className="w-3 h-3" />
                              {b.campaigns.length}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", statusCfg.bg, statusCfg.color)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", statusCfg.dot)} />
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {b.lastUpdated.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          <span className="text-gray-400 ml-1">
                            {b.lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="relative inline-block">
                            <button
                              onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === b.id ? null : b.id); }}
                              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <MoreHorizontal className="w-4 h-4 text-gray-500" />
                            </button>
                            {openMenu === b.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                                <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setOpenMenu(null); onOpenBooking(b.id); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    <Eye className="w-3.5 h-3.5" /> View Booking
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setOpenMenu(null); onOpenBooking(b.id); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    <Pencil className="w-3.5 h-3.5" /> Edit Booking
                                  </button>
                                  {(derivedStatus === "approved" || derivedStatus === "in_planning" || derivedStatus === "partially_converted") && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setOpenMenu(null); onAddCampaign(b.id); }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary-700 hover:bg-primary-50"
                                    >
                                      <PlusCircle className="w-3.5 h-3.5" /> Add Campaign
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded: Child Campaigns */}
                      {isExpanded && b.campaigns.length > 0 && (
                        <tr>
                          <td colSpan={11} className="p-0">
                            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
                              {/* Booking-level rollup */}
                              <div className="flex items-center gap-6 mb-4 px-3 py-2.5 bg-white rounded-lg border border-gray-200">
                                <div className="flex items-center gap-2">
                                  <Layers className="w-4 h-4 text-primary-500" />
                                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Booking Rollup</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-gray-500">Campaigns:</span>
                                  <span className="text-sm font-semibold text-gray-900">{b.campaigns.length}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                                  <span className="text-xs text-gray-500">Allocated:</span>
                                  <span className="text-sm font-semibold text-gray-900">${totalCampaignBudget.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                                  <span className="text-xs text-gray-500">Impressions:</span>
                                  <span className="text-sm font-semibold text-gray-900">{formatNumber(totalImpressions)}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <BarChart3 className="w-3.5 h-3.5 text-gray-400" />
                                  <span className="text-xs text-gray-500">Spend:</span>
                                  <span className="text-sm font-semibold text-gray-900">${totalSpend.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-1.5 ml-auto">
                                  <span className="text-xs text-gray-500">{overallocated ? "Over:" : "Remaining:"}</span>
                                  <span className={cn("text-sm font-semibold", overallocated ? "text-red-600" : remainingBudget > 0 ? "text-amber-600" : "text-green-600")}>
                                    ${Math.abs(remainingBudget).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                  </span>
                                </div>
                              </div>

                              {/* Campaign rows */}
                              <div className="space-y-2">
                                {b.campaigns.map((c) => {
                                  const campStatusCfg = CAMPAIGN_STATUS_CONFIG[c.status] || CAMPAIGN_STATUS_CONFIG.draft;
                                  const healthPct = c.budget > 0 ? Math.min(100, (c.spend / c.budget) * 100) : 0;
                                  const healthColor = healthPct > 90 ? "bg-red-400" : healthPct > 70 ? "bg-amber-400" : "bg-green-400";
                                  return (
                                    <div
                                      key={c.id}
                                      ref={c.id === fadingHighlight ? highlightRef : undefined}
                                      className={cn(
                                        "flex items-center gap-4 px-4 py-3 rounded-lg border transition-all duration-700",
                                        c.id === fadingHighlight
                                          ? "bg-green-50 border-green-300 ring-2 ring-green-200"
                                          : "bg-white border-gray-200 hover:border-gray-300"
                                      )}
                                    >
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-gray-900 text-sm truncate">{c.campaignName}</span>
                                          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium", campStatusCfg.bg, campStatusCfg.color)}>
                                            {campStatusCfg.label}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                          <span className="uppercase font-medium">{c.pricingModel}</span>
                                          <span>&middot;</span>
                                          <span>${c.budget.toLocaleString()}</span>
                                          {c.startDate && (
                                            <>
                                              <span>&middot;</span>
                                              <span>{c.startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}{c.endDate ? ` – ${c.endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}</span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4 text-xs">
                                        <div className="text-center">
                                          <span className="text-gray-500 block">Impressions</span>
                                          <span className="font-semibold text-gray-900">{formatNumber(c.impressions)}</span>
                                        </div>
                                        <div className="text-center">
                                          <span className="text-gray-500 block">Clicks</span>
                                          <span className="font-semibold text-gray-900">{formatNumber(c.clicks)}</span>
                                        </div>
                                        <div className="text-center">
                                          <span className="text-gray-500 block">CTR</span>
                                          <span className="font-semibold text-gray-900">{c.ctr.toFixed(1)}%</span>
                                        </div>
                                        <div className="text-center min-w-[60px]">
                                          <span className="text-gray-500 block">Delivery</span>
                                          <div className="flex items-center gap-1.5 mt-0.5">
                                            <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                              <div className={cn("h-full rounded-full", healthColor)} style={{ width: `${healthPct}%` }} />
                                            </div>
                                            <span className="font-semibold text-gray-700">{Math.round(healthPct)}%</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <button className="p-1.5 rounded hover:bg-gray-100 transition-colors text-primary-600" title="View Campaign">
                                          <Eye className="w-3.5 h-3.5" />
                                        </button>
                                        <button className="p-1.5 rounded hover:bg-gray-100 transition-colors text-primary-600" title="Edit Campaign">
                                          <ExternalLink className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          className="p-1.5 rounded hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500"
                                          title="Delete Campaign"
                                          onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ bookingId: b.id, campaignId: c.id, campaignName: c.campaignName }); }}
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {(derivedStatus === "approved" || derivedStatus === "in_planning" || derivedStatus === "partially_converted") && (
                                <button
                                  onClick={() => onAddCampaign(b.id)}
                                  className="mt-3 flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium px-3 py-2 rounded-lg hover:bg-primary-50 transition-colors"
                                >
                                  <PlusCircle className="w-4 h-4" />
                                  Add Campaign to this Booking
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Campaign Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Campaign</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-1">
              Are you sure you want to delete <span className="font-medium">&ldquo;{deleteConfirm.campaignName}&rdquo;</span>?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              This will remove the campaign from the Booking and recalculate the allocation status.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  removeCampaignFromBooking(deleteConfirm.bookingId, deleteConfirm.campaignId, "ops");
                  setDeleteConfirm(null);
                }}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
