"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  CheckSquare,
  Boxes,
  DollarSign,
  FileText,
  HardHat,
  MapPin,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  Layers,
} from "lucide-react";
import { RoleType, SYSTEM_ROLES } from "@/types/erp";
import { ApexLogo } from "@/components/brand/ApexLogo";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

// 9 Core Navigation Items Matching Specification
export const ERP_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: Building2 },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Materials", href: "/materials", icon: Boxes },
  { label: "Budgets", href: "/finance/budgets", icon: DollarSign },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Team", href: "/people/workers", icon: HardHat },
  { label: "Locations", href: "/administration/locations", icon: MapPin },
  { label: "Settings", href: "/administration/settings", icon: Settings },
];

interface AppSidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  userName?: string;
  userRole?: RoleType;
  onRoleChange?: (role: RoleType) => void;
  onLogout?: () => void;
}

export default function AppSidebar({
  isMobileOpen,
  onMobileClose,
  isCollapsed,
  onToggleCollapse,
  userName = "",
  userRole,
  onRoleChange,
  onLogout,
}: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs md:hidden transition-opacity duration-300"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation Container */}
      <aside
        id="app-sidebar"
        aria-label="Main Navigation"
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#F3F4F6] dark:bg-[#111111] border-r border-[#E5E7EB] dark:border-[#2A2A2A] text-[#111827] dark:text-[#FFFFFF] select-none
          transition-all duration-300 ease-in-out
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${isCollapsed ? "md:w-20" : "md:w-64"}
          w-72 shadow-2xl md:shadow-none
        `}
      >
        {/* Top Branding Section */}
        <div
          className={`relative h-16 flex items-center border-b border-[#E5E7EB] dark:border-[#2A2A2A] bg-[#FFFFFF] dark:bg-[#141414] shrink-0 ${
            isCollapsed ? "justify-center px-2" : "justify-between px-4"
          }`}
        >
          <Link
            href="/dashboard"
            onClick={onMobileClose}
            className="flex items-center gap-2.5 min-w-0 group"
          >
            <ApexLogo size={32} />
            {!isCollapsed && (
              <div className="flex flex-col truncate leading-none min-w-0">
                <span className="text-sm font-extrabold text-[#111827] dark:text-[#FFFFFF] tracking-widest uppercase truncate">
                  Apex <span className="text-[#6B7280] dark:text-[#A1A1A1]">ERP</span>
                </span>
                <span className="text-[9px] text-[#9CA3AF] dark:text-[#777777] font-mono tracking-wider uppercase mt-1 truncate">
                  Construction Management
                </span>
              </div>
            )}
          </Link>

          {/* Mobile close button (>=44px touch target) */}
          <button
            onClick={onMobileClose}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-[#6B7280] dark:text-[#A1A1A1] hover:text-[#111827] dark:hover:text-[#FFFFFF] hover:bg-[#E5E7EB] dark:hover:bg-[#1F1F1F] md:hidden transition-colors"
            aria-label="Close navigation drawer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop/Tablet collapse toggle button */}
          <button
            onClick={onToggleCollapse}
            className={`hidden md:flex rounded-lg text-[#6B7280] dark:text-[#A1A1A1] hover:text-[#111827] dark:hover:text-[#FFFFFF] hover:bg-[#E5E7EB] dark:hover:bg-[#1F1F1F] transition-colors ${
              isCollapsed ? "absolute right-1.5 top-5 p-1" : "p-1.5"
            }`}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* User Role Card */}
        <div className="px-3 py-2.5 border-b border-[#E5E7EB] dark:border-[#2A2A2A] bg-[#FFFFFF] dark:bg-[#141414] shrink-0">
          {!isCollapsed ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#111827] dark:text-[#FFFFFF] truncate max-w-[130px]">
                  {userName || <span className="text-[#9CA3AF] dark:text-[#777777] italic">Loading…</span>}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F3F4F6] dark:bg-[#1F1F1F] text-[#111827] dark:text-[#FFFFFF] border border-[#E5E7EB] dark:border-[#2A2A2A] font-bold">
                  {userRole}
                </span>
              </div>
              {onRoleChange && (
                <select
                  value={userRole}
                  onChange={(e) => onRoleChange(e.target.value as RoleType)}
                  className="w-full text-[11px] bg-[#F9FAFB] dark:bg-[#1F1F1F] border border-[#E5E7EB] dark:border-[#2A2A2A] text-[#111827] dark:text-[#FFFFFF] rounded-lg px-2 py-1 outline-none focus:border-[#111827] dark:focus:border-[#FFFFFF] cursor-pointer"
                  aria-label="Switch User Role"
                >
                  {SYSTEM_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <div className="flex justify-center" title={`${userName}${userRole ? ` (${userRole})` : ""}`}>
              <div className="w-8 h-8 rounded-full bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#111111] border border-[#E5E7EB] dark:border-[#2A2A2A] flex items-center justify-center text-xs font-bold">
                {userName ? userName.charAt(0).toUpperCase() : "A"}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items List */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1 scrollbar-thin">
          {!isCollapsed && (
            <p className="px-2.5 py-1 text-[10px] font-semibold text-[#9CA3AF] dark:text-[#777777] uppercase font-mono tracking-wider">
              Navigation
            </p>
          )}

          {ERP_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onMobileClose}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative ${
                  isActive
                    ? "bg-[#FFFFFF] dark:bg-[#1F1F1F] text-[#111827] dark:text-[#FFFFFF] font-bold shadow-xs border border-[#E5E7EB] dark:border-[#2A2A2A]"
                    : "text-[#6B7280] dark:text-[#A1A1A1] hover:text-[#111827] dark:hover:text-[#FFFFFF] hover:bg-[#E5E7EB] dark:hover:bg-[#1F1F1F]"
                } ${isCollapsed ? "justify-center px-2" : ""}`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    isActive
                      ? "text-[#111827] dark:text-[#FFFFFF]"
                      : "text-[#6B7280] dark:text-[#A1A1A1] group-hover:text-[#111827] dark:group-hover:text-[#FFFFFF]"
                  }`}
                />
                {!isCollapsed && (
                  <span className="truncate flex-1 text-xs">{item.label}</span>
                )}
                {!isCollapsed && item.badge && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#111111]">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Banner: Architecture & Site Control */}
        {!isCollapsed && (
          <div className="p-3 mx-2 my-2 rounded-xl bg-[#FFFFFF] dark:bg-[#1F1F1F] border border-[#E5E7EB] dark:border-[#2A2A2A] shrink-0 text-left shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#111827] dark:text-[#FFFFFF] mb-1">
              <Layers className="w-3.5 h-3.5 text-[#111827] dark:text-[#FFFFFF]" />
              <span>APEX Enterprise</span>
            </div>
            <p className="text-[11px] text-[#6B7280] dark:text-[#A1A1A1] mb-2 leading-tight">
              Real-time site telemetry, safety logs & fiscal auditing
            </p>
            <Link
              href="/reports"
              onClick={onMobileClose}
              className="inline-flex w-full items-center justify-center py-1.5 px-2 text-[11px] font-semibold text-[#FFFFFF] dark:text-[#111111] bg-[#111111] dark:bg-[#FFFFFF] hover:opacity-90 rounded-lg transition-opacity border border-transparent shadow-xs"
            >
              Executive Reports
            </Link>
          </div>
        )}

        {/* Bottom Logout Action */}
        {onLogout && (
          <div className="p-2 border-t border-[#E5E7EB] dark:border-[#2A2A2A] bg-[#FFFFFF] dark:bg-[#141414] shrink-0">
            <button
              onClick={onLogout}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#6B7280] dark:text-[#A1A1A1] hover:text-[#111827] dark:hover:text-[#FFFFFF] hover:bg-[#F3F4F6] dark:hover:bg-[#1F1F1F] transition-colors ${
                isCollapsed ? "justify-center px-2" : ""
              }`}
              title="Logout"
            >
              <LogOut className="w-4 h-4 shrink-0 text-[#6B7280] dark:text-[#A1A1A1]" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
