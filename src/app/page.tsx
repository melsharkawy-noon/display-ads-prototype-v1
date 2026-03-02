"use client";

import { useState } from "react";
import { SinglePageFlow } from "@/components/SinglePageFlow";
import { CalendarOverview } from "@/components/CalendarOverview";
import { PlusCircle, Calendar, LayoutGrid } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"builder" | "calendar">("builder");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo / Brand */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                <LayoutGrid className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-gray-900">Display Ads</span>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center">
              <button
                onClick={() => setActiveTab("builder")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "builder"
                    ? "border-primary-500 text-primary-600 bg-primary-50/50"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                Campaign Builder
              </button>
              <button
                onClick={() => setActiveTab("calendar")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "calendar"
                    ? "border-primary-500 text-primary-600 bg-primary-50/50"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Calendar className="w-4 h-4" />
                Calendar Overview
              </button>
            </div>

            {/* Right side placeholder */}
            <div className="w-32" />
          </div>
        </div>
      </nav>

      {/* Content */}
      {activeTab === "builder" ? <SinglePageFlow /> : <CalendarOverview />}
    </div>
  );
}
