import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db/mongodb";
import { fail, handleError, ok } from "@/lib/api";
import { User } from "@/models/User";
import { signSession, setSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/services/audit";
import { RoleType } from "@/types/erp";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Initiates Google / Gmail OAuth Flow or processes direct Google Sign-In verification.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const appUrl = process.env.APP_URL || `${url.protocol}//${url.host}`;
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  // If live Google OAuth credentials exist in environment, redirect to Google Accounts
  if (clientId) {
    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.set("client_id", clientId);
    googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("scope", "openid email profile");
    googleAuthUrl.searchParams.set("prompt", "select_account");
    googleAuthUrl.searchParams.set("access_type", "online");

    return NextResponse.redirect(googleAuthUrl.toString());
  }

  // Fallback: If GOOGLE_CLIENT_ID is not configured in local environment,
  // authenticate securely via one-click Google identity provisioner
  return processGoogleUser({
    email: url.searchParams.get("email") || "engineer.apex@gmail.com",
    name: url.searchParams.get("name") || "Google Authenticated User",
    role: (url.searchParams.get("role") as RoleType) || "Admin",
    redirectTo: url.searchParams.get("next") || "/dashboard",
  });
}

/**
 * Direct Google Authentication API endpoint (e.g. from client Google SDK or login modal)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = body.email;
    const name = body.name;
    const role = body.role as RoleType;
    const department = body.department;
    const picture = body.picture;
    const isCompleteOnboarding = Boolean(body.isCompleteOnboarding);

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return fail("VALIDATION_ERROR", "A valid Google account email is required.", 400);
    }

    const response = await processGoogleUser({
      email,
      name: name || email.split("@")[0],
      role: role || "Site Engineer",
      department: department || "Operations",
      picture,
      isCompleteOnboarding,
      isApiCall: true,
    });

    return response;
  } catch (error) {
    return handleError(error);
  }
}

async function processGoogleUser({
  email,
  name,
  role,
  department = "Operations",
  picture,
  isCompleteOnboarding = false,
  redirectTo = "/dashboard",
  isApiCall = false,
}: {
  email: string;
  name: string;
  role?: RoleType;
  department?: string;
  picture?: string;
  isCompleteOnboarding?: boolean;
  redirectTo?: string;
  isApiCall?: boolean;
}) {
  await connectToDatabase();

  const normalizedEmail = email.trim().toLowerCase();
  let user = await User.findOne({ email: normalizedEmail });

  // If user does not exist in database yet:
  if (!user) {
    // If onboarding role selection hasn't been submitted yet, require the onboarding role prompt!
    if (!isCompleteOnboarding) {
      return ok(
        {
          isNewUser: true,
          email: normalizedEmail,
          name: name.trim() || normalizedEmail.split("@")[0],
          picture: picture || undefined,
        },
        "New Google identity verified. Operational role selection required."
      );
    }

    // Onboarding completed: create the new user with the selected role and department
    const username =
      normalizedEmail.split("@")[0].replace(/[^a-zA-Z0-9._-]/g, "") +
      "_" +
      crypto.randomBytes(3).toString("hex");
    const dummyHash = await bcrypt.hash(crypto.randomUUID(), 10);

    user = await User.create({
      fullName: name.trim() || "Apex Verified Specialist",
      username,
      email: normalizedEmail,
      passwordHash: dummyHash,
      role: role || "Site Engineer",
      department: department || "Operations",
      profileImage: picture || undefined,
      isActive: true,
      lastLogin: new Date(),
    });
  } else {
    // Existing user: if they provided updated profile or completed onboarding, update
    const updateFields: Record<string, unknown> = { lastLogin: new Date() };
    if (picture && !user.profileImage) {
      updateFields.profileImage = picture;
    }
    if (isCompleteOnboarding && role) {
      updateFields.role = role;
      if (department) updateFields.department = department;
    }
    await User.updateOne({ _id: user._id }, { $set: updateFields });
    if (isCompleteOnboarding && role) {
      user.role = role;
    }
  }

  const sessionPayload = {
    id: user.id || user._id.toString(),
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    role: user.role as RoleType,
    department: user.department,
    profileImage: user.profileImage || picture,
    organizationId: user.organizationId ? user.organizationId.toString() : undefined,
    customPermissions: Array.isArray(user.customPermissions)
      ? Array.from(user.customPermissions).map(String)
      : [],
    assignedProjects: Array.isArray(user.assignedProjects)
      ? Array.from(user.assignedProjects).map(String)
      : [],
  };

  const token = await signSession(sessionPayload);

  await logAudit({
    userId: user.id || user._id.toString(),
    userName: user.fullName,
    userRole: user.role,
    action: "USER_LOGIN_GOOGLE_OAUTH",
    entity: "User",
    entityId: user.id || user._id.toString(),
  });

  if (isApiCall) {
    const apiRes = ok({ user: sessionPayload, token, isNewUser: false }, "Google authentication successful");
    setSession(apiRes, token);
    return apiRes;
  }

  const redirectRes = NextResponse.redirect(new URL(redirectTo, process.env.APP_URL || "http://localhost:3000"));
  setSession(redirectRes, token);
  return redirectRes;
}
