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
  Building2,
  CheckSquare,
  Package,
  Truck,
  Compass,
  Loader2,
} from "lucide-react";
import { RoleType } from "@/types/erp";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ApexLogo } from "@/components/brand/ApexLogo";
import { useTheme } from "@/components/theme/ThemeProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface SearchResultItem {
  id: string;
  type: "project" | "task" | "material" | "user" | "equipment" | "module";
  title: string;
  subtitle: string;
  badge?: string;
  url: string;
}

interface AppHeaderProps {
  onToggleMobileSidebar: () => void;
  isMobileSidebarOpen: boolean;
  userName?: string;
  userRole?: RoleType;
  userEmail?: string;
  userProfileImage?: string;
  onLogout?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export default function AppHeader({
  onToggleMobileSidebar,
  isMobileSidebarOpen,
  userName = "",
  userRole,
  userEmail,
  userProfileImage,
  onLogout,
  searchQuery = "",
  onSearchChange,
}: AppHeaderProps) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { theme, resolvedTheme, setTheme } = useTheme();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  // Search Results & Dropdown State
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

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
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      fetch(`/api/dashboard?q=${encodeURIComponent(searchQuery.trim())}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data?.results)) {
            setSearchResults(json.data.results);
          } else {
            setSearchResults([]);
          }
        })
        .catch(() => setSearchResults([]))
        .finally(() => setIsSearching(false));
    }, 220);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const displayedResults = searchQuery.trim() ? searchResults : [];

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
    <header className="sticky top-0 z-30 w-full min-w-0 bg-[#FFFFFF]/90 dark:bg-[#000000]/90 backdrop-blur-md border-b border-[#D4D4D4] dark:border-[#303030] shadow-xs transition-colors">
      <div className="h-16 px-3 sm:px-5 lg:px-6 flex items-center justify-between gap-2 sm:gap-4 w-full min-w-0">
        {/* Left Section: Mobile Hamburger Toggle + Breadcrumbs / Mobile Logo */}
        <div className="flex flex-1 items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Hamburger Toggle (>=44px touch target) */}
          <button
            onClick={onToggleMobileSidebar}
            aria-label={isMobileSidebarOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileSidebarOpen}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:bg-[#F5F5F5] dark:hover:bg-[#171717] md:hidden transition-colors shrink-0"
          >
            {isMobileSidebarOpen ? (
              <X className="w-5 h-5 text-[#000000] dark:text-[#FFFFFF]" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          {/* Mobile Brand Mark (Visible only on mobile header) */}
          <div className="md:hidden flex items-center shrink-0">
            <ApexLogo size={30} showText subtitle="" href="/dashboard" />
          </div>

          {/* Desktop/Tablet Breadcrumb Navigation */}
          <nav
            aria-label="Breadcrumbs"
            className="hidden md:flex min-w-0 items-center text-xs font-medium text-[#666666] dark:text-[#A3A3A3]"
          >
            <Link
              href="/dashboard"
              className="flex shrink-0 items-center gap-1.5 font-bold text-[#000000] dark:text-[#FFFFFF] transition-colors hover:text-[#000000] dark:hover:text-[#FFFFFF]"
            >
              <span>APEX ERP</span>
            </Link>
            {pathSegments.map((segment, index) => {
              const href = `/${pathSegments.slice(0, index + 1).join("/")}`;
              const isLast = index === pathSegments.length - 1;
              const formattedSegment = segment
                .replace(/-/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase());

              return (
                <React.Fragment key={href}>
                  <ChevronRight className="w-3.5 h-3.5 mx-1 text-[#A3A3A3] dark:text-[#666666] shrink-0" />
                  {isLast ? (
                    <span className="text-[#000000] dark:text-[#FFFFFF] font-semibold truncate max-w-[120px] sm:max-w-[200px]">
                      {formattedSegment}
                    </span>
                  ) : (
                    <Link
                      href={href}
                      className="hover:text-[#000000] dark:hover:text-[#FFFFFF] transition-colors truncate max-w-[100px] sm:max-w-none text-[#666666] dark:text-[#A3A3A3]"
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
          <div
            ref={searchContainerRef}
            className="relative hidden min-w-0 flex-[0_1_22rem] items-center md:flex"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3] dark:text-[#666666] pointer-events-none z-10" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => {
                if (searchQuery.trim().length > 0) setShowSearchDropdown(true);
              }}
              onChange={(e) => {
                onSearchChange?.(e.target.value);
                if (e.target.value.trim().length > 0) setShowSearchDropdown(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setShowSearchDropdown(false);
              }}
              placeholder="Search projects, materials, workers..."
              className="w-full h-9 bg-[#F5F5F5] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] placeholder-[#A3A3A3] dark:placeholder-[#666666] text-xs rounded-xl pl-9 pr-8 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF] focus:ring-1 focus:ring-[#FFFFFF]/20 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  onSearchChange?.("");
                  setShowSearchDropdown(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A3A3A3] dark:text-[#666666] hover:text-[#000000] dark:hover:text-[#FFFFFF] p-0.5 rounded-full transition-colors"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Global Search Results Dropdown */}
            {showSearchDropdown && searchQuery.trim().length > 0 && (
              <div className="absolute left-0 top-full mt-2 w-full min-w-[340px] max-w-[440px] bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                <div className="px-3.5 py-1.5 border-b border-[#D4D4D4] dark:border-[#303030] flex items-center justify-between text-[11px] font-semibold text-[#666666] dark:text-[#A3A3A3]">
                  <span>{isSearching ? "SEARCHING..." : `RESULTS FOR "${searchQuery.trim()}"`}</span>
                  <span className="text-[10px] font-mono">{displayedResults.length} found</span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-[#E5E5E5] dark:divide-[#303030]">
                  {isSearching ? (
                    <div className="p-5 flex items-center justify-center gap-2.5 text-xs text-[#666666] dark:text-[#A3A3A3]">
                      <Loader2 className="w-4 h-4 animate-spin text-[#111111] dark:text-[#FFFFFF]" />
                      <span>Scanning records...</span>
                    </div>
                  ) : displayedResults.length === 0 ? (
                    <div className="p-6 text-center space-y-2">
                      <Search className="w-7 h-7 text-[#A3A3A3] dark:text-[#777777] mx-auto" />
                      <p className="text-xs font-semibold text-[#111111] dark:text-[#FFFFFF]">
                        No results found for &ldquo;{searchQuery}&rdquo;
                      </p>
                      <p className="text-[11px] text-[#666666] dark:text-[#A3A3A3] max-w-[260px] mx-auto">
                        Search by project code, worker name, or materials SKU.
                      </p>
                      <button
                        onClick={() => {
                          onSearchChange?.("");
                          setShowSearchDropdown(false);
                        }}
                        className="mt-1 px-3 py-1 rounded-lg text-xs font-medium text-[#111111] dark:text-[#FFFFFF] hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] transition-colors"
                      >
                        Clear Search
                      </button>
                    </div>
                  ) : (
                    displayedResults.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setShowSearchDropdown(false);
                          router.push(item.url);
                        }}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] transition-colors group"
                      >
                        <div className="p-2 rounded-xl bg-[#F5F5F5] dark:bg-[#141414] group-hover:bg-[#E5E5E5] dark:group-hover:bg-[#303030] transition-colors">
                          {item.type === "project" && <Building2 className="w-4 h-4 text-[#111111] dark:text-[#FFFFFF] shrink-0" />}
                          {item.type === "task" && <CheckSquare className="w-4 h-4 text-[#111111] dark:text-[#FFFFFF] shrink-0" />}
                          {item.type === "material" && <Package className="w-4 h-4 text-[#111111] dark:text-[#FFFFFF] shrink-0" />}
                          {item.type === "equipment" && <Truck className="w-4 h-4 text-[#111111] dark:text-[#FFFFFF] shrink-0" />}
                          {item.type === "user" && <User className="w-4 h-4 text-[#111111] dark:text-[#FFFFFF] shrink-0" />}
                          {item.type === "module" && <Compass className="w-4 h-4 text-[#111111] dark:text-[#FFFFFF] shrink-0" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-[#111111] dark:text-[#FFFFFF] truncate group-hover:underline transition-all">
                              {item.title}
                            </span>
                            {item.badge && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F5F5F5] dark:bg-[#141414] text-[#111111] dark:text-[#FFFFFF] border border-[#E5E5E5] dark:border-[#303030] shrink-0">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#666666] dark:text-[#A3A3A3] truncate">
                            {item.subtitle}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {displayedResults.length > 0 && (
                  <div className="px-3.5 py-2 border-t border-[#E5E5E5] dark:border-[#303030] bg-[#F9FAFB] dark:bg-[#141414] flex items-center justify-between text-[11px]">
                    <span className="text-[#A3A3A3] dark:text-[#777777]">Press Esc to dismiss</span>
                    <button
                      onClick={() => {
                        onSearchChange?.("");
                        setShowSearchDropdown(false);
                      }}
                      className="text-[#111111] dark:text-[#FFFFFF] hover:underline font-medium"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Search Toggle Button (>=44px touch target) */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="md:hidden flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl text-[#666666] dark:text-[#A3A3A3] hover:text-[#111111] dark:hover:text-[#FFFFFF] hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] transition-colors shrink-0"
            title="Search"
            aria-label="Toggle search input"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Theme Mode Toggle Control */}
          <div className="relative" ref={themeMenuRef}>
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl text-[#666666] dark:text-[#A3A3A3] hover:text-[#111111] dark:hover:text-[#FFFFFF] hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] transition-colors"
              title={`Theme: ${theme}`}
              aria-label="Toggle color theme"
            >
              {resolvedTheme === "dark" ? (
                <Moon className="w-4 h-4 text-[#FFFFFF]" />
              ) : (
                <Sun className="w-4 h-4 text-[#111111]" />
              )}
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-36 bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl shadow-xl py-1 z-50 animate-in fade-in duration-100">
                <button
                  onClick={() => {
                    setTheme("light");
                    setShowThemeMenu(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-left transition-colors ${
                    theme === "light"
                      ? "text-[#000000] dark:text-[#FFFFFF] bg-[#F5F5F5] dark:bg-[#171717] font-semibold"
                      : "text-[#666666] dark:text-[#A3A3A3] hover:bg-[#F5F5F5] dark:hover:bg-[#171717]"
                  }`}
                >
                  <Sun className="w-4 h-4 text-[#000000] dark:text-[#FFFFFF]" />
                  <span>Light</span>
                </button>
                <button
                  onClick={() => {
                    setTheme("dark");
                    setShowThemeMenu(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-left transition-colors ${
                    theme === "dark"
                      ? "text-[#000000] dark:text-[#FFFFFF] bg-[#F5F5F5] dark:bg-[#171717] font-semibold"
                      : "text-[#666666] dark:text-[#A3A3A3] hover:bg-[#F5F5F5] dark:hover:bg-[#171717]"
                  }`}
                >
                  <Moon className="w-4 h-4 text-[#000000] dark:text-[#FFFFFF]" />
                  <span>Dark</span>
                </button>
                <button
                  onClick={() => {
                    setTheme("system");
                    setShowThemeMenu(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-left transition-colors ${
                    theme === "system"
                      ? "text-[#000000] dark:text-[#FFFFFF] bg-[#F5F5F5] dark:bg-[#171717] font-semibold"
                      : "text-[#666666] dark:text-[#A3A3A3] hover:bg-[#F5F5F5] dark:hover:bg-[#171717]"
                  }`}
                >
                  <Laptop className="w-4 h-4 text-[#000000] dark:text-[#FFFFFF]" />
                  <span>System</span>
                </button>
              </div>
            )}
          </div>

          {/* Notifications Link with Live Badge (>=44px touch target) */}
          <Link
            href="/notifications"
            className="relative flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:bg-[#F5F5F5] dark:hover:bg-[#171717] transition-colors"
            title="Notifications"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#000000] dark:bg-[#FFFFFF] text-[10px] font-bold text-[#FFFFFF] dark:text-[#000000] shadow-2xs ring-2 ring-[#FFFFFF] dark:ring-[#000000]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* User Profile Pill & Dropdown (>=44px touch target) */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#F5F5F5] dark:hover:bg-[#171717] min-h-[44px] transition-colors"
              aria-label="User profile menu"
            >
              <div className="w-8 h-8 rounded-full bg-[#111111] dark:bg-[#171717] text-[#FFFFFF] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030] flex items-center justify-center text-xs font-bold shadow-2xs overflow-hidden">
                {userProfileImage ? (
                  <img src={userProfileImage} alt={userName} className="w-full h-full object-cover" />
                ) : userName ? (
                  userName.charAt(0).toUpperCase()
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF]">
                  {userName}
                </span>
                <span className="text-[10px] text-[#666666] dark:text-[#A3A3A3] font-medium">
                  {userRole}
                </span>
              </div>
              <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-[#A3A3A3] dark:text-[#666666]" />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2.5 border-b border-[#D4D4D4] dark:border-[#303030] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#111111] dark:bg-[#171717] text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030] flex items-center justify-center text-xs font-bold overflow-hidden shrink-0 shadow-2xs">
                    {userProfileImage ? (
                      <img src={userProfileImage} alt={userName} className="w-full h-full object-cover" />
                    ) : userName ? (
                      userName.charAt(0).toUpperCase()
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] truncate">
                      {userName}
                    </p>
                    {userEmail && (
                      <p className="text-[11px] text-[#666666] dark:text-[#A3A3A3] truncate">
                        {userEmail}
                      </p>
                    )}
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#F5F5F5] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]">
                      {userRole}
                    </span>
                  </div>
                </div>

                <Link
                  href="/administration/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-[#111111] dark:text-[#FFFFFF] hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] transition-colors"
                >
                  <User className="w-4 h-4 text-[#666666] dark:text-[#A3A3A3]" />
                  <span>Account Settings</span>
                </Link>

                {onLogout && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] transition-colors text-left border-t border-[#E5E5E5] dark:border-[#303030]"
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

      {/* Expandable Mobile Search Dropdown */}
      {showMobileSearch && (
        <div
          ref={mobileSearchRef}
          className="md:hidden px-4 pb-3 pt-2 border-t border-[#E5E5E5] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#141414]"
        >
          <div className="relative flex items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3] dark:text-[#777777] pointer-events-none z-10" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search projects, materials, workers..."
              className="w-full h-10 bg-[#F9FAFB] dark:bg-[#1F1F1F] border border-[#E5E5E5] dark:border-[#303030] text-[#111111] dark:text-[#FFFFFF] placeholder-[#A3A3A3] dark:placeholder-[#777777] text-xs rounded-xl pl-9 pr-9 outline-none focus:border-[#111111] dark:focus:border-[#FFFFFF] transition-all"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange?.("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A3A3A3] dark:text-[#777777] hover:text-[#111111] dark:hover:text-[#FFFFFF] p-0.5 rounded-full transition-colors"
                title="Clear"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile Search Results */}
          {searchQuery.trim().length > 0 && (
            <div className="mt-2 max-h-60 overflow-y-auto rounded-2xl border border-[#E5E5E5] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#1F1F1F] divide-y divide-[#E5E5E5] dark:divide-[#303030] shadow-xl">
              {isSearching ? (
                <div className="p-3 text-center text-xs text-[#666666] dark:text-[#A3A3A3] flex items-center justify-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#111111] dark:text-[#FFFFFF]" />
                  <span>Searching...</span>
                </div>
              ) : displayedResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#666666] dark:text-[#A3A3A3]">
                  No matches for &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                displayedResults.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setShowMobileSearch(false);
                      router.push(item.url);
                    }}
                    className="w-full flex items-center gap-2.5 p-2.5 text-left text-xs hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-[#F5F5F5] dark:bg-[#141414]">
                      {item.type === "project" && <Building2 className="w-3.5 h-3.5 text-[#111111] dark:text-[#FFFFFF]" />}
                      {item.type === "task" && <CheckSquare className="w-3.5 h-3.5 text-[#111111] dark:text-[#FFFFFF]" />}
                      {item.type === "material" && <Package className="w-3.5 h-3.5 text-[#111111] dark:text-[#FFFFFF]" />}
                      {item.type === "equipment" && <Truck className="w-3.5 h-3.5 text-[#111111] dark:text-[#FFFFFF]" />}
                      {item.type === "user" && <User className="w-3.5 h-3.5 text-[#111111] dark:text-[#FFFFFF]" />}
                      {item.type === "module" && <Compass className="w-3.5 h-3.5 text-[#111111] dark:text-[#FFFFFF]" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[#111111] dark:text-[#FFFFFF] truncate">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-[#666666] dark:text-[#A3A3A3] truncate">
                        {item.subtitle}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
