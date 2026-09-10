export type RoleType =
  | "Admin"
  | "Project Manager"
  | "Site Engineer"
  | "Procurement Officer"
  | "Warehouse Manager"
  | "Accountant"
  | "HR Manager"
  | "Worker"
  | "Client";

export const SYSTEM_ROLES: RoleType[] = [
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

export type Permission =
  // Wildcard
  | "*"
  // Project Management
  | "PROJECT_VIEW"
  | "PROJECT_CREATE"
  | "PROJECT_UPDATE"
  | "PROJECT_DELETE"
  | "PROJECT_ARCHIVE"
  // Tasks & Milestones
  | "TASK_VIEW"
  | "TASK_CREATE"
  | "TASK_UPDATE"
  | "TASK_DELETE"
  | "MILESTONE_VIEW"
  | "MILESTONE_MANAGE"
  | "PROGRESS_LOG"
  // Clients
  | "CLIENT_VIEW"
  | "CLIENT_CREATE"
  | "CLIENT_UPDATE"
  | "CLIENT_DELETE"
  // Materials Catalog
  | "MATERIAL_VIEW"
  | "MATERIAL_CREATE"
  | "MATERIAL_UPDATE"
  | "MATERIAL_DELETE"
  // Warehouse & Inventory Movements
  | "INVENTORY_VIEW"
  | "INVENTORY_ADJUST"
  | "INVENTORY_TRANSFER"
  | "WAREHOUSE_MANAGE"
  | "STOCK_TRANSACTION_VIEW"
  // Suppliers & Procurement
  | "SUPPLIER_VIEW"
  | "SUPPLIER_MANAGE"
  | "MATERIAL_REQUEST_CREATE"
  | "MATERIAL_REQUEST_VIEW"
  | "MATERIAL_REQUEST_APPROVE"
  | "PURCHASE_ORDER_CREATE"
  | "PURCHASE_ORDER_VIEW"
  | "PURCHASE_ORDER_APPROVE"
  | "GOODS_RECEIPT_CREATE"
  | "GOODS_RECEIPT_VIEW"
  // Employees & Labor
  | "EMPLOYEE_VIEW"
  | "EMPLOYEE_MANAGE"
  | "ATTENDANCE_VIEW"
  | "ATTENDANCE_LOG"
  // Equipment & Plant
  | "EQUIPMENT_VIEW"
  | "EQUIPMENT_MANAGE"
  | "EQUIPMENT_ASSIGN"
  | "MAINTENANCE_LOG"
  // Finance & Cost Control
  | "FINANCE_VIEW"
  | "EXPENSE_CREATE"
  | "EXPENSE_APPROVE"
  | "INVOICE_VIEW"
  | "INVOICE_CREATE"
  | "PAYMENT_RECORD"
  // Documents
  | "DOCUMENT_VIEW"
  | "DOCUMENT_UPLOAD"
  | "DOCUMENT_DELETE"
  // Notifications & Audit Logs
  | "NOTIFICATION_VIEW"
  | "AUDIT_VIEW"
  // System Administration
  | "USER_MANAGE"
  | "ROLE_MANAGE"
  | "SETTINGS_MANAGE"
  | "REPORT_VIEW"
  | "REPORT_EXPORT";

export interface SessionUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: RoleType;
  department?: string;
  assignedProjects?: string[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

