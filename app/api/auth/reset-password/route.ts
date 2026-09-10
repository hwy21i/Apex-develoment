import crypto from "crypto";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db/mongodb";
import { body, fail, handleError, ok } from "@/lib/api";
import { resetPasswordSchema } from "@/lib/validation/schemas";
import { User } from "@/models/User";
import { logAudit } from "@/lib/services/audit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await body(request, resetPasswordSchema);
    await connectToDatabase();

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return fail("INVALID_TOKEN", "Password reset token is invalid or has expired", 400);
    }

    // Set new hashed password
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    await logAudit({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      action: "PASSWORD_RESET_COMPLETED",
      entity: "User",
      entityId: user.id,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return ok(null, "Password has been reset successfully. You may now sign in.");
  } catch (error) {
    return handleError(error);
  }
}

