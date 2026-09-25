import { connectToDatabase } from "@/lib/db/mongodb";
import { body, fail, handleError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/auth/guard";
import { clientCreateSchema } from "@/lib/validation/schemas";
import { Client } from "@/models/Client";
import { logAudit } from "@/lib/services/audit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const guard = await requirePermission("CLIENT_VIEW", request);
  if (guard.error) return guard.error;

  try {
    await connectToDatabase();
    const items = await Client.find().sort({ name: 1 }).limit(200).lean();
    return ok({ items });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  const guard = await requirePermission("CLIENT_CREATE", request);
  if (guard.error) return guard.error;

  try {
    const input = await body(request, clientCreateSchema);
    await connectToDatabase();
    if (input.email && await Client.exists({ email: input.email.toLowerCase() })) {
      return fail("DUPLICATE_RESOURCE", "A client with this email already exists", 409);
    }

    const client = await Client.create({ ...input, createdBy: guard.user.id });
    await logAudit({
      userId: guard.user.id,
      userName: guard.user.fullName,
      userRole: guard.user.role,
      action: "CLIENT_CREATED",
      entity: "Client",
      entityId: client.id,
      newValue: { name: client.name, companyName: client.companyName },
    });
    return ok(client, "Client created successfully", 201);
  } catch (error) {
    return handleError(error);
  }
}
