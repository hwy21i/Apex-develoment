import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { RoleType, SessionUser, SYSTEM_ROLES } from "@/types/erp";

const getSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not configured. Add it to .env.local.");
  }
  return new TextEncoder().encode(secret);
};

export const SESSION_COOKIE_NAME = "apex_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 8; // 8 hours

export async function signSession(user: SessionUser): Promise<string> {
  const key = getSecretKey();
  return new SignJWT({
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    role: user.role,
    department: user.department,
    assignedProjects: user.assignedProjects || [],
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(key);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const key = getSecretKey();
    const { payload } = await jwtVerify(token, key);
    if (typeof payload.role !== "string" || !SYSTEM_ROLES.includes(payload.role as RoleType)) {
      return null;
    }
    return {
      id: String(payload.id),
      fullName: String(payload.fullName || ""),
      username: String(payload.username),
      email: String(payload.email),
      role: payload.role as RoleType,
      department: payload.department ? String(payload.department) : undefined,
      assignedProjects: Array.isArray(payload.assignedProjects)
        ? (payload.assignedProjects as string[])
        : [],
    };
  } catch {
    return null;
  }
}

export async function currentUser(request?: Request): Promise<SessionUser | null> {
  try {
    // 1. Check Authorization Bearer header if request is provided
    if (request) {
      const authHeader = request.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7).trim();
        const user = await verifyToken(token);
        if (user) return user;
      }
    }

    // 2. Check HTTP-only cookie
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!cookieToken) return null;

    return await verifyToken(cookieToken);
  } catch {
    return null;
  }
}

export function setSession(response: NextResponse, token: string): void {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export function clearSession(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });
}
