import { connectToDatabase } from "@/lib/db/mongodb";
import { handleError, fail } from "@/lib/api";
import { requirePermission } from "@/lib/auth/guard";
import { Project } from "@/models/Project";
import { Material } from "@/models/Material";
import { Task } from "@/models/Task";
import { MaterialRequest } from "@/models/MaterialRequest";
import { PurchaseOrder } from "@/models/PurchaseOrder";
import { GoodsReceipt } from "@/models/GoodsReceipt";
import { formatCurrency } from "@/lib/formatters/currency";
import PDFDocument from "pdfkit";
import mongoose from "mongoose";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const guard = await requirePermission("REPORT_VIEW", request);
  if (guard.error) return guard.error;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "project-overview";
    const projectId = searchParams.get("projectId");
    const customTitle = searchParams.get("title");

    let reportTitle = customTitle || "Project Portfolio Overview Report";
    let filename = `apex-report-${type}-${Date.now()}.pdf`;

    const projectFilter: Record<string, unknown> = {};
    if (projectId && mongoose.Types.ObjectId.isValid(projectId)) {
      projectFilter._id = projectId;
    }

    let tableHeaders: string[] = [];
    let tableRows: string[][] = [];
    let summaryStats: Array<{ label: string; value: string }> = [];

    if (type === "project-overview" || type === "projects") {
      reportTitle = customTitle || "Project Portfolio Status & Execution Report";
      tableHeaders = ["Project Name", "Code", "Location", "Budget (ETB)", "Spent (ETB)", "Progress", "Status"];
      const projects = await Project.find(projectFilter).sort({ createdAt: -1 }).limit(100).lean();

      let totalBudget = 0;
      let totalSpent = 0;

      tableRows = projects.map((p) => {
        const b = Number(p.budget ?? p.totalBudget ?? 0);
        const s = Number(p.amountSpent ?? 0);
        totalBudget += b;
        totalSpent += s;
        return [
          p.name || "Untitled Project",
          p.projectCode || "APX",
          p.location || "Addis Ababa",
          formatCurrency(b, true),
          formatCurrency(s, true),
          `${p.progress ?? 0}%`,
          p.status || "ACTIVE",
        ];
      });

      summaryStats = [
        { label: "Total Projects", value: projects.length.toString() },
        { label: "Total Contract Budget", value: formatCurrency(totalBudget, true) },
        { label: "Total Site Expenditures", value: formatCurrency(totalSpent, true) },
        { label: "Uncommitted Remaining", value: formatCurrency(Math.max(0, totalBudget - totalSpent), true) },
      ];
    } else if (type === "budget-variance" || type === "financial") {
      reportTitle = "Budget Variance & Cost Ledger Report";
      tableHeaders = ["Project Name", "Allocated Capital", "Actual Expenses", "Committed POs", "Net Balance", "Variance"];
      const projects = await Project.find(projectFilter).sort({ createdAt: -1 }).limit(100).lean();

      let sumAllocated = 0;
      let sumSpent = 0;
      let sumCommitted = 0;

      tableRows = projects.map((p) => {
        const allocated = Number(p.budget ?? p.totalBudget ?? 0);
        const spent = Number(p.amountSpent ?? 0);
        const committed = Number(p.committedCost ?? 0);
        const remaining = Math.max(0, allocated - spent - committed);
        const variancePct = allocated > 0 ? Math.round(((spent + committed) / allocated) * 100) : 0;

        sumAllocated += allocated;
        sumSpent += spent;
        sumCommitted += committed;

        return [
          p.name || "Project",
          formatCurrency(allocated, true),
          formatCurrency(spent, true),
          formatCurrency(committed, true),
          formatCurrency(remaining, true),
          `${variancePct}%`,
        ];
      });

      summaryStats = [
        { label: "Total Allocated", value: formatCurrency(sumAllocated, true) },
        { label: "Actual Expenditures", value: formatCurrency(sumSpent, true) },
        { label: "Committed Purchase Orders", value: formatCurrency(sumCommitted, true) },
        { label: "Remaining Balance", value: formatCurrency(Math.max(0, sumAllocated - sumSpent - sumCommitted), true) },
      ];
    } else if (type === "materials-inventory" || type === "materials" || type === "inventory") {
      reportTitle = customTitle || "Materials Catalog & Stock Valuation Report";
      tableHeaders = ["SKU", "Material Name & Spec", "Category", "UOM", "Stock", "Unit Price", "Total Valuation", "Status"];
      const materials = await Material.find({}).sort({ name: 1 }).limit(100).lean();

      let totalVal = 0;
      let lowStockCount = 0;

      tableRows = materials.map((m) => {
        const val = m.currentStock * m.unitCost;
        totalVal += val;
        if (m.currentStock <= m.minimumStockLevel) lowStockCount++;

        return [
          m.sku,
          m.gradeOrSpec ? `${m.name} (${m.gradeOrSpec})` : m.name,
          m.category,
          m.unitOfMeasure,
          m.currentStock.toString(),
          formatCurrency(m.unitCost, true),
          formatCurrency(val, true),
          m.currentStock <= m.minimumStockLevel ? "REORDER" : "IN STOCK",
        ];
      });

      summaryStats = [
        { label: "Total Catalog Items", value: materials.length.toString() },
        { label: "Low Stock Items", value: lowStockCount.toString() },
        { label: "Total Inventory Valuation", value: formatCurrency(totalVal, true) },
      ];
    } else if (type === "procurement-orders" || type === "procurement") {
      reportTitle = "Procurement & Purchase Requisitions Status Report";
      tableHeaders = ["Requisition #", "Project", "Requested By", "Items", "Est. Value (ETB)", "Budget Check", "Status"];
      const requests = await MaterialRequest.find({})
        .sort({ createdAt: -1 })
        .limit(100)
        .populate("projectId", "name projectCode")
        .populate("requestedBy", "fullName")
        .lean();

      let totalValue = 0;

      tableRows = requests.map((r) => {
        totalValue += r.totalEstimatedCost || 0;
        const projName = typeof r.projectId === "object" && r.projectId ? (r.projectId as { name: string }).name : "Site";
        const reqName = typeof r.requestedBy === "object" && r.requestedBy ? (r.requestedBy as { fullName: string }).fullName : "Engineer";

        return [
          r.requestNumber,
          projName,
          reqName,
          `${r.items?.length || 0} items`,
          formatCurrency(r.totalEstimatedCost || 0, true),
          r.budgetStatus || "OK",
          r.status,
        ];
      });

      summaryStats = [
        { label: "Total Requisitions", value: requests.length.toString() },
        { label: "Total Value Requested", value: formatCurrency(totalValue, true) },
        { label: "Pending Review", value: requests.filter((r) => r.status === "SUBMITTED").length.toString() },
        { label: "Approved / Ordered", value: requests.filter((r) => r.status === "APPROVED" || r.status === "ORDERED").length.toString() },
      ];
    } else if (type === "delivery-tracking" || type === "deliveries" || type === "equipment") {
      reportTitle = customTitle || "Goods Receipts & Delivery Inspection Report";
      tableHeaders = ["GRN #", "Delivery Note", "PO Ref", "Supplier", "Site Depot", "Received Qty", "Value (ETB)", "Status"];
      const receipts = await GoodsReceipt.find({})
        .sort({ receiptDate: -1 })
        .limit(100)
        .populate("supplierId", "name")
        .populate("projectId", "name")
        .lean();

      let totalVal = 0;
      let totalQty = 0;

      tableRows = receipts.map((r) => {
        const supName = typeof r.supplierId === "object" && r.supplierId ? (r.supplierId as { name: string }).name : "Vendor";
        const projName = typeof r.projectId === "object" && r.projectId ? (r.projectId as { name: string }).name : "Site";
        const items = (r.items || []) as Array<Record<string, unknown>>;
        const qty = items.reduce((s: number, i: Record<string, unknown>) => s + (Number(i.receivedQuantity) || 0), 0);
        const val = items.reduce((s: number, i: Record<string, unknown>) => s + (Number(i.totalPrice) || 0), 0);
        totalVal += val;
        totalQty += qty;

        return [
          r.grnNumber,
          r.deliveryNoteNumber || "DN-REF",
          "PO-ISSUED",
          supName,
          projName,
          qty.toString(),
          formatCurrency(val, true),
          r.status,
        ];
      });

      summaryStats = [
        { label: "Total Deliveries Received", value: receipts.length.toString() },
        { label: "Total Units Verified", value: totalQty.toString() },
        { label: "Total Inbound Valuation", value: formatCurrency(totalVal, true) },
      ];
    } else {
      // tasks-workforce, workforce or generic
      reportTitle = customTitle || "Site Tasks Breakdown & Workforce Execution Report";
      tableHeaders = ["Task Title", "Project", "Priority", "Due Date", "Progress", "Status"];
      const tasks = await Task.find({}).sort({ createdAt: -1 }).limit(100).populate("projectId", "name").lean();

      tableRows = tasks.map((t) => {
        const projName = typeof t.projectId === "object" && t.projectId ? (t.projectId as { name: string }).name : "Site";
        return [
          t.title,
          projName,
          t.priority || "MEDIUM",
          t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "Flexible",
          `${t.progress || 0}%`,
          t.status || "NOT_STARTED",
        ];
      });

      summaryStats = [
        { label: "Total Tasks Logged", value: tasks.length.toString() },
        { label: "Completed Deliverables", value: tasks.filter((t) => t.status === "COMPLETED").length.toString() },
        { label: "In Progress", value: tasks.filter((t) => t.status === "IN_PROGRESS").length.toString() },
      ];
    }

    // Build PDF Binary
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: "A4",
        margin: 36,
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err: Error) => reject(err));

      const pageWidth = doc.page.width - 72; // 36 margin on left and right

      // Header Banner
      doc.rect(36, 36, pageWidth, 56).fill("#000000");
      doc.fillColor("#FFFFFF").fontSize(16).font("Helvetica-Bold").text("APEX DEVELOPMENTS", 50, 48);
      doc.fontSize(9).font("Helvetica").text("Enterprise Construction Project Management ERP — Official Intelligence Report", 50, 68);

      doc.moveDown(2);

      // Report Title & Metadata
      const topY = 108;
      doc.fillColor("#000000").fontSize(14).font("Helvetica-Bold").text(reportTitle, 36, topY);

      doc.fontSize(8).font("Helvetica").fillColor("#666666");
      const metaY = topY + 22;
      doc.text(`Generated: ${new Date().toUTCString()}`, 36, metaY);
      doc.text(`Issued By: ${guard.user.fullName} (${guard.user.role})`, 220, metaY);
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
      const colWidth = pageWidth / tableHeaders.length;
      const rowHeight = 22;

      // Table Header Row
      doc.rect(36, currentY, pageWidth, rowHeight).fill("#111111");
      tableHeaders.forEach((header, idx) => {
        doc.fillColor("#FFFFFF").fontSize(7).font("Helvetica-Bold").text(
          header.toUpperCase(),
          36 + idx * colWidth + 6,
          currentY + 6,
          { width: colWidth - 12, ellipsis: true }
        );
      });
      currentY += rowHeight;

      // Table Data Rows
      tableRows.forEach((row, rowIdx) => {
        // Page overflow check
        if (currentY + rowHeight > doc.page.height - 50) {
          doc.addPage();
          currentY = 40;
          // Re-render table header on new page
          doc.rect(36, currentY, pageWidth, rowHeight).fill("#111111");
          tableHeaders.forEach((header, idx) => {
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

      // Pagination & Confidentiality Footer
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

    return new Response(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
