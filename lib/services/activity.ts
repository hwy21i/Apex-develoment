import { ActivityLog } from "@/models/ActivityLog";
export const logActivity = (input: { userId: string; action: string; entityType: string; entityId?: string; projectId?: string; oldValue?: unknown; newValue?: unknown }) => ActivityLog.create(input);
