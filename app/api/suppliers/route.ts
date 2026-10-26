import { connectToDatabase } from "@/lib/db/mongodb";
import { handleError, ok, fail } from "@/lib/api";
import { requirePermission } from "@/lib/auth/guard";
import { Supplier } from "@/models/Supplier";
import { Operational } from "@/models/Operational";
import { logAudit } from "@/lib/services/audit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const guard = await requirePermission("SUPPLIER_VIEW", request);
  if (guard.error) return guard.error;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("q") || searchParams.get("search");
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 50)));

    const query: Record<string, unknown> = {};
    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { name: { $regex: term, $options: "i" } },
        { contactPerson: { $regex: term, $options: "i" } },
        { category: { $regex: term, $options: "i" } },
        { email: { $regex: term, $options: "i" } },
      ];
    }

    let [items, total] = await Promise.all([
      Supplier.find(query).sort({ name: 1 }).limit(limit).lean(),
      Supplier.countDocuments(query),
    ]);

    // Fallback: check legacy Operational records if count is 0
    if (total === 0 && !search) {
      const legacy = await Operational.find({ kind: "suppliers" }).limit(limit).lean();
      if (legacy.length > 0) {
        items = legacy.map((r) => ({
          _id: r._id,
          name: (r.title || r.data?.name || "Supplier") as string,
          contactPerson: (r.data?.contactPerson || "Contact") as string,
          email: (r.data?.email || "") as string,
          phone: (r.data?.phone || "+251 91 100 0000") as string,
          category: (r.data?.category || "Building Materials") as string,
          address: (r.data?.address || "Addis Ababa") as string,
          rating: Number(r.data?.rating || 4),
          status: (r.status || "ACTIVE") as "ACTIVE" | "SUSPENDED" | "BLACKLISTED",
        })) as unknown as typeof items;
        total = legacy.length;
      }
    }

    return ok({ items, total });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  const guard = await requirePermission("SUPPLIER_MANAGE", request);
  if (guard.error) return guard.error;

  try {
    await connectToDatabase();
    const body = await request.json();
    const { name, contactPerson, email, phone, category, address, paymentTerms } = body;

    if (!name || !name.trim()) {
      return fail("VALIDATION_ERROR", "Supplier name is required.", 400);
    }
    if (!phone || !phone.trim()) {
      return fail("VALIDATION_ERROR", "Contact phone number is required.", 400);
    }

    const supplier = await Supplier.create({
      name: name.trim(),
      contactPerson: contactPerson?.trim() || undefined,
      email: email?.trim().toLowerCase() || undefined,
      phone: phone.trim(),
      category: category?.trim() || "Building Materials",
      address: address?.trim() || undefined,
      paymentTerms: paymentTerms?.trim() || "Net 30",
      status: "ACTIVE",
    });

    await logAudit({
      userId: guard.user.id,
      userName: guard.user.fullName,
      userRole: guard.user.role,
      action: "SUPPLIER_CREATE",
      entity: "Supplier",
      entityId: supplier._id.toString(),
      newValue: { name: supplier.name, category: supplier.category },
    });

    return ok(supplier, "Supplier created successfully", 201);
  } catch (error) {
    return handleError(error);
  }
}
