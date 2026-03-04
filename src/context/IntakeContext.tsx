"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { BookingIntake, createInitialBooking } from "@/lib/types";

interface IntakeContextType {
  intake: BookingIntake;
  updateIntake: (updates: Partial<BookingIntake>) => void;
  resetIntake: () => void;
  convertedIntakeId: string | null;
  setConvertedIntakeId: (id: string | null) => void;
}

const IntakeContext = createContext<IntakeContextType | undefined>(undefined);

export function IntakeProvider({ children }: { children: ReactNode }) {
  const [intake, setIntake] = useState<BookingIntake>(createInitialBooking);
  const [convertedIntakeId, setConvertedIntakeId] = useState<string | null>(null);

  const updateIntake = useCallback((updates: Partial<BookingIntake>) => {
    setIntake((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetIntake = useCallback(() => {
    setIntake(createInitialBooking());
  }, []);

  return (
    <IntakeContext.Provider
      value={{ intake, updateIntake, resetIntake, convertedIntakeId, setConvertedIntakeId }}
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
