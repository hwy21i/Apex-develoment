import { ok, fail, handleError } from "@/lib/api";
import { ensureDefaultAdmin } from "@/lib/db/seed-admin";

export const runtime = "nodejs";

/**
 * Server-side route to safely check and ensure default admin / baseline demo accounts.
 * Completely idempotent:
 * - If admin accounts already exist, no passwords or accounts are overwritten.
 * - If the database is completely empty (e.g. freshly deployed to Vercel),
 *   it provisions the foundational baseline accounts.
 */
export async function POST(request: Request) {
  try {
    // Optional seed authorization key check if ADMIN_SEED_SECRET is configured
    const seedSecret = process.env.ADMIN_SEED_SECRET;
    if (seedSecret) {
      const authHeader = request.headers.get("authorization");
      const providedKey = authHeader?.replace("Bearer ", "").trim();
      if (providedKey !== seedSecret) {
        return fail("UNAUTHORIZED", "Invalid or missing seed authorization key.", 401);
      }
    }

    const result = await ensureDefaultAdmin();
    return ok(
      {
        seeded: result.seeded,
        message: result.message,
        adminUsername: result.adminUsername,
        totalUsersCount: result.totalUsersCount,
      },
      result.message,
      result.seeded ? 201 : 200
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function GET() {
  return ok({
    status: "READY",
    message: "POST to this endpoint to initialize default admin accounts if not already present.",
  });
}

