import crypto from "crypto";
import { connectToDatabase } from "@/lib/db/mongodb";
import { body, fail, handleError, ok } from "@/lib/api";
import { forgotPasswordSchema } from "@/lib/validation/schemas";
import { User } from "@/models/User";
import { logAudit } from "@/lib/services/audit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { email } = await body(request, forgotPasswordSchema);
    await connectToDatabase();

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.isActive) {
      // Return success anyway to avoid user enumeration attacks
      return ok(
        { sent: true },
        "If an account with that email exists, reset instructions have been generated."
      );
    }

    // Generate random 32-byte hex reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Expire in 1 hour
    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    await logAudit({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      action: "PASSWORD_RESET_REQUESTED",
      entity: "User",
      entityId: user.id,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    // In a production environment with email SMTP configured, send an email here.
    // For development and testing, return the token in non-production mode
    const isDev = process.env.NODE_ENV !== "production";

    return ok(
      {
        sent: true,
        ...(isDev ? { devResetToken: resetToken } : {}),
      },
      "If an account with that email exists, reset instructions have been generated."
    );
  } catch (error) {
    return handleError(error);
  }
}

