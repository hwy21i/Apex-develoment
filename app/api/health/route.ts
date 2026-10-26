import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "DISCONNECTED";
  let dbLatencyMs = 0;

  try {
    const conn = await connectToDatabase();
    if (conn.connection.readyState === 1) {
      dbStatus = "CONNECTED";
      const pingStart = Date.now();
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
        dbLatencyMs = Date.now() - pingStart;
      }
    }
  } catch {
    dbStatus = "ERROR: Connection failed";
  }

  const isHealthy = dbStatus === "CONNECTED";

  return NextResponse.json(
    {
      status: isHealthy ? "HEALTHY" : "DEGRADED",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV,
      services: {
        database: {
          status: dbStatus,
          configured: Boolean(
            process.env.MONGODB_URI?.trim() ||
            process.env.DATABASE_URL?.trim() ||
            process.env.MONGO_URI?.trim() ||
            process.env.MONGODB_URL?.trim()
          ),
          latencyMs: dbLatencyMs,
        },
        memory: {
          rssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
          heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        },
      },
      durationMs: Date.now() - startTime,
    },
    { status: isHealthy ? 200 : 503 }
  );
}

