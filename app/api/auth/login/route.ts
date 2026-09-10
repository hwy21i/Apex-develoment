import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db/mongodb";
import { body, fail, handleError, ok } from "@/lib/api";
import { loginSchema } from "@/lib/validation/schemas";
import { User } from "@/models/User";
import { signSession, setSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/services/audit";
import { RoleType } from "@/types/erp";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { identifier, password } = await body(request, loginSchema);
    await connectToDatabase();

    const normalizedIdentifier = identifier.trim().toLowerCase();

    // Look up user by email or username
    const user = await User.findOne({
      $or: [{ email: normalizedIdentifier }, { username: normalizedIdentifier }],
    }).select("+passwordHash");

    if (!user) {
      return fail("INVALID_CREDENTIALS", "Invalid email/username or password", 401);
    }

    if (!user.isActive) {
      return fail(
        "ACCOUNT_DISABLED",
        "Your account has been deactivated. Please contact your system administrator.",
        403
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return fail("INVALID_CREDENTIALS", "Invalid email/username or password", 401);
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

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

    // Audit login
    await logAudit({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      action: "USER_LOGIN",
      entity: "User",
      entityId: user.id,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    const response = ok(
      {
        user: sessionPayload,
        token, // For mobile/API callers that use Bearer token
      },
      "Login successful"
    );

    setSession(response, token);
    return response;
  } catch (error) {
    return handleError(error);
  }
}
