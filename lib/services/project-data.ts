import mongoose from "mongoose";
import { notFound, redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Project } from "@/models/Project";
import { Task } from "@/models/Task";
import { ProjectSummary } from "@/types/project";
import { getActiveUser } from "@/lib/auth/guard";
import { canAccessProject } from "@/lib/services/access";

export async function getProject(projectId: string): Promise<ProjectSummary> {
  const user = await getActiveUser();
  if (!user) redirect("/Authpage");
  await connectToDatabase();
  const filter = mongoose.isObjectIdOrHexString(projectId)
    ? { _id: projectId }
    : { projectCode: projectId.toUpperCase() };
  const project = await Project.findOne(filter).populate("projectManager", "fullName").lean();
  if (!project) notFound();
  if (!(await canAccessProject(user, String(project._id)))) notFound();
  return JSON.parse(JSON.stringify(project)) as ProjectSummary;
}

export async function getProjectTaskMetrics(projectId: string) {
  await connectToDatabase();
  const [total, completed, active] = await Promise.all([Task.countDocuments({ projectId }), Task.countDocuments({ projectId, status: "COMPLETED" }), Task.countDocuments({ projectId, status: { $in: ["NOT_STARTED", "IN_PROGRESS"] } })]);
  return { total, completed, active, completion: total ? Math.round((completed / total) * 100) : 0 };
}
