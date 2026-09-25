import { connectToDatabase } from "@/lib/db/mongodb";
import { body, fail, handleError, ok } from "@/lib/api";
import { requireAuth, requirePermission } from "@/lib/auth/guard";
import { citySchema } from "@/lib/validation/schemas";
import { City } from "@/models/City";
import { logAudit } from "@/lib/services/audit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const guard = await requireAuth(request);
  if (guard.error) return guard.error;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const countryId = searchParams.get("countryId");
    const regionId = searchParams.get("regionId");
    const search = searchParams.get("search");

    const query: Record<string, unknown> = {};
    if (countryId) query.countryId = countryId;
    if (regionId) query.regionId = regionId;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { cityCode: { $regex: search, $options: "i" } },
      ];
    }

    const items = await City.find(query)
      .populate("countryId", "name countryCode")
      .populate("regionId", "name regionCode")
      .sort({ name: 1 });
    return ok({ items, total: items.length });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  const guard = await requirePermission("SETTINGS_MANAGE", request);
  if (guard.error) return guard.error;

  try {
    const input = await body(request, citySchema);
    await connectToDatabase();

    const existing = await City.findOne({ regionId: input.regionId, name: input.name });
    if (existing) {
      return fail("DUPLICATE_RESOURCE", "A city with this name already exists in this region", 409);
    }

    const item = await City.create({
      ...input,
      createdBy: guard.user.id,
    });

    await logAudit({
      userId: guard.user.id,
      userName: guard.user.fullName,
      userRole: guard.user.role,
      action: "CITY_CREATED",
      entity: "City",
      entityId: item.id,
      newValue: { name: item.name, regionId: item.regionId },
    });

    return ok(item, "City created successfully", 201);
  } catch (error) {
    return handleError(error);
  }
}
