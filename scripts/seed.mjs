import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// ============ Initialize Database ============
const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is required. Add it to .env.local before seeding.");
}

await mongoose.connect(uri);

// ============ Define Core Mongoose Schemas ============
const User =
  mongoose.models.User ||
  mongoose.model(
    "User",
    new mongoose.Schema(
      {
        fullName: { type: String, required: true },
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        passwordHash: { type: String, required: true },
        phone: String,
        role: { type: String, required: true },
        department: String,
        position: String,
        assignedProjects: [mongoose.Schema.Types.ObjectId],
        isActive: { type: Boolean, default: true },
        lastLogin: Date,
      },
      { timestamps: true }
    )
  );

const Project =
  mongoose.models.Project ||
  mongoose.model(
    "Project",
    new mongoose.Schema(
      {
        name: { type: String, required: true },
        projectCode: { type: String, unique: true },
        description: String,
        clientName: String,
        location: String,
        projectManager: mongoose.Schema.Types.ObjectId,
        teamMembers: [mongoose.Schema.Types.ObjectId],
        startDate: Date,
        expectedEndDate: Date,
        actualEndDate: Date,
        totalBudget: { type: Number, default: 0 },
        amountSpent: { type: Number, default: 0 },
        progressPercentage: { type: Number, default: 0 },
        status: { type: String, default: "Active" },
        createdBy: mongoose.Schema.Types.ObjectId,
      },
      { timestamps: true }
    )
  );

const AuditLog =
  mongoose.models.AuditLog ||
  mongoose.model(
    "AuditLog",
    new mongoose.Schema(
      {
        userId: mongoose.Schema.Types.ObjectId,
        userName: String,
        userRole: String,
        action: String,
        entity: String,
        entityId: String,
        projectId: mongoose.Schema.Types.ObjectId,
        previousValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed,
      },
      { timestamps: { createdAt: true, updatedAt: false } }
    )
  );

const Country =
  mongoose.models.Country ||
  mongoose.model(
    "Country",
    new mongoose.Schema(
      {
        name: { type: String, required: true },
        countryCode: { type: String, required: true },
        phoneCode: String,
        currency: String,
        currencyCode: String,
        currencySymbol: String,
        timeZone: String,
        status: { type: String, default: "ACTIVE" },
      },
      { timestamps: true }
    )
  );

const Region =
  mongoose.models.Region ||
  mongoose.model(
    "Region",
    new mongoose.Schema(
      {
        name: { type: String, required: true },
        countryId: { type: mongoose.Schema.Types.ObjectId, ref: "Country", required: true },
        regionCode: String,
        status: { type: String, default: "ACTIVE" },
      },
      { timestamps: true }
    )
  );

const City =
  mongoose.models.City ||
  mongoose.model(
    "City",
    new mongoose.Schema(
      {
        name: { type: String, required: true },
        countryId: { type: mongoose.Schema.Types.ObjectId, ref: "Country", required: true },
        regionId: { type: mongoose.Schema.Types.ObjectId, ref: "Region", required: true },
        cityCode: String,
        status: { type: String, default: "ACTIVE" },
      },
      { timestamps: true }
    )
  );

// ============ Clear Existing Collections ============
console.log("Cleaning existing database collections...");
await Promise.all([
  User.deleteMany({}),
  Project.deleteMany({}),
  AuditLog.deleteMany({}),
  Country.deleteMany({}),
  Region.deleteMany({}),
  City.deleteMany({}),
]);

// ============ Seed All 9 ERP Roles ============
console.log("Seeding all 9 Construction ERP roles...");
const defaultPassword = "Password123!";
const passwordHash = await bcrypt.hash(defaultPassword, 12);

const users = await User.create([
  {
    fullName: "Alemayehu Tesfaye (Executive Admin)",
    username: "admin",
    email: "admin@apexdev.et",
    passwordHash,
    role: "Admin",
    department: "Executive Management",
    position: "Chief Executive Officer",
    phone: "+251 91 100 0001",
    isActive: true,
  },
  {
    fullName: "Abebe Bekele",
    username: "pm.abebe",
    email: "pm@apexdev.et",
    passwordHash,
    role: "Project Manager",
    department: "Project Management Office",
    position: "Senior Project Manager",
    phone: "+251 91 100 0002",
    isActive: true,
  },
  {
    fullName: "Marta Tesfaye",
    username: "engineer.marta",
    email: "engineer@apexdev.et",
    passwordHash,
    role: "Site Engineer",
    department: "Civil Engineering",
    position: "Lead Structural Engineer",
    phone: "+251 91 100 0003",
    isActive: true,
  },
  {
    fullName: "Dawit Alemu",
    username: "procurement.dawit",
    email: "procurement@apexdev.et",
    passwordHash,
    role: "Procurement Officer",
    department: "Supply Chain",
    position: "Procurement Lead",
    phone: "+251 91 100 0004",
    isActive: true,
  },
  {
    fullName: "Tadesse Gebre",
    username: "warehouse.tadesse",
    email: "warehouse@apexdev.et",
    passwordHash,
    role: "Warehouse Manager",
    department: "Logistics & Materials",
    position: "Central Yard Manager",
    phone: "+251 91 100 0005",
    isActive: true,
  },
  {
    fullName: "Hana Solomon",
    username: "accountant.hana",
    email: "accountant@apexdev.et",
    passwordHash,
    role: "Accountant",
    department: "Finance & Accounting",
    position: "Senior Project Accountant",
    phone: "+251 91 100 0006",
    isActive: true,
  },
  {
    fullName: "Selamawit Kebede",
    username: "hr.selam",
    email: "hr@apexdev.et",
    passwordHash,
    role: "HR Manager",
    department: "Human Resources",
    position: "HR & Labor Relations Director",
    phone: "+251 91 100 0007",
    isActive: true,
  },
  {
    fullName: "Yonas Girma",
    username: "worker.yonas",
    email: "worker@apexdev.et",
    passwordHash,
    role: "Worker",
    department: "Field Construction",
    position: "Site Foreman / Specialist",
    phone: "+251 91 100 0008",
    isActive: true,
  },
  {
    fullName: "Bole Tower Investments Ltd",
    username: "client.bole",
    email: "client@apexdev.et",
    passwordHash,
    role: "Client",
    department: "Client Representative",
    position: "Owner Representative",
    phone: "+251 91 100 0009",
    isActive: true,
  },
]);

console.log(`Created ${users.length} users across all 9 roles.`);

// ============ Seed Initial Projects ============
const [adminUser, pmUser, engUser, procUser, wareUser, accUser, hrUser, wrkUser, clientUser] = users;

// ============ Seed Countries, Regions, Cities ============
console.log("Seeding Ethiopia administrative hierarchy (Country -> Regions -> Cities)...");
const ethiopia = await Country.create({
  name: "Ethiopia",
  countryCode: "ET",
  phoneCode: "+251",
  currency: "Ethiopian Birr",
  currencyCode: "ETB",
  currencySymbol: "Br",
  timeZone: "Africa/Addis_Ababa",
  status: "ACTIVE",
});

const addisAbabaRegion = await Region.create({
  name: "Addis Ababa",
  countryId: ethiopia._id,
  regionCode: "AA",
  status: "ACTIVE",
});

const oromiaRegion = await Region.create({
  name: "Oromia",
  countryId: ethiopia._id,
  regionCode: "OR",
  status: "ACTIVE",
});

await City.create([
  { name: "Bole Sub-City", countryId: ethiopia._id, regionId: addisAbabaRegion._id, cityCode: "BOL" },
  { name: "Yeka Sub-City", countryId: ethiopia._id, regionId: addisAbabaRegion._id, cityCode: "YEK" },
  { name: "Kirkos Sub-City", countryId: ethiopia._id, regionId: addisAbabaRegion._id, cityCode: "KIR" },
  { name: "Bishoftu", countryId: ethiopia._id, regionId: oromiaRegion._id, cityCode: "BSH" },
  { name: "Modjo", countryId: ethiopia._id, regionId: oromiaRegion._id, cityCode: "MDJ" },
  { name: "Adama", countryId: ethiopia._id, regionId: oromiaRegion._id, cityCode: "ADM" },
]);

const projects = await Project.create([

  {
    name: "Addis Heights Mixed-Use Tower",
    projectCode: "PRJ-ADD-001",
    description: "32-story commercial & residential development located in Kazanchis financial district.",
    clientName: "Bole Tower Investments Ltd",
    location: "Kazanchis, Addis Ababa",
    projectManager: pmUser._id,
    teamMembers: [pmUser._id, engUser._id, procUser._id, wareUser._id, accUser._id, wrkUser._id, clientUser._id],
    startDate: new Date("2026-01-15"),
    expectedEndDate: new Date("2027-12-31"),
    totalBudget: 45000000,
    amountSpent: 16200000,
    progressPercentage: 36,
    status: "Active",
    createdBy: adminUser._id,
  },
  {
    name: "Harbor Logistics & Cold Storage Hub",
    projectCode: "PRJ-LOG-002",
    description: "State-of-the-art multimodal distribution warehouse facility.",
    clientName: "Rift Valley Logistics Corp",
    location: "Modjo Dry Port Corridor",
    projectManager: pmUser._id,
    teamMembers: [pmUser._id, engUser._id, wareUser._id, accUser._id],
    startDate: new Date("2025-10-01"),
    expectedEndDate: new Date("2026-11-15"),
    totalBudget: 22000000,
    amountSpent: 17800000,
    progressPercentage: 81,
    status: "Active",
    createdBy: adminUser._id,
  },
  {
    name: "Greenfield Eco-Resort & Spa",
    projectCode: "PRJ-RES-003",
    description: "Sustainable lakeside hospitality infrastructure development.",
    clientName: "Lakeside Leisure Holdings",
    location: "Bishoftu Lake View",
    projectManager: pmUser._id,
    teamMembers: [pmUser._id, engUser._id],
    startDate: new Date("2026-09-01"),
    expectedEndDate: new Date("2028-03-30"),
    totalBudget: 15000000,
    amountSpent: 1200000,
    progressPercentage: 8,
    status: "Planning",
    createdBy: adminUser._id,
  },
]);

// Link assigned projects to users
await User.updateMany(
  { _id: { $in: [pmUser._id, engUser._id, clientUser._id] } },
  { $set: { assignedProjects: projects.map((p) => p._id) } }
);

// ============ Seed Initial Audit Log ============
await AuditLog.create({
  userId: adminUser._id,
  userName: adminUser.fullName,
  userRole: adminUser.role,
  action: "SYSTEM_INITIALIZED",
  entity: "System",
  newValue: { seededUsers: users.length, seededProjects: projects.length },
});

console.log("Seed complete! Credentials for all seeded accounts:");
console.table(
  users.map((u) => ({
    Role: u.role,
    Username: u.username,
    Email: u.email,
    Password: defaultPassword,
  }))
);

await mongoose.disconnect();
console.log("Database disconnected cleanly.");
