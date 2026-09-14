import { Task } from "@/models/Task";
import { Milestone } from "@/models/Milestone";
import { connectToDatabase } from "@/lib/db/mongodb";

export async function getProjectTimelineData(projectId: string) {
  await connectToDatabase();

  const [tasks, milestones] = await Promise.all([
    Task.find({ projectId }).sort({ startDate: 1 }).lean(),
    Milestone.find({ projectId }).sort({ dueDate: 1 }).lean(),
  ]);

  // Transform data for the Gantt chart
  const formattedTasks = tasks.map((task: any) => ({
    id: task._id.toString(),
    name: task.title,
    start: task.startDate || task.createdAt,
    end: task.dueDate || task.startDate || task.createdAt,
    progress: task.progress || 0,
    status: task.status,
    dependencies: task.dependencies?.map((d: any) => d.toString()) || [],
    type: 'task'
  }));

  const formattedMilestones = milestones.map((ms: any) => ({
    id: ms._id.toString(),
    name: ms.title,
    start: ms.dueDate,
    end: ms.dueDate,
    status: ms.status,
    type: 'milestone'
  }));

  return {
    items: [...formattedTasks, ...formattedMilestones].sort((a, b) => 
      new Date(a.start).getTime() - new Date(b.start).getTime()
    )
  };
}
