import { connectToDatabase } from "@/lib/db/mongodb";
import { fail, handleError, ok } from "@/lib/api";
import { currentUser } from "@/lib/auth/session";
import { getRolePermissions } from "@/lib/rbac/permissions";
import { User } from "@/models/User";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await currentUser(request);
    if (!session) {
      return fail("UNAUTHORIZED", "Not authenticated", 401);
    }

    await connectToDatabase();
    const user = await User.findById(session.id).select("-passwordHash");

    if (!user || !user.isActive) {
      return fail("USER_NOT_FOUND", "User account not found or inactive", 404);
    }

    const permissions = getRolePermissions(user.role);

    return ok({
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department,
        position: user.position,
        profileImage: user.profileImage,
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
