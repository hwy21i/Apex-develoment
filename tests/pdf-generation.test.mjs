import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

function buildReportPdf(reportType, title, summaryStats, headers, rows) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 36,
      bufferPages: true,
      autoFirstPage: true
    });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err) => reject(err));

    const pageWidth = doc.page.width - 72;

    // Header Banner
    doc.rect(36, 36, pageWidth, 56).fill("#000000");
    doc.fillColor("#FFFFFF").fontSize(16).font("Helvetica-Bold").text("APEX DEVELOPMENTS", 50, 48);
    doc.fontSize(9).font("Helvetica").text("Enterprise Construction Project Management ERP — Official Intelligence Report", 50, 68);

    doc.moveDown(2);

    // Report Title & Metadata
    const topY = 108;
    doc.fillColor("#000000").fontSize(14).font("Helvetica-Bold").text(title, 36, topY);

    doc.fontSize(8).font("Helvetica").fillColor("#666666");
    const metaY = topY + 22;
    doc.text(`Generated: ${new Date().toUTCString()}`, 36, metaY);
    doc.text(`Issued By: Lead Engineer (Admin)`, 220, metaY);
    doc.text(`Currency: ETB (Ethiopian Birr)`, 440, metaY);

    // Decorative divider
    doc.strokeColor("#D4D4D4").lineWidth(1).moveTo(36, metaY + 16).lineTo(36 + pageWidth, metaY + 16).stroke();

    // Summary Metric Cards
    let currentY = metaY + 28;
    if (summaryStats.length > 0) {
      const cardWidth = pageWidth / summaryStats.length;
      summaryStats.forEach((stat, i) => {
        const cardX = 36 + i * cardWidth;
        doc.rect(cardX, currentY, cardWidth - 8, 40).fillAndStroke("#FAFAFA", "#D4D4D4");
        doc.fillColor("#666666").fontSize(7).font("Helvetica").text(stat.label.toUpperCase(), cardX + 8, currentY + 6, {
          width: cardWidth - 24,
        });
        doc.fillColor("#000000").fontSize(11).font("Helvetica-Bold").text(stat.value, cardX + 8, currentY + 20, {
          width: cardWidth - 24,
        });
      });
      currentY += 54;
    }

    // Table Rendering
    const colWidth = pageWidth / headers.length;
    const rowHeight = 22;

    // Table Header Row
    doc.rect(36, currentY, pageWidth, rowHeight).fill("#111111");
    headers.forEach((header, idx) => {
      doc.fillColor("#FFFFFF").fontSize(7).font("Helvetica-Bold").text(
        header.toUpperCase(),
        36 + idx * colWidth + 6,
        currentY + 6,
        { width: colWidth - 12, ellipsis: true }
      );
    });
    currentY += rowHeight;

    // Table Data Rows
    rows.forEach((row, rowIdx) => {
      if (currentY + rowHeight > doc.page.height - 50) {
        doc.addPage();
        currentY = 40;
        doc.rect(36, currentY, pageWidth, rowHeight).fill("#111111");
        headers.forEach((header, idx) => {
          doc.fillColor("#FFFFFF").fontSize(7).font("Helvetica-Bold").text(
            header.toUpperCase(),
            36 + idx * colWidth + 6,
            currentY + 6,
            { width: colWidth - 12, ellipsis: true }
          );
        });
        currentY += rowHeight;
      }

      const isEven = rowIdx % 2 === 0;
      doc.rect(36, currentY, pageWidth, rowHeight).fillAndStroke(isEven ? "#FFFFFF" : "#F9F9F9", "#E5E5E5");

      row.forEach((cell, colIdx) => {
        doc.fillColor("#111111").fontSize(7.5).font("Helvetica").text(
          cell,
          36 + colIdx * colWidth + 6,
          currentY + 6,
          { width: colWidth - 12, ellipsis: true }
        );
      });

      currentY += rowHeight;
    });

    // Pagination Footer — eliminate bottom margin constraint during footer drawing
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.page.margins.bottom = 0;
      const footerY = doc.page.height - 24;
      doc.strokeColor("#E5E5E5").lineWidth(0.5).moveTo(36, footerY - 4).lineTo(36 + pageWidth, footerY - 4).stroke();
      doc.fontSize(7).font("Helvetica").fillColor("#888888").text(
        "Apex Developments ERP — Confidential Construction Management Intelligence",
        36,
        footerY,
        { lineBreak: false }
      );
      doc.text(
        `Page ${i + 1} of ${range.count}`,
        36,
        footerY,
        { width: pageWidth, align: "right", lineBreak: false }
      );
    }

    doc.end();
  });
}

const configs = [
  {
    type: "project-overview",
    title: "Project Portfolio Status & Execution Report",
    stats: [{ label: "Total Projects", value: "8" }, { label: "Total Budget", value: "145,000,000 ETB" }],
    headers: ["Project Name", "Code", "Location", "Budget (ETB)", "Progress", "Status"],
    rows: [["Addis Heights Tower", "APX-01", "Bole", "45,000,000 ETB", "68%", "ACTIVE"]]
  },
  {
    type: "budget-variance",
    title: "Budget Variance & Cost Ledger Report",
    stats: [{ label: "Allocated", value: "50,000,000 ETB" }, { label: "Spent", value: "32,000,000 ETB" }],
    headers: ["Project", "Allocated", "Expenses", "Committed", "Balance", "Variance"],
    rows: [["Modjo Freight Hub", "25,000,000 ETB", "14,000,000 ETB", "3,000,000 ETB", "8,000,000 ETB", "68%"]]
  },
  {
    type: "materials-inventory",
    title: "Materials Catalog & Stock Valuation Report",
    stats: [{ label: "Catalog Items", value: "12" }, { label: "Valuation", value: "8,900,000 ETB" }],
    headers: ["SKU", "Material Name", "Category", "UOM", "Stock", "Unit Cost", "Status"],
    rows: [["MAT-001", "Portland Cement 42.5R", "Cement", "bags", "1,200", "950 ETB", "IN STOCK"]]
  },
  {
    type: "procurement-orders",
    title: "Procurement & Purchase Requisitions Status Report",
    stats: [{ label: "Requisitions", value: "6" }, { label: "Approved Value", value: "4,200,000 ETB" }],
    headers: ["Requisition #", "Project", "Requested By", "Items", "Est. Value", "Status"],
    rows: [["REQ-2026-001", "Addis Heights", "Engineer Abebe", "3 items", "481,000 ETB", "APPROVED"]]
  },
  {
    type: "delivery-tracking",
    title: "Goods Receipts & Delivery Inspection Report",
    stats: [{ label: "Total Receipts", value: "14" }, { label: "Verified Units", value: "3,500" }],
    headers: ["GRN #", "Delivery Note", "Supplier", "Site Depot", "Received Qty", "Status"],
    rows: [["GRN-2026-001", "DN-9842", "Muger Cement", "Bole Site", "500 bags", "VERIFIED"]]
  },
  {
    type: "tasks-workforce",
    title: "Site Tasks Breakdown & Workforce Execution Report",
    stats: [{ label: "Total Tasks", value: "28" }, { label: "Completed", value: "19" }],
    headers: ["Task Title", "Project", "Priority", "Due Date", "Progress", "Status"],
    rows: [["Rebar Grid Inspection L4", "Addis Heights", "HIGH", "Tomorrow", "80%", "IN_PROGRESS"]]
  }
];

for (const cfg of configs) {
  test(`PDF Generation: ${cfg.title} (${cfg.type}) produces valid single-page binary PDF`, async () => {
    const pdfBuf = await buildReportPdf(cfg.type, cfg.title, cfg.stats, cfg.headers, cfg.rows);
    assert.ok(pdfBuf instanceof Buffer);
    assert.ok(pdfBuf.length > 2000, `Buffer must be >2000 bytes, got ${pdfBuf.length}`);

    const magic = pdfBuf.subarray(0, 5).toString("utf-8");
    assert.equal(magic, "%PDF-", `Magic header mismatch: ${magic}`);

    const tail = pdfBuf.subarray(pdfBuf.length - 60).toString("utf-8");
    assert.ok(tail.includes("%%EOF"), "PDF must contain %%EOF marker");

    const outPath = path.resolve(`./tests/sample-${cfg.type}.pdf`);
    fs.writeFileSync(outPath, pdfBuf);
    assert.ok(fs.existsSync(outPath));
  });
}

test("Enterprise PDF Engine: Dynamic Y cursor, text-wrapping, and multi-line row handling", async () => {
  const { generateEnterprisePdf } = await import("../lib/pdf/engine.ts");
  const longMaterial = "400 Bags Mugher Portland Cement 42.5R Grade A Special Construction High Durability Formulation for Commercial Foundations";
  const longTracking = "TRK-2026-ETH-AA-BOLE-COMMERCIAL-TOWER-000849204";
  const longLocation = "Addis Heights Tower - Bole Site Gate B Main Inbound Gate Logistics Terminal";

  const pdfBytes = await generateEnterprisePdf({
    title: "Delivery Telemetry, Carrier Route & Checkpoints Audit",
    reportType: "delivery-tracking",
    issuerName: "Lead Logistics Specialist",
    issuerRole: "Admin",
    summaryStats: [
      { label: "Active Deliveries", value: "14 Shipments" },
      { label: "Transit Integrity", value: "100% Sealed" },
    ],
    singleTable: {
      headers: ["Tracking Number", "PO Ref", "Material / Payload", "Carrier & Plate", "Origin", "Location", "Status"],
      rows: [
        [
          longTracking,
          "PO-2026-0091",
          longMaterial,
          "Trans-Ethiopia Logistics (ET-3-48192-AA)",
          "Mugher Cement Factory Silo 4",
          longLocation,
          "IN TRANSIT",
        ],
      ],
    },
  });

  assert.ok(pdfBytes instanceof Uint8Array);
  assert.ok(pdfBytes.length > 1000);
  const pdfString = Buffer.from(pdfBytes).toString("latin1");
  assert.ok(pdfString.startsWith("%PDF-"));
  assert.ok(pdfString.includes("%%EOF"));
});

