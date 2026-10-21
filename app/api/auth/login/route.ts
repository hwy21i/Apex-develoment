import bcrypt from "bcryptjs";
import { connectToDatabase, sanitizeMongoUrl } from "@/lib/db/mongodb";
import { body, fail, handleError, ok } from "@/lib/api";
import { loginSchema } from "@/lib/validation/schemas";
import { User } from "@/models/User";
import { signSession, setSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/services/audit";
import { RoleType } from "@/types/erp";
import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limit";
import { ensureDefaultAdmin } from "@/lib/db/seed-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`login:${ip}`, { max: 10, windowMs: 60 * 1000 });
    if (!rateCheck.allowed) {
      return fail(
        "TOO_MANY_REQUESTS",
        "Too many login attempts. Please wait a minute and try again.",
        429
      );
    }

    const { identifier, password } = await body(request, loginSchema);

    // 1. Verify required environment variables
    const rawMongoUri =
      process.env.MONGODB_URI?.trim() ||
      process.env.DATABASE_URL?.trim() ||
      process.env.MONGO_URI?.trim() ||
      process.env.MONGODB_URL?.trim();

    if (!rawMongoUri) {
      console.error("[Auth API] Missing MongoDB connection string in environment variables.");
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
      console.error("[Auth API] Missing JWT_SECRET / NEXTAUTH_SECRET environment variable.");
      return fail(
        "CONFIGURATION_ERROR",
        "Authentication security configuration is missing. Please configure JWT_SECRET or NEXTAUTH_SECRET in Vercel project settings.",
        503
      );
    }

    // 2. Connect to MongoDB with safe error logging
    try {
      await connectToDatabase();
    } catch (dbErr: unknown) {
      const errMsg = dbErr instanceof Error ? dbErr.message : String(dbErr);
      console.error("[Auth API] Database connection failure:", sanitizeMongoUrl(errMsg));

      if (
        errMsg.includes("bad auth") ||
        errMsg.includes("Authentication failed") ||
        errMsg.includes("auth failed")
      ) {
        return fail(
          "DATABASE_AUTH_ERROR",
          "Database authentication failed. Please verify that MONGODB_URI credentials (username and password) are configured correctly in Vercel project environment variables.",
          503
        );
      }

      return fail(
        "DATABASE_UNAVAILABLE",
        "Database service is currently unavailable. Please verify MongoDB cluster status and network access (allow 0.0.0.0/0).",
        503
      );
    }

    const normalizedIdentifier = identifier.trim().toLowerCase();

    // 3. Look up user by email or username
    let user = await User.findOne({
      $or: [{ email: normalizedIdentifier }, { username: normalizedIdentifier }],
    }).select("+passwordHash");

    // 4. If user not found, check if this is an unseeded fresh database (0 users)
    if (!user) {
      try {
        const totalUsers = await User.countDocuments();
        if (totalUsers === 0) {
          console.log("[Auth API] Fresh database detected (0 users). Provisioning baseline demonstration accounts...");
          await ensureDefaultAdmin();
          user = await User.findOne({
            $or: [{ email: normalizedIdentifier }, { username: normalizedIdentifier }],
          }).select("+passwordHash");
        }
      } catch (seedErr: unknown) {
        console.warn("[Auth API] Auto-seed check failed:", seedErr instanceof Error ? seedErr.message : String(seedErr));
      }
    }

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

    // Guard against malformed or missing password hash
    if (!user.passwordHash || typeof user.passwordHash !== "string") {
      console.error(`[Auth API] User account (${user.username}) has missing or invalid passwordHash.`);
      return fail("INVALID_CREDENTIALS", "Invalid email/username or password", 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return fail("INVALID_CREDENTIALS", "Invalid email/username or password", 401);
    }

    // Update last login timestamp without full document validation overhead
    await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } }).catch((err: unknown) => {
      console.warn("[Auth API] Failed to update lastLogin timestamp:", err instanceof Error ? err.message : String(err));
    });

    const sessionPayload = {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      role: user.role as RoleType,
      department: user.department,
      organizationId: user.organizationId ? user.organizationId.toString() : undefined,
      customPermissions: Array.isArray(user.customPermissions)
        ? Array.from(user.customPermissions).map(String)
        : [],
      assignedProjects: Array.isArray(user.assignedProjects)
        ? Array.from(user.assignedProjects).map(String)
        : [],
    };

    let token: string;
    try {
      token = await signSession(sessionPayload);
    } catch (jwtErr: unknown) {
      const jwtMsg = jwtErr instanceof Error ? jwtErr.message : String(jwtErr);
      console.error("[Auth API] Session token generation error:", jwtMsg);
      return fail(
        "AUTH_ERROR",
        "Failed to generate secure session credentials. Please check server security settings.",
        500
      );
    }

    // Audit login (non-blocking)
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
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("[Auth API] Unhandled exception:", sanitizeMongoUrl(errMsg));
    return handleError(error);
  }
}
