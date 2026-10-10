import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db/mongodb";
import { body, fail, handleError, ok } from "@/lib/api";
import { registerSchema } from "@/lib/validation/schemas";
import { User } from "@/models/User";
import { requirePermission } from "@/lib/auth/guard";
import { logAudit } from "@/lib/services/audit";
import { RoleType } from "@/types/erp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin-only: list all user accounts (never exposes password hashes).
export async function GET(request: Request) {
  try {
    const authResult = await requirePermission("USER_MANAGE", request);
    if (authResult.error) return authResult.error;

    await connectToDatabase();

    const users = await User.find()
      .select("-passwordHash -resetPasswordToken -resetPasswordExpires")
      .populate("assignedProjects", "name projectCode")
      .sort({ createdAt: -1 })
      .lean();

    return ok({ users });
  } catch (error) {
    return handleError(error);
  }
}

// Admin-only: provision a new account with an explicit operational role.
// Unlike public registration this does NOT create a session for the caller.
export async function POST(request: Request) {
  try {
    const authResult = await requirePermission("USER_MANAGE", request);
    if (authResult.error) return authResult.error;
    const { user: actor } = authResult;

    const input = await body(request, registerSchema);
    await connectToDatabase();

    const normalizedEmail = input.email.toLowerCase();
    const normalizedUsername = input.username.toLowerCase();

    const existing = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    });

    if (existing) {
      const field = existing.email === normalizedEmail ? "Email" : "Username";
      return fail("CONFLICT", `${field} is already in use by another account`, 409);
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const created = await User.create({
      fullName: input.fullName,
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
      role: (input.role || "Worker") as RoleType,
      phone: input.phone,
      department: input.department,
      position: input.position,
      isActive: true,
    });

    await logAudit({
      userId: actor.id,
      userName: actor.fullName,
      userRole: actor.role,
      action: "CREATE",
      entity: "User",
      entityId: created.id,
      newValue: { email: created.email, username: created.username, role: created.role },
    });

    const result = await User.findById(created.id)
      .select("-passwordHash -resetPasswordToken -resetPasswordExpires")
      .populate("assignedProjects", "name projectCode")
      .lean();

    return ok({ user: result }, "User account created successfully", 201);
  } catch (error) {
    return handleError(error);
  }
}
