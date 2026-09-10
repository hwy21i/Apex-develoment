import { ok } from "@/lib/api";
import { clearSession, currentUser } from "@/lib/auth/session";
import { logAudit } from "@/lib/services/audit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await currentUser(request);

  if (user) {
    await logAudit({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      action: "USER_LOGOUT",
      entity: "User",
      entityId: user.id,
      userAgent: request.headers.get("user-agent") || undefined,
    });
  }

  const response = ok(null, "Logged out successfully");
  clearSession(response);
  return response;
}
