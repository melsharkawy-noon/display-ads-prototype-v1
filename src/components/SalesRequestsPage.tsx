"use client";

import React, { useMemo, useState } from "react";
import { useIntake } from "@/context/IntakeContext";
import { cn } from "@/lib/utils";
import { BookingStatus, AED_TO_USD_RATE } from "@/lib/types";
import { brands } from "@/lib/mock-data";
import { Button } from "@/components/ui/Button";
import {
  Plus,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  ClipboardList,
  Eye,
  Pencil,
  AlertCircle,
  Filter,
} from "lucide-react";

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  draft: { label: "Draft", color: "text-gray-700", bg: "bg-gray-100", dot: "bg-gray-400" },
  pending_approval: {
    label: "Pending Approval",
    color: "text-amber-700",
    bg: "bg-amber-50",
    dot: "bg-amber-400",
  },
  approved: {
    label: "Approved",
    color: "text-blue-700",
    bg: "bg-blue-50",
    dot: "bg-blue-400",
  },
  rejected: { label: "Rejected", color: "text-red-700", bg: "bg-red-50", dot: "bg-red-400" },
  ready_for_ops: {
    label: "Ready for Ops",
    color: "text-purple-700",
    bg: "bg-purple-50",
    dot: "bg-purple-400",
  },
  converted: {
    label: "Converted",
    color: "text-green-700",
    bg: "bg-green-50",
    dot: "bg-green-500",
  },
};

const COUNTRY_LABELS: Record<string, string> = {
  AE: "UAE",
  SA: "KSA",
  EG: "Egypt",
  OTHER: "Other",
};

const ADV_TYPE_LABELS: Record<string, string> = {
  "1P": "1P",
  "3P": "3P",
  marketplace: "Marketplace",
};

type SortField = "lastUpdated" | "netBudget" | "status";
type SortDir = "asc" | "desc";

interface SalesRequestsPageProps {
  onOpenBooking: (id: string) => void;
  onNewBooking: () => void;
}

function isIncomplete(b: { bookingName: string; partnerLeCode: string; brandCode: string; advertiserType: string; advertiserCountry: string; campaignCountry: string; finalBudget: number; adAssetTypes: readonly string[] }) {
  return (
    !b.bookingName.trim() ||
    !b.partnerLeCode.trim() ||
    !b.brandCode ||
    !b.advertiserType ||
    !b.advertiserCountry ||
    !b.campaignCountry ||
    b.finalBudget <= 0 ||
    b.adAssetTypes.length === 0
  );
}

export function SalesRequestsPage({ onOpenBooking, onNewBooking }: SalesRequestsPageProps) {
  const { bookings } = useIntake();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "">("");
  const [countryFilter, setCountryFilter] = useState("");
  const [advTypeFilter, setAdvTypeFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("lastUpdated");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const brandMap = useMemo(() => {
    const m: Record<string, string> = {};
    brands.forEach((b) => { m[b.id] = b.name; });
    return m;
  }, []);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const filteredBookings = useMemo(() => {
    let list = [...bookings];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (b) =>
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
      if (sortField === "lastUpdated") {
        cmp = a.lastUpdated.getTime() - b.lastUpdated.getTime();
      } else if (sortField === "netBudget") {
        const netA = a.finalBudget * (1 - a.discountPercent / 100);
        const netB = b.finalBudget * (1 - b.discountPercent / 100);
        cmp = netA - netB;
      } else if (sortField === "status") {
        const order: Record<BookingStatus, number> = {
          draft: 0,
          pending_approval: 1,
          approved: 2,
          ready_for_ops: 3,
          converted: 4,
          rejected: 5,
        };
        cmp = order[a.status] - order[b.status];
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [bookings, searchQuery, statusFilter, countryFilter, advTypeFilter, sortField, sortDir, brandMap]);

  const hasFilters = searchQuery || statusFilter || countryFilter || advTypeFilter;

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setCountryFilter("");
    setAdvTypeFilter("");
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-gray-400" />;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3 text-primary-500" />
    ) : (
      <ChevronDown className="w-3 h-3 text-primary-500" />
    );
  };

  // ── Empty: No bookings at all ──
  if (bookings.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <ClipboardList className="w-8 h-8 text-primary-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No booking requests yet</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
          Create your first booking intake to start the sales approval and ops handoff process.
        </p>
        <Button size="lg" onClick={onNewBooking}>
          <Plus className="w-4 h-4 mr-2" />
          Create your first booking
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Requests</h1>
          <p className="text-sm text-gray-500 mt-1">
            {bookings.length} booking{bookings.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button onClick={onNewBooking}>
          <Plus className="w-4 h-4 mr-2" />
          New Booking
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
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
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as BookingStatus | "")}
            className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Statuses</option>
            {(Object.keys(STATUS_CONFIG) as BookingStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_CONFIG[s].label}
              </option>
            ))}
          </select>
          <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>

        {/* Country Filter */}
        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Countries</option>
          {Object.entries(COUNTRY_LABELS).map(([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>

        {/* Advertiser Type Filter */}
        <select
          value={advTypeFilter}
          onChange={(e) => setAdvTypeFilter(e.target.value)}
          className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Types</option>
          {Object.entries(ADV_TYPE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-primary-600 hover:text-primary-700 hover:underline whitespace-nowrap"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filteredBookings.length === 0 ? (
          <div className="py-16 text-center">
            <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600">No matching requests</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
            <button
              onClick={clearFilters}
              className="mt-4 text-sm text-primary-600 hover:text-primary-700 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Booking Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Brand</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">
                    LE Code
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Country</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    <button
                      onClick={() => toggleSort("netBudget")}
                      className="flex items-center gap-1 hover:text-gray-900"
                    >
                      Net Budget <SortIcon field="netBudget" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    <button
                      onClick={() => toggleSort("status")}
                      className="flex items-center gap-1 hover:text-gray-900"
                    >
                      Status <SortIcon field="status" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden xl:table-cell">
                    Created By
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    <button
                      onClick={() => toggleSort("lastUpdated")}
                      className="flex items-center gap-1 hover:text-gray-900"
                    >
                      Updated <SortIcon field="lastUpdated" />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => {
                  const net = b.finalBudget * (1 - b.discountPercent / 100);
                  const statusCfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.draft;
                  const incomplete = b.status === "draft" && isIncomplete(b);

                  return (
                    <tr
                      key={b.id}
                      onClick={() => onOpenBooking(b.id)}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/80 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 truncate max-w-[200px]">
                            {b.bookingName || (
                              <span className="text-gray-400 italic">Untitled</span>
                            )}
                          </span>
                          {incomplete && (
                            <span title="Missing required fields" className="flex-shrink-0">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {brandMap[b.brandCode] || b.brandCode || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs hidden lg:table-cell">
                        {b.partnerLeCode || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {ADV_TYPE_LABELS[b.advertiserType] || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {COUNTRY_LABELS[b.campaignCountry] || b.campaignCountry || "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                        {net > 0
                          ? `${b.currency === "USD" ? "$" : ""}${net.toLocaleString(undefined, { maximumFractionDigits: 0 })}${b.currency === "AED" ? " AED" : ""}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                            statusCfg.bg,
                            statusCfg.color
                          )}
                        >
                          <span className={cn("w-1.5 h-1.5 rounded-full", statusCfg.dot)} />
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs hidden xl:table-cell">
                        {b.salesEmail}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {b.lastUpdated.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                        <span className="text-gray-400 ml-1">
                          {b.lastUpdated.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenBooking(b.id);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 px-2 py-1 rounded hover:bg-primary-50 transition-colors"
                        >
                          {b.status === "draft" ? (
                            <>
                              <Pencil className="w-3 h-3" /> Edit
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3" /> View
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
