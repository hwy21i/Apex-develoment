import { connectToDatabase } from "@/lib/db/mongodb";
import { handleError, fail } from "@/lib/api";
import { requireAuth } from "@/lib/auth/guard";
import { currentUser } from "@/lib/auth/session";
import { Project } from "@/models/Project";
import { Material } from "@/models/Material";
import { Task } from "@/models/Task";
import { PurchaseOrder } from "@/models/PurchaseOrder";
import { DeliveryTracking } from "@/models/DeliveryTracking";
import { Budget } from "@/models/Budget";
import { Expense } from "@/models/Expense";
import { AuditLog } from "@/models/AuditLog";
import "@/models/User";
import "@/models/Supplier";
import { formatCurrency } from "@/lib/formatters/currency";
import { generateEnterprisePdf, PDFSummaryStat, PDFTableConfig } from "@/lib/pdf/engine";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  // Resilient authentication verification supporting both session cookies and Bearer headers
  let user = null;
  const authGuard = await requireAuth(request);
  if (!authGuard.error && authGuard.user) {
    user = authGuard.user;
  } else {
    user = await currentUser(request);
  }

  if (!user) {
    return fail(
      "UNAUTHORIZED",
      "Authentication is required to generate and download PDF reports. Please sign in.",
      401
    );
  }

  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get("type") || "master-executive").toLowerCase();
    const projectId = searchParams.get("projectId");
    const customTitle = searchParams.get("title");

    const todayStr = new Date().toISOString().split("T")[0];
    const projectFilter: Record<string, unknown> = {};
    if (projectId && mongoose.Types.ObjectId.isValid(projectId)) {
      projectFilter._id = new mongoose.Types.ObjectId(projectId);
    }

    const isMaster =
      type === "master-executive" ||
      type === "master" ||
      type === "full" ||
      type === "dashboard";

    let pdfBytes: Uint8Array;
    let filename = `Apex_${type.replace(/[^a-zA-Z0-9_-]/g, "_")}_${todayStr}.pdf`;

    if (isMaster) {
      // ═══════════════════════════════════════════════════════════════════════
      // 1. MASTER EXECUTIVE INTELLIGENCE DOSSIER (ALL 6 CORE ERP PILLARS)
      // ═══════════════════════════════════════════════════════════════════════
      filename = `Apex_Master_Executive_Report_${todayStr}.pdf`;

      const projectRefFilter: Record<string, unknown> = {};
      if (projectId && mongoose.Types.ObjectId.isValid(projectId)) {
        projectRefFilter.projectId = new mongoose.Types.ObjectId(projectId);
      }

      const [
        projectsList,
        budgetsList,
        expensesList,
        purchaseOrdersList,
        deliveriesList,
        tasksList,
        auditLogsList,
      ] = await Promise.all([
        Project.find(projectFilter)
          .populate("projectManager", "fullName email")
          .sort({ createdAt: -1 })
          .limit(40)
          .lean(),
        Budget.find(projectRefFilter)
          .populate("projectId", "name projectCode")
          .populate("approvedBy", "fullName")
          .sort({ createdAt: -1 })
          .limit(30)
          .lean(),
        Expense.find(projectRefFilter)
          .populate("projectId", "name projectCode")
          .populate("approvedBy", "fullName")
          .sort({ date: -1, createdAt: -1 })
          .limit(30)
          .lean(),
        PurchaseOrder.find(projectRefFilter)
          .populate("projectId", "name projectCode")
          .populate("supplierId", "name")
          .populate("requestedBy", "fullName")
          .populate("approvedBy", "fullName")
          .sort({ createdAt: -1 })
          .limit(30)
          .lean(),
        DeliveryTracking.find(projectRefFilter)
          .populate("projectId", "name projectCode")
          .sort({ updatedAt: -1 })
          .limit(30)
          .lean(),
        Task.find(projectRefFilter)
          .populate("projectId", "name projectCode")
          .populate("assignedTo", "fullName role")
          .sort({ createdAt: -1 })
          .limit(40)
          .lean(),
        AuditLog.find({})
          .sort({ createdAt: -1 })
          .limit(25)
          .lean(),
      ]);

      // Portfolio Rollups
      let totalBudgetVal = 0;
      let totalSpentVal = 0;
      let totalCommittedVal = 0;
      projectsList.forEach((p) => {
        totalBudgetVal += Number(p.budget ?? p.totalBudget ?? 0);
        totalSpentVal += Number(p.amountSpent ?? 0);
        totalCommittedVal += Number(p.committedCost ?? 0);
      });

      const totalPOValue = purchaseOrdersList.reduce((s, po) => s + (Number(po.totalAmount) || 0), 0);
      const avgQualityScore =
        purchaseOrdersList.length > 0
          ? Math.round(
              purchaseOrdersList.reduce((s, po) => s + (Number(po.overallQualityScore) || 98), 0) /
                purchaseOrdersList.length
            )
          : 98;

      const summaryStats: PDFSummaryStat[] = [
        { label: "Monitored Projects", value: `${projectsList.length} Sites` },
        { label: "Portfolio Budget", value: formatCurrency(totalBudgetVal, true) },
        { label: "Actual Site Expenses", value: formatCurrency(totalSpentVal, true) },
        { label: "PO Quality Compliance", value: `${avgQualityScore}% Certified` },
      ];

      // Table 1: Projects Portfolio
      const projectTable: PDFTableConfig = {
        title: "1. Projects Portfolio & Site Execution Status",
        subtitle: `Total Sites: ${projectsList.length}`,
        headers: ["Project Name & Code", "Location", "Project Manager", "Progress", "Budget (ETB)", "Status"],
        colWidths: [140, 90, 100, 60, 80, 53.28],
        rows: projectsList.map((p) => {
          const pm =
            typeof p.projectManager === "object" && p.projectManager
              ? (p.projectManager as { fullName: string }).fullName
              : "Lead Engineer";
          return [
            `${p.name} (${p.projectCode || "APX"})`,
            p.location || "Addis Ababa",
            pm,
            `${p.progress ?? 0}%`,
            formatCurrency(Number(p.budget ?? p.totalBudget ?? 0), true),
            p.status || "ACTIVE",
          ];
        }),
      };

      // Table 2: CSI Budget & Expenses
      const budgetTable: PDFTableConfig = {
        title: "2. Cost Control, Budgets & Expenses (ETB)",
        subtitle: `Logged Budgets: ${budgetsList.length} | Expenses: ${expensesList.length}`,
        headers: ["Cost Code / Project", "CSI Category", "Allocated (ETB)", "Spent (ETB)", "Balance (ETB)", "Status"],
        colWidths: [130, 90, 85, 85, 80, 53.28],
        rows: budgetsList.map((b) => {
          const pName =
            typeof b.projectId === "object" && b.projectId
              ? (b.projectId as { name: string }).name
              : "Main Site";
          const allocated = Number(b.allocatedAmount ?? 0);
          const spent = Number(b.spentAmount ?? 0);
          const balance = Math.max(0, allocated - spent);
          return [
            `${b.costCode || "CSI-01"} - ${pName}`,
            b.category || "General",
            formatCurrency(allocated, true),
            formatCurrency(spent, true),
            formatCurrency(balance, true),
            b.status || "ACTIVE",
          ];
        }),
      };

      // Table 3: Purchasing & Procurement
      const poTable: PDFTableConfig = {
        title: "3. Procurement & Purchase Program (Quality & Quantity)",
        subtitle: `Total POs: ${purchaseOrdersList.length} | Val: ${formatCurrency(totalPOValue, true)}`,
        headers: ["PO #", "Project Site", "Purchase Type", "Ordered/Accepted", "Quality Grade", "Total (ETB)", "Status"],
        colWidths: [75, 100, 95, 80, 70, 60, 43.28],
        rows: purchaseOrdersList.map((po) => {
          const pName =
            typeof po.projectId === "object" && po.projectId
              ? (po.projectId as { name: string }).name
              : "Site";
          const items = (po.items || []) as Array<Record<string, unknown>>;
          const ordQty = items.reduce((s, i) => s + (Number(i.orderedQuantity) || 0), 0);
          const accQty = items.reduce((s, i) => s + (Number(i.acceptedQuantity) || 0), 0);
          const firstGrade = items[0]?.qualityGrade ? String(items[0].qualityGrade).replace("GRADE_", "") : "A";

          return [
            po.poNumber || "PO-2026",
            pName,
            String(po.purchaseType || "BULK_PO").replace(/_/g, " "),
            `${ordQty} / ${accQty}`,
            `Grade ${firstGrade}`,
            formatCurrency(Number(po.totalAmount || 0), true),
            String(po.status || "ISSUED"),
          ];
        }),
      };

      // Table 4: Delivery Tracking & Telemetry
      const deliveryTable: PDFTableConfig = {
        title: "4. Inbound Delivery Tracking & Telemetry (\"Where It Has Been\")",
        subtitle: `Tracked Shipments: ${deliveriesList.length}`,
        headers: ["Tracking # & PO", "Material Payload", "Carrier / Plate", "Origin Hub", "Current Checkpoint", "Status"],
        colWidths: [85, 115, 95, 80, 85, 63.28],
        rows: deliveriesList.map((d) => {
          const lastCp = d.checkpoints && d.checkpoints.length > 0 ? d.checkpoints[d.checkpoints.length - 1] : null;
          const cpLocation = lastCp ? lastCp.locationName : d.currentLocation || "In Transit";
          return [
            `${d.trackingNumber} (${d.poNumber})`,
            d.materialSummary || "Construction Materials",
            `${d.carrierName || "Direct"} - ${d.vehiclePlate || "ET-AA"}`,
            d.originLocation || "Mugher / Akaki",
            cpLocation,
            String(d.status || "DISPATCHED").replace(/_/g, " "),
          ];
        }),
      };

      // Table 5: Tasks & Workforce
      const taskTable: PDFTableConfig = {
        title: "5. Construction Tasks & Workforce Execution",
        subtitle: `Logged Tasks: ${tasksList.length}`,
        headers: ["Task Title", "Project Site", "Assigned Lead", "Due Date", "Progress", "Status"],
        colWidths: [140, 100, 100, 70, 55, 58.28],
        rows: tasksList.map((t) => {
          const pName =
            typeof t.projectId === "object" && t.projectId
              ? (t.projectId as { name: string }).name
              : "Site";
          const assignee =
            typeof t.assignedTo === "object" && t.assignedTo
              ? (t.assignedTo as { fullName: string }).fullName
              : "Site Engineer";
          const due = t.dueDate ? new Date(t.dueDate).toISOString().split("T")[0] : "Scheduled";

          return [
            t.title,
            pName,
            assignee,
            due,
            `${t.progress || 0}%`,
            String(t.status || "IN_PROGRESS").replace(/_/g, " "),
          ];
        }),
      };

      // Table 6: Security & Cryptographic Audit
      const auditTable: PDFTableConfig = {
        title: "6. Security & Audit Trail Logs",
        subtitle: `Recent Entries: ${auditLogsList.length}`,
        headers: ["Action", "Resource / Entity", "Performed By (Who)", "Timestamp", "IP / Hash"],
        colWidths: [110, 120, 110, 90, 93.28],
        rows: auditLogsList.map((a) => [
          String(a.action || "UPDATE"),
          String(a.entity || "System"),
          String(a.userName || "Admin"),
          a.createdAt ? new Date(a.createdAt).toISOString().replace("T", " ").substring(0, 16) : todayStr,
          String(a.ipAddress || "Internal"),
        ]),
      };

      pdfBytes = await generateEnterprisePdf({
        title: customTitle || "Master Executive Intelligence Dossier",
        reportType: "master-executive",
        issuerName: user.fullName || "Executive Administrator",
        issuerRole: user.role || "Admin",
        summaryStats,
        tables: [projectTable, budgetTable, poTable, deliveryTable, taskTable, auditTable],
      });
    } else {
      // ═══════════════════════════════════════════════════════════════════════
      // 2. SPECIALIZED SINGLE-PILLAR REPORTS
      // ═══════════════════════════════════════════════════════════════════════

      let reportTitle = customTitle || "Project Portfolio Overview Report";
      let tableHeaders: string[] = [];
      let tableRows: string[][] = [];
      let summaryStats: PDFSummaryStat[] = [];
      let colWidths: number[] | undefined;

      if (type === "project-overview" || type === "projects" || type === "completed-projects") {
        const isCompletedOnly = type === "completed-projects";
        reportTitle = customTitle || (isCompletedOnly ? "Completed & Historical Projects Dossier" : "Project Portfolio Status & Execution Report");
        filename = `Apex_${isCompletedOnly ? "Completed_Projects" : "Project_Portfolio"}_${todayStr}.pdf`;

        const filter = { ...projectFilter };
        if (isCompletedOnly) {
          filter.status = "COMPLETED";
        }

        const projects = await Project.find(filter)
          .populate("projectManager", "fullName")
          .sort({ createdAt: -1 })
          .limit(100)
          .lean();

        let totalBudget = 0;
        let totalSpent = 0;

        tableHeaders = ["Project Name", "Code", "Location", "Project Manager", "Budget (ETB)", "Spent (ETB)", "Progress", "Status"];
        colWidths = [120, 45, 75, 80, 70, 65, 40, 28.28];

        tableRows = projects.map((p) => {
          const b = Number(p.budget ?? p.totalBudget ?? 0);
          const s = Number(p.amountSpent ?? 0);
          totalBudget += b;
          totalSpent += s;
          const pm = typeof p.projectManager === "object" && p.projectManager ? (p.projectManager as { fullName: string }).fullName : "Lead Engineer";
          return [
            p.name || "Project",
            p.projectCode || "APX",
            p.location || "Addis Ababa",
            pm,
            formatCurrency(b, true),
            formatCurrency(s, true),
            `${p.progress ?? 0}%`,
            p.status || "ACTIVE",
          ];
        });

        summaryStats = [
          { label: "Monitored Sites", value: projects.length.toString() },
          { label: "Contract Budget", value: formatCurrency(totalBudget, true) },
          { label: "Site Expenses", value: formatCurrency(totalSpent, true) },
          { label: "Remaining Capital", value: formatCurrency(Math.max(0, totalBudget - totalSpent), true) },
        ];
      } else if (type === "budget-variance" || type === "financial" || type === "budgets" || type === "expenses") {
        reportTitle = customTitle || "Budget Variance, CSI Cost Codes & Expenditure Ledger";
        filename = `Apex_Financial_Budget_Report_${todayStr}.pdf`;

        tableHeaders = ["Project / Cost Code", "CSI Division", "Allocated (ETB)", "Actual Spent (ETB)", "Remaining (ETB)", "Variance"];
        colWidths = [140, 95, 85, 85, 75, 43.28];

        const [budgets, expenses] = await Promise.all([
          Budget.find(projectFilter.projectId ? { projectId: projectFilter.projectId } : {})
            .populate("projectId", "name projectCode")
            .sort({ createdAt: -1 })
            .limit(100)
            .lean(),
          Expense.find(projectFilter.projectId ? { projectId: projectFilter.projectId } : {})
            .sort({ date: -1 })
            .limit(100)
            .lean(),
        ]);

        let sumAllocated = 0;
        let sumSpent = 0;

        tableRows = budgets.map((b) => {
          const pName = typeof b.projectId === "object" && b.projectId ? (b.projectId as { name: string }).name : "Main Project";
          const allocated = Number(b.allocatedAmount ?? 0);
          const spent = Number(b.spentAmount ?? 0);
          const rem = Math.max(0, allocated - spent);
          const variancePct = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
          sumAllocated += allocated;
          sumSpent += spent;

          return [
            `${pName} (${b.costCode || "CSI-01"})`,
            b.category || "Civil Works",
            formatCurrency(allocated, true),
            formatCurrency(spent, true),
            formatCurrency(rem, true),
            `${variancePct}%`,
          ];
        });

        summaryStats = [
          { label: "Total Budgets Tracked", value: budgets.length.toString() },
          { label: "Total Allocated Capital", value: formatCurrency(sumAllocated, true) },
          { label: "Total Actual Spent", value: formatCurrency(sumSpent, true) },
          { label: "Net Unspent Balance", value: formatCurrency(Math.max(0, sumAllocated - sumSpent), true) },
        ];
      } else if (type === "materials-inventory" || type === "materials" || type === "inventory") {
        reportTitle = customTitle || "Materials Catalog, Stock Valuation & Movements Report";
        filename = `Apex_Materials_Inventory_Report_${todayStr}.pdf`;

        tableHeaders = ["SKU Code", "Material Name & Specification", "Category", "UOM", "Available Stock", "Unit Cost", "Total Value", "Status"];
        colWidths = [60, 130, 70, 45, 55, 55, 65, 43.28];

        const materials = await Material.find({}).sort({ name: 1 }).limit(100).lean();
        let totalVal = 0;
        let lowStockCount = 0;

        tableRows = materials.map((m) => {
          const val = Number(m.currentStock || 0) * Number(m.unitCost || 0);
          totalVal += val;
          if (Number(m.currentStock || 0) <= Number(m.minimumStockLevel || 0)) lowStockCount++;

          return [
            m.sku,
            m.gradeOrSpec ? `${m.name} (${m.gradeOrSpec})` : m.name,
            m.category,
            m.unitOfMeasure,
            Number(m.currentStock || 0).toString(),
            formatCurrency(m.unitCost, true),
            formatCurrency(val, true),
            Number(m.currentStock || 0) <= Number(m.minimumStockLevel || 0) ? "REORDER" : "IN STOCK",
          ];
        });

        summaryStats = [
          { label: "Catalog SKUs", value: materials.length.toString() },
          { label: "Low Stock Alerts", value: lowStockCount.toString() },
          { label: "Total Stock Valuation", value: formatCurrency(totalVal, true) },
        ];
      } else if (type === "procurement-orders" || type === "procurement" || type === "purchasing") {
        reportTitle = customTitle || "Procurement, Purchase Orders & Requisitions Dossier";
        filename = `Apex_Procurement_Orders_Report_${todayStr}.pdf`;

        tableHeaders = ["PO / Req #", "Project Site", "Purchase Type", "Supplier / Requester", "Ordered Qty", "Amount (ETB)", "Status"];
        colWidths = [85, 105, 95, 95, 50, 55, 38.28];

        const purchaseOrders = await PurchaseOrder.find({})
          .populate("projectId", "name")
          .populate("supplierId", "name")
          .sort({ createdAt: -1 })
          .limit(100)
          .lean();

        let totalAmount = 0;

        tableRows = purchaseOrders.map((po) => {
          const pName = typeof po.projectId === "object" && po.projectId ? (po.projectId as { name: string }).name : "Site";
          const supName = typeof po.supplierId === "object" && po.supplierId ? (po.supplierId as { name: string }).name : "Approved Supplier";
          const items = (po.items || []) as Array<Record<string, unknown>>;
          const ordQty = items.reduce((s, i) => s + (Number(i.orderedQuantity) || 0), 0);
          const amt = Number(po.totalAmount || 0);
          totalAmount += amt;

          return [
            po.poNumber || "PO-2026",
            pName,
            String(po.purchaseType || "BULK_PO").replace(/_/g, " "),
            supName,
            ordQty.toString(),
            formatCurrency(amt, true),
            String(po.status || "APPROVED"),
          ];
        });

        summaryStats = [
          { label: "Total POs Tracked", value: purchaseOrders.length.toString() },
          { label: "Total Order Valuation", value: formatCurrency(totalAmount, true) },
          { label: "Active Orders", value: purchaseOrders.filter((po) => po.status !== "CANCELLED").length.toString() },
        ];
      } else if (type === "delivery-tracking" || type === "deliveries") {
        reportTitle = customTitle || "Delivery Telemetry, Carrier Route & Checkpoints Audit";
        filename = `Apex_Delivery_Tracking_Report_${todayStr}.pdf`;

        tableHeaders = ["Tracking Number", "PO Ref", "Material / Payload", "Carrier & Plate", "Origin Checkpoint", "Current Location", "Status"];
        colWidths = [85, 55, 115, 85, 75, 75, 33.28];

        const deliveries = await DeliveryTracking.find({})
          .populate("projectId", "name")
          .sort({ updatedAt: -1 })
          .limit(100)
          .lean();

        tableRows = deliveries.map((d) => [
          d.trackingNumber,
          d.poNumber || "PO-DIRECT",
          d.materialSummary || "Construction Materials",
          `${d.carrierName || "Direct"} (${d.vehiclePlate || "ET-AA"})`,
          d.originLocation || "Supplier Terminal",
          d.currentLocation || "In Transit Checkpoint",
          String(d.status || "DISPATCHED").replace(/_/g, " "),
        ]);

        const inTransitCount = deliveries.filter((d) => d.status === "IN_TRANSIT_CHECKPOINT" || d.status === "DISPATCHED").length;
        const deliveredCount = deliveries.filter((d) => d.status === "ARRIVED_AT_SITE" || d.status === "INSPECTED_AND_STORED").length;

        summaryStats = [
          { label: "Total Shipments Tracked", value: deliveries.length.toString() },
          { label: "Active In-Transit", value: inTransitCount.toString() },
          { label: "Delivered & Verified", value: deliveredCount.toString() },
        ];
      } else {
        // workforce, tasks, or generic
        reportTitle = customTitle || "Workforce Deployment, Site Tasks & Execution Status";
        filename = `Apex_Tasks_Workforce_Report_${todayStr}.pdf`;

        tableHeaders = ["Task Title", "Project Site", "Assigned Lead", "Due Date", "Progress", "Status"];
        colWidths = [140, 105, 100, 70, 50, 58.28];

        const tasks = await Task.find({})
          .populate("projectId", "name")
          .populate("assignedTo", "fullName")
          .sort({ createdAt: -1 })
          .limit(100)
          .lean();

        tableRows = tasks.map((t) => {
          const pName = typeof t.projectId === "object" && t.projectId ? (t.projectId as { name: string }).name : "Site";
          const assignee = typeof t.assignedTo === "object" && t.assignedTo ? (t.assignedTo as { fullName: string }).fullName : "Site Team";
          const due = t.dueDate ? new Date(t.dueDate).toISOString().split("T")[0] : "Scheduled";

          return [
            t.title,
            pName,
            assignee,
            due,
            `${t.progress || 0}%`,
            String(t.status || "IN_PROGRESS").replace(/_/g, " "),
          ];
        });

        summaryStats = [
          { label: "Total Tasks Logged", value: tasks.length.toString() },
          { label: "Completed Deliverables", value: tasks.filter((t) => t.status === "COMPLETED").length.toString() },
          { label: "In Progress Execution", value: tasks.filter((t) => t.status === "IN_PROGRESS").length.toString() },
        ];
      }

      pdfBytes = await generateEnterprisePdf({
        title: reportTitle,
        reportType: type,
        issuerName: user.fullName || "Lead Engineer",
        issuerRole: user.role || "Admin",
        summaryStats,
        singleTable: {
          headers: tableHeaders,
          rows: tableRows,
        },
      });
    }

    return new Response(pdfBytes as unknown as BodyInit, {
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
