import { connectToDatabase } from "@/lib/db/mongodb";
import { body, fail, handleError, ok } from "@/lib/api";
import { requireAuth, requirePermission } from "@/lib/auth/guard";
import { countrySchema } from "@/lib/validation/schemas";
import { Country } from "@/models/Country";
import { logAudit } from "@/lib/services/audit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const guard = await requireAuth(request);
  if (guard.error) return guard.error;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { countryCode: { $regex: search, $options: "i" } },
        { currencyCode: { $regex: search, $options: "i" } },
      ];
    }

    const items = await Country.find(query).sort({ name: 1 });
    return ok({ items, total: items.length });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  const guard = await requirePermission("SETTINGS_MANAGE", request);
  if (guard.error) return guard.error;

  try {
    const input = await body(request, countrySchema);
    await connectToDatabase();

    const existing = await Country.findOne({
      $or: [{ countryCode: input.countryCode }, { name: input.name }],
    });
    if (existing) {
      return fail("DUPLICATE_RESOURCE", "A country with this name or code already exists", 409);
    }

    const item = await Country.create({
      ...input,
      createdBy: guard.user.id,
    });

    await logAudit({
      userId: guard.user.id,
      userName: guard.user.fullName,
      userRole: guard.user.role,
      action: "COUNTRY_CREATED",
      entity: "Country",
      entityId: item.id,
      newValue: { name: item.name, code: item.countryCode },
    });

    return ok(item, "Country created successfully", 201);
  } catch (error) {
    return handleError(error);
  }
}
