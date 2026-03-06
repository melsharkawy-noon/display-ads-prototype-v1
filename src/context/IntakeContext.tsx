"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import {
  BookingIntake,
  BookingCampaign,
  ActorType,
  ActivityLogEntry,
  createInitialBooking,
  createMockBookings,
  deriveConversionStatus,
} from "@/lib/types";

interface IntakeContextType {
  bookings: BookingIntake[];
  activeBookingId: string | null;
  intake: BookingIntake;
  updateIntake: (updates: Partial<BookingIntake>) => void;
  saveBooking: (actorType: ActorType, detail?: string) => void;
  createBooking: () => BookingIntake;
  selectBooking: (id: string | null) => void;
  deleteBooking: (id: string) => void;
  addCampaignToBooking: (bookingId: string, campaign: BookingCampaign) => void;
  removeCampaignFromBooking: (bookingId: string, campaignId: string, actorType: ActorType) => void;
}

const IntakeContext = createContext<IntakeContextType | undefined>(undefined);

function recomputeStatus(booking: BookingIntake): BookingIntake {
  const { status: derived } = deriveConversionStatus(booking);
  if (derived !== booking.status) {
    return { ...booking, status: derived };
  }
  return booking;
}

export function IntakeProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<BookingIntake[]>(() =>
    createMockBookings().map(recomputeStatus)
  );
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);

  const activeBooking = activeBookingId
    ? bookings.find((b) => b.id === activeBookingId) ?? null
    : null;

  const placeholderBooking = React.useRef(createInitialBooking());

  const updateIntake = useCallback(
    (updates: Partial<BookingIntake>) => {
      if (!activeBookingId) return;
      const now = new Date();
      setBookings((prev) =>
        prev.map((b) => {
          if (b.id !== activeBookingId) return b;
          const updated = { ...b, ...updates, lastUpdated: now };
          return recomputeStatus(updated);
        })
      );
    },
    [activeBookingId]
  );

  const saveBooking = useCallback(
    (actorType: ActorType, detail?: string) => {
      if (!activeBookingId) return;
      const now = new Date();
      const actorLabel = actorType === "sales" ? "Sales" : actorType === "ops" ? "Ops" : actorType;
      const actorEmail =
        actorType === "sales" ? "sales.user@noon.com" : "ops.user@noon.com";

      setBookings((prev) =>
        prev.map((b) => {
          if (b.id !== activeBookingId) return b;
          const wasApproved = b.approvedAt !== null;
          const action = wasApproved
            ? `Booking updated after approval by ${actorLabel}`
            : `Edited by ${actorLabel}`;
          const logEntry: ActivityLogEntry = {
            id: Date.now().toString(),
            timestamp: now,
            action,
            actor: actorEmail,
            actorType,
            detail,
          };
          const updated = {
            ...b,
            activityLog: [...b.activityLog, logEntry],
            lastUpdated: now,
          };
          return recomputeStatus(updated);
        })
      );
    },
    [activeBookingId]
  );

  const createBooking = useCallback(() => {
    const newBooking = createInitialBooking();
    setBookings((prev) => [newBooking, ...prev]);
    setActiveBookingId(newBooking.id);
    return newBooking;
  }, []);

  const selectBooking = useCallback((id: string | null) => {
    setActiveBookingId(id);
  }, []);

  const deleteBooking = useCallback(
    (id: string) => {
      setBookings((prev) => prev.filter((b) => b.id !== id));
      if (activeBookingId === id) setActiveBookingId(null);
    },
    [activeBookingId]
  );

  const addCampaignToBooking = useCallback(
    (bookingId: string, campaign: BookingCampaign) => {
      const now = new Date();
      setBookings((prev) =>
        prev.map((b) => {
          if (b.id !== bookingId) return b;
          const updatedCampaigns = [...b.campaigns, campaign];
          const logEntry: ActivityLogEntry = {
            id: Date.now().toString(),
            timestamp: now,
            action: `Campaign added: ${campaign.campaignName}`,
            actor: "ops.user@noon.com",
            actorType: "ops",
          };
          const updated = {
            ...b,
            campaigns: updatedCampaigns,
            activityLog: [...b.activityLog, logEntry],
            lastUpdated: now,
          };
          return recomputeStatus(updated);
        })
      );
    },
    []
  );

  const removeCampaignFromBooking = useCallback(
    (bookingId: string, campaignId: string, actorType: ActorType) => {
      const now = new Date();
      const actorLabel = actorType === "sales" ? "Sales" : "Ops";
      const actorEmail = actorType === "sales" ? "sales.user@noon.com" : "ops.user@noon.com";
      setBookings((prev) =>
        prev.map((b) => {
          if (b.id !== bookingId) return b;
          const campaign = b.campaigns.find((c) => c.id === campaignId);
          const campaignName = campaign?.campaignName ?? campaignId;
          const logEntry: ActivityLogEntry = {
            id: Date.now().toString(),
            timestamp: now,
            action: `Campaign '${campaignName}' removed from Booking by ${actorLabel}`,
            actor: actorEmail,
            actorType,
          };
          const updated = {
            ...b,
            campaigns: b.campaigns.filter((c) => c.id !== campaignId),
            activityLog: [...b.activityLog, logEntry],
            lastUpdated: now,
          };
          return recomputeStatus(updated);
        })
      );
    },
    []
  );

  return (
    <IntakeContext.Provider
      value={{
        bookings,
        activeBookingId,
        intake: activeBooking || placeholderBooking.current,
        updateIntake,
        saveBooking,
        createBooking,
        selectBooking,
        deleteBooking,
        addCampaignToBooking,
        removeCampaignFromBooking,
      }}
    >
      {children}
    </IntakeContext.Provider>
  );
}

export function useIntake() {
  const context = useContext(IntakeContext);
  if (context === undefined) {
    throw new Error("useIntake must be used within an IntakeProvider");
  }
  return context;
}
