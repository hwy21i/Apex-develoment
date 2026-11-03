import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import fs from "fs";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://hawariyayohannes52_db_user:yohatli200226@ac-smcmcr5-shard-00-00.zm7lnui.mongodb.net:27017,ac-smcmcr5-shard-00-01.zm7lnui.mongodb.net:27017,ac-smcmcr5-shard-00-02.zm7lnui.mongodb.net:27017/construction_management?ssl=true&replicaSet=atlas-relbq0-shard-0&authSource=admin";

console.log("Connecting to MongoDB Atlas...");
await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
console.log("Connected successfully to DB:", mongoose.connection.name);

// Check collections
const collections = await mongoose.connection.db.listCollections().toArray();
console.log("Available collections in Atlas:", collections.map(c => c.name));

// Check documents count
for (const c of ["projects", "budgets", "expenses", "purchaseorders", "goodsreceipts", "tasks", "deliverytrackings"]) {
  const count = await mongoose.connection.db.collection(c).countDocuments();
  console.log(`- ${c}: ${count} documents`);
}

await mongoose.disconnect();
console.log("Done database probe.");
