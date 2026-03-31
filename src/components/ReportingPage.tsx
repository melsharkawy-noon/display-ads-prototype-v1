"use client";

import React, { useMemo, useState } from "react";
import { useIntake } from "@/context/IntakeContext";
import { useAccount } from "@/context/AccountContext";
import type { BookingCampaign } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import {
  BarChart2,
  Calendar,
  ChevronDown,
  ChevronLeft,
  Filter,
} from "lucide-react";

// Simple aggregate metrics based on campaign stats
function aggregateMetrics(camps: BookingCampaign[]) {
  const spend = camps.reduce((s, c) => s + c.spend, 0);
  const revenue = camps.reduce((s, c) => s + c.spend * 2, 0); // mock: 2x ROAS
  const orders = camps.reduce((s, c) => s + Math.round(c.clicks * 0.05), 0);
  const clicks = camps.reduce((s, c) => s + c.clicks, 0);
  const views = camps.reduce((s, c) => s + c.impressions, 0);

  const roas = spend > 0 ? revenue / spend : 0;
  const ctr = views > 0 ? (clicks / views) * 100 : 0;
  const ecpc = clicks > 0 ? spend / clicks : 0;

  return { spend, revenue, orders, clicks, views, roas, ctr, ecpc };
}

type View = "overview" | "campaign";

export function ReportingPage() {
  const { bookings } = useIntake();
  const { activeAccount, accounts, setActiveAccountId } = useAccount();
  const [view, setView] = useState<View>("overview");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const isAgency = activeAccount.type === "agency";

  // Flatten campaigns with booking + ownership context
  const allCampaigns = useMemo(
    () =>
      bookings.flatMap((b) =>
        b.campaigns.map((c) => ({
          ...c,
          bookingName: b.bookingName,
          brandCode: b.brandCode,
        }))
      ),
    [bookings]
  );

  // Map brandCode to partner account id (prototype mapping)
  const brandToPartner: Record<string, string> = {
    samsung: "partner-samsung",
    nestle: "partner-nestle",
  };

  // Visible campaigns based on account context
  const visibleCampaigns = useMemo(() => {
    if (isAgency) {
      // Agency: only campaigns where owner is this agency (prototype: mark some by id)
      return allCampaigns.filter((c) =>
        ["C-SAM-2", "C-NES-2", "C-RAM-CLP"].includes(c.id)
      );
    }
    // Partner: all campaigns where partner matches IDP
    return allCampaigns.filter(
      (c) => brandToPartner[c.brandCode] === activeAccount.id
    );
  }, [allCampaigns, activeAccount.id, isAgency]);

  const metrics = useMemo(
    () => aggregateMetrics(visibleCampaigns),
    [visibleCampaigns]
  );

  const activeCampaign =
    view === "campaign" && selectedCampaignId
      ? visibleCampaigns.find((c) => c.id === selectedCampaignId) || null
      : null;

  if (view === "campaign" && activeCampaign) {
    const campMetrics = aggregateMetrics([activeCampaign]);
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-5">
        <button
          onClick={() => {
            setView("overview");
            setSelectedCampaignId(null);
          }}
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Reporting
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {activeCampaign.campaignName}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {activeCampaign.bookingName} · Managed Display
            </p>
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-600">
              <span>Owner: {isAgency ? activeAccount.name : "Partner"}</span>
              <span>·</span>
              <span>Partner: {activeAccount.name}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-8 gap-3">
          <KpiCard label="ROAS" value={campMetrics.roas.toFixed(2)} />
          <KpiCard label="Revenue" value={formatCurrency(campMetrics.revenue, "USD")} />
          <KpiCard label="Spend" value={formatCurrency(campMetrics.spend, "USD")} />
          <KpiCard label="eCPC" value={formatCurrency(campMetrics.ecpc, "USD")} />
          <KpiCard
            label="CPS"
            value={formatCurrency(
              campMetrics.orders ? campMetrics.spend / campMetrics.orders : 0,
              "USD"
            )}
          />
          <KpiCard label="CTR" value={`${campMetrics.ctr.toFixed(2)}%`} />
          <KpiCard
            label="CVR"
            value={`${
              campMetrics.orders && campMetrics.clicks
                ? ((campMetrics.orders / campMetrics.clicks) * 100).toFixed(2)
                : "0.00"
            }%`}
          />
          <KpiCard label="Orders" value={formatNumber(campMetrics.orders)} />
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-900">
                Performance
              </span>
              <div className="flex items-center gap-2 text-xs">
                <button className="px-2.5 py-1 rounded-full border border-primary-400 bg-primary-50 text-primary-700">
                  Revenue
                </button>
                <button className="px-2.5 py-1 rounded-full border border-gray-200 text-gray-600">
                  Spend
                </button>
                <button className="px-2.5 py-1 rounded-full border border-gray-200 text-gray-600">
                  CTR
                </button>
              </div>
            </div>
            <div className="h-40 rounded-lg bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-400">
              Campaign-level time-series chart (prototype placeholder)
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-primary-500" />
            Reporting
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {activeAccount.type === "partner"
              ? `${activeAccount.code ?? "IDP"} | ${activeAccount.name}`
              : `${activeAccount.name} Agency Account`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Account</span>
          <select
            value={activeAccount.id}
            onChange={(e) => setActiveAccountId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.type === "partner"
                  ? `${a.code ?? ""} ${a.name}`.trim()
                  : `${a.name} (Agency)`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span>01/03/2026 – 31/03/2026</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </button>
        <div className="relative">
          <select className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white">
            <option>Status: All</option>
            <option>Active</option>
            <option>Paused</option>
            <option>Completed</option>
          </select>
          <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-6 gap-3">
        <KpiCard label="ROAS" value={metrics.roas.toFixed(2)} />
        <KpiCard label="Revenue" value={formatCurrency(metrics.revenue, "USD")} />
        <KpiCard label="Spend" value={formatCurrency(metrics.spend, "USD")} />
        <KpiCard label="eCPC" value={formatCurrency(metrics.ecpc, "USD")} />
        <KpiCard label="CTR" value={`${metrics.ctr.toFixed(2)}%`} />
        <KpiCard label="Orders" value={formatNumber(metrics.orders)} />
      </div>

      {/* Overview performance chart */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-900">Performance</span>
            <div className="flex items-center gap-2 text-xs">
              <button className="px-2.5 py-1 rounded-full border border-primary-400 bg-primary-50 text-primary-700">
                Revenue
              </button>
              <button className="px-2.5 py-1 rounded-full border border-gray-200 text-gray-600">
                Spend
              </button>
              <button className="px-2.5 py-1 rounded-full border border-gray-200 text-gray-600">
                CTR
              </button>
            </div>
          </div>
          <div className="h-40 rounded-lg bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-400">
            Overview time-series chart (prototype placeholder)
          </div>
        </CardContent>
      </Card>

      {/* Campaign table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                <th className="text-left px-3 py-3 font-medium text-gray-600">
                  Campaign
                </th>
                <th className="text-left px-3 py-3 font-medium text-gray-600">
                  Budget
                </th>
                <th className="text-left px-3 py-3 font-medium text-gray-600">
                  Spend
                </th>
                <th className="text-left px-3 py-3 font-medium text-gray-600">
                  Revenue
                </th>
                <th className="text-left px-3 py-3 font-medium text-gray-600">
                  ROAS
                </th>
                <th className="text-right px-3 py-3 font-medium text-gray-600">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleCampaigns.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-gray-400"
                  >
                    No campaigns for this account in the selected period.
                  </td>
                </tr>
              ) : (
                visibleCampaigns.map((c) => {
                  const m = aggregateMetrics([c]);
                  const createdByAgency = ["C-SAM-2", "C-NES-2", "C-RAM-CLP"].includes(
                    c.id
                  );
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-gray-100 hover:bg-gray-50/80 cursor-pointer"
                      onClick={() => {
                        setSelectedCampaignId(c.id);
                        setView("campaign");
                      }}
                    >
                      <td className="px-3 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 truncate">
                            {c.campaignName}
                          </span>
                          <span className="text-[11px] text-gray-400 truncate">
                            {c.bookingName}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {createdByAgency
                              ? "Created by Agency"
                              : "Created by Partner"}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-700">
                        {formatCurrency(c.budget, "USD")}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-700">
                        {formatCurrency(m.spend, "USD")}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-700">
                        {formatCurrency(m.revenue, "USD")}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-700">
                        {m.roas.toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-right text-xs text-gray-500">
                        {c.status}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-[11px] font-medium text-gray-500 mb-1">{label}</p>
        <p className="text-lg font-semibold text-gray-900">{value}</p>
      </CardContent>
    </Card>
  );
}

