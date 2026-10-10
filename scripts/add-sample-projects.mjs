import dns from "node:dns";
import mongoose from "mongoose";

try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch {}

const FALLBACK_DIRECT_URI =
  "mongodb://hawariyayohannes52_db_user:yohatli@ac-smcmcr5-shard-00-00.zm7lnui.mongodb.net:27017,ac-smcmcr5-shard-00-01.zm7lnui.mongodb.net:27017,ac-smcmcr5-shard-00-02.zm7lnui.mongodb.net:27017/construction_management?ssl=true&replicaSet=atlas-relbq0-shard-0&authSource=admin&appName=Cluster0";

const uri = process.env.MONGODB_URI || FALLBACK_DIRECT_URI;

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
} catch (e) {
  if (uri !== FALLBACK_DIRECT_URI) {
    console.warn("Primary URI failed. Retrying with direct replica set...");
    await mongoose.connect(FALLBACK_DIRECT_URI, { serverSelectionTimeoutMS: 15000 });
  } else {
    throw e;
  }
}

const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({ role: String, fullName: String }));
const Project = mongoose.models.Project || mongoose.model("Project", new mongoose.Schema({
  name: String, projectCode: String, client: String, location: String, description: String,
  projectManager: mongoose.Schema.Types.ObjectId, teamMembers: [mongoose.Schema.Types.ObjectId],
  startDate: Date, expectedEndDate: Date, contractValue: Number, totalBudget: Number,
  amountSpent: Number, committedCost: Number, remainingBudget: Number, progressPercentage: Number,
  status: String, createdBy: mongoose.Schema.Types.ObjectId,
}, { timestamps: true }));

const manager = await User.findOne({ role: { $in: ["Project Manager", "Admin"] } }).sort({ role: 1 });
if (!manager) throw new Error("Create an Admin or Project Manager user before adding sample projects.");

const samples = [
  { name: "Addis Heights Mixed-Use Tower", projectCode: "PRJ-ADD-001", client: "Bole Tower Investments Ltd", location: "Kazanchis, Addis Ababa", description: "32-story commercial and residential development.", startDate: new Date("2026-01-15"), expectedEndDate: new Date("2027-12-31"), contractValue: 52000000, totalBudget: 45000000, amountSpent: 16200000, committedCost: 5200000, remainingBudget: 28800000, progressPercentage: 36, status: "active" },
  { name: "Modjo Logistics & Cold Storage Hub", projectCode: "PRJ-LOG-002", client: "Rift Valley Logistics Corp", location: "Modjo Dry Port Corridor", description: "Multimodal distribution warehouse and cold-storage facility.", startDate: new Date("2025-10-01"), expectedEndDate: new Date("2026-11-15"), contractValue: 28000000, totalBudget: 22000000, amountSpent: 17800000, committedCost: 1800000, remainingBudget: 4200000, progressPercentage: 81, status: "active" },
  { name: "Greenfield Eco-Resort & Spa", projectCode: "PRJ-RES-003", client: "Lakeside Leisure Holdings", location: "Bishoftu Lake View", description: "Sustainable lakeside hospitality infrastructure development.", startDate: new Date("2026-09-01"), expectedEndDate: new Date("2028-03-30"), contractValue: 18500000, totalBudget: 15000000, amountSpent: 1200000, committedCost: 650000, remainingBudget: 13800000, progressPercentage: 8, status: "planning" },
];

for (const sample of samples) {
  await Project.updateOne(
    { projectCode: sample.projectCode },
    { $set: { ...sample, projectManager: manager._id, teamMembers: [manager._id] }, $setOnInsert: { createdBy: manager._id } },
    { upsert: true }
  );
}

console.log(`Added or updated ${samples.length} sample projects.`);
await mongoose.disconnect();
