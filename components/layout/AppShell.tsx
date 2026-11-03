"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import { usePathname } from "next/navigation";
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
  background?: React.ReactNode;
}

export default function AppShell({
  children,
  userName: nameProp,
  userRole: roleProp,
  userEmail,
  onRoleChange,
  onLogout: onLogoutProp,
  background,
}: AppShellProps) {
  const { user, logout } = useCurrentUser();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Resolve user identity: authenticated context → explicit prop fallback → empty
  const userName = user?.fullName || nameProp || "";
  const userRole = user?.role || roleProp;
  const resolvedEmail = user?.email || userEmail;

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

  const pathname = usePathname();

  // Automatically dismiss mobile sidebar drawer immediately on route transition
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery }}>
      <div className="h-dvh w-full overflow-hidden flex bg-[var(--background)] text-[var(--foreground)] font-sans transition-colors relative">
        <AppSidebar
          isMobileOpen={isMobileOpen}
          onMobileClose={() => setIsMobileOpen(false)}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          userName={userName}
          userRole={userRole}
          userEmail={resolvedEmail}
          profileImage={user?.profileImage}
          onRoleChange={onRoleChange}
          onLogout={handleTriggerLogout}
        />

        {/* Right-Side Column Wrapper */}
        <div
          className={`flex-1 min-w-0 h-dvh flex flex-col overflow-hidden transition-all duration-300 ease-in-out relative
            md:pl-20
            ${isCollapsed ? "lg:pl-20" : "lg:pl-64"}
          `}
        >
          {/* Background layer behind Header and Main */}
          {background && (
            <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0">
              {background}
            </div>
          )}

          {/* Top Header */}
          <div className="shrink-0 z-30 relative">
            <AppHeader
              isMobileSidebarOpen={isMobileOpen}
              onToggleMobileSidebar={() => setIsMobileOpen(!isMobileOpen)}
              userName={userName}
              userRole={userRole}
              userEmail={resolvedEmail}
              userProfileImage={user?.profileImage}
              onLogout={handleTriggerLogout}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>

          {/* Dynamic Page Content with Smooth Transition (without black screen flash) */}
          <main
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain scroll-smooth p-3 sm:p-6 lg:p-8 relative z-10 transition-opacity duration-150"
          >
            <div className="mx-auto w-full max-w-[1800px] min-w-0 overflow-x-hidden">
              {children}
            </div>
          </main>
        </div>

        {/* Logout Confirmation Modal */}
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
            <div className="relative w-full max-w-sm max-h-[88vh] flex flex-col overflow-hidden bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] flex items-center justify-center shrink-0">
                  <LogOut className="w-5 h-5" />
                </div>
                <button
                  onClick={() => setShowLogoutModal(false)}
                  disabled={isLoggingOut}
                  className="p-1.5 rounded-lg text-[#666666] dark:text-[#A3A3A3] hover:bg-[#FAFAFA] dark:hover:bg-[#1F1F1F] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">
                  Confirm Sign Out
                </h3>
                <p className="mt-1 text-xs text-[#666666] dark:text-[#A3A3A3] leading-relaxed">
                  Are you sure you want to log out of APEX ERP{userName ? `, ${userName}` : ""}? All active tokens and role sessions will be cleared.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(false)}
                  disabled={isLoggingOut}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] hover:bg-[#FAFAFA] dark:hover:bg-[#1F1F1F] border border-[#D4D4D4] dark:border-[#303030] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLogout}
                  disabled={isLoggingOut}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#FFFFFF] dark:text-[#000000] bg-[#000000] dark:bg-[#FFFFFF] hover:opacity-90 border border-transparent transition-opacity shadow-xs"
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
