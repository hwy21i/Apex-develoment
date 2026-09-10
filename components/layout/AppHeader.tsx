"use client";

import React, { useState } from "react";
import { Menu, X, Search, Bell, ChevronRight, User, LogOut } from "lucide-react";
import { RoleType } from "@/types/erp";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AppHeaderProps {
  onToggleMobileSidebar: () => void;
  isMobileSidebarOpen: boolean;
  userName?: string;
  userRole?: RoleType;
  onLogout?: () => void;
}

export default function AppHeader({
  onToggleMobileSidebar,
  isMobileSidebarOpen,
  userName = "Abebe Bekele",
  userRole = "Admin",
  onLogout,
}: AppHeaderProps) {
  const pathname = usePathname() || "/";
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  // Generate breadcrumb segments from pathname
  const pathSegments = pathname.split("/").filter(Boolean);

  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-[#13151A] border-b border-[#232733] flex items-center justify-between px-4 sm:px-6 lg:px-8">
      {/* Left side: Hamburger menu + Breadcrumbs */}
      <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={onToggleMobileSidebar}
          aria-label={isMobileSidebarOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMobileSidebarOpen}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#1E222D] lg:hidden transition-colors"
        >
          {isMobileSidebarOpen ? (
            <X className="w-5 h-5 text-blue-400" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>

        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumbs" className="flex items-center text-xs font-medium text-slate-400 truncate">
          <Link href="/dashboard" className="hover:text-white transition-colors">
            ERP
          </Link>
          {pathSegments.map((segment, index) => {
            const href = `/${pathSegments.slice(0, index + 1).join("/")}`;
            const isLast = index === pathSegments.length - 1;
            const formattedSegment = segment
              .replace(/-/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase());

            return (
              <React.Fragment key={href}>
                <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-600 shrink-0" />
                {isLast ? (
                  <span className="text-blue-400 font-semibold truncate">
                    {formattedSegment}
                  </span>
                ) : (
                  <Link href={href} className="hover:text-white transition-colors truncate">
                    {formattedSegment}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Right side: Global Search + Notifications + Profile dropdown */}
      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <div className="relative hidden md:block w-48 lg:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search ERP (Cmd + K)..."
            className="w-full bg-[#1A1D27] border border-[#2B303E] text-slate-200 text-xs rounded-lg pl-9 pr-3 py-2 outline-none focus:border-blue-500 focus:bg-[#161820] transition-all"
          />
        </div>

        {/* Notifications Icon with Badge */}
        <button
          onClick={() => setUnreadCount(0)}
          className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#1E222D] transition-colors"
          title="Notifications"
          aria-label="View notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-sm">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Profile Pill & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-[#1E222D] transition-colors"
            aria-label="User Profile Menu"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-xs font-bold text-blue-300">
              {userName.charAt(0)}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-white leading-tight">
                {userName}
              </span>
              <span className="text-[10px] text-slate-400">{userRole}</span>
            </div>
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-[#161820] border border-[#2B303E] rounded-xl shadow-2xl py-2 z-50">
              <div className="px-4 py-2 border-b border-[#232733]">
                <p className="text-xs font-semibold text-white">{userName}</p>
                <p className="text-[11px] text-blue-400 font-mono mt-0.5">{userRole}</p>
              </div>

              <Link
                href="/administration/settings"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs text-slate-300 hover:bg-[#1E222D] hover:text-white"
              >
                <User className="w-4 h-4 text-slate-500" />
                <span>Account Settings</span>
              </Link>

              {onLogout && (
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

