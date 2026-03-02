"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  selected?: boolean;
  onClick?: () => void;
  hoverable?: boolean;
}

export function Card({
  children,
  className,
  selected,
  onClick,
  hoverable = false,
}: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border-2 transition-all overflow-hidden",
        selected
          ? "border-primary-500 ring-2 ring-primary-100"
          : "border-gray-200",
        hoverable && !selected && "hover:border-gray-300 hover:shadow-md",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("p-4 border-b border-gray-100", className)}>{children}</div>;
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("p-4 overflow-hidden", className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl", className)}>{children}</div>;
}
