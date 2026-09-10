"use client";

import ConstructionDashboard from "@/components/dashboard/ConstructionDashboard";
import AppShell from "@/components/layout/AppShell";

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <ConstructionDashboard />
      </div>
    </AppShell>
  );
}
