import dns from "node:dns";
import mongoose from "mongoose";

// Resolve DNS SRV timeouts on Windows/local networks by routing DNS through reliable public resolvers
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch {
  // Ignore in environments where setServers is restricted
}

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const globalCache = global as typeof globalThis & { mongooseCache?: Cache };
const cache = globalCache.mongooseCache ?? (globalCache.mongooseCache = { conn: null, promise: null });

const DIRECT_URI = process.env.MONGODB_DIRECT_URI || process.env.MONGODB_URI;

export async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not defined in .env.local");
  }

  if (cache.conn) return cache.conn;

  async function tryConnect(targetUri: string) {
    return mongoose.connect(targetUri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 20000,
    });
  }

  cache.promise = tryConnect(uri).catch(async (error) => {
    // If SRV lookup fails due to Windows/local DNS loopback (ECONNREFUSED/ETIMEOUT), fallback to direct replica-set hosts
    if (
      uri.includes("mongodb+srv://") &&
      DIRECT_URI &&
      DIRECT_URI !== uri &&
      (error.message.includes("querySrv") ||
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("ETIMEOUT"))
    ) {
      console.warn("MongoDB SRV DNS failed. Switching to direct replica-set connection...");
      try {
        return await tryConnect(DIRECT_URI);
      } catch (fallbackErr: any) {
        cache.promise = null;
        console.error("MongoDB Direct Fallback Failure:", fallbackErr.message);
        throw fallbackErr;
      }
    }
    cache.promise = null;
    console.error("MongoDB Connection Failure:", error.message);
    throw error;
  });

  cache.conn = await cache.promise;
  return cache.conn;
}
