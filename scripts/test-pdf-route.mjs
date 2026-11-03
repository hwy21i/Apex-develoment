import mongoose from "mongoose";
import fs from "fs";
import { generateEnterprisePdf } from "../lib/pdf/engine.ts";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://hawariyayohannes52_db_user:yohatli200226@ac-smcmcr5-shard-00-00.zm7lnui.mongodb.net:27017,ac-smcmcr5-shard-00-01.zm7lnui.mongodb.net:27017,ac-smcmcr5-shard-00-02.zm7lnui.mongodb.net:27017/construction_management?ssl=true&replicaSet=atlas-relbq0-shard-0&authSource=admin";

console.log("Connecting to MongoDB Atlas...");
await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
console.log("Connected to MongoDB.");

const testCases = [
  {
    type: "master-executive",
    title: "Master Executive Intelligence Dossier",
    tables: [
      {
        title: "1. Projects Portfolio",
        headers: ["Project Name", "Location", "Budget (ETB)", "Status"],
        rows: [["Addis Heights Tower", "Bole, Addis Ababa", "45,000,000 ETB", "ACTIVE"]]
      },
      {
        title: "2. Empty Section Test",
        headers: ["Item", "Detail"],
        rows: [] // Testing empty state
      }
    ]
  },
  {
    type: "project-overview",
    title: "Project Portfolio Status & Execution Report",
    singleTable: {
      headers: ["Project Name", "Code", "Location", "Budget (ETB)", "Progress", "Status"],
      rows: [
        ["Addis Heights Tower", "APX-01", "Bole", "45,000,000 ETB", "74%", "ACTIVE"],
        ["Modjo Freight Hub", "APX-02", "Modjo", "22,000,000 ETB", "45%", "ACTIVE"]
      ]
    }
  },
  {
    type: "empty-report-test",
    title: "Empty Database Controls Report",
    singleTable: {
      headers: ["Column 1", "Column 2", "Column 3"],
      rows: []
    }
  }
];

for (const tc of testCases) {
  console.log(`\nGenerating PDF for ${tc.type}...`);
  const bytes = await generateEnterprisePdf({
    title: tc.title,
    reportType: tc.type,
    issuerName: "Hawariya Yohannes",
    issuerRole: "Super Admin",
    summaryStats: [
      { label: "Active Sites", value: "4 Projects" },
      { label: "Portfolio Value", value: "56.4M ETB" }
    ],
    tables: tc.tables,
    singleTable: tc.singleTable
  });

  console.log(`- Generated ${bytes.length} bytes.`);
  const magic = Buffer.from(bytes.subarray(0, 5)).toString("utf-8");
  console.log(`- Magic header: ${magic}`);
  if (magic !== "%PDF-") {
    throw new Error(`Invalid PDF header: ${magic}`);
  }

  const outPath = `./construction-progect-mangegment/tests/test-${tc.type}.pdf`;
  fs.writeFileSync(outPath, bytes);
  console.log(`- Saved verified file to ${outPath}`);
}

await mongoose.disconnect();
console.log("\nALL PDF TESTS PASSED SUCCESSFULLY!");
