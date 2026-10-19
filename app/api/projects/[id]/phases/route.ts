import { connectToDatabase } from "@/lib/db/mongodb";
import { fail, handleError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/auth/guard";
import { canAccessProject } from "@/lib/services/access";
import { ProjectPhase } from "@/models/ProjectPhase";
import { Project } from "@/models/Project";
import { logAudit } from "@/lib/services/audit";
import { refreshProjectMetrics } from "@/lib/calculations/project";
import mongoose from "mongoose";

export const runtime = "nodejs";

const STANDARD_CONSTRUCTION_TEMPLATES = [
  { name: "Planning & Feasibility", description: "Design documentation, architectural approvals, permits and site survey", plannedPercentage: 5, order: 1 },
  { name: "Site Preparation & Mobilization", description: "Fencing, temporary facilities, utilities setup, safety perimeter", plannedPercentage: 5, order: 2 },
  { name: "Excavation & Earthworks", description: "Bulk excavation, grading, soil stabilization and retention systems", plannedPercentage: 10, order: 3 },
  { name: "Foundation Construction", description: "Reinforced concrete footings, piles, grade beams, waterproofing", plannedPercentage: 15, order: 4 },
  { name: "Structural Construction", description: "Cast-in-place concrete columns, slabs, structural steel framing", plannedPercentage: 20, order: 5 },
  { name: "Masonry & External Walls", description: "Blockwork, partition walls, lintels, damp-proof coursing", plannedPercentage: 10, order: 6 },
  { name: "Roofing & Cladding", description: "Trusses, deck waterproofing, rainwater drainage systems", plannedPercentage: 5, order: 7 },
  { name: "Electrical Systems Installation", description: "Conduit roughing, power distribution panels, earthing and wiring", plannedPercentage: 8, order: 8 },
  { name: "Plumbing & Mechanical (MEP)", description: "Water supply, sanitary drainage, HVAC ducting and fire suppression", plannedPercentage: 8, order: 9 },
  { name: "Finishing & Interior Works", description: "Plastering, floor screed, tiling, painting, doors and fixtures", plannedPercentage: 8, order: 10 },
  { name: "Inspection & Quality Assurance", description: "Third-party testing, municipal approvals, code compliance verification", plannedPercentage: 3, order: 11 },
  { name: "Handover & Project Closure", description: "Punch list clearance, operational manuals, warranty documentation, client handover", plannedPercentage: 3, order: 12 },
];

function validId(id: string) {
  return mongoose.isObjectIdOrHexString(id);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission("PROJECT_VIEW", request);
  if (guard.error) return guard.error;

  const { id } = await context.params;
  if (!validId(id)) return fail("VALIDATION_ERROR", "Invalid project ID", 422);

  try {
    await connectToDatabase();
    if (!(await canAccessProject(guard.user, id))) {
      return fail("FORBIDDEN", "You do not have access to this project", 403);
    }

    const phases = await ProjectPhase.find({ projectId: id })
      .sort({ sequenceNumber: 1, order: 1, createdAt: 1 })
      .populate("assignedManager", "fullName username email role")
      .lean();

    const totalPhases = phases.length;
    const completedPhases = phases.filter((p) => p.status === "COMPLETED").length;
    const inProgressPhases = phases.filter((p) => p.status === "IN_PROGRESS").length;

    // Calculate weighted completion percentage
    let totalPlannedWeight = 0;
    let weightedSum = 0;
    for (const p of phases) {
      const weight = p.plannedPercentage || 0;
      const completion = p.completionPercentage ?? p.actualPercentage ?? 0;
      totalPlannedWeight += weight;
      weightedSum += (completion * weight) / 100;
    }

    const overallProgress =
      totalPlannedWeight > 0
        ? Math.round((weightedSum / totalPlannedWeight) * 100)
        : totalPhases > 0
        ? Math.round(
            phases.reduce(
              (acc, p) => acc + (p.completionPercentage ?? p.actualPercentage ?? 0),
              0
            ) / totalPhases
          )
        : 0;

    return ok({
      phases,
      summary: {
        totalPhases,
        completedPhases,
        inProgressPhases,
        overallProgress,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission("PROJECT_UPDATE", request);
  if (guard.error) return guard.error;

  const { id } = await context.params;
  if (!validId(id)) return fail("VALIDATION_ERROR", "Invalid project ID", 422);

  try {
    await connectToDatabase();
    if (!(await canAccessProject(guard.user, id))) {
      return fail("FORBIDDEN", "You do not have access to modify this project", 403);
    }

    const json = await request.json();

    // Mode 1: Initialize Standard Construction Templates
    if (json.action === "INIT_TEMPLATES") {
      const existingCount = await ProjectPhase.countDocuments({ projectId: id });
      if (existingCount > 0) {
        return fail("CONFLICT", "Phases already exist for this project. Cannot re-initialize standard templates.", 409);
      }

      const docsToInsert = STANDARD_CONSTRUCTION_TEMPLATES.map((tmpl) => ({
        projectId: id,
        name: tmpl.name,
        description: tmpl.description,
        sequenceNumber: tmpl.order,
        order: tmpl.order,
        plannedPercentage: tmpl.plannedPercentage,
        completionPercentage: 0,
        actualPercentage: 0,
        status: tmpl.order === 1 ? "IN_PROGRESS" : "NOT_STARTED",
        budget: 0,
      }));

      const created = await ProjectPhase.insertMany(docsToInsert);
      await refreshProjectMetrics(id);

      await logAudit({
        userId: guard.user.id,
        userName: guard.user.fullName,
        userRole: guard.user.role,
        action: "PROJECT_PHASES_INITIALIZED",
        entity: "ProjectPhase",
        entityId: id,
        projectId: id,
        newValue: { templateCount: created.length },
      });

      return ok(created, "Standard 12 construction phases initialized successfully", 201);
    }

    // Mode 2: Create Single Phase
    const {
      name,
      description,
      sequenceNumber,
      plannedStart,
      plannedEnd,
      plannedPercentage,
      budget,
      assignedManager,
      notes,
    } = json;

    if (!name || typeof name !== "string" || !name.trim()) {
      return fail("VALIDATION_ERROR", "Phase name is required", 422);
    }

    const highestSeq = await ProjectPhase.findOne({ projectId: id })
      .sort({ sequenceNumber: -1 })
      .select("sequenceNumber");
    const nextSeq = sequenceNumber ?? (highestSeq ? (highestSeq.sequenceNumber || 1) + 1 : 1);

    const phase = await ProjectPhase.create({
      projectId: id,
      name: name.trim(),
      description: description?.trim() || "",
      sequenceNumber: Number(nextSeq),
      order: Number(nextSeq),
      plannedStart: plannedStart ? new Date(plannedStart) : undefined,
      plannedEnd: plannedEnd ? new Date(plannedEnd) : undefined,
      plannedPercentage: Number(plannedPercentage || 0),
      budget: Number(budget || 0),
      assignedManager: assignedManager && validId(assignedManager) ? assignedManager : undefined,
      notes: notes?.trim() || "",
      status: "NOT_STARTED",
      completionPercentage: 0,
      actualPercentage: 0,
    });

    await refreshProjectMetrics(id);

    await logAudit({
      userId: guard.user.id,
      userName: guard.user.fullName,
      userRole: guard.user.role,
      action: "PROJECT_PHASE_CREATED",
      entity: "ProjectPhase",
      entityId: phase.id,
      projectId: id,
      newValue: { name: phase.name, sequenceNumber: phase.sequenceNumber },
    });

    return ok(phase, "Phase created successfully", 201);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission("PROJECT_UPDATE", request);
  if (guard.error) return guard.error;

  const { id } = await context.params;
  if (!validId(id)) return fail("VALIDATION_ERROR", "Invalid project ID", 422);

  try {
    await connectToDatabase();
    if (!(await canAccessProject(guard.user, id))) {
      return fail("FORBIDDEN", "You do not have access to modify this project", 403);
    }

    const json = await request.json();
    const { phaseId, updates } = json;

    if (!phaseId || !validId(phaseId)) {
      return fail("VALIDATION_ERROR", "Valid phaseId is required", 422);
    }

    const phase = await ProjectPhase.findOne({ _id: phaseId, projectId: id });
    if (!phase) {
      return fail("NOT_FOUND", "Project phase not found", 404);
    }

    const allowedUpdates: Record<string, unknown> = {};

    if (updates.name !== undefined) allowedUpdates.name = String(updates.name).trim();
    if (updates.description !== undefined) allowedUpdates.description = String(updates.description).trim();
    if (updates.sequenceNumber !== undefined) {
      allowedUpdates.sequenceNumber = Number(updates.sequenceNumber);
      allowedUpdates.order = Number(updates.sequenceNumber);
    }
    if (updates.plannedStart !== undefined) allowedUpdates.plannedStart = updates.plannedStart ? new Date(updates.plannedStart) : null;
    if (updates.plannedEnd !== undefined) allowedUpdates.plannedEnd = updates.plannedEnd ? new Date(updates.plannedEnd) : null;
    if (updates.actualStart !== undefined) allowedUpdates.actualStart = updates.actualStart ? new Date(updates.actualStart) : null;
    if (updates.actualEnd !== undefined) allowedUpdates.actualEnd = updates.actualEnd ? new Date(updates.actualEnd) : null;
    if (updates.plannedPercentage !== undefined) allowedUpdates.plannedPercentage = Number(updates.plannedPercentage);
    if (updates.budget !== undefined) allowedUpdates.budget = Number(updates.budget);
    if (updates.notes !== undefined) allowedUpdates.notes = String(updates.notes).trim();
    if (updates.assignedManager !== undefined) {
      allowedUpdates.assignedManager = updates.assignedManager && validId(updates.assignedManager) ? updates.assignedManager : null;
    }

    // Status and Completion Consistency
    if (updates.status !== undefined) {
      allowedUpdates.status = updates.status;
      if (updates.status === "COMPLETED" && (updates.completionPercentage === undefined || updates.completionPercentage < 100)) {
        allowedUpdates.completionPercentage = 100;
        allowedUpdates.actualPercentage = 100;
        if (!phase.actualEnd) allowedUpdates.actualEnd = new Date();
      } else if (updates.status === "IN_PROGRESS" && !phase.actualStart) {
        allowedUpdates.actualStart = new Date();
      }
    }

    if (updates.completionPercentage !== undefined) {
      const pct = Math.min(100, Math.max(0, Number(updates.completionPercentage)));
      allowedUpdates.completionPercentage = pct;
      allowedUpdates.actualPercentage = pct;
      if (pct === 100 && (!allowedUpdates.status || allowedUpdates.status !== "COMPLETED")) {
        allowedUpdates.status = "COMPLETED";
        if (!phase.actualEnd) allowedUpdates.actualEnd = new Date();
      } else if (pct > 0 && pct < 100 && phase.status === "NOT_STARTED") {
        allowedUpdates.status = "IN_PROGRESS";
        if (!phase.actualStart) allowedUpdates.actualStart = new Date();
      }
    }

    const updated = await ProjectPhase.findByIdAndUpdate(
      phaseId,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    ).populate("assignedManager", "fullName username email role");

    await refreshProjectMetrics(id);

    await logAudit({
      userId: guard.user.id,
      userName: guard.user.fullName,
      userRole: guard.user.role,
      action: "PROJECT_PHASE_UPDATED",
      entity: "ProjectPhase",
      entityId: phaseId,
      projectId: id,
      newValue: allowedUpdates,
    });

    return ok(updated, "Phase updated successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requirePermission("PROJECT_UPDATE", request);
  if (guard.error) return guard.error;

  const { id } = await context.params;
  if (!validId(id)) return fail("VALIDATION_ERROR", "Invalid project ID", 422);

  try {
    await connectToDatabase();
    if (!(await canAccessProject(guard.user, id))) {
      return fail("FORBIDDEN", "You do not have access to modify this project", 403);
    }

    const { searchParams } = new URL(request.url);
    const phaseId = searchParams.get("phaseId");

    if (!phaseId || !validId(phaseId)) {
      return fail("VALIDATION_ERROR", "Valid phaseId is required", 422);
    }

    const deleted = await ProjectPhase.findOneAndDelete({ _id: phaseId, projectId: id });
    if (!deleted) {
      return fail("NOT_FOUND", "Project phase not found", 404);
    }

    await refreshProjectMetrics(id);

    await logAudit({
      userId: guard.user.id,
      userName: guard.user.fullName,
      userRole: guard.user.role,
      action: "PROJECT_PHASE_DELETED",
      entity: "ProjectPhase",
      entityId: phaseId,
      projectId: id,
      previousValue: { name: deleted.name },
    });

    return ok({ success: true }, "Phase deleted successfully");
  } catch (error) {
    return handleError(error);
  }
}
