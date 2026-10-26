import { connectToDatabase } from "@/lib/db/mongodb";
import { handleError, ok, fail } from "@/lib/api";
import { requirePermission } from "@/lib/auth/guard";
import { materialValidationSchema } from "@/lib/validation/schemas";
import { Material } from "@/models/Material";
import { Operational } from "@/models/Operational";
import { logAudit } from "@/lib/services/audit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const guard = await requirePermission("MATERIAL_VIEW", request);
  if (guard.error) return guard.error;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 50)));
    const search = searchParams.get("q") || searchParams.get("search");
    const category = searchParams.get("category");
    const status = searchParams.get("status");

    const query: Record<string, unknown> = {};

    if (category && category !== "ALL") {
      query.category = category;
    }

    if (status && status !== "ALL") {
      query.status = status;
    }

    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { name: { $regex: term, $options: "i" } },
        { sku: { $regex: term, $options: "i" } },
        { gradeOrSpec: { $regex: term, $options: "i" } },
        { category: { $regex: term, $options: "i" } },
        { description: { $regex: term, $options: "i" } },
      ];
    }

    let [items, total] = await Promise.all([
      Material.find(query)
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("preferredSupplierId", "name contactPerson phone")
        .populate("defaultWarehouseId", "name location")
        .lean(),
      Material.countDocuments(query),
    ]);

    // Backward compatibility fallback: check Operational records if collection has 0 items
    if (total === 0 && !search && (!category || category === "ALL")) {
      const legacyRecords = await Operational.find({ kind: "materials" }).limit(limit).lean();
      if (legacyRecords.length > 0) {
        items = legacyRecords.map((r) => ({
          _id: r._id,
          name: (r.title || r.data?.name || "Material Item") as string,
          sku: (r.data?.sku || `MAT-${r._id.toString().slice(-6).toUpperCase()}`) as string,
          category: (r.data?.category || "Cement & Aggregates") as string,
          unitOfMeasure: (r.data?.unitOfMeasure || "pieces") as string,
          minimumStockLevel: Number(r.data?.minimumStockLevel) || 10,
          currentStock: Number(r.data?.currentStock ?? 50),
          unitCost: Number(r.data?.unitCost) || 0,
          gradeOrSpec: (r.data?.gradeOrSpec || "") as string,
          description: (r.data?.description || "") as string,
          status: (r.status || "ACTIVE") as "ACTIVE" | "DISCONTINUED",
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })) as unknown as typeof items;
        total = legacyRecords.length;
      }
    }

    return ok({
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  const guard = await requirePermission("MATERIAL_CREATE", request);
  if (guard.error) return guard.error;

  try {
    await connectToDatabase();
    const rawData = await request.json();

    const parsed = materialValidationSchema.safeParse(rawData);
    if (!parsed.success) {
      return fail(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message || "Invalid material data provided.",
        400,
        parsed.error.flatten()
      );
    }

    const {
      name,
      sku: providedSku,
      category,
      unitOfMeasure,
      minimumStockLevel,
      currentStock,
      unitCost,
      gradeOrSpec,
      description,
      status,
    } = parsed.data;

    // Generate SKU if not provided or empty
    let sku = providedSku?.trim().toUpperCase();
    if (!sku) {
      const catPrefix = category.slice(0, 3).toUpperCase();
      sku = `MAT-${catPrefix}-${Date.now().toString().slice(-5)}`;
    }

    // Ensure unique SKU
    const existingSku = await Material.findOne({ sku });
    if (existingSku) {
      sku = `${sku}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const newMaterial = await Material.create({
      name,
      sku,
      category,
      unitOfMeasure,
      minimumStockLevel,
      currentStock,
      unitCost,
      gradeOrSpec,
      description,
      status: status || "ACTIVE",
    });

    await logAudit({
      userId: guard.user.id,
      userName: guard.user.fullName,
      userRole: guard.user.role,
      action: "MATERIAL_CREATE",
      entity: "Material",
      entityId: newMaterial._id.toString(),
      newValue: {
        name: newMaterial.name,
        sku: newMaterial.sku,
        category: newMaterial.category,
        unitCost: newMaterial.unitCost,
      },
    });

    return ok(newMaterial, "Material created successfully", 201);
  } catch (error) {
    return handleError(error);
  }
}
