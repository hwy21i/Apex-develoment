"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Shield, Check, X, Lock, Key, Users, Edit,
  CheckCircle, AlertCircle, ChevronRight
} from "lucide-react";
import { RoleType } from "@/types/erp";
import { ROLE_PERMISSIONS } from "@/lib/rbac/permissions";

const ALL_ROLES: RoleType[] = [
  "Admin",
  "Project Manager",
  "Site Engineer",
  "Procurement Officer",
  "Warehouse Manager",
  "Accountant",
  "HR Manager",
  "Worker",
  "Client",
];

const PERMISSION_CATEGORIES = [
  {
    category: "Project & Planning",
    permissions: ["PROJECT_VIEW", "PROJECT_CREATE", "PROJECT_UPDATE", "PROJECT_ARCHIVE", "TASK_VIEW", "TASK_CREATE", "TASK_UPDATE", "TASK_DELETE", "MILESTONE_VIEW", "MILESTONE_MANAGE", "PROGRESS_LOG"],
  },
  {
    category: "Procurement & Materials",
    permissions: ["MATERIAL_VIEW", "MATERIAL_MANAGE", "INVENTORY_VIEW", "STOCK_TRANSACTION_CREATE", "MATERIAL_REQUEST_CREATE", "MATERIAL_REQUEST_VIEW", "MATERIAL_REQUEST_APPROVE", "PURCHASE_ORDER_CREATE", "PURCHASE_ORDER_VIEW", "PURCHASE_ORDER_APPROVE", "GOODS_RECEIPT_CREATE", "GOODS_RECEIPT_VIEW"],
  },
  {
    category: "Financials & Billing",
    permissions: ["FINANCE_VIEW", "BUDGET_MANAGE", "EXPENSE_CREATE", "EXPENSE_APPROVE", "INVOICE_CREATE", "INVOICE_APPROVE", "PAYMENT_RECORD"],
  },
  {
    category: "HR & Site Labor",
    permissions: ["EMPLOYEE_VIEW", "EMPLOYEE_MANAGE", "ATTENDANCE_VIEW", "ATTENDANCE_LOG"],
  },
  {
    category: "Plant & Equipment",
    permissions: ["EQUIPMENT_VIEW", "EQUIPMENT_MANAGE", "EQUIPMENT_ASSIGN", "MAINTENANCE_LOG"],
  },
  {
    category: "System Administration",
    permissions: ["USER_MANAGE", "ROLE_MANAGE", "AUDIT_VIEW", "SETTINGS_MANAGE"],
  },
];

export default function RolesAndPermissionsPage() {
  const [selectedRole, setSelectedRole] = useState<RoleType>("Project Manager");

  const currentPermissions = ROLE_PERMISSIONS[selectedRole] || [];
  const isSuperAdmin = selectedRole === "Admin";

  const hasPermission = (perm: string) => {
    if (isSuperAdmin) return true;
    return currentPermissions.includes(perm as any);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Roles & Granular RBAC Permissions</h1>
            <p className="text-gray-400 text-sm mt-1">
              Configure access matrices, role capabilities, operational guardrails, and audit privileges
            </p>
          </div>
        </div>

        {/* Roles selector tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {ALL_ROLES.map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                selectedRole === role
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                  : "bg-gray-800 text-gray-400 hover:text-white border border-gray-700"
              }`}
            >
              <Shield size={13} />
              {role}
            </button>
          ))}
        </div>

        {/* Selected role details banner */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">{selectedRole}</h2>
              {isSuperAdmin && (
                <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs px-2 py-0.5 rounded font-bold">
                  Wildcard [*] Full Root Authority
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {isSuperAdmin
                ? "The Administrator role possesses unrestricted access to all ERP endpoints, database models, and system configurations."
                : `Configured with ${currentPermissions.length} granted operational permissions.`}
            </p>
          </div>
        </div>

        {/* Permission breakdown categories */}
        <div className="space-y-6">
          {PERMISSION_CATEGORIES.map((cat, idx) => (
            <div key={idx} className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-white border-b border-gray-700 pb-2">
                {cat.category}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {cat.permissions.map((perm) => {
                  const active = hasPermission(perm);
                  return (
                    <div
                      key={perm}
                      className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                        active
                          ? "bg-blue-500/10 border-blue-500/30 text-white"
                          : "bg-gray-900/40 border-gray-700/60 text-gray-500"
                      }`}
                    >
                      <span className="font-mono font-medium">{perm}</span>
                      {active ? (
                        <Check size={14} className="text-green-400 font-bold" />
                      ) : (
                        <X size={14} className="text-gray-600" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
