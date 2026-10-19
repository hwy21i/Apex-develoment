import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const rawUri = process.env.MONGODB_URI;
if (!rawUri || !rawUri.trim()) {
  console.error("ERROR: MONGODB_URI environment variable is required. Run with: node --env-file=.env.local scripts/ensure-hawariya.mjs");
  process.exit(1);
}

const uri = rawUri.trim();

function sanitizeMongoUrl(text) {
  return text.replace(/(mongodb(?:\+srv)?:\/\/)[^:]+:[^@]+@/gi, "$1<credentials-hidden>@");
}

console.log("[Seed Script] Connecting to database:", sanitizeMongoUrl(uri));

try {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 12000,
    connectTimeoutMS: 12000,
  });
  console.log("[Seed Script] Database connected successfully.");
} catch (e) {
  console.error("[Seed Script] Database connection failed:", sanitizeMongoUrl(e.message));
  process.exit(1);
}

const UserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true },
    department: String,
    position: String,
    phone: String,
    isActive: { type: Boolean, default: true },
    lastLogin: Date,
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

try {
  const existing = await User.findOne({ username: "hawariya21" });
  if (existing) {
    console.log(`[Seed Script] Admin user 'hawariya21' already exists (ID: ${existing._id}).`);
    console.log("[Seed Script] Existing password preserved. No changes made.");
    process.exit(0);
  }

  const initialPassword = process.env.INITIAL_ADMIN_PASSWORD || "yohatli2023";
  const initialEmail = (process.env.INITIAL_ADMIN_EMAIL || "hawariya@apexdev.et").toLowerCase().trim();
  const passwordHash = await bcrypt.hash(initialPassword, 12);

  const admin = await User.create({
    fullName: "Hawariya Yohannes (Super Admin)",
    username: "hawariya21",
    email: initialEmail,
    passwordHash,
    role: "Admin",
    department: "Executive Management",
    position: "System Administrator",
    phone: "+251 91 100 0000",
    isActive: true,
  });

  console.log(`[Seed Script] Super Admin account 'hawariya21' created successfully (ID: ${admin._id}).`);
  process.exit(0);
} catch (err) {
  console.error("[Seed Script] Failed to provision admin account:", err.message);
  process.exit(1);
}

