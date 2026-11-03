export type RoleType =
  | "Super Admin"
  | "Company Admin"
  | "Admin"
  | "Project Manager"
  | "Site Engineer"
  | "Quantity Surveyor"
  | "Procurement Officer"
  | "Storekeeper"
  | "Warehouse Manager"
  | "Contractor"
  | "Supplier"
  | "Accountant"
  | "HR Manager"
  | "Worker"
  | "Client"
  | "Viewer";

export const SYSTEM_ROLES: RoleType[] = [
  "Super Admin",
  "Company Admin",
  "Admin",
  "Project Manager",
  "Site Engineer",
  "Quantity Surveyor",
  "Procurement Officer",
  "Storekeeper",
  "Warehouse Manager",
  "Contractor",
  "Supplier",
  "Accountant",
  "HR Manager",
  "Worker",
  "Client",
  "Viewer",
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
  | "projects.read"
  | "projects.create"
  | "projects.update"
  | "projects.delete"
  | "projects.archive"
  // Tasks & Milestones
  | "TASK_VIEW"
  | "TASK_CREATE"
  | "TASK_UPDATE"
  | "TASK_DELETE"
  | "MILESTONE_VIEW"
  | "MILESTONE_MANAGE"
  | "PROGRESS_LOG"
  | "tasks.read"
  | "tasks.create"
  | "tasks.assign"
  | "tasks.update"
  | "tasks.delete"
  // Clients
  | "CLIENT_VIEW"
  | "CLIENT_CREATE"
  | "CLIENT_UPDATE"
  | "CLIENT_DELETE"
  | "clients.read"
  | "clients.manage"
  // Materials Catalog
  | "MATERIAL_VIEW"
  | "MATERIAL_CREATE"
  | "MATERIAL_UPDATE"
  | "MATERIAL_DELETE"
  | "materials.read"
  | "materials.manage"
  // Warehouse & Inventory Movements
  | "INVENTORY_VIEW"
  | "INVENTORY_ADJUST"
  | "INVENTORY_TRANSFER"
  | "WAREHOUSE_MANAGE"
  | "STOCK_TRANSACTION_VIEW"
  | "inventory.read"
  | "inventory.receive"
  | "inventory.issue"
  | "inventory.adjust"
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
  | "procurement.read"
  | "procurement.create"
  | "procurement.approve"
  // Employees & Labor
  | "EMPLOYEE_VIEW"
  | "EMPLOYEE_MANAGE"
  | "ATTENDANCE_VIEW"
  | "ATTENDANCE_LOG"
  | "people.read"
  | "people.manage"
  // Equipment & Plant
  | "EQUIPMENT_VIEW"
  | "EQUIPMENT_MANAGE"
  | "EQUIPMENT_ASSIGN"
  | "MAINTENANCE_LOG"
  | "equipment.read"
  | "equipment.manage"
  | "equipment.assign"
  | "equipment.maintain"
  // Finance & Cost Control
  | "FINANCE_VIEW"
  | "BUDGET_VIEW"
  | "BUDGET_CREATE"
  | "EXPENSE_CREATE"
  | "EXPENSE_APPROVE"
  | "INVOICE_VIEW"
  | "INVOICE_CREATE"
  | "PAYMENT_RECORD"
  | "finance.read"
  | "finance.create"
  | "finance.approve"
  // Documents
  | "DOCUMENT_VIEW"
  | "DOCUMENT_UPLOAD"
  | "DOCUMENT_DELETE"
  | "documents.read"
  | "documents.upload"
  | "documents.delete"
  // Notifications & Audit Logs
  | "NOTIFICATION_VIEW"
  | "AUDIT_VIEW"
  | "notifications.read"
  | "audit.read"
  // System Administration & Multi-Tenant
  | "USER_MANAGE"
  | "ROLE_MANAGE"
  | "SETTINGS_MANAGE"
  | "REPORT_VIEW"
  | "REPORT_EXPORT"
  | "users.manage"
  | "organization.manage"
  | "reports.read"
  | "reports.export";

export interface SessionUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: RoleType;
  department?: string;
  organizationId?: string;
  customPermissions?: string[];
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

