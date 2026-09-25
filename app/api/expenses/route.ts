import { connectToDatabase } from "@/lib/db/mongodb";
import { body, fail, handleError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/auth/guard";
import { expenseCreateSchema } from "@/lib/validation/schemas";
import { canAccessProject } from "@/lib/services/access";
import { Expense } from "@/models/Expense";
import { Project } from "@/models/Project";
import { logAudit } from "@/lib/services/audit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const guard = await requirePermission("FINANCE_VIEW", request);
  if (guard.error) return guard.error;

  try {
    await connectToDatabase();
    const query = guard.user.role === "Admin"
      ? {}
      : {
          projectId: {
            $in: await Project.find({
              $or: [{ projectManager: guard.user.id }, { teamMembers: guard.user.id }],
            }).distinct("_id"),
          },
        };
    const items = await Expense.find(query).populate("projectId", "name projectCode").sort({ date: -1 }).limit(200).lean();
    return ok({ items });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  const guard = await requirePermission("EXPENSE_CREATE", request);
  if (guard.error) return guard.error;

  try {
    const input = await body(request, expenseCreateSchema);
    await connectToDatabase();

    if (!(await canAccessProject(guard.user, input.projectId))) {
      return fail("FORBIDDEN", "You do not have access to this project", 403);
    }
    if (await Expense.exists({ expenseNumber: input.expenseNumber })) {
      return fail("DUPLICATE_RESOURCE", "An expense voucher with this number already exists", 409);
    }

    const expense = await Expense.create({
      ...input,
      recordedBy: guard.user.id,
      status: "PENDING_APPROVAL",
    });

    await logAudit({
      userId: guard.user.id,
      userName: guard.user.fullName,
      userRole: guard.user.role,
      action: "EXPENSE_CREATED",
      entity: "Expense",
      entityId: expense.id,
      projectId: input.projectId,
      newValue: { expenseNumber: expense.expenseNumber, amount: expense.amount },
    });

    const populated = await Expense.findById(expense.id).populate("projectId", "name projectCode").lean();
    return ok(populated, "Expense voucher submitted for approval", 201);
  } catch (error) {
    return handleError(error);
  }
}
