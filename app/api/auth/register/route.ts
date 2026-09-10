import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db/mongodb";
import { body, fail, handleError, ok } from "@/lib/api";
import { registerSchema } from "@/lib/validation/schemas";
import { User } from "@/models/User";
import { signSession, setSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/services/audit";
import { RoleType } from "@/types/erp";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = await body(request, registerSchema);
    await connectToDatabase();

    const normalizedEmail = input.email.toLowerCase();
    const normalizedUsername = input.username.toLowerCase();

    // Check if user already exists
    const existing = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    });

    if (existing) {
      const field = existing.email === normalizedEmail ? "Email" : "Username";
      return fail("CONFLICT", `${field} is already in use by another account`, 409);
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await User.create({
      fullName: input.fullName,
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
      role: (input.role as RoleType) || "Worker",
      phone: input.phone,
      department: input.department,
      position: input.position,
      isActive: true,
      lastLogin: new Date(),
    });

    // Generate JWT session
    const sessionPayload = {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      role: user.role as RoleType,
      department: user.department,
      assignedProjects: (user.assignedProjects || []).map((id) => id.toString()),
    };

    const token = await signSession(sessionPayload);

    // Record audit event
    await logAudit({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      action: "USER_REGISTERED",
      entity: "User",
      entityId: user.id,
      newValue: { email: user.email, username: user.username, role: user.role },
      userAgent: request.headers.get("user-agent") || undefined,
    });

    const response = ok(
      {
        user: sessionPayload,
      },
      "Account registered successfully",
      201
    );

    setSession(response, token);
    return response;
  } catch (error) {
    return handleError(error);
  }
}
