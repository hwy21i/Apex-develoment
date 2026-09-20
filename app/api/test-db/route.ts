import { ok, fail } from "@/lib/api";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/guard";

export async function GET(request: Request) {
  const guard = await requireRole("Admin", request);
  if (guard.error) return guard.error;
  try {
    await connectToDatabase();
    return ok({ connected: true }, "MongoDB connected successfully!");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    return fail("DATABASE_CONNECTION_ERROR", "MongoDB connection failed", 500);
  }
}
