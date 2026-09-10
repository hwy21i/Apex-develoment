import { connectToDatabase } from "@/lib/db/mongodb";
import { AuditLog } from "@/models/AuditLog";
import mongoose from "mongoose";

export interface LogAuditParams {
  userId?: string;
  userName?: string;
  userRole?: string;
  action: string;
  entity: string;
  entityId?: string;
  projectId?: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAudit(params: LogAuditParams) {
  try {
    await connectToDatabase();
    await AuditLog.create({
      userId: params.userId ? new mongoose.Types.ObjectId(params.userId) : undefined,
      userName: params.userName,
      userRole: params.userRole,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      projectId: params.projectId ? new mongoose.Types.ObjectId(params.projectId) : undefined,
      previousValue: params.previousValue,
      newValue: params.newValue,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  } catch (error) {
    console.error("Audit logging error:", error);
    // Non-blocking: audit failure shouldn't crash primary business workflow
  }
}

