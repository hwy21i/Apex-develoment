"use client";

import React, { useState, useEffect } from "react";
import { Menu, X, Search, Bell, ChevronRight, User, LogOut, Sun, Moon, Monitor } from "lucide-react";
import { RoleType } from "@/types/erp";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ApexLogo } from "@/components/brand/ApexLogo";

interface AppHeaderProps {
  onToggleMobileSidebar: () => void;
  isMobileSidebarOpen: boolean;
  userName?: string;
  userRole?: RoleType;
  onLogout?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export default function AppHeader({
  onToggleMobileSidebar,
  isMobileSidebarOpen,
  userName,
  userRole,
  onLogout,
  searchQuery = "",
  onSearchChange,
}: AppHeaderProps) {
  const pathname = usePathname() || "/";
  const displayName = userName || "Signed out";
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [theme, setTheme] = useState<"light" | "dark" | "system">(() => {
    if (typeof window === "undefined") return "light";
    return (window.localStorage.getItem("apex-theme") as "light" | "dark" | "system" | null) || "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches));
  }, [theme]);

  const changeTheme = (nextTheme: "light" | "dark" | "system") => {
    setTheme(nextTheme);
    window.localStorage.setItem("apex-theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark" || (nextTheme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches));
  };

  // Fetch real unread notification count
  useEffect(() => {
    fetch("/api/notifications?unreadOnly=true")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && typeof json.data?.unreadCount === "number") {
          setUnreadCount(json.data.unreadCount);
        }
      })
      .catch(() => {});
  }, []);

  // Generate breadcrumb segments from pathname
  const pathSegments = pathname.split("/").filter(Boolean);

  return (
    <header className="sticky top-0 z-30 w-full min-w-0 bg-white border-b border-slate-200 shadow-sm">
      <div className="h-16 px-4 sm:px-5 flex items-center justify-between gap-3 w-full min-w-0">
        {/* Left: Hamburger menu (mobile) + Breadcrumbs */}
        <div className="flex flex-1 items-center gap-2 sm:gap-4 min-w-0">
          {/* Mobile Hamburger Toggle (>=44px touch target) */}
          <button
            onClick={onToggleMobileSidebar}
            aria-label={isMobileSidebarOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileSidebarOpen}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 md:hidden transition-colors shrink-0"
          >
            {isMobileSidebarOpen ? (
              <X className="w-5 h-5 text-blue-600" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumbs" className="flex min-w-0 items-center text-xs font-medium text-slate-500">
            <Link
              href="/dashboard"
              className="flex shrink-0 items-center gap-2 font-bold text-slate-800 transition-colors hover:text-slate-900"
            >
              <ApexLogo size={28} className="rounded-lg" />
              <span className="hidden sm:inline">Apex Build</span>
            </Link>
            {pathSegments.map((segment, index) => {
              const href = `/${pathSegments.slice(0, index + 1).join("/")}`;
              const isLast = index === pathSegments.length - 1;
              const formattedSegment = segment
                .replace(/-/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase());

              return (
                <React.Fragment key={href}>
                  <ChevronRight className="w-3.5 h-3.5 mx-1 text-slate-400 shrink-0" />
                  {isLast ? (
                      <span className="text-blue-700 font-semibold truncate max-w-[120px] sm:max-w-[200px]">
                      {formattedSegment}
                    </span>
                  ) : (
                    <Link
                      href={href}
                      className="hover:text-slate-900 transition-colors truncate max-w-[90px] sm:max-w-none"
                    >
                      {formattedSegment}
                    </Link>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* Right: Search + Notifications + Profile dropdown */}
        <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Desktop & Tablet Search Bar */}
          <div className="relative hidden min-w-0 flex-[0_1_18rem] items-center md:flex">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search projects, tasks…"
              className="w-full h-9 bg-slate-100 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs rounded-full pl-9 pr-8 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/30 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange?.("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition-colors"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mobile Search Toggle Button (>=44px touch target) */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="md:hidden flex items-center justify-center h-10 w-10 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
            title="Search"
            aria-label="Toggle search input"
          >
            <Search className="w-5 h-5" />
          </button>

          <label className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-slate-500 dark:border-[#2F333A] dark:bg-[#22252B] dark:text-slate-300" title="Theme">
            {theme === "dark" ? <Moon className="h-3.5 w-3.5" /> : theme === "system" ? <Monitor className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
            <select value={theme} onChange={(event) => changeTheme(event.target.value as "light" | "dark" | "system")} className="h-8 bg-transparent text-[11px] font-semibold outline-none dark:bg-[#22252B]">
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </label>

          {/* Notifications Link with Live Badge (>=44px touch target) */}
          <Link
            href="/notifications"
            className="relative flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Notifications"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-xs">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* User Profile Pill & Dropdown (>=44px touch target) */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 min-h-[44px] transition-colors"
              aria-label="User profile menu"
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 text-blue-300 flex items-center justify-center text-xs font-bold shadow-xs">
                {displayName.charAt(0)}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 leading-tight">
                  {displayName}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">{userRole}</span>
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-900">{displayName}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                    {userRole}
                  </span>
                </div>

                <Link
                  href="/administration/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Account Settings</span>
                </Link>

                {onLogout && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 transition-colors text-left border-t border-slate-100"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Mobile Search Dropdown (>=44px touch-friendly input) */}
      {showMobileSearch && (
        <div className="md:hidden px-4 pb-3 pt-2 border-t border-slate-100 bg-white">
          <div className="relative flex items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search projects, tasks, materials, equipment…"
              className="w-full h-10 bg-slate-100 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs rounded-full pl-9 pr-9 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/30 transition-all"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange?.("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition-colors"
                title="Clear"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
