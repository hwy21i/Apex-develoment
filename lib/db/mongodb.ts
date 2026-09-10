import mongoose from "mongoose";

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const globalCache = global as typeof globalThis & { mongooseCache?: Cache };
const cache = globalCache.mongooseCache ?? (globalCache.mongooseCache = { conn: null, promise: null });

export async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not configured. Add your MongoDB connection string to .env.local.");
  }

  if (cache.conn) return cache.conn;

  cache.promise ??= mongoose
    .connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    })
    .catch((error) => {
      cache.promise = null;
      console.error("MongoDB Connection Failure:", error.message);
      throw error;
    });

  cache.conn = await cache.promise;
  return cache.conn;
}
