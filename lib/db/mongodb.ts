import dns from "node:dns";
import mongoose from "mongoose";

/**
 * Strips sensitive credentials (username:password) from connection URIs or error messages
 * to ensure database passwords are never exposed in serverless/Vercel runtime logs.
 */
export function sanitizeMongoUrl(text: string): string {
  if (!text) return "";
  return text.replace(/(mongodb(?:\+srv)?:\/\/)[^:]+:[^@]+@/gi, "$1<credentials-hidden>@");
}

// Only configure custom DNS servers on local Windows environments where ISP DNS loopback issues occur.
// Never override DNS on Vercel / AWS Lambda (Linux) where outbound port 53 is restricted and
// system DNS resolvers (/etc/resolv.conf) are required for SRV resolution.
if (process.platform === "win32" && !process.env.VERCEL && !process.env.AWS_REGION) {
  try {
    dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
  } catch {
    // Ignore in environments where setServers is restricted
  }
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalCache = globalThis as typeof globalThis & { mongooseCache?: MongooseCache };
const cache: MongooseCache = globalCache.mongooseCache ?? (globalCache.mongooseCache = { conn: null, promise: null });

export async function connectToDatabase(): Promise<typeof mongoose> {
  const rawUri = process.env.MONGODB_URI;
  if (!rawUri || !rawUri.trim()) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }

  const uri = rawUri.trim();

  // If already connected and ready, return cached connection immediately
  if (cache.conn && mongoose.connection.readyState === 1) {
    return cache.conn;
  }

  // If connection dropped or in error state, reset promise and connection cache
  if (mongoose.connection.readyState === 0) {
    cache.promise = null;
    cache.conn = null;
  }

  if (!cache.promise) {
    const directUri = process.env.MONGODB_DIRECT_URI?.trim();

    const connectOptions: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    cache.promise = mongoose.connect(uri, connectOptions).catch(async (error: unknown) => {
      cache.promise = null;
      cache.conn = null;

      const errMsg = error instanceof Error ? error.message : String(error);

      // Fallback for environments where SRV DNS resolution fails but direct replica-set hosts are provided
      if (
        uri.startsWith("mongodb+srv://") &&
        directUri &&
        directUri !== uri &&
        (errMsg.includes("querySrv") ||
          errMsg.includes("ECONNREFUSED") ||
          errMsg.includes("ETIMEOUT"))
      ) {
        console.warn("[MongoDB] SRV lookup timed out. Attempting fallback to direct replica set URI...");
        try {
          return await mongoose.connect(directUri, connectOptions);
        } catch (fallbackErr: unknown) {
          const fbMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
          console.error("[MongoDB] Direct fallback connection failed:", sanitizeMongoUrl(fbMsg));
          throw fallbackErr;
        }
      }

      console.error("[MongoDB] Connection failed:", sanitizeMongoUrl(errMsg));
      throw error;
    });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
