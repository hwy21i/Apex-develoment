import { fail } from "../api";
import { currentUser } from "./session";
import { hasPermission, hasAnyPermission } from "../rbac/permissions";
import { Permission, RoleType, SessionUser } from "@/types/erp";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";

export type GuardResult =
  | { user: SessionUser; error?: never }
  | { user?: never; error: NextResponse };

export async function getActiveUser(request?: Request): Promise<SessionUser | null> {
  const session = await currentUser(request);
  if (!session) return null;

  await connectToDatabase();
  const user = await User.findById(session.id).lean();
  if (!user || !user.isActive) return null;

  return {
    id: String(user._id),
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    role: user.role,
    department: user.department,
    assignedProjects: (user.assignedProjects || []).map(String),
  };
}

export async function requireAuth(request?: Request): Promise<GuardResult> {
  const user = await getActiveUser(request);
  if (!user) {
    return {
      error: fail("UNAUTHORIZED", "Authentication is required to access this resource", 401),
    };
  }
  return { user };
}

export async function requirePermission(
  permission: Permission | Permission[],
  request?: Request
): Promise<GuardResult> {
  const authResult = await requireAuth(request);
  if (authResult.error) return authResult;

  const { user } = authResult;

  if (Array.isArray(permission)) {
    if (!hasAnyPermission(user, permission)) {
      return {
        error: fail(
          "FORBIDDEN",
          `Access denied. Requires one of: ${permission.join(", ")}`,
          403
        ),
      };
    }
  } else {
    if (!hasPermission(user, permission)) {
      return {
        error: fail(
          "FORBIDDEN",
          `Access denied. Requires permission: ${permission}`,
          403
        ),
      };
    }
  }

  return { user };
}

export async function requireRole(
  role: RoleType | RoleType[],
  request?: Request
): Promise<GuardResult> {
  const authResult = await requireAuth(request);
  if (authResult.error) return authResult;

  const { user } = authResult;
  const allowedRoles = Array.isArray(role) ? role : [role];

  if (!allowedRoles.includes(user.role) && user.role !== "Admin") {
    return {
      error: fail(
        "FORBIDDEN",
        `Access denied. Requires role: ${allowedRoles.join(", ")}`,
        403
      ),
    };
  }

  return { user };
}
