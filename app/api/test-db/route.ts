import { ok, fail } from "@/lib/api";
import { connectToDatabase } from "@/lib/db/mongodb";

export async function GET() {
  try {
    await connectToDatabase();
    return ok({ connected: true }, "MongoDB connected successfully!");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    return fail("DATABASE_CONNECTION_ERROR", error instanceof Error ? error.message : "MongoDB connection failed", 500);
  }
}