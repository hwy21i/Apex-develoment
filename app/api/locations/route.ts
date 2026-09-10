import { connectToDatabase } from "@/lib/db/mongodb";
import { body, fail, handleError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/auth/guard";
import { locationSchema } from "@/lib/validation/schemas";
import { Location } from "@/models/Location";
import { logAudit } from "@/lib/services/audit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const countryId = searchParams.get("countryId");
    const regionId = searchParams.get("regionId");
    const cityId = searchParams.get("cityId");
    const search = searchParams.get("search");

    const query: Record<string, unknown> = {};
    if (countryId) query.countryId = countryId;
    if (regionId) query.regionId = regionId;
    if (cityId) query.cityId = cityId;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { district: { $regex: search, $options: "i" } },
      ];
    }

    const items = await Location.find(query)
      .populate("countryId", "name countryCode")
      .populate("regionId", "name regionCode")
      .populate("cityId", "name cityCode")
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
    const input = await body(request, locationSchema);
    await connectToDatabase();

    const item = await Location.create(input);

    await logAudit({
      userId: guard.user.id,
      userName: guard.user.fullName,
      userRole: guard.user.role,
      action: "LOCATION_CREATED",
      entity: "Location",
      entityId: item.id,
      newValue: { name: item.name, address: item.address },
    });

    return ok(item, "Location created successfully", 201);
  } catch (error) {
    return handleError(error);
  }
}

