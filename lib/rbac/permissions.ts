import { Permission, RoleType, SessionUser } from "@/types/erp";

export const ROLE_PERMISSIONS: Record<RoleType, Permission[]> = {
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
  ],

  Worker: [
    "PROJECT_VIEW",
    "TASK_VIEW",
    "PROGRESS_LOG",
    "ATTENDANCE_LOG",
    "NOTIFICATION_VIEW",
  ],

  Client: [
    "PROJECT_VIEW",
    "TASK_VIEW",
    "MILESTONE_VIEW",
    "INVOICE_VIEW",
    "DOCUMENT_VIEW",
    "REPORT_VIEW",
    "NOTIFICATION_VIEW",
  ],
};

export function getRolePermissions(role: RoleType): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(user: SessionUser | null | undefined, permission: Permission): boolean {
  if (!user || !user.role) return false;
  const perms = ROLE_PERMISSIONS[user.role] ?? [];
  return perms.includes("*") || perms.includes(permission);
}

export function hasAnyPermission(user: SessionUser | null | undefined, permissions: Permission[]): boolean {
  if (!user || !user.role) return false;
  const perms = ROLE_PERMISSIONS[user.role] ?? [];
  if (perms.includes("*")) return true;
  return permissions.some((p) => perms.includes(p));
}

export function hasAllPermissions(user: SessionUser | null | undefined, permissions: Permission[]): boolean {
  if (!user || !user.role) return false;
  const perms = ROLE_PERMISSIONS[user.role] ?? [];
  if (perms.includes("*")) return true;
  return permissions.every((p) => perms.includes(p));
}

