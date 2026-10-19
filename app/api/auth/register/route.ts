import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db/mongodb";
import { body, fail, handleError, ok } from "@/lib/api";
import { registerSchema } from "@/lib/validation/schemas";
import { User } from "@/models/User";
import { signSession, setSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/services/audit";
import { RoleType } from "@/types/erp";
import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`register:${ip}`, { max: 5, windowMs: 60 * 1000 });
    if (!rateCheck.allowed) {
      return fail(
        "TOO_MANY_REQUESTS",
        "Too many registration attempts. Please wait a minute and try again.",
        429
      );
    }

    const input = await body(request, registerSchema);

    // 1. Verify required environment variables
    if (!process.env.MONGODB_URI || !process.env.MONGODB_URI.trim()) {
      console.error("[Register API] Missing MONGODB_URI environment variable.");
      return fail(
        "CONFIGURATION_ERROR",
        "Database service configuration is missing. Please configure MONGODB_URI in Vercel project settings.",
        503
      );
    }

    const hasJwtSecret = Boolean(
      process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET
    );
    if (!hasJwtSecret) {
      console.error("[Register API] Missing JWT_SECRET / NEXTAUTH_SECRET environment variable.");
      return fail(
        "CONFIGURATION_ERROR",
        "Authentication security configuration is missing. Please configure JWT_SECRET or NEXTAUTH_SECRET in Vercel project settings.",
        503
      );
    }

    try {
      await connectToDatabase();
    } catch (dbErr: unknown) {
      const errMsg = dbErr instanceof Error ? dbErr.message : String(dbErr);
      console.error("[Register API] Database connection failure:", errMsg);
      return fail(
        "DATABASE_UNAVAILABLE",
        "Database service is currently unavailable. Please verify MongoDB cluster status and network access.",
        503
      );
    }

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
      // Public registration must never mint a privileged account. Administrators
      // assign operational roles through an authenticated provisioning flow.
      role: "Worker" as RoleType,
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
