"use client";

import React, { createContext, useContext, useMemo, useState, ReactNode } from "react";
import type {
  Account,
  AccessAdFormat,
  AccessControlLogEntry,
  AccessRelationship,
  AccessStatus,
  AccessType,
} from "@/lib/types";

interface AccountContextValue {
  accounts: Account[];
  activeAccount: Account;
  setActiveAccountId: (id: string) => void;
  accessRelationships: AccessRelationship[];
  accessLogs: AccessControlLogEntry[];
  createAccessRelationship: (input: {
    partnerAccountId: string;
    agencyAccountId: string;
    accessType: AccessType;
    allowedFormats: AccessAdFormat[];
    startDate: Date;
    expiryDate: Date;
    approver: string;
    notes?: string;
  }) => void;
  updateAccessRelationship: (id: string, updates: Partial<{
    accessType: AccessType;
    allowedFormats: AccessAdFormat[];
    startDate: Date;
    expiryDate: Date;
    status: AccessStatus;
    approver: string;
    notes: string;
  }>) => void;
  revokeAccessRelationship: (id: string) => void;
  getAgencyPartnerAccess: (agencyId: string) => AccessRelationship[];
}

const AccountContext = createContext<AccountContextValue | undefined>(undefined);

const MOCK_ACCOUNTS: Account[] = [
  { id: "partner-samsung", name: "Samsung IDP", type: "partner", code: "9999" },
  { id: "partner-loreal", name: "L’Oréal IDP", type: "partner", code: "8877" },
  { id: "partner-apple", name: "Apple IDP", type: "partner", code: "5544" },
  { id: "partner-nestle", name: "Nestlé IDP", type: "partner", code: "8888" },
  { id: "agency-publicis", name: "Publicis", type: "agency" },
  { id: "agency-groupm", name: "GroupM", type: "agency" },
  { id: "agency-wpp", name: "WPP", type: "agency" },
];

export function AccountProvider({ children }: { children: ReactNode }) {
  const [accounts] = useState<Account[]>(MOCK_ACCOUNTS);
  const [activeAccountId, setActiveAccountId] = useState<string>("partner-samsung");
  const [accessRelationships, setAccessRelationships] = useState<AccessRelationship[]>([
    {
      id: "rel-samsung-publicis",
      partnerAccountId: "partner-samsung",
      partnerAccountName: "Samsung IDP",
      partnerCode: "9999",
      agencyAccountId: "agency-publicis",
      agencyAccountName: "Publicis",
      accessType: "write",
      allowedFormats: ["Display Ads", "Brand Ads"],
      startDate: new Date("2026-01-01"),
      expiryDate: new Date("2026-12-31"),
      status: "active",
      approver: "Fatima Al Noor",
      notes: "Primary agency for managed display",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    },
    {
      id: "rel-loreal-groupm",
      partnerAccountId: "partner-loreal",
      partnerAccountName: "L’Oréal IDP",
      partnerCode: "8877",
      agencyAccountId: "agency-groupm",
      agencyAccountName: "GroupM",
      accessType: "view",
      allowedFormats: ["Display Ads"],
      startDate: new Date("2026-01-10"),
      expiryDate: new Date("2026-10-31"),
      status: "active",
      approver: "Ahmed Khan",
      notes: "View-only while onboarding",
      createdAt: new Date("2026-01-10"),
      updatedAt: new Date("2026-01-10"),
    },
    {
      id: "rel-apple-wpp",
      partnerAccountId: "partner-apple",
      partnerAccountName: "Apple IDP",
      partnerCode: "5544",
      agencyAccountId: "agency-wpp",
      agencyAccountName: "WPP",
      accessType: "write",
      allowedFormats: ["PLA", "Brand Ads"],
      startDate: new Date("2025-11-01"),
      expiryDate: new Date("2026-02-15"),
      status: "expired",
      approver: "Omar Saleh",
      notes: "Pilot contract expired",
      createdAt: new Date("2025-11-01"),
      updatedAt: new Date("2026-02-15"),
    },
  ]);
  const [accessLogs, setAccessLogs] = useState<AccessControlLogEntry[]>([]);

  const activeAccount =
    accounts.find((a) => a.id === activeAccountId) ?? accounts[0];

  const createAccessRelationship: AccountContextValue["createAccessRelationship"] = (input) => {
    const partner = accounts.find((a) => a.id === input.partnerAccountId);
    const agency = accounts.find((a) => a.id === input.agencyAccountId);
    if (!partner || !agency) return;
    const now = new Date();
    const rel: AccessRelationship = {
      id: `rel-${now.getTime()}`,
      partnerAccountId: partner.id,
      partnerAccountName: partner.name,
      partnerCode: partner.code || "",
      agencyAccountId: agency.id,
      agencyAccountName: agency.name,
      accessType: input.accessType,
      allowedFormats: input.allowedFormats,
      startDate: input.startDate,
      expiryDate: input.expiryDate,
      status: input.expiryDate < now ? "expired" : "active",
      approver: input.approver,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };
    setAccessRelationships((prev) => [rel, ...prev]);
    setAccessLogs((prev) => [
      {
        id: `log-${now.getTime()}`,
        actor: activeAccount.name,
        timestamp: now,
        action: "Access granted",
        summary: `${agency.name} granted ${input.accessType} access to ${partner.name}`,
      },
      ...prev,
    ]);
  };

  const updateAccessRelationship: AccountContextValue["updateAccessRelationship"] = (id, updates) => {
    const now = new Date();
    setAccessRelationships((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const next: AccessRelationship = {
          ...r,
          ...updates,
          updatedAt: now,
        };
        if (next.status !== "revoked" && next.expiryDate < now) {
          next.status = "expired";
        }
        return next;
      })
    );
    setAccessLogs((prev) => [
      {
        id: `log-${now.getTime()}`,
        actor: activeAccount.name,
        timestamp: now,
        action: "Access updated",
        summary: `Relationship ${id} updated`,
      },
      ...prev,
    ]);
  };

  const revokeAccessRelationship: AccountContextValue["revokeAccessRelationship"] = (id) => {
    const now = new Date();
    setAccessRelationships((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "revoked", updatedAt: now } : r
      )
    );
    setAccessLogs((prev) => [
      {
        id: `log-${now.getTime()}`,
        actor: activeAccount.name,
        timestamp: now,
        action: "Access revoked",
        summary: `Relationship ${id} revoked`,
      },
      ...prev,
    ]);
  };

  const getAgencyPartnerAccess: AccountContextValue["getAgencyPartnerAccess"] = (agencyId) =>
    accessRelationships.filter((r) => r.agencyAccountId === agencyId);

  return (
    <AccountContext.Provider
      value={{
        accounts,
        activeAccount,
        setActiveAccountId,
        accessRelationships,
        accessLogs,
        createAccessRelationship,
        updateAccessRelationship,
        revokeAccessRelationship,
        getAgencyPartnerAccess,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) {
    throw new Error("useAccount must be used within an AccountProvider");
  }
  return ctx;
}

