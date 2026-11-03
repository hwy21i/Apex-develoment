import type { Permission, RoleType, SessionUser } from "../../types/erp.ts";

export const ROLE_PERMISSIONS: Record<RoleType, Permission[]> = {
  "Super Admin": ["*"],
  "Company Admin": ["*"],
  Admin: ["*"],

  "Project Manager": [
    "PROJECT_VIEW",
    "PROJECT_CREATE",
    "PROJECT_UPDATE",
    "PROJECT_ARCHIVE",
    "TASK_VIEW",
    "TASK_CREATE",
    "TASK_UPDATE",
    "TASK_DELETE",
    "MILESTONE_VIEW",
    "MILESTONE_MANAGE",
    "PROGRESS_LOG",
    "CLIENT_VIEW",
    "MATERIAL_VIEW",
    "INVENTORY_VIEW",
    "STOCK_TRANSACTION_VIEW",
    "MATERIAL_REQUEST_CREATE",
    "MATERIAL_REQUEST_VIEW",
    "MATERIAL_REQUEST_APPROVE",
    "PURCHASE_ORDER_VIEW",
    "GOODS_RECEIPT_VIEW",
    "EMPLOYEE_VIEW",
    "ATTENDANCE_VIEW",
    "EQUIPMENT_VIEW",
    "EQUIPMENT_ASSIGN",
    "FINANCE_VIEW",
    "EXPENSE_CREATE",
    "EXPENSE_APPROVE",
    "DOCUMENT_VIEW",
    "DOCUMENT_UPLOAD",
    "DOCUMENT_DELETE",
    "NOTIFICATION_VIEW",
    "REPORT_VIEW",
    "REPORT_EXPORT",
    "projects.read",
    "projects.create",
    "projects.update",
    "tasks.read",
    "tasks.create",
    "tasks.assign",
    "tasks.update",
    "finance.read",
    "finance.create",
    "finance.approve",
    "procurement.read",
    "procurement.approve",
    "inventory.read",
    "reports.read",
    "reports.export",
  ],

  "Site Engineer": [
    "PROJECT_VIEW",
    "TASK_VIEW",
    "TASK_CREATE",
    "TASK_UPDATE",
    "MILESTONE_VIEW",
    "PROGRESS_LOG",
    "MATERIAL_VIEW",
    "INVENTORY_VIEW",
    "MATERIAL_REQUEST_CREATE",
    "MATERIAL_REQUEST_VIEW",
    "GOODS_RECEIPT_VIEW",
    "EMPLOYEE_VIEW",
    "ATTENDANCE_LOG",
    "EQUIPMENT_VIEW",
    "MAINTENANCE_LOG",
    "EXPENSE_CREATE",
    "DOCUMENT_VIEW",
    "DOCUMENT_UPLOAD",
    "NOTIFICATION_VIEW",
    "REPORT_VIEW",
    "projects.read",
    "tasks.read",
    "tasks.create",
    "tasks.update",
    "inventory.read",
  ],

  "Quantity Surveyor": [
    "PROJECT_VIEW",
    "TASK_VIEW",
    "MILESTONE_VIEW",
    "PROGRESS_LOG",
    "FINANCE_VIEW",
    "EXPENSE_CREATE",
    "EXPENSE_APPROVE",
    "INVOICE_VIEW",
    "INVOICE_CREATE",
    "MATERIAL_VIEW",
    "INVENTORY_VIEW",
    "DOCUMENT_VIEW",
    "DOCUMENT_UPLOAD",
    "REPORT_VIEW",
    "REPORT_EXPORT",
    "projects.read",
    "finance.read",
    "finance.create",
    "finance.approve",
    "reports.read",
    "reports.export",
  ],

  "Procurement Officer": [
    "PROJECT_VIEW",
    "MATERIAL_VIEW",
    "MATERIAL_CREATE",
    "MATERIAL_UPDATE",
    "INVENTORY_VIEW",
    "STOCK_TRANSACTION_VIEW",
    "SUPPLIER_VIEW",
    "SUPPLIER_MANAGE",
    "MATERIAL_REQUEST_VIEW",
    "PURCHASE_ORDER_CREATE",
    "PURCHASE_ORDER_VIEW",
    "PURCHASE_ORDER_APPROVE",
    "GOODS_RECEIPT_VIEW",
    "DOCUMENT_VIEW",
    "DOCUMENT_UPLOAD",
    "NOTIFICATION_VIEW",
    "REPORT_VIEW",
    "REPORT_EXPORT",
    "procurement.read",
    "procurement.create",
    "procurement.approve",
    "inventory.read",
  ],

  Storekeeper: [
    "PROJECT_VIEW",
    "MATERIAL_VIEW",
    "MATERIAL_CREATE",
    "MATERIAL_UPDATE",
    "INVENTORY_VIEW",
    "INVENTORY_ADJUST",
    "INVENTORY_TRANSFER",
    "WAREHOUSE_MANAGE",
    "STOCK_TRANSACTION_VIEW",
    "PURCHASE_ORDER_VIEW",
    "GOODS_RECEIPT_CREATE",
    "GOODS_RECEIPT_VIEW",
    "DOCUMENT_VIEW",
    "DOCUMENT_UPLOAD",
    "NOTIFICATION_VIEW",
    "inventory.read",
    "inventory.receive",
    "inventory.issue",
    "inventory.adjust",
  ],

  "Warehouse Manager": [
    "PROJECT_VIEW",
    "MATERIAL_VIEW",
    "MATERIAL_CREATE",
    "MATERIAL_UPDATE",
    "INVENTORY_VIEW",
    "INVENTORY_ADJUST",
    "INVENTORY_TRANSFER",
    "WAREHOUSE_MANAGE",
    "STOCK_TRANSACTION_VIEW",
    "PURCHASE_ORDER_VIEW",
    "GOODS_RECEIPT_CREATE",
    "GOODS_RECEIPT_VIEW",
    "DOCUMENT_VIEW",
    "DOCUMENT_UPLOAD",
    "NOTIFICATION_VIEW",
    "REPORT_VIEW",
    "inventory.read",
    "inventory.receive",
    "inventory.issue",
    "inventory.adjust",
  ],

  Contractor: [
    "PROJECT_VIEW",
    "TASK_VIEW",
    "TASK_UPDATE",
    "PROGRESS_LOG",
    "MATERIAL_REQUEST_CREATE",
    "MATERIAL_REQUEST_VIEW",
    "DOCUMENT_VIEW",
    "DOCUMENT_UPLOAD",
    "NOTIFICATION_VIEW",
    "projects.read",
    "tasks.read",
    "tasks.update",
  ],

  Supplier: [
    "MATERIAL_VIEW",
    "PURCHASE_ORDER_VIEW",
    "GOODS_RECEIPT_VIEW",
    "NOTIFICATION_VIEW",
    "procurement.read",
  ],

  Accountant: [
    "PROJECT_VIEW",
    "CLIENT_VIEW",
    "SUPPLIER_VIEW",
    "PURCHASE_ORDER_VIEW",
    "GOODS_RECEIPT_VIEW",
    "FINANCE_VIEW",
    "EXPENSE_CREATE",
    "EXPENSE_APPROVE",
    "INVOICE_VIEW",
    "INVOICE_CREATE",
    "PAYMENT_RECORD",
    "DOCUMENT_VIEW",
    "DOCUMENT_UPLOAD",
    "NOTIFICATION_VIEW",
    "REPORT_VIEW",
    "REPORT_EXPORT",
    "AUDIT_VIEW",
    "finance.read",
    "finance.create",
    "finance.approve",
    "reports.read",
    "reports.export",
  ],

  "HR Manager": [
    "PROJECT_VIEW",
    "EMPLOYEE_VIEW",
    "EMPLOYEE_MANAGE",
    "ATTENDANCE_VIEW",
    "ATTENDANCE_LOG",
    "DOCUMENT_VIEW",
    "DOCUMENT_UPLOAD",
    "NOTIFICATION_VIEW",
    "REPORT_VIEW",
    "REPORT_EXPORT",
    "people.read",
    "people.manage",
  ],

  Worker: [
    "PROJECT_VIEW",
    "TASK_VIEW",
    "PROGRESS_LOG",
    "ATTENDANCE_LOG",
    "NOTIFICATION_VIEW",
    "tasks.read",
  ],

  Client: [
    "PROJECT_VIEW",
    "TASK_VIEW",
    "MILESTONE_VIEW",
    "INVOICE_VIEW",
    "DOCUMENT_VIEW",
    "REPORT_VIEW",
    "NOTIFICATION_VIEW",
    "projects.read",
    "tasks.read",
    "reports.read",
  ],

  Viewer: [
    "PROJECT_VIEW",
    "TASK_VIEW",
    "MILESTONE_VIEW",
    "DOCUMENT_VIEW",
    "REPORT_VIEW",
    "NOTIFICATION_VIEW",
    "projects.read",
    "tasks.read",
    "reports.read",
  ],
};

const PERMISSION_ALIASES: Record<string, string[]> = {
  PROJECT_VIEW: ["projects.read"],
  PROJECT_CREATE: ["projects.create"],
  PROJECT_UPDATE: ["projects.update"],
  PROJECT_DELETE: ["projects.delete"],
  PROJECT_ARCHIVE: ["projects.archive"],
  TASK_VIEW: ["tasks.read"],
  TASK_CREATE: ["tasks.create"],
  TASK_UPDATE: ["tasks.update", "tasks.assign"],
  TASK_DELETE: ["tasks.delete"],
  FINANCE_VIEW: ["finance.read"],
  EXPENSE_CREATE: ["finance.create"],
  EXPENSE_APPROVE: ["finance.approve"],
  PURCHASE_ORDER_CREATE: ["procurement.create"],
  PURCHASE_ORDER_APPROVE: ["procurement.approve"],
  GOODS_RECEIPT_CREATE: ["inventory.receive"],
  INVENTORY_VIEW: ["inventory.read"],
  INVENTORY_TRANSFER: ["inventory.issue"],
  INVENTORY_ADJUST: ["inventory.adjust"],
  REPORT_VIEW: ["reports.read"],
  REPORT_EXPORT: ["reports.export"],
  USER_MANAGE: ["users.manage"],
  SETTINGS_MANAGE: ["organization.manage"],
};

export function getRolePermissions(role: RoleType): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(user: SessionUser | null | undefined, permission: Permission): boolean {
  if (!user || !user.role) return false;
  if (user.role === "Super Admin" || user.role === "Admin" || user.role === "Company Admin") return true;

  const userCustom = (user.customPermissions || []) as string[];
  const rolePerms = (ROLE_PERMISSIONS[user.role] || []) as string[];
  const allUserPerms = new Set([...rolePerms, ...userCustom]);

  if (allUserPerms.has("*") || allUserPerms.has(permission)) return true;

  // Check aliases
  for (const [key, aliases] of Object.entries(PERMISSION_ALIASES)) {
    if (key === permission && aliases.some((a) => allUserPerms.has(a))) return true;
    if (aliases.includes(permission as string) && allUserPerms.has(key)) return true;
  }

  return false;
}

export function hasAnyPermission(user: SessionUser | null | undefined, permissions: Permission[]): boolean {
  if (!user || !user.role) return false;
  if (user.role === "Super Admin" || user.role === "Admin" || user.role === "Company Admin") return true;
  return permissions.some((p) => hasPermission(user, p));
}

export function hasAllPermissions(user: SessionUser | null | undefined, permissions: Permission[]): boolean {
  if (!user || !user.role) return false;
  if (user.role === "Super Admin" || user.role === "Admin" || user.role === "Company Admin") return true;
  return permissions.every((p) => hasPermission(user, p));
}

