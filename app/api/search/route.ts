import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { currentUser } from "@/lib/auth/session";
import { Project } from "@/models/Project";
import { Task } from "@/models/Task";
import { Material } from "@/models/Material";
import { User } from "@/models/User";
import { Equipment } from "@/models/Equipment";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await currentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();

    if (!q) {
      return NextResponse.json({
        success: true,
        data: { results: [], total: 0 },
      });
    }

    await connectToDatabase();

    const regex = new RegExp(q.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "i");
    const results: Array<{
      id: string;
      type: "project" | "task" | "material" | "user" | "equipment" | "module";
      title: string;
      subtitle: string;
      badge?: string;
      url: string;
    }> = [];

    // 1. Module / Page Navigation Matches (based on role)
    const isAdminUser =
      user.role === "Admin" ||
      user.role === "Super Admin" ||
      user.role === "Company Admin";

    const modules = [
      { title: "Projects Portfolio", subtitle: "All construction sites & execution", url: "/projects", roles: ["Admin", "Super Admin", "Company Admin", "Project Manager", "Site Engineer", "Client"] },
      { title: "Site Tasks & Activities", subtitle: "WBS execution & progress tracking", url: "/tasks", roles: ["Admin", "Super Admin", "Company Admin", "Project Manager", "Site Engineer", "Worker"] },
      { title: "Materials Inventory", subtitle: "Stock levels, replenishment & SKUs", url: "/materials", roles: ["Admin", "Super Admin", "Company Admin", "Project Manager", "Site Engineer", "Warehouse Manager", "Procurement Officer"] },
      { title: "Site Workers & Personnel", subtitle: "Laborers, trades, daily wages & PPE", url: "/people/workers", roles: ["Admin", "Super Admin", "Company Admin", "Project Manager", "HR Manager"] },
      { title: "Equipment & Machinery", subtitle: "Heavy fleet tracking & operating status", url: "/equipment", roles: ["Admin", "Super Admin", "Company Admin", "Project Manager", "Site Engineer", "Warehouse Manager"] },
      { title: "Expense Vouchers", subtitle: "Disbursements, petty cash & payments", url: "/finance/expenses", roles: ["Admin", "Super Admin", "Company Admin", "Project Manager", "Accountant"] },
      { title: "CSI Budgets & Cost Control", subtitle: "Division allocations & variance", url: "/finance/budgets", roles: ["Admin", "Super Admin", "Company Admin", "Project Manager", "Accountant"] },
      { title: "Suppliers & Vendors", subtitle: "Subcontractors & trade material vendors", url: "/procurement/suppliers", roles: ["Admin", "Super Admin", "Company Admin", "Project Manager", "Procurement Officer"] },
      { title: "Contracts & Documents", subtitle: "Engineering drawings & signed contracts", url: "/documents/contracts", roles: ["Admin", "Super Admin", "Company Admin", "Project Manager", "Site Engineer", "Client"] },
      { title: "Safety Announcements", subtitle: "Site advisories & safety alerts", url: "/announcements", roles: ["Admin", "Super Admin", "Company Admin", "Project Manager", "Site Engineer", "Worker", "HR Manager"] },
    ];

    for (const mod of modules) {
      if (mod.roles.includes(user.role)) {
        if (regex.test(mod.title) || regex.test(mod.subtitle)) {
          results.push({
            id: `module-${mod.url}`,
            type: "module",
            title: mod.title,
            subtitle: mod.subtitle,
            badge: "Page",
            url: mod.url,
          });
        }
      }
    }

    // 2. Search Projects
    try {
      const projectQuery: Record<string, unknown> = {
        $or: [
          { name: regex },
          { projectCode: regex },
          { client: regex },
          { location: regex },
        ],
      };
      if (!isAdminUser) {
        projectQuery.$or = [
          ...((projectQuery.$or as unknown[]) || []),
          { projectManager: user.id },
          { teamMembers: user.id },
          { createdBy: user.id },
        ];
      }
      const projects = await Project.find(projectQuery)
        .select("name projectCode client location status")
        .limit(6)
        .lean();

      for (const p of projects) {
        results.push({
          id: String(p._id),
          type: "project",
          title: p.name,
          subtitle: `${p.projectCode || "PRJ"} • ${p.location || p.client || "Active Site"}`,
          badge: p.status || "Active",
          url: `/projects?search=${encodeURIComponent(p.name)}`,
        });
      }
    } catch {}

    // 3. Search Tasks
    try {
      const tasks = await Task.find({
        $or: [{ title: regex }, { description: regex }],
      })
        .select("title priority status progress")
        .limit(6)
        .lean();

      for (const t of tasks) {
        results.push({
          id: String(t._id),
          type: "task",
          title: t.title,
          subtitle: `Priority: ${t.priority || "MEDIUM"} • Progress: ${t.progress || 0}%`,
          badge: t.status || "Task",
          url: `/tasks?search=${encodeURIComponent(t.title)}`,
        });
      }
    } catch {}

    // 4. Search Materials (if permitted)
    if (["Admin", "Project Manager", "Site Engineer", "Warehouse Manager", "Procurement Officer"].includes(user.role)) {
      try {
        const materials = await Material.find({
          $or: [{ name: regex }, { sku: regex }, { category: regex }],
        })
          .select("name sku category currentStock unit")
          .limit(6)
          .lean();

        for (const m of materials) {
          results.push({
            id: String(m._id),
            type: "material",
            title: m.name,
            subtitle: `${m.sku || "MAT"} • Stock: ${m.currentStock || 0} ${m.unit || "units"}`,
            badge: m.category || "Inventory",
            url: `/materials?search=${encodeURIComponent(m.name)}`,
          });
        }
      } catch {}
    }

    // 5. Search Equipment (if permitted)
    if (["Admin", "Project Manager", "Site Engineer", "Warehouse Manager"].includes(user.role)) {
      try {
        const equipment = await Equipment.find({
          $or: [{ name: regex }, { equipmentCode: regex }, { type: regex }],
        })
          .select("name equipmentCode type status")
          .limit(5)
          .lean();

        for (const eq of equipment) {
          results.push({
            id: String(eq._id),
            type: "equipment",
            title: eq.name,
            subtitle: `${eq.equipmentCode || "EQP"} • Type: ${eq.type || "Machinery"}`,
            badge: eq.status || "Available",
            url: `/equipment?search=${encodeURIComponent(eq.name)}`,
          });
        }
      } catch {}
    }

    // 6. Search Users / Personnel (if permitted)
    if (["Admin", "Project Manager", "HR Manager"].includes(user.role)) {
      try {
        const users = await User.find({
          $or: [{ fullName: regex }, { username: regex }, { department: regex }],
        })
          .select("fullName username role department")
          .limit(5)
          .lean();

        for (const u of users) {
          results.push({
            id: String(u._id),
            type: "user",
            title: u.fullName,
            subtitle: `${u.role} • ${u.department || "Field Team"}`,
            badge: u.role,
            url: `/people/workers?search=${encodeURIComponent(u.fullName)}`,
          });
        }
      } catch {}
    }

    return NextResponse.json({
      success: true,
      data: {
        results,
        total: results.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Search failed",
        },
      },
      { status: 500 }
    );
  }
}
