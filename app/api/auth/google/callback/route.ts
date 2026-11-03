import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { signSession, setSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/services/audit";
import { RoleType } from "@/types/erp";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Handles Google OAuth 2.0 Authorization Code Callback
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const appUrl = process.env.APP_URL || `${url.protocol}//${url.host}`;

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent(error || "OAuth access denied")}`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${appUrl}/api/auth/google/callback`;

  try {
    // 1. Exchange authorization code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId || "",
        client_secret: clientSecret || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("[Google OAuth Callback] Token exchange failed:", tokenData);
      return NextResponse.redirect(`${appUrl}/login?error=TokenExchangeFailed`);
    }

    // 2. Retrieve user profile information from Google
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileResponse.json();

    if (!profile.email) {
      return NextResponse.redirect(`${appUrl}/login?error=MissingEmailFromGoogle`);
    }

    await connectToDatabase();
    const normalizedEmail = profile.email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // First-time Google user: redirect to login with Google Onboarding flag so user selects their operational role
      return NextResponse.redirect(
        `${appUrl}/login?googleOnboarding=true&email=${encodeURIComponent(normalizedEmail)}&name=${encodeURIComponent(profile.name || "")}&picture=${encodeURIComponent(profile.picture || "")}`
      );
    }

    await User.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date(), profileImage: profile.picture || user.profileImage } }
    );

    const sessionPayload = {
      id: user.id || user._id.toString(),
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      role: user.role as RoleType,
      department: user.department,
      profileImage: user.profileImage || profile.picture,
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

    const redirectRes = NextResponse.redirect(`${appUrl}/dashboard`);
    setSession(redirectRes, token);
    return redirectRes;
  } catch (err) {
    console.error("[Google OAuth Callback] Error processing callback:", err);
    return NextResponse.redirect(`${appUrl}/login?error=GoogleAuthFailed`);
  }
}
