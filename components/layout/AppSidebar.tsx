"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users2,
  CheckSquare,
  Boxes,
  Truck,
  CreditCard,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  X,
  Warehouse,
  ShoppingBag,
  Calendar,
  GitBranch,
  HardHat,
  UserSquare2,
  Clock,
  DollarSign,
  PieChart,
  FolderLock,
  ShieldCheck,
} from "lucide-react";
import { Permission, RoleType, SYSTEM_ROLES } from "@/types/erp";
import { getRolePermissions } from "@/lib/rbac/permissions";
import { ApexLogo } from "@/components/brand/ApexLogo";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  requiredPermission?: Permission;
}

// Primary construction operations navigation.
export const PRIMARY_ERP_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, requiredPermission: "PROJECT_VIEW" },
  { label: "Projects", href: "/projects", icon: Building2, requiredPermission: "PROJECT_VIEW" },
  { label: "Tasks", href: "/tasks", icon: CheckSquare, requiredPermission: "TASK_VIEW" },
  { label: "Materials & Inventory", href: "/inventory", icon: Boxes, requiredPermission: "INVENTORY_VIEW" },
  { label: "Equipment", href: "/equipment", icon: Truck, requiredPermission: "EQUIPMENT_VIEW" },
  { label: "Payments", href: "/finance/payments", icon: CreditCard, requiredPermission: "PAYMENT_RECORD" },
  { label: "Reports", href: "/reports", icon: FileText, requiredPermission: "REPORT_VIEW" },
  { label: "Clients", href: "/clients", icon: Users2, requiredPermission: "CLIENT_VIEW" },
  { label: "Settings", href: "/administration/settings", icon: Settings, requiredPermission: "SETTINGS_MANAGE" },
];

// Extended ERP Modules accessible via collapsible section so no routes are broken
export const SECONDARY_ERP_NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Planning & Timeline",
    items: [
      { label: "Calendar", href: "/calendar", icon: Calendar, requiredPermission: "PROJECT_VIEW" },
      { label: "Timeline", href: "/timeline", icon: GitBranch, requiredPermission: "PROJECT_VIEW" },
    ],
  },
  {
    group: "Materials & Procurement",
    items: [
      { label: "Materials Catalog", href: "/materials", icon: Boxes, requiredPermission: "MATERIAL_VIEW" },
      { label: "Warehouses", href: "/warehouses", icon: Warehouse, requiredPermission: "INVENTORY_VIEW" },
      { label: "Purchase Orders", href: "/procurement/orders", icon: ShoppingBag, requiredPermission: "PURCHASE_ORDER_VIEW" },
    ],
  },
  {
    group: "Workforce",
    items: [
      { label: "Employees", href: "/people/employees", icon: UserSquare2, requiredPermission: "EMPLOYEE_VIEW" },
      { label: "Site Workers", href: "/people/workers", icon: HardHat, requiredPermission: "EMPLOYEE_VIEW" },
      { label: "Attendance", href: "/people/attendance", icon: Clock, requiredPermission: "ATTENDANCE_VIEW" },
    ],
  },
  {
    group: "Finance & Admin",
    items: [
      { label: "Budgets", href: "/finance/budgets", icon: DollarSign, requiredPermission: "FINANCE_VIEW" },
      { label: "Financial Overview", href: "/finance/overview", icon: PieChart, requiredPermission: "FINANCE_VIEW" },
      { label: "Documents", href: "/documents", icon: FolderLock, requiredPermission: "DOCUMENT_VIEW" },
      { label: "Users & Roles", href: "/administration/users", icon: ShieldCheck, requiredPermission: "USER_MANAGE" },
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
  userName = "Signed out",
  userRole,
  onRoleChange,
  onLogout,
}: AppSidebarProps) {
  const pathname = usePathname();
  const [showExtended, setShowExtended] = useState(false);
  const permissions = getRolePermissions(userRole as RoleType);
  const canSee = (permission?: Permission) => !permission || permissions.includes("*") || permissions.includes(permission);

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
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#13151A] border-r border-[#232733] text-slate-300 select-none
          transition-all duration-300 ease-in-out
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${isCollapsed ? "md:w-20" : "md:w-64"}
          w-72 shadow-2xl md:shadow-none
        `}
      >
        {/* Top Branding Section */}
        <div className={`relative h-16 flex items-center border-b border-[#232733] bg-[#0F1117] shrink-0 ${isCollapsed ? "justify-center px-2" : "justify-between px-4"}`}>
          <Link
            href="/dashboard"
            onClick={onMobileClose}
            className="flex items-center gap-2.5 min-w-0"
          >
            <ApexLogo size={36} className="rounded-xl shadow-md shadow-amber-500/30" />
            {!isCollapsed && (
              <div className="flex flex-col truncate leading-none min-w-0">
                <span className="text-sm font-extrabold text-white tracking-widest uppercase truncate">
                  Apex <span className="text-amber-400">Build</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-0.5 truncate">
                  Construction ERP
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
            className={`hidden md:flex rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${isCollapsed ? "absolute right-1.5 top-5 p-1" : "p-1.5"}`}
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
        <div className="px-3 py-3 border-b border-[#232733] bg-[#161820] shrink-0">
          {!isCollapsed ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white truncate max-w-[140px]">
                  {userName}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {userRole ?? "Signed out"}
                </span>
              </div>
              {onRoleChange && userRole && (
                <select
                  value={userRole}
                  onChange={(e) => onRoleChange(e.target.value as RoleType)}
                  className="w-full text-xs bg-[#1F232E] border border-[#2E3342] text-slate-300 rounded-lg px-2 py-1 outline-none focus:border-blue-500 cursor-pointer"
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
            <div className="flex justify-center" title={`${userName} (${userRole ?? "Signed out"})`}>
              <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-xs font-bold text-blue-300">
                {userName.charAt(0)}
              </div>
            </div>
          )}
        </div>

        {/* Primary Navigation Items (9 items) */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
          {!isCollapsed && (
            <p className="px-2.5 py-1 text-[10px] font-semibold text-slate-500 tracking-wider uppercase font-mono">
              Construction ERP
            </p>
          )}

          {PRIMARY_ERP_NAV.filter((item) => canSee(item.requiredPermission)).map((item) => {
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
                    ? "bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/25"
                    : "text-slate-400 hover:text-slate-100 hover:bg-[#1E222D]"
                } ${isCollapsed ? "justify-center px-2" : ""}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!isCollapsed && (
                  <span className="truncate flex-1 text-xs">{item.label}</span>
                )}
                {!isCollapsed && item.badge && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Extended ERP Modules Dropdown */}
          {!isCollapsed ? (
            <div className="pt-3">
              <button
                onClick={() => setShowExtended(!showExtended)}
                className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors"
              >
                <span>Extended Modules</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    showExtended ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showExtended && (
                <div className="space-y-3 mt-2 pl-2 border-l border-[#232733] ml-2">
                  {SECONDARY_ERP_NAV.map((sec) => (
                    <div key={sec.group} className="space-y-0.5">
                      <p className="px-2 text-[9px] font-semibold text-slate-500 uppercase font-mono">
                        {sec.group}
                      </p>
                      {sec.items.filter((subItem) => canSee(subItem.requiredPermission)).map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isSubActive = pathname?.startsWith(subItem.href);
                        return (
                          <Link
                            key={subItem.label}
                            href={subItem.href}
                            onClick={onMobileClose}
                            className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${
                              isSubActive
                                ? "bg-amber-500/15 text-amber-300 font-semibold"
                                : "text-slate-400 hover:text-white hover:bg-[#1E222D]"
                            }`}
                          >
                            <SubIcon className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                            <span className="truncate">{subItem.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-px bg-[#232733] my-2 mx-1" />
          )}
        </div>

        {/* Bottom User Actions */}
        {onLogout && (
          <div className="p-3 border-t border-[#232733] bg-[#0F1117] shrink-0">
            <button
              onClick={onLogout}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors ${
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
