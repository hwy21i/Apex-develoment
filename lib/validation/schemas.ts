import { z } from "zod";
import { SYSTEM_ROLES } from "@/types/erp";

// ================= AUTH VALIDATIONS =================
export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(120),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(40)
    .regex(/^[a-zA-Z0-9_.-]+$/, "Username can only contain alphanumeric characters, underscores, dots, or hyphens"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
  phone: z.string().max(30).optional(),
  department: z.string().max(80).optional(),
  position: z.string().max(80).optional(),
  role: z.enum(SYSTEM_ROLES as [string, ...string[]]).default("Worker"),
});

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(128),
});

export const userUpdateSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  phone: z.string().max(30).optional(),
  department: z.string().max(80).optional(),
  position: z.string().max(80).optional(),
  role: z.enum(SYSTEM_ROLES as [string, ...string[]]).optional(),
  isActive: z.boolean().optional(),
  assignedProjects: z.array(z.string().regex(/^[a-f\d]{24}$/i, "Invalid project ID")).optional(),
});

// ================= PROJECT VALIDATIONS =================
export const projectSchema = z
  .object({
    name: z.string().min(2, "Project name must be at least 2 characters").max(160),
    projectCode: z.string().min(2).max(40).optional(),
    description: z.string().max(3000).optional(),
    client: z.string().min(2).max(160),
    location: z.string().min(2, "Location is required").max(200),
    projectManager: z.string().regex(/^[a-f\d]{24}$/i, "Invalid Project Manager ID").optional(),
    teamMembers: z.array(z.string().regex(/^[a-f\d]{24}$/i, "Invalid Team Member ID")).default([]),
    startDate: z.coerce.date(),
    expectedEndDate: z.coerce.date(),
    actualEndDate: z.coerce.date().optional(),
    totalBudget: z.coerce.number().nonnegative("Budget cannot be negative"),
    contractValue: z.coerce.number().nonnegative().default(0),
    status: z.enum(["planning", "active", "on-hold", "completed", "cancelled"]).default("planning"),
    currentPhase: z.string().max(100).optional(),
  })
  .refine((v) => v.expectedEndDate > v.startDate, {
    message: "Expected end date must be after start date",
    path: ["expectedEndDate"],
  });

export const projectUpdateSchema = z.object({
  name: z.string().min(2).max(160).optional(),
  projectCode: z.string().min(2).max(40).optional(),
  description: z.string().max(3000).optional(),
  client: z.string().min(2).max(160).optional(),
  location: z.string().min(2).max(200).optional(),
  projectManager: z.string().regex(/^[a-f\d]{24}$/i, "Invalid Project Manager ID").optional(),
  teamMembers: z.array(z.string().regex(/^[a-f\d]{24}$/i, "Invalid Team Member ID")).optional(),
  startDate: z.coerce.date().optional(),
  expectedEndDate: z.coerce.date().optional(),
  actualEndDate: z.coerce.date().optional(),
  contractValue: z.coerce.number().nonnegative().optional(),
  totalBudget: z.coerce.number().nonnegative().optional(),
  revisedBudget: z.coerce.number().nonnegative().optional(),
  amountSpent: z.coerce.number().nonnegative().optional(),
  committedCost: z.coerce.number().nonnegative().optional(),
  progressPercentage: z.coerce.number().min(0).max(100).optional(),
  status: z.enum(["planning", "active", "on-hold", "completed", "cancelled"]).optional(),
  currentPhase: z.string().max(100).optional(),
  healthStatus: z.string().transform((value) => value.toUpperCase().replace(/\s+/g, "_")).pipe(z.enum(["ON_TRACK", "AT_RISK", "DELAYED", "CRITICAL"])).optional(),
});

// ================= TASK VALIDATIONS =================
export const taskSchema = z.object({
  title: z.string().min(2, "Task title is required").max(200),
  description: z.string().max(3000).optional(),
  projectId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid Project ID"),
  assignedTo: z.string().regex(/^[a-f\d]{24}$/i, "Invalid Assigned User ID"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "DELAYED", "BLOCKED"]).default("NOT_STARTED"),
  progress: z.coerce.number().min(0).max(100).default(0),
  startDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  dependencies: z.array(z.string().regex(/^[a-f\d]{24}$/i)).default([]),
  notes: z.string().max(3000).optional(),
});

// ================= OPERATIONAL RECORD VALIDATIONS =================
export const materialRequestCreateSchema = z.object({
  projectId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid Project ID"),
  requiredByDate: z.coerce.date(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  materialId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid Material ID"),
  requestedQuantity: z.coerce.number().int().positive(),
  reason: z.string().min(2).max(1000),
});

export const materialRequestDecisionSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  approvalNotes: z.string().max(1000).optional(),
});

export const clientCreateSchema = z.object({
  name: z.string().min(2).max(160),
  companyName: z.string().max(160).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(30).optional(),
  address: z.string().max(300).optional(),
  taxId: z.string().max(80).optional(),
  paymentTerms: z.string().max(80).default("Net 30"),
  notes: z.string().max(1000).optional(),
});

export const expenseCreateSchema = z.object({
  expenseNumber: z.string().min(2).max(40).transform((value) => value.toUpperCase()),
  projectId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid Project ID"),
  category: z.enum(["Materials", "Labor", "Subcontractor", "Equipment", "Overhead & Permits", "Contingency"]),
  amount: z.coerce.number().positive(),
  date: z.coerce.date(),
  payee: z.string().min(2).max(160),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHECK", "CREDIT_LINE"]),
  receiptNumber: z.string().max(80).optional(),
  description: z.string().min(2).max(1000),
});

export const operationalSchema = z.object({
  projectId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid Project ID"),
  status: z.string().max(64).optional(),
  title: z.string().min(2).max(200).optional(),
  data: z.record(z.string(), z.unknown()).default({}),
});


// ================= LOCATION HIERARCHY VALIDATIONS =================
export const countrySchema = z.object({
  name: z.string().min(2, "Country name is required").max(100),
  countryCode: z.string().min(2).max(10).toUpperCase(),
  isoCode: z.string().max(10).toUpperCase().optional(),
  phoneCode: z.string().min(1).max(10),
  currency: z.string().min(1).max(50),
  currencyCode: z.string().min(2).max(10).toUpperCase(),
  currencySymbol: z.string().min(1).max(10),
  timeZone: z.string().min(1).max(60).default("Africa/Addis_Ababa"),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const regionSchema = z.object({
  name: z.string().min(2, "Region name is required").max(100),
  countryId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid Country ID"),
  regionCode: z.string().max(20).toUpperCase().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const citySchema = z.object({
  name: z.string().min(2, "City name is required").max(100),
  countryId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid Country ID"),
  regionId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid Region ID"),
  cityCode: z.string().max(20).toUpperCase().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const locationSchema = z.object({
  name: z.string().min(2, "Location name is required").max(150),
  countryId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid Country ID"),
  regionId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid Region ID"),
  cityId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid City ID"),
  district: z.string().max(100).optional(),
  address: z.string().min(3, "Address is required").max(250),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  siteDescription: z.string().max(1000).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});
