"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";
import { RoleType } from "@/types/erp";
import { useAuth } from "@/components/AuthProvider";

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
  onRoleChange?: (role: RoleType) => void;
  onLogout?: () => void;
}

export default function AppShell({
  children,
  onRoleChange,
  onLogout,
}: AppShellProps) {
  const { user, status, refreshUser, logout } = useAuth();
  const router = useRouter();
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

  const authenticatedUserName = user?.fullName || "Signed out";
  const authenticatedUserRole = user?.role;
  const handleLogout = onLogout || logout;

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/Authpage");
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return <div className="grid min-h-screen place-items-center bg-[#f4f5f7] text-sm text-slate-500 dark:bg-[#0f1115] dark:text-slate-300">Verifying session…</div>;
  }

  if (status === "service-error") {
    return <div className="grid min-h-screen place-items-center bg-[#f4f5f7] p-6 text-center dark:bg-[#0f1115]"><div><p className="text-sm text-slate-600 dark:text-slate-300">Unable to verify your session.</p><button type="button" onClick={() => void refreshUser()} className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Try again</button></div></div>;
  }

  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery }}>
      <div className="erp-app-shell min-h-screen w-full overflow-x-hidden bg-[#f4f5f7] font-sans text-slate-900 dark:bg-[#0f1115] dark:text-slate-100">
        <AppSidebar
          isMobileOpen={isMobileOpen}
          onMobileClose={() => setIsMobileOpen(false)}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          userName={authenticatedUserName}
          userRole={authenticatedUserRole}
          onRoleChange={onRoleChange}
          onLogout={handleLogout}
        />

        {/* Main Content — offset matches sidebar width at every breakpoint:
             md (tablet):  sidebar visible, auto-collapsed to 80px  → md:pl-20
             lg (desktop): sidebar expanded 256px / collapsed 80px  → lg:pl-64 / lg:pl-20 */}
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
            userName={authenticatedUserName}
          userRole={authenticatedUserRole}
            onLogout={handleLogout}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* Dynamic Page Content */}
          <main className="mx-auto w-full max-w-[1800px] flex-1 overflow-x-hidden p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </SearchContext.Provider>
  );
}
