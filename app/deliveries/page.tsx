"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import LiveDeliveryTracker from "@/components/procurement/LiveDeliveryTracker";
import { Truck } from "lucide-react";

export default function DeliveriesPage() {
  return (
    <AppShell>
      <div className="space-y-6 max-w-full min-w-0">
        {/* Deliveries Page Header Banner */}
        <section className="v18-card animate-v18-spring relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5F5F5] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-xs font-mono text-[#666666] dark:text-[#A3A3A3] mb-2.5">
              <Truck className="w-3.5 h-3.5 text-[#000000] dark:text-[#FFFFFF]" />
              <span>Logistics &amp; Inbound Telemetry</span>
              <span>•</span>
              <span className="text-[#000000] dark:text-[#FFFFFF] font-semibold">Live Transit Tracking</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
              Inbound Delivery Tracking
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#666666] dark:text-[#A3A3A3]">
              End-to-end waypoint tracking, carrier vehicle verification &amp; goods inspection logs.
            </p>
          </div>
        </section>

        {/* Dedicated Live Delivery Tracker View */}
        <section className="v18-card animate-v18-spring border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] text-[#000000] dark:text-[#FFFFFF] rounded-3xl p-5 sm:p-7 shadow-md">
          <LiveDeliveryTracker />
        </section>
      </div>
    </AppShell>
  );
}
