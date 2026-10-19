import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { RoleType } from "@/types/erp";

export interface SeedResult {
  seeded: boolean;
  message: string;
  adminUsername?: string;
  totalUsersCount?: number;
}

/**
 * Ensures the default administrative and core role accounts exist in the database.
 * This function is completely idempotent and SAFE:
 * - If the admin account already exists, it is NEVER modified or overwritten.
 * - It will never overwrite existing passwords or credentials.
 * - If the database is completely empty (e.g. brand new Vercel deployment),
 *   it provisions the foundational baseline accounts.
 */
export async function ensureDefaultAdmin(): Promise<SeedResult> {
  await connectToDatabase();

  // 1. Check if the Super Admin (hawariya21) already exists
  const existingAdmin = await User.findOne({ username: "hawariya21" });
  if (existingAdmin) {
    return {
      seeded: false,
      message: "Default super admin account (hawariya21) is already present.",
      adminUsername: existingAdmin.username,
      totalUsersCount: await User.countDocuments(),
    };
  }

  // Check if any other Admin exists
  const anyAdmin = await User.findOne({ role: "Admin" });
  if (anyAdmin) {
    // An administrator already exists in the system under another username.
    // We still ensure hawariya21 exists as a dedicated recovery/demo super admin if not present.
    console.log("[Seed] Another admin exists; provisioning hawariya21 as super-admin...");
  }

  const adminPass = process.env.INITIAL_ADMIN_PASSWORD || "yohatli2023";
  const adminEmail = (process.env.INITIAL_ADMIN_EMAIL || "hawariya@apexdev.et").toLowerCase().trim();
  const adminHash = await bcrypt.hash(adminPass, 12);

  const superAdmin = await User.create({
    fullName: "Hawariya Yohannes (Super Admin)",
    username: "hawariya21",
    email: adminEmail,
    passwordHash: adminHash,
    role: "Admin" as RoleType,
    department: "Executive Management",
    position: "System Administrator",
    phone: "+251 91 100 0000",
    isActive: true,
  });

  console.log(`[Seed] Super Admin (${superAdmin.username}) provisioned successfully.`);

  // 2. If the database was completely empty prior to creating hawariya21, seed the baseline demo roles
  const remainingCount = await User.countDocuments();
  if (remainingCount <= 1) {
    console.log("[Seed] Fresh database detected. Provisioning baseline demonstration roles...");
    const defaultPasswordHash = await bcrypt.hash("Password123!", 12);

    const demoUsers = [
      {
        fullName: "Alemayehu Tesfaye (Executive Admin)",
        username: "admin",
        email: "admin@apexdev.et",
        passwordHash: defaultPasswordHash,
        role: "Admin" as RoleType,
        department: "Executive Management",
        position: "Chief Executive Officer",
        phone: "+251 91 100 0001",
        isActive: true,
      },
      {
        fullName: "Abebe Bekele",
        username: "pm.abebe",
        email: "pm@apexdev.et",
        passwordHash: defaultPasswordHash,
        role: "Project Manager" as RoleType,
        department: "Project Management Office",
        position: "Senior Project Manager",
        phone: "+251 91 100 0002",
        isActive: true,
      },
      {
        fullName: "Marta Tesfaye",
        username: "engineer.marta",
        email: "engineer@apexdev.et",
        passwordHash: defaultPasswordHash,
        role: "Site Engineer" as RoleType,
        department: "Civil Engineering",
        position: "Lead Structural Engineer",
        phone: "+251 91 100 0003",
        isActive: true,
      },
      {
        fullName: "Dawit Alemu",
        username: "procurement.dawit",
        email: "procurement@apexdev.et",
        passwordHash: defaultPasswordHash,
        role: "Procurement Officer" as RoleType,
        department: "Supply Chain",
        position: "Procurement Lead",
        phone: "+251 91 100 0004",
        isActive: true,
      },
      {
        fullName: "Tadesse Gebre",
        username: "warehouse.tadesse",
        email: "warehouse@apexdev.et",
        passwordHash: defaultPasswordHash,
        role: "Warehouse Manager" as RoleType,
        department: "Logistics & Materials",
        position: "Central Yard Manager",
        phone: "+251 91 100 0005",
        isActive: true,
      },
      {
        fullName: "Hana Solomon",
        username: "accountant.hana",
        email: "accountant@apexdev.et",
        passwordHash: defaultPasswordHash,
        role: "Accountant" as RoleType,
        department: "Finance & Accounting",
        position: "Senior Project Accountant",
        phone: "+251 91 100 0006",
        isActive: true,
      },
      {
        fullName: "Selamawit Kebede",
        username: "hr.selam",
        email: "hr@apexdev.et",
        passwordHash: defaultPasswordHash,
        role: "HR Manager" as RoleType,
        department: "Human Resources",
        position: "HR & Labor Relations Director",
        phone: "+251 91 100 0007",
        isActive: true,
      },
      {
        fullName: "Yonas Girma",
        username: "worker.yonas",
        email: "worker@apexdev.et",
        passwordHash: defaultPasswordHash,
        role: "Worker" as RoleType,
        department: "Field Construction",
        position: "Site Foreman / Specialist",
        phone: "+251 91 100 0008",
        isActive: true,
      },
      {
        fullName: "Bole Real Estate Development",
        username: "client.bole",
        email: "client@apexdev.et",
        passwordHash: defaultPasswordHash,
        role: "Client" as RoleType,
        department: "External Stakeholders",
        position: "Client Representative",
        phone: "+251 91 100 0009",
        isActive: true,
      },
    ];

    await User.insertMany(demoUsers, { ordered: false }).catch((err: unknown) => {
      // Ignore duplicate key errors if some accounts were already inserted
      console.warn("[Seed] Note on demo user insertion:", err instanceof Error ? err.message : String(err));
    });
  }

  const finalCount = await User.countDocuments();
  return {
    seeded: true,
    message: "Default admin and baseline roles successfully provisioned.",
    adminUsername: superAdmin.username,
    totalUsersCount: finalCount,
  };
}

