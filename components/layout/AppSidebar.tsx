"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  CheckSquare,
  Building,
  Boxes,
  HardHat,
  Truck,
  Users2,
  DollarSign,
  CreditCard,
  FileText,
  FolderLock,
  MessageSquare,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  Sparkles,
} from "lucide-react";
import { RoleType, SYSTEM_ROLES } from "@/types/erp";
import { ApexLogo } from "@/components/brand/ApexLogo";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

// Navigation items matching specification
export const ERP_NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: Building2 },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Buildings", href: "/administration/locations", icon: Building },
  { label: "Materials", href: "/materials", icon: Boxes },
  { label: "Workers", href: "/people/workers", icon: HardHat },
  { label: "Equipment", href: "/equipment", icon: Truck },
  { label: "Suppliers", href: "/procurement/suppliers", icon: Users2 },
  { label: "Budgets", href: "/finance/budgets", icon: DollarSign },
  { label: "Expenses", href: "/finance/expenses", icon: CreditCard },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Documents", href: "/documents", icon: FolderLock },
  { label: "Messages", href: "/announcements", icon: MessageSquare },
  { label: "Notifications", href: "/notifications", icon: Bell },
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
  userName = "Abebe Bekele",
  userRole = "Admin",
  onRoleChange,
  onLogout,
}: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* ─── Mobile Backdrop Overlay ─── */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden transition-opacity duration-300"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* ─── Sidebar Navigation Container ─── */}
      <aside
        id="app-sidebar"
        aria-label="Main Navigation"
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#16181D] dark:bg-[#0B0D10] border-r border-[#262A33] dark:border-[#1E222A] text-slate-300 select-none
          transition-all duration-300 ease-in-out
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${isCollapsed ? "md:w-20" : "md:w-64"}
          w-72 shadow-2xl md:shadow-none
        `}
      >
        {/* Top Branding Section */}
        <div
          className={`relative h-16 flex items-center border-b border-[#262A33] dark:border-[#1E222A] bg-[#121418] dark:bg-[#07080A] shrink-0 ${
            isCollapsed ? "justify-center px-2" : "justify-between px-4"
          }`}
        >
          <Link
            href="/dashboard"
            onClick={onMobileClose}
            className="flex items-center gap-2.5 min-w-0 group"
          >
            <ApexLogo size={34} />
            {!isCollapsed && (
              <div className="flex flex-col truncate leading-none min-w-0">
                <span className="text-sm font-extrabold text-white tracking-widest uppercase truncate">
                  Apex <span className="text-[#C9A15A]">Build</span>
                </span>
                <span className="text-[9.5px] text-slate-400 font-mono tracking-wider uppercase mt-1 truncate">
                  Construction Management
                </span>
              </div>
            )}
          </Link>

          {/* Mobile close button (>=44px touch target) */}
          <button
            onClick={onMobileClose}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden transition-colors"
            aria-label="Close navigation drawer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop/Tablet collapse toggle button */}
          <button
            onClick={onToggleCollapse}
            className={`hidden md:flex rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${
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
        <div className="px-3 py-2.5 border-b border-[#262A33] dark:border-[#1E222A] bg-[#1A1D24] dark:bg-[#101217] shrink-0">
          {!isCollapsed ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white truncate max-w-[130px]">
                  {userName}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#C9A15A]/15 text-[#C9A15A] border border-[#C9A15A]/30">
                  {userRole}
                </span>
              </div>
              {onRoleChange && (
                <select
                  value={userRole}
                  onChange={(e) => onRoleChange(e.target.value as RoleType)}
                  className="w-full text-[11px] bg-[#121418] border border-[#2B303B] text-slate-300 rounded-lg px-2 py-1 outline-none focus:border-[#C9A15A] cursor-pointer"
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
            <div className="flex justify-center" title={`${userName} (${userRole})`}>
              <div className="w-8 h-8 rounded-full bg-[#C9A15A]/20 border border-[#C9A15A]/40 flex items-center justify-center text-xs font-bold text-[#C9A15A]">
                {userName.charAt(0)}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-800">
          {!isCollapsed && (
            <p className="px-2.5 py-1 text-[10px] font-semibold text-slate-500 uppercase font-mono tracking-wider">
              Construction ERP
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
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group relative ${
                  isActive
                    ? "bg-[#C9A15A] text-slate-950 font-semibold shadow-md shadow-amber-500/20"
                    : "text-slate-400 hover:text-white hover:bg-[#20242D]"
                } ${isCollapsed ? "justify-center px-2" : ""}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!isCollapsed && (
                  <span className="truncate flex-1 text-xs">{item.label}</span>
                )}
                {!isCollapsed && item.badge && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#C9A15A] text-slate-950">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Bottom Banner: Construction Pro */}
        {!isCollapsed && (
          <div className="p-3 mx-2 my-2 rounded-xl bg-gradient-to-br from-[#1F232B] to-[#16181D] border border-[#2D323E] shrink-0 text-left">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#C9A15A]" />
              <span>Construction Pro</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2 leading-tight">
              Advanced project analytics & reports
            </p>
            <Link
              href="/reports"
              onClick={onMobileClose}
              className="inline-flex w-full items-center justify-center py-1.5 px-2 text-[11px] font-semibold text-slate-950 bg-[#C9A15A] hover:bg-[#B8924B] rounded-lg transition-colors shadow-xs"
            >
              View Reports
            </Link>
          </div>
        )}

        {/* Bottom Logout Action */}
        {onLogout && (
          <div className="p-2 border-t border-[#262A33] dark:border-[#1E222A] bg-[#121418] dark:bg-[#07080A] shrink-0">
            <button
              onClick={onLogout}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors ${
                isCollapsed ? "justify-center px-2" : ""
              }`}
              title="Logout"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
