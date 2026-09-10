import { connectToDatabase } from "@/lib/db/mongodb";
import { body, fail, handleError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/auth/guard";
import { regionSchema } from "@/lib/validation/schemas";
import { Region } from "@/models/Region";
import { logAudit } from "@/lib/services/audit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const countryId = searchParams.get("countryId");
    const search = searchParams.get("search");

    const query: Record<string, unknown> = {};
    if (countryId) query.countryId = countryId;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { regionCode: { $regex: search, $options: "i" } },
      ];
    }

    const items = await Region.find(query).populate("countryId", "name countryCode").sort({ name: 1 });
    return ok({ items, total: items.length });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  const guard = await requirePermission("SETTINGS_MANAGE", request);
  if (guard.error) return guard.error;

  try {
    const input = await body(request, regionSchema);
    await connectToDatabase();

    const existing = await Region.findOne({ countryId: input.countryId, name: input.name });
    if (existing) {
      return fail("DUPLICATE_RESOURCE", "A region with this name already exists in the country", 409);
    }

    const item = await Region.create({
      ...input,
      createdBy: guard.user.id,
    });

    await logAudit({
      userId: guard.user.id,
      userName: guard.user.fullName,
      userRole: guard.user.role,
      action: "REGION_CREATED",
      entity: "Region",
      entityId: item.id,
      newValue: { name: item.name, countryId: item.countryId },
    });

    return ok(item, "Region created successfully", 201);
  } catch (error) {
    return handleError(error);
  }
}

