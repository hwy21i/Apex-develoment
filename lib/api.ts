import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { sanitizeMongoUrl } from "@/lib/db/mongodb";

export const ok = (
  data: unknown,
  message = "Operation completed successfully",
  status = 200
) => NextResponse.json({ success: true, data, message }, { status });

export const fail = (
  code: string,
  message: string,
  status = 400,
  details?: unknown
) =>
  NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
    },
    { status }
  );

export function handleError(error: unknown) {
  if (error instanceof ZodError) {
    const errorDetails = error.issues.map((i) => {
      const fieldPath = i.path.join(".");
      return fieldPath ? `${fieldPath}: ${i.message}` : i.message;
    });

    const detailedMessage =
      errorDetails.length > 0
        ? `Validation failed (${errorDetails.join(", ")})`
        : "Invalid request data";

    return fail("VALIDATION_ERROR", detailedMessage, 422, error.issues);
  }

  const errorName = error instanceof Error ? error.name : "UnknownError";
  const errorMessage = error instanceof Error ? error.message : String(error);
  const sanitizedMessage = sanitizeMongoUrl(errorMessage);

  console.error(`[API Error] [${errorName}]:`, sanitizedMessage);

  // 1. Missing Database Configuration Error
  if (
    sanitizedMessage.includes("MONGODB_URI") ||
    sanitizedMessage.includes("environment variable is not defined")
  ) {
    return fail(
      "CONFIGURATION_ERROR",
      "Database service configuration is missing. Please configure MONGODB_URI in Vercel project settings.",
      503
    );
  }

  // 2. Database Authentication Failure
  if (
    sanitizedMessage.includes("bad auth") ||
    sanitizedMessage.includes("Authentication failed") ||
    sanitizedMessage.includes("auth failed")
  ) {
    return fail(
      "DATABASE_AUTH_ERROR",
      "Database authentication failed. Please verify that MONGODB_URI credentials are valid in Vercel project environment variables.",
      503
    );
  }

  // 3. Database Connection / Network / Timeout errors
  const isDatabaseError =
    errorName.includes("Mongo") ||
    errorName.includes("Mongoose") ||
    sanitizedMessage.includes("querySrv") ||
    sanitizedMessage.includes("ECONNREFUSED") ||
    sanitizedMessage.includes("ETIMEOUT") ||
    sanitizedMessage.includes("buffering timed out") ||
    sanitizedMessage.includes("TopologyDescription");

  if (isDatabaseError) {
    return fail(
      "DATABASE_UNAVAILABLE",
      "Database service is currently unavailable. Please verify MongoDB cluster status and network access.",
      503
    );
  }

  const isProd = process.env.NODE_ENV === "production";
  const safeMessage = isProd
    ? "An unexpected internal server error occurred"
    : sanitizedMessage || "An unexpected server error occurred";

  return fail("INTERNAL_ERROR", safeMessage, 500);
}

export async function body<T>(
  request: Request,
  schema: { parse: (value: unknown) => T }
): Promise<T> {
  let parsedJson: unknown;
  try {
    parsedJson = await request.json();
  } catch {
    throw new ZodError([
      {
        code: "custom",
        message: "Invalid or empty JSON body",
        path: [],
      },
    ]);
  }
  return schema.parse(parsedJson);
}
