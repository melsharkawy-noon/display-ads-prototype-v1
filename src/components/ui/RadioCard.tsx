"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface RadioCardProps {
  selected: boolean;
  onClick: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  disabled?: boolean;
  badge?: string;
}

export function RadioCard({
  selected,
  onClick,
  title,
  description,
  children,
  disabled,
  badge,
}: RadioCardProps) {
  return (
    <div
      onClick={() => !disabled && onClick()}
      className={cn(
        "relative p-4 rounded-xl border-2 transition-all cursor-pointer",
        selected
          ? "border-primary-500 bg-primary-50/50 ring-1 ring-primary-200"
          : "border-gray-200 hover:border-gray-300 bg-white",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
            selected ? "border-primary-500 bg-primary-500" : "border-gray-300"
          )}
        >
          {selected && (
            <div className="w-2 h-2 rounded-full bg-white" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900">{title}</h4>
            {badge && (
              <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-gray-500 mt-0.5">{description}</p>
          )}
          {children && <div className="mt-3">{children}</div>}
        </div>
      </div>
    </div>
  );
}
