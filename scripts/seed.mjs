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

const Warehouse =
  mongoose.models.Warehouse ||
  mongoose.model(
    "Warehouse",
    new mongoose.Schema(
      {
        name: { type: String, required: true },
        code: { type: String, required: true, unique: true },
        location: String,
        type: { type: String, default: "CENTRAL" },
        status: { type: String, default: "ACTIVE" },
      },
      { timestamps: true }
    )
  );

const Supplier =
  mongoose.models.Supplier ||
  mongoose.model(
    "Supplier",
    new mongoose.Schema(
      {
        name: { type: String, required: true },
        contactPerson: String,
        email: String,
        phone: String,
        address: String,
        category: String,
        rating: { type: Number, default: 4.5 },
        status: { type: String, default: "ACTIVE" },
        tinNumber: String,
        paymentTerms: String,
      },
      { timestamps: true }
    )
  );

const Material =
  mongoose.models.Material ||
  mongoose.model(
    "Material",
    new mongoose.Schema(
      {
        name: { type: String, required: true },
        sku: { type: String, required: true, unique: true },
        category: { type: String, required: true },
        unitOfMeasure: { type: String, default: "pieces" },
        minimumStockLevel: { type: Number, default: 10 },
        currentStock: { type: Number, default: 0 },
        unitCost: { type: Number, default: 0 },
        status: { type: String, default: "ACTIVE" },
      },
      { timestamps: true }
    )
  );

const Milestone =
  mongoose.models.Milestone ||
  mongoose.model(
    "Milestone",
    new mongoose.Schema(
      {
        projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
        title: { type: String, required: true },
        description: String,
        dueDate: Date,
        status: { type: String, default: "Pending" },
      },
      { timestamps: true }
    )
  );

const Notification =
  mongoose.models.Notification ||
  mongoose.model(
    "Notification",
    new mongoose.Schema(
      {
        userId: mongoose.Schema.Types.ObjectId,
        title: { type: String, required: true },
        message: { type: String, required: true },
        type: { type: String, default: "SYSTEM" },
        link: String,
        isRead: { type: Boolean, default: false },
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
  Warehouse.deleteMany({}),
  Supplier.deleteMany({}),
  Material.deleteMany({}),
  Milestone.deleteMany({}),
  Notification.deleteMany({}),
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

// ============ Seed Warehouses ============
console.log("Seeding warehouses & logistics centers...");
const warehouses = await Warehouse.create([
  {
    name: "Central Logistics Hub - Kaliti",
    code: "WH-ADD-01",
    location: "Akaki Kality, Addis Ababa",
    type: "CENTRAL",
    status: "ACTIVE",
  },
  {
    name: "Addis Heights Site Storage",
    code: "WH-BOLE-02",
    location: "Bole Sub-City, Site Block B",
    type: "PROJECT_SITE",
    status: "ACTIVE",
  },
  {
    name: "Modjo Corridor Depot",
    code: "WH-MDJ-03",
    location: "Modjo Dry Port Industrial Corridor",
    type: "TRANSIT",
    status: "ACTIVE",
  },
]);

// ============ Seed Qualified Suppliers ============
console.log("Seeding qualified suppliers...");
const suppliers = await Supplier.create([
  {
    name: "Addis Construction Supply Co.",
    contactPerson: "Solomon Tadesse",
    email: "sales@addisconstructionsupply.et",
    phone: "+251 11 234 5678",
    address: "Bole Sub-City, Addis Ababa",
    category: "Cement & Aggregates",
    rating: 4.8,
    tinNumber: "0012345678",
    paymentTerms: "Net 30",
    status: "ACTIVE",
  },
  {
    name: "Tekle Steel Works Plc",
    contactPerson: "Tekle Wolde",
    email: "orders@teklesteel.com",
    phone: "+251 11 456 7890",
    address: "Akaki Kality Industrial Zone",
    category: "Steel & Rebar",
    rating: 4.7,
    tinNumber: "0023456789",
    paymentTerms: "Net 45",
    status: "ACTIVE",
  },
  {
    name: "Ethiopian Aggregate Industries",
    contactPerson: "Marta Getachew",
    email: "info@ethioaggregate.et",
    phone: "+251 11 345 6789",
    address: "Gelam Quarry Site, Oromia",
    category: "Aggregates & Sand",
    rating: 4.3,
    tinNumber: "0034567890",
    paymentTerms: "50% Advance, 50% Delivery",
    status: "ACTIVE",
  },
]);

// ============ Seed Materials Catalog ============
console.log("Seeding materials catalog with ETB unit pricing...");
const materials = await Material.create([
  {
    name: "Portland Pozzolana Cement (50kg bag)",
    sku: "MAT-CEM-001",
    category: "Cement & Aggregates",
    unitOfMeasure: "bags",
    minimumStockLevel: 200,
    currentStock: 1850,
    unitCost: 1500,
    status: "ACTIVE",
  },
  {
    name: "High-Yield Deformed Steel Rebar 16mm",
    sku: "MAT-STL-016",
    category: "Steel & Rebar",
    unitOfMeasure: "tons",
    minimumStockLevel: 15,
    currentStock: 48,
    unitCost: 85000,
    status: "ACTIVE",
  },
  {
    name: "Crushed Basalt Stone 20mm (Gravel)",
    sku: "MAT-AGG-020",
    category: "Cement & Aggregates",
    unitOfMeasure: "m3",
    minimumStockLevel: 50,
    currentStock: 340,
    unitCost: 1650,
    status: "ACTIVE",
  },
  {
    name: "Washed River Sand",
    sku: "MAT-SND-001",
    category: "Cement & Aggregates",
    unitOfMeasure: "m3",
    minimumStockLevel: 40,
    currentStock: 220,
    unitCost: 1800,
    status: "ACTIVE",
  },
  {
    name: "Construction Safety Helmet (EN 397)",
    sku: "MAT-PPE-001",
    category: "Safety Gear",
    unitOfMeasure: "pieces",
    minimumStockLevel: 25,
    currentStock: 120,
    unitCost: 850,
    status: "ACTIVE",
  },
]);

// ============ Seed Project Milestones ============
console.log("Seeding project milestones...");
await Milestone.create([
  {
    projectId: projects[0]._id,
    title: "Deep Piling & Substructure Foundation Complete",
    description: "Casting of 120 friction piles and 2.5m thick raft slab foundation",
    dueDate: new Date("2026-04-30"),
    status: "Completed",
  },
  {
    projectId: projects[0]._id,
    title: "Floors 1-15 Concrete Frame Top-Out",
    description: "Cast-in-place columns, elevator cores, and PT slabs up to level 15",
    dueDate: new Date("2026-11-30"),
    status: "In Progress",
  },
  {
    projectId: projects[1]._id,
    title: "Cold Storage Warehouse Steel Frame Erection",
    description: "Main portal frames, cold room insulation panels, and overhead crane rails",
    dueDate: new Date("2026-06-15"),
    status: "In Progress",
  },
]);

// ============ Seed Initial Notifications ============
console.log("Seeding initial system notifications...");
await Notification.create([
  {
    userId: pmUser._id,
    title: "Material Request Pending Approval",
    message: "Requisition MR-2026-001 for 500 bags Portland Cement requires your review.",
    type: "MATERIAL_REQUEST",
    link: "/procurement/requests",
    isRead: false,
  },
  {
    userId: pmUser._id,
    title: "Concrete Pour Scheduled",
    message: "Level 12 Deck slab concrete pour (450m³) scheduled for Thursday 06:00 AM.",
    type: "TASK_ASSIGNED",
    link: "/calendar",
    isRead: false,
  },
  {
    userId: adminUser._id,
    title: "System Initialized Successfully",
    message: "All ERP models, Ethiopian hierarchy, roles, and project foundations are active.",
    type: "SYSTEM",
    link: "/administration/settings",
    isRead: true,
  },
]);

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
