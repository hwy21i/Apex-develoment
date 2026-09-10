"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users2,
  CheckSquare,
  Milestone,
  Calendar,
  GitBranch,
  Boxes,
  Warehouse,
  ArrowLeftRight,
  TrendingDown,
  ShoppingBag,
  FileText,
  Truck,
  Receipt,
  FileCheck,
  UserSquare2,
  HardHat,
  Clock,
  Briefcase,
  Wrench,
  Cog,
  DollarSign,
  CreditCard,
  Banknote,
  PieChart,
  FolderLock,
  FileSignature,
  Bell,
  Radio,
  Globe2,
  ShieldCheck,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
} from "lucide-react";
import { RoleType, SYSTEM_ROLES } from "@/types/erp";

export interface NavGroup {
  label: string;
  items: {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[];
}

export const ERP_NAV_GROUPS: NavGroup[] = [
  {
    label: "MAIN",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "PROJECT MANAGEMENT",
    items: [
      { label: "Projects", href: "/projects", icon: Building2 },
      { label: "Clients", href: "/clients", icon: Users2 },
      { label: "Tasks", href: "/tasks", icon: CheckSquare },
      { label: "Milestones", href: "/milestones", icon: Milestone },
      { label: "Project Calendar", href: "/calendar", icon: Calendar },
      { label: "Project Timeline", href: "/timeline", icon: GitBranch },
    ],
  },
  {
    label: "MATERIALS & INVENTORY",
    items: [
      { label: "Materials", href: "/materials", icon: Boxes },
      { label: "Inventory", href: "/inventory", icon: Boxes },
      { label: "Warehouses", href: "/warehouses", icon: Warehouse },
      { label: "Stock Movements", href: "/stock-movements", icon: ArrowLeftRight },
      { label: "Material Usage", href: "/material-usage", icon: TrendingDown },
    ],
  },
  {
    label: "PROCUREMENT",
    items: [
      { label: "Material Requests", href: "/procurement/requests", icon: ShoppingBag },
      { label: "Purchase Orders", href: "/procurement/orders", icon: FileText },
      { label: "Suppliers", href: "/procurement/suppliers", icon: Truck },
      { label: "Goods Receipts", href: "/procurement/receipts", icon: FileCheck },
      { label: "Supplier Invoices", href: "/procurement/invoices", icon: Receipt },
    ],
  },
  {
    label: "PEOPLE",
    items: [
      { label: "Employees", href: "/people/employees", icon: UserSquare2 },
      { label: "Workers", href: "/people/workers", icon: HardHat },
      { label: "Attendance", href: "/people/attendance", icon: Clock },
      { label: "Departments", href: "/people/departments", icon: Briefcase },
    ],
  },
  {
    label: "EQUIPMENT",
    items: [
      { label: "Equipment", href: "/equipment", icon: Wrench },
      { label: "Equipment Assignments", href: "/equipment/assignments", icon: HardHat },
      { label: "Maintenance", href: "/equipment/maintenance", icon: Cog },
    ],
  },
  {
    label: "FINANCE",
    items: [
      { label: "Budgets", href: "/finance/budgets", icon: DollarSign },
      { label: "Expenses", href: "/finance/expenses", icon: CreditCard },
      { label: "Invoices", href: "/finance/invoices", icon: Receipt },
      { label: "Payments", href: "/finance/payments", icon: Banknote },
      { label: "Income", href: "/finance/income", icon: TrendingDown },
      { label: "Financial Overview", href: "/finance/overview", icon: PieChart },
    ],
  },
  {
    label: "DOCUMENTS",
    items: [
      { label: "Documents", href: "/documents", icon: FolderLock },
      { label: "Project Documents", href: "/documents/projects", icon: FileText },
      { label: "Contracts", href: "/documents/contracts", icon: FileSignature },
      { label: "Receipts", href: "/documents/receipts", icon: Receipt },
    ],
  },
  {
    label: "REPORTS",
    items: [
      { label: "Project Reports", href: "/reports/projects", icon: FileText },
      { label: "Financial Reports", href: "/reports/financial", icon: PieChart },
      { label: "Inventory Reports", href: "/reports/inventory", icon: Boxes },
      { label: "Procurement Reports", href: "/reports/procurement", icon: ShoppingBag },
      { label: "Workforce Reports", href: "/reports/workforce", icon: HardHat },
      { label: "Equipment Reports", href: "/reports/equipment", icon: Wrench },
    ],
  },
  {
    label: "COMMUNICATION",
    items: [
      { label: "Notifications", href: "/notifications", icon: Bell, badge: "3" },
      { label: "Announcements", href: "/announcements", icon: Radio },
    ],
  },
  {
    label: "ADMINISTRATION",
    items: [
      { label: "Countries & Locations", href: "/administration/locations", icon: Globe2 },
      { label: "Users", href: "/administration/users", icon: Users2 },
      { label: "Roles & Permissions", href: "/administration/roles", icon: ShieldCheck },
      { label: "Audit Logs", href: "/administration/audit-logs", icon: ScrollText },
      { label: "System Settings", href: "/administration/settings", icon: Settings },
    ],
  },
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
      {/* ================= MOBILE BACKDROP OVERLAY ================= */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity duration-300"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* ================= SIDEBAR CONTAINER ================= */}
      <aside
        id="app-sidebar"
        aria-label="Main Navigation"
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#13151A] border-r border-[#232733] text-slate-300 select-none
          transition-transform duration-300 ease-in-out lg:translate-x-0
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsed ? "lg:w-20" : "lg:w-64"}
          w-72 shadow-2xl lg:shadow-none
        `}
      >
        {/* Top Branding Section */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#232733] bg-[#0F1117]">
          <Link
            href="/dashboard"
            onClick={onMobileClose}
            className="flex items-center gap-2.5 overflow-hidden"
          >
            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-lg tracking-wider shadow-md shrink-0">
              A
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-bold text-white tracking-wide">
                  APEX <span className="text-blue-400">ERP</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">
                  Construction OS
                </span>
              </div>
            )}
          </Link>

          {/* Mobile close button */}
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop collapse toggle button */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
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
        <div className="px-3 py-3 border-b border-[#232733] bg-[#161820]">
          {!isCollapsed ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white truncate max-w-[150px]">
                  {userName}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {userRole}
                </span>
              </div>
              {onRoleChange && (
                <select
                  value={userRole}
                  onChange={(e) => onRoleChange(e.target.value as RoleType)}
                  className="w-full text-xs bg-[#1F232E] border border-[#2E3342] text-slate-300 rounded px-2 py-1 outline-none focus:border-blue-500"
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
              <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-xs font-bold text-blue-300">
                {userName.charAt(0)}
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
          {ERP_NAV_GROUPS.map((group) => (
            <div key={group.label} className="space-y-1">
              {!isCollapsed ? (
                <p className="px-2 text-[10px] font-semibold text-slate-500 tracking-wider uppercase font-mono">
                  {group.label}
                </p>
              ) : (
                <div className="h-px bg-[#232733] my-2 mx-1" />
              )}

              {group.items.map((item) => {
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
                    className={`flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-medium transition-all group relative ${
                      isActive
                        ? "bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20"
                        : "text-slate-400 hover:text-slate-100 hover:bg-[#1E222D]"
                    } ${isCollapsed ? "justify-center" : ""}`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!isCollapsed && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}
                    {!isCollapsed && item.badge && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom User Actions */}
        {onLogout && (
          <div className="p-3 border-t border-[#232733] bg-[#0F1117]">
            <button
              onClick={onLogout}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors ${
                isCollapsed ? "justify-center" : ""
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

