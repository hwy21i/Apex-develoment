import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { AuditLog } from "@/models/AuditLog";
import { requirePermission } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requirePermission("AUDIT_VIEW", request);
    if (authResult.error) {
      return authResult.error;
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const action = searchParams.get("action");
    const entity = searchParams.get("entity");

    const query: Record<string, unknown> = {};
    if (action) query.action = action;
    if (entity) query.entity = entity;

    // Non-super-admins should only see logs for projects they have access to or their own actions
    if (authResult.user.role !== "Admin" && authResult.user.role !== "Super Admin") {
      const allowedProjects = authResult.user.assignedProjects || [];
      query.$or = [
        { userId: authResult.user.id },
        { projectId: { $in: allowedProjects } },
      ];
    }

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ success: true, data: logs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch audit logs";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
