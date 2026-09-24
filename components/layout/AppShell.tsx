"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";
import { RoleType } from "@/types/erp";

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const SearchContext = createContext<SearchContextType>({
  searchQuery: "",
  setSearchQuery: () => {},
});

export const useSearch = () => useContext(SearchContext);

interface AppShellProps {
  children: React.ReactNode;
  userName?: string;
  userRole?: RoleType;
  userEmail?: string;
  onRoleChange?: (role: RoleType) => void;
  onLogout?: () => void;
}

export default function AppShell({
  children,
  userName = "Abebe Bekele",
  userRole = "Admin",
  userEmail,
  onRoleChange,
  onLogout,
}: AppShellProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Responsive sidebar auto-collapse on tablet (768px - 1023px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    <SearchContext.Provider value={{ searchQuery, setSearchQuery }}>
      <div className="min-h-screen w-full overflow-x-hidden bg-[#F5F6F7] dark:bg-[#0F1115] font-sans text-[#1C1E22] dark:text-[#E4E5E7] transition-colors">
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

        {/* Main Content Area:
            - Mobile (<768px): 0px left offset
            - Tablet (768px-1023px): 80px left offset (md:pl-20)
            - Desktop (>=1024px): 80px if collapsed, 256px if expanded (lg:pl-64 / lg:pl-20) */}
        <div
          className={`flex-1 flex flex-col min-w-0 overflow-x-hidden transition-all duration-300 ease-in-out
            md:pl-20
            ${isCollapsed ? "lg:pl-20" : "lg:pl-64"}
          `}
        >
          {/* Top Header */}
          <AppHeader
            isMobileSidebarOpen={isMobileOpen}
            onToggleMobileSidebar={() => setIsMobileOpen(!isMobileOpen)}
            userName={userName}
            userRole={userRole}
            userEmail={userEmail}
            onLogout={onLogout}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* Dynamic Page Content */}
          <main className="mx-auto w-full max-w-[1800px] flex-1 overflow-x-hidden p-3.5 sm:p-5 lg:p-7">
            {children}
          </main>
        </div>
      </div>
    </SearchContext.Provider>
  );
}
