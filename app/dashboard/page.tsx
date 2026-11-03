"use client";

import Image from "next/image";
import ConstructionDashboard from "@/components/dashboard/ConstructionDashboard";
import AppShell from "@/components/layout/AppShell";

export default function DashboardPage() {
  const dashboardBackground = (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none">
      {/* 100% Pure Monochrome Architectural Construction Photography */}
      <Image
        src="/images/construction-dashboard.jpg"
        alt="Apex Developments Commercial Construction Project"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center opacity-30 dark:opacity-20 grayscale transition-opacity duration-300"
      />
      {/* Neutral Atmospheric Contrast Veil */}
      <div className="absolute inset-0 bg-[#FAFAFA]/70 dark:bg-[#000000]/75 transition-colors duration-300" />
      {/* Architectural Precision Blueprint Grid */}
      <div
        className="absolute inset-0 opacity-20 dark:opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(128,128,128,0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(128,128,128,0.08) 1px, transparent 1px)
          `,
          backgroundSize: "36px 36px",
        }}
      />
    </div>
  );

  return (
    <AppShell background={dashboardBackground}>
      <div className="relative z-10 space-y-6">
        <ConstructionDashboard />
      </div>
    </AppShell>
  );
}
