"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  X,
  Search,
  Bell,
  ChevronRight,
  User,
  LogOut,
  Sun,
  Moon,
  Laptop,
  ChevronDown,
} from "lucide-react";
import { RoleType } from "@/types/erp";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ApexLogo } from "@/components/brand/ApexLogo";
import { useTheme } from "@/components/theme/ThemeProvider";

interface AppHeaderProps {
  onToggleMobileSidebar: () => void;
  isMobileSidebarOpen: boolean;
  userName?: string;
  userRole?: RoleType;
  userEmail?: string;
  onLogout?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export default function AppHeader({
  onToggleMobileSidebar,
  isMobileSidebarOpen,
  userName = "Abebe Bekele",
  userRole = "Admin",
  userEmail,
  onLogout,
  searchQuery = "",
  onSearchChange,
}: AppHeaderProps) {
  const pathname = usePathname() || "/";
  const { theme, resolvedTheme, setTheme } = useTheme();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
      if (
        themeMenuRef.current &&
        !themeMenuRef.current.contains(event.target as Node)
      ) {
        setShowThemeMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <header className="sticky top-0 z-30 w-full min-w-0 bg-white dark:bg-[#16181D] border-b border-slate-200 dark:border-[#2F333A] shadow-xs transition-colors">
      <div className="h-16 px-3 sm:px-5 lg:px-6 flex items-center justify-between gap-2 sm:gap-4 w-full min-w-0">
        {/* Left Section: Mobile Hamburger Toggle + Breadcrumbs / Mobile Logo */}
        <div className="flex flex-1 items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Hamburger Toggle (>=44px touch target) */}
          <button
            onClick={onToggleMobileSidebar}
            aria-label={isMobileSidebarOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileSidebarOpen}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden transition-colors shrink-0"
          >
            {isMobileSidebarOpen ? (
              <X className="w-5 h-5 text-[#C9A15A]" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          {/* Mobile Brand Mark (Visible only on mobile header) */}
          <div className="md:hidden flex items-center shrink-0">
            <ApexLogo size={32} showText subtitle="" href="/dashboard" />
          </div>

          {/* Desktop/Tablet Breadcrumb Navigation */}
          <nav
            aria-label="Breadcrumbs"
            className="hidden md:flex min-w-0 items-center text-xs font-medium text-slate-500 dark:text-slate-400"
          >
            <Link
              href="/dashboard"
              className="flex shrink-0 items-center gap-1.5 font-bold text-slate-900 dark:text-white transition-colors hover:text-[#C9A15A]"
            >
              <span>Apex Build</span>
            </Link>
            {pathSegments.map((segment, index) => {
              const href = `/${pathSegments.slice(0, index + 1).join("/")}`;
              const isLast = index === pathSegments.length - 1;
              const formattedSegment = segment
                .replace(/-/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase());

              return (
                <React.Fragment key={href}>
                  <ChevronRight className="w-3.5 h-3.5 mx-1 text-slate-400 dark:text-slate-600 shrink-0" />
                  {isLast ? (
                    <span className="text-[#C9A15A] font-semibold truncate max-w-[120px] sm:max-w-[200px]">
                      {formattedSegment}
                    </span>
                  ) : (
                    <Link
                      href={href}
                      className="hover:text-slate-900 dark:hover:text-white transition-colors truncate max-w-[100px] sm:max-w-none"
                    >
                      {formattedSegment}
                    </Link>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* Right Section: Search + Theme Toggle + Notifications + User Profile */}
        <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2.5">
          {/* Desktop & Tablet Search Bar */}
          <div className="relative hidden min-w-0 flex-[0_1_20rem] items-center md:flex">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none z-10" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search projects, materials, workers..."
              className="w-full h-9 bg-slate-100 dark:bg-[#1C1F24] border border-slate-200 dark:border-[#2F333A] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs rounded-full pl-9 pr-8 outline-none focus:border-[#C9A15A] focus:bg-white dark:focus:bg-[#16181D] focus:ring-2 focus:ring-[#C9A15A]/25 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange?.("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
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
            className="md:hidden flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            title="Search"
            aria-label="Toggle search input"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Theme Mode Toggle Dropdown */}
          <div className="relative" ref={themeMenuRef}>
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={`Theme: ${theme}`}
              aria-label="Toggle color theme"
            >
              {resolvedTheme === "dark" ? (
                <Moon className="w-4 h-4 text-[#C9A15A]" />
              ) : (
                <Sun className="w-4 h-4 text-amber-600" />
              )}
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-[#16181D] border border-slate-200 dark:border-[#2F333A] rounded-xl shadow-xl py-1 z-50 animate-in fade-in duration-100">
                <button
                  onClick={() => {
                    setTheme("light");
                    setShowThemeMenu(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-left transition-colors ${
                    theme === "light"
                      ? "text-[#C9A15A] bg-amber-500/10 font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-600" />
                  <span>Light</span>
                </button>
                <button
                  onClick={() => {
                    setTheme("dark");
                    setShowThemeMenu(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-left transition-colors ${
                    theme === "dark"
                      ? "text-[#C9A15A] bg-amber-500/10 font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <Moon className="w-4 h-4 text-[#C9A15A]" />
                  <span>Dark</span>
                </button>
                <button
                  onClick={() => {
                    setTheme("system");
                    setShowThemeMenu(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-left transition-colors ${
                    theme === "system"
                      ? "text-[#C9A15A] bg-amber-500/10 font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <Laptop className="w-4 h-4 text-slate-400" />
                  <span>System</span>
                </button>
              </div>
            )}
          </div>

          {/* Notifications Link with Live Badge (>=44px touch target) */}
          <Link
            href="/notifications"
            className="relative flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Notifications"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#C9A15A] text-[10px] font-bold text-slate-950 shadow-xs">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* User Profile Pill & Dropdown (>=44px touch target) */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] transition-colors"
              aria-label="User profile menu"
            >
              <div className="w-8 h-8 rounded-full bg-[#16181D] dark:bg-slate-800 text-[#C9A15A] border border-[#C9A15A]/30 flex items-center justify-center text-xs font-bold shadow-xs">
                {userName.charAt(0)}
              </div>
              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {userName}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {userRole}
                </span>
              </div>
              <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-[#16181D] border border-slate-200 dark:border-[#2F333A] rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-[#2F333A]">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {userName}
                  </p>
                  {userEmail && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {userEmail}
                    </p>
                  )}
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                    {userRole}
                  </span>
                </div>

                <Link
                  href="/administration/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
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
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left border-t border-slate-100 dark:border-[#2F333A]"
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
        <div className="md:hidden px-4 pb-3 pt-2 border-t border-slate-100 dark:border-[#2F333A] bg-white dark:bg-[#16181D]">
          <div className="relative flex items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none z-10" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search projects, materials, workers..."
              className="w-full h-10 bg-slate-100 dark:bg-[#1C1F24] border border-slate-200 dark:border-[#2F333A] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs rounded-full pl-9 pr-9 outline-none focus:border-[#C9A15A] focus:bg-white dark:focus:bg-[#16181D] focus:ring-2 focus:ring-[#C9A15A]/25 transition-all"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange?.("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
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
