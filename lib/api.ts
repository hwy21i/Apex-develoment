import { NextResponse } from "next/server";
import { ZodError } from "zod";

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

  console.error("API error:", error);

  if (
    error instanceof Error &&
    (error.name === "MongoServerError" || error.name === "MongoNetworkError" || "codeName" in error)
  ) {
    return fail("SERVICE_UNAVAILABLE", "The data service is temporarily unavailable. Please try again later.", 503);
  }

  return fail("INTERNAL_ERROR", "An unexpected server error occurred", 500);
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
