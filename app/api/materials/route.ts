import { connectToDatabase } from "@/lib/db/mongodb";
import { handleError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/auth/guard";
import { Material } from "@/models/Material";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const guard = await requirePermission("MATERIAL_VIEW", request);
  if (guard.error) return guard.error;

  try {
    await connectToDatabase();
    const search = new URL(request.url).searchParams.get("q")?.trim();
    const query: Record<string, unknown> = { status: "ACTIVE" };
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [{ name: { $regex: escaped, $options: "i" } }, { sku: { $regex: escaped, $options: "i" } }];
    }
    const items = await Material.find(query).sort({ name: 1 }).limit(200).lean();
    return ok({ items });
  } catch (error) {
    return handleError(error);
  }
}
