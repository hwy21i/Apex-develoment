import { connectToDatabase } from "@/lib/db/mongodb";
import { body, handleError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/auth/guard";
import { projectSchema } from "@/lib/validation/schemas";
import { Project } from "@/models/Project";
import { logAudit } from "@/lib/services/audit";
import { buildProjectAccessQuery, normalizeProjectDocument } from "@/lib/services/access";
import mongoose from "mongoose";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const guard = await requirePermission("PROJECT_VIEW", request);
  if (guard.error) return guard.error;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
    const search = searchParams.get("q");

    const baseAccessQuery = buildProjectAccessQuery(guard.user);

    let query: Record<string, unknown> = baseAccessQuery;

    if (search && search.trim()) {
      const term = search.trim();
      const searchFilter = [
        { name: { $regex: term, $options: "i" } },
        { projectCode: { $regex: term, $options: "i" } },
        { location: { $regex: term, $options: "i" } },
        { client: { $regex: term, $options: "i" } },
        { clientName: { $regex: term, $options: "i" } },
      ];

      if (Object.keys(baseAccessQuery).length === 0) {
        query = { $or: searchFilter };
      } else {
        query = { $and: [baseAccessQuery, { $or: searchFilter }] };
      }
    }

    let [rawItems, total] = await Promise.all([
      Project.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("projectManager", "fullName email username role")
        .populate("teamMembers", "fullName email username role")
        .lean(),
      Project.countDocuments(query),
    ]);

    // Backward-compatibility: Check if collection was named 'Projects' with capital P
    if (total === 0 && !search && mongoose.connection.db) {
      try {
        const altCollection = mongoose.connection.db.collection("Projects");
        const altCount = await altCollection.countDocuments();
        if (altCount > 0) {
          const altDocs = await altCollection
            .find({})
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();

          rawItems = altDocs as unknown as typeof rawItems;
          total = altCount;
        }
      } catch {
        // Fallback gracefully if admin check is not permitted
      }
    }

    const items = rawItems.map((item) =>
      normalizeProjectDocument(item as Record<string, unknown>)
    );

    return ok({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  const guard = await requirePermission("PROJECT_CREATE", request);
  if (guard.error) return guard.error;

  try {
    const input = await body(request, projectSchema);
    await connectToDatabase();

    const projectCode = input.projectCode || `PRJ-${Date.now().toString(36).toUpperCase()}`;

    const project = await Project.create({
      name: input.name,
      projectCode,
      description: input.description,
      client: input.client,
      location: input.location,
      projectManager: input.projectManager || guard.user.id,
      teamMembers: input.teamMembers,
      startDate: input.startDate,
      expectedEndDate: input.expectedEndDate,
      actualEndDate: input.actualEndDate,
      totalBudget: input.totalBudget,
      amountSpent: 0,
      remainingBudget: input.totalBudget,
      progressPercentage: 0,
      contractValue: input.contractValue,
      status: input.status,
      organizationId: guard.user.organizationId || undefined,
      createdBy: guard.user.id,
    });

    await logAudit({
      userId: guard.user.id,
      userName: guard.user.fullName,
      userRole: guard.user.role,
      action: "PROJECT_CREATED",
      entity: "Project",
      entityId: project.id,
      projectId: project.id,
      newValue: { name: project.name, projectCode, totalBudget: project.totalBudget },
    });

    return ok(project, "Project created successfully", 201);
  } catch (error) {
    return handleError(error);
  }
}
