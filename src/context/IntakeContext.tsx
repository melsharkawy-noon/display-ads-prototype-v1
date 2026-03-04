"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { BookingIntake, createInitialBooking, createMockBookings } from "@/lib/types";

interface IntakeContextType {
  bookings: BookingIntake[];
  activeBookingId: string | null;
  intake: BookingIntake;
  updateIntake: (updates: Partial<BookingIntake>) => void;
  createBooking: () => BookingIntake;
  selectBooking: (id: string | null) => void;
  deleteBooking: (id: string) => void;
}

const IntakeContext = createContext<IntakeContextType | undefined>(undefined);

export function IntakeProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<BookingIntake[]>(createMockBookings);
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
        prev.map((b) =>
          b.id === activeBookingId ? { ...b, ...updates, lastUpdated: now } : b
        )
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

  return (
    <IntakeContext.Provider
      value={{
        bookings,
        activeBookingId,
        intake: activeBooking || placeholderBooking.current,
        updateIntake,
        createBooking,
        selectBooking,
        deleteBooking,
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
