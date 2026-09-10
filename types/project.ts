export type ProjectStatus = "planning" | "active" | "on-hold" | "completed" | "cancelled";

export interface ProjectSummary {
  _id: string;
  name: string;
  projectCode: string;
  client: string;
  location: string;
  description?: string;
  startDate: string;
  expectedEndDate: string;
  contractValue: number;
  totalBudget: number;
  revisedBudget?: number;
  amountSpent: number;
  committedCost: number;
  remainingBudget: number;
  progressPercentage: number;
  status: ProjectStatus;
  currentPhase?: string;
  healthStatus?: "ON_TRACK" | "AT_RISK" | "DELAYED" | "CRITICAL";
  projectManager?: { fullName?: string } | string;
}
