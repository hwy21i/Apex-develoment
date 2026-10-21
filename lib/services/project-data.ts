import mongoose from "mongoose";
import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Project } from "@/models/Project";
import { Task } from "@/models/Task";
import { ProjectSummary } from "@/types/project";
import { getActiveUser } from "@/lib/auth/guard";
import { canAccessProject, normalizeProjectDocument } from "@/lib/services/access";

export async function getProject(projectId: string): Promise<ProjectSummary> {
  const user = await getActiveUser();
  if (!user) notFound();
  await connectToDatabase();

  const isId = mongoose.isObjectIdOrHexString(projectId);
  const filter = isId
    ? { _id: projectId }
    : { projectCode: projectId.toUpperCase() };

  let rawProject = await Project.findOne(filter).populate("projectManager", "fullName email username").lean();

  if (!rawProject && mongoose.connection.db) {
    try {
      const altCollection = mongoose.connection.db.collection("Projects");
      const nativeFilter = isId
        ? { _id: new mongoose.Types.ObjectId(projectId) }
        : { projectCode: projectId.toUpperCase() };
      const altDoc = await altCollection.findOne(nativeFilter);
      if (altDoc) {
        rawProject = altDoc as unknown as typeof rawProject;
      }
    } catch {
      // Fallback gracefully
    }
  }

  if (!rawProject) notFound();

  const normalized = normalizeProjectDocument(
    JSON.parse(JSON.stringify(rawProject)) as Record<string, unknown>
  );

  if (!(await canAccessProject(user, String(normalized._id)))) notFound();

  return normalized as unknown as ProjectSummary;
}

export async function getProjectTaskMetrics(projectId: string) {
  await connectToDatabase();
  const [total, completed, active] = await Promise.all([
    Task.countDocuments({ projectId }),
    Task.countDocuments({ projectId, status: "COMPLETED" }),
    Task.countDocuments({ projectId, status: { $in: ["NOT_STARTED", "IN_PROGRESS"] } }),
  ]);
  return {
    total,
    completed,
    active,
    completion: total ? Math.round((completed / total) * 100) : 0,
  };
}
