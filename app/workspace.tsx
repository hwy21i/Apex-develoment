"use client";

import AppShell from "@/components/layout/AppShell";
import ConstructionDashboard from "@/components/dashboard/ConstructionDashboard";

export default function Workspace({ onLogout }: { onLogout: () => void }) {
  return (
    <AppShell onLogout={onLogout}>
      <ConstructionDashboard />
    </AppShell>
  );
}
