import { Task } from "@/models/Task";
import { Milestone } from "@/models/Milestone";
import { connectToDatabase } from "@/lib/db/mongodb";

interface LeanTask {
  _id: unknown;
  title?: string;
  startDate?: Date | string;
  dueDate?: Date | string;
  createdAt?: Date | string;
  progress?: number;
  status?: string;
  dependencies?: unknown[];
}

interface LeanMilestone {
  _id: unknown;
  title?: string;
  dueDate?: Date | string;
  status?: string;
}

export async function getProjectTimelineData(projectId: string) {
  await connectToDatabase();

  const [tasks, milestones] = await Promise.all([
    Task.find({ projectId }).sort({ startDate: 1 }).lean<LeanTask[]>(),
    Milestone.find({ projectId }).sort({ dueDate: 1 }).lean<LeanMilestone[]>(),
  ]);

  // Transform data for the Gantt chart
  const formattedTasks = tasks.map((task) => ({
    id: String(task._id),
    name: task.title || "Untitled Task",
    start: task.startDate || task.createdAt || new Date(),
    end: task.dueDate || task.startDate || task.createdAt || new Date(),
    progress: task.progress || 0,
    status: task.status,
    dependencies: Array.isArray(task.dependencies) ? task.dependencies.map(String) : [],
    type: "task",
  }));

  const formattedMilestones = milestones.map((ms) => ({
    id: String(ms._id),
    name: ms.title || "Untitled Milestone",
    start: ms.dueDate || new Date(),
    end: ms.dueDate || new Date(),
    status: ms.status,
    type: "milestone",
  }));

  return {
    items: [...formattedTasks, ...formattedMilestones].sort((a, b) => 
      new Date(a.start).getTime() - new Date(b.start).getTime()
    )
  };
}
