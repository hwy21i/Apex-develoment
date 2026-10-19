import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { fail, handleError, ok } from "@/lib/api";
import { currentUser } from "@/lib/auth/session";
import { getRolePermissions } from "@/lib/rbac/permissions";
import { User } from "@/models/User";
import { RoleType } from "@/types/erp";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await currentUser(request);
    if (!session || !session.id) {
      return fail("UNAUTHORIZED", "Not authenticated", 401);
    }

    if (!mongoose.Types.ObjectId.isValid(session.id)) {
      return fail("UNAUTHORIZED", "Invalid session token identity", 401);
    }

    await connectToDatabase();
    const user = await User.findById(session.id)
      .select("-passwordHash")
      .lean();

    if (!user || !user.isActive) {
      return fail("USER_NOT_FOUND", "User account not found or inactive", 404);
    }

    const rolePermissions = getRolePermissions(user.role as RoleType);
    const customPermissions = (user.customPermissions || []).map(String);
    const permissions = Array.from(new Set([...rolePermissions, ...customPermissions]));

    return ok({
      user: {
        id: String(user._id),
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department,
        position: user.position,
        profileImage: user.profileImage,
        organizationId: user.organizationId ? user.organizationId.toString() : undefined,
        customPermissions: user.customPermissions || [],
        assignedProjects: user.assignedProjects || [],
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
      permissions,
    });
  } catch (error) {
    return handleError(error);
  }
}
