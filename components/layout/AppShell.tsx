"use client";

import React, { useState, useEffect } from "react";
import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";
import { RoleType } from "@/types/erp";

interface AppShellProps {
  children: React.ReactNode;
  userName?: string;
  userRole?: RoleType;
  onRoleChange?: (role: RoleType) => void;
  onLogout?: () => void;
}

export default function AppShell({
  children,
  userName = "Abebe Bekele",
  userRole = "Admin",
  onRoleChange,
  onLogout,
}: AppShellProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Close mobile sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen]);

  return (
    <div className="min-h-screen bg-[#0F1117] text-slate-100 flex flex-col font-sans">
      {/* ─── Responsive Left Navigation Sidebar ─── */}
      <AppSidebar
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        userName={userName}
        userRole={userRole}
        onRoleChange={onRoleChange}
        onLogout={onLogout}
      />

      {/* ─── Main Content Canvas (Adjusts when desktop sidebar collapses) ─── */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        {/* Top Header */}
        <AppHeader
          isMobileSidebarOpen={isMobileOpen}
          onToggleMobileSidebar={() => setIsMobileOpen(!isMobileOpen)}
          userName={userName}
          userRole={userRole}
          onLogout={onLogout}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}

