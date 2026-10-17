"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";
import { RoleType } from "@/types/erp";
import { useCurrentUser } from "@/components/auth/UserProvider";
import { LogOut, X, Loader2 } from "lucide-react";

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
  /** When provided (e.g. from Workspace), override the context user name */
  userName?: string;
  /** When provided (e.g. from Workspace), override the context user role */
  userRole?: RoleType;
  userEmail?: string;
  onRoleChange?: (role: RoleType) => void;
  onLogout?: () => void;
}

export default function AppShell({
  children,
  userName: nameProp,
  userRole: roleProp,
  userEmail,
  onRoleChange,
  onLogout: onLogoutProp,
}: AppShellProps) {
  const { user, logout } = useCurrentUser();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Resolve user identity: explicit prop → context → undefined (never hardcode a name/role)
  const userName = nameProp || user?.fullName || "";
  const userRole = roleProp || user?.role;
  const resolvedEmail = userEmail || user?.email;

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

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showLogoutModal) setShowLogoutModal(false);
        if (isMobileOpen) setIsMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen, showLogoutModal]);

  const handleTriggerLogout = () => {
    if (onLogoutProp) {
      onLogoutProp();
    } else {
      setShowLogoutModal(true);
    }
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery }}>
      <div className="min-h-screen w-full overflow-x-hidden bg-[#F9FAFB] dark:bg-[#0B0B0B] font-sans text-[#111827] dark:text-[#FFFFFF] transition-colors relative">
        <AppSidebar
          isMobileOpen={isMobileOpen}
          onMobileClose={() => setIsMobileOpen(false)}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          userName={userName}
          userRole={userRole}
          onRoleChange={onRoleChange}
          onLogout={handleTriggerLogout}
        />

        {/* Main Content Area */}
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
            userEmail={resolvedEmail}
            onLogout={handleTriggerLogout}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* Dynamic Page Content */}
          <main className="mx-auto w-full max-w-[1800px] flex-1 overflow-x-hidden p-3.5 sm:p-5 lg:p-7 relative z-1">
            {children}
          </main>
        </div>

        {/* Logout Confirmation Modal */}
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-sm bg-[#FFFFFF] dark:bg-[#1F1F1F] border border-[#E5E7EB] dark:border-[#2A2A2A] rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] dark:bg-[#141414] border border-[#E5E7EB] dark:border-[#2A2A2A] text-[#111827] dark:text-[#FFFFFF] flex items-center justify-center shrink-0">
                  <LogOut className="w-5 h-5" />
                </div>
                <button
                  onClick={() => setShowLogoutModal(false)}
                  disabled={isLoggingOut}
                  className="p-1.5 rounded-lg text-[#6B7280] dark:text-[#A1A1A1] hover:bg-[#F3F4F6] dark:hover:bg-[#252525] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#111827] dark:text-[#FFFFFF]">
                  Confirm Sign Out
                </h3>
                <p className="mt-1 text-xs text-[#6B7280] dark:text-[#A1A1A1] leading-relaxed">
                  Are you sure you want to log out of APEX ERP{userName ? `, ${userName}` : ""}? All active tokens and role sessions will be cleared.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(false)}
                  disabled={isLoggingOut}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#111827] dark:text-[#FFFFFF] hover:bg-[#F3F4F6] dark:hover:bg-[#252525] border border-[#E5E7EB] dark:border-[#2A2A2A] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLogout}
                  disabled={isLoggingOut}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#FFFFFF] dark:text-[#111111] bg-[#111111] dark:bg-[#FFFFFF] hover:opacity-90 border border-transparent transition-opacity shadow-xs"
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Signing Out...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SearchContext.Provider>
  );
}
