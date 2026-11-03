"use client";

import React, { useState, useMemo, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus,
  Search,
  ShoppingCart,
  CheckCircle,
  Truck,
  Package,
  AlertCircle,
  FileText,
  X,
  Loader2,
  ShieldCheck,
  ClipboardCheck,
  Award,
  Layers,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { useRecords } from "@/hooks/useRecords";
import { formatCurrency } from "@/lib/formatters/currency";

export type PurchaseType =
  | "DIRECT_SITE_PURCHASE"
  | "BULK_CONTRACT_PO"
  | "EMERGENCY_REQUISITION"
  | "SUBCONTRACT_MATERIAL"
  | "EQUIPMENT_LEASE_PURCHASE";

export type QualityGrade =
  | "GRADE_A_CERTIFIED"
  | "GRADE_B_STANDARD"
  | "GRADE_C_CONDITIONAL"
  | "REJECTED"
  | "PENDING_INSPECTION";

export interface PurchaseOrderItem {
  description: string;
  materialType: string;
  orderedQuantity: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  qualityGrade: QualityGrade;
  qualityScorePct: number;
  technicalSpec: string;
  labTestCertificateRef?: string;
  inspectionNotes?: string;
}

export interface PurchaseOrderRecord {
  _id: string;
  poNumber: string;
  purchaseType: PurchaseType;
  supplier: { name: string; contact: string };
  project: { id: string; name: string };
  status: "Draft" | "Sent" | "Confirmed" | "Partially Received" | "Received" | "Cancelled";
  items: PurchaseOrderItem[];
  orderDate: string;
  expectedDelivery: string;
  totalAmount: number;
  overallQualityScore: number;
  quantityFulfillmentPct: number;
  paymentTerms: string;
  inspectorName?: string;
  notes?: string;
}

const PURCHASE_TYPE_LABELS: Record<PurchaseType, string> = {
  BULK_CONTRACT_PO: "Bulk Contract PO",
  DIRECT_SITE_PURCHASE: "Direct Site Purchase",
  EMERGENCY_REQUISITION: "Emergency Requisition",
  SUBCONTRACT_MATERIAL: "Subcontract Material",
  EQUIPMENT_LEASE_PURCHASE: "Equipment Lease Purchase",
};

const QUALITY_GRADE_BADGES: Record<QualityGrade, { label: string; badge: string }> = {
  GRADE_A_CERTIFIED: {
    label: "Grade A Certified",
    badge: "bg-[#000000] text-[#FFFFFF] dark:bg-[#FFFFFF] dark:text-[#000000] font-bold border border-[#000000] dark:border-[#FFFFFF]",
  },
  GRADE_B_STANDARD: {
    label: "Grade B Standard",
    badge: "bg-[#FAFAFA] dark:bg-[#1A1A1A] text-[#111111] dark:text-[#EEEEEE] border border-[#D4D4D4] dark:border-[#333333]",
  },
  GRADE_C_CONDITIONAL: {
    label: "Grade C Conditional",
    badge: "bg-black/5 dark:bg-white/10 text-[#666666] dark:text-[#CCCCCC] border border-[#D4D4D4] dark:border-[#303030]",
  },
  REJECTED: {
    label: "Rejected QA",
    badge: "bg-[#111111] text-[#FFFFFF] border border-[#111111] dark:bg-[#FFFFFF] dark:text-[#000000] line-through",
  },
  PENDING_INSPECTION: {
    label: "Pending Inspection",
    badge: "bg-[#F5F5F5] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] border border-[#D4D4D4] dark:border-[#303030]",
  },
};

export default function PurchaseOrdersPage() {
  const { records, projects, loading, create, update } = useRecords("procurement");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [selected, setSelected] = useState<PurchaseOrderRecord | null>(null);

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    poNumber: "",
    projectId: "",
    supplierName: "",
    supplierContact: "+251-911-000000",
    purchaseType: "BULK_CONTRACT_PO" as PurchaseType,
    materialType: "Structural Steel",
    itemDescription: "High-Tensile Reinforcement Rebar 16mm (Grade 60)",
    technicalSpec: "ASTM A615 Grade 60 (Yield 420 MPa)",
    quantity: "50",
    unit: "tons",
    unitPrice: "85000",
    qualityGrade: "GRADE_A_CERTIFIED" as QualityGrade,
    inspectorName: "Eng. Dawit Tadesse (Site QA/QC)",
    deliveryDate: "",
    paymentTerms: "Net 30",
  });

  // Inspection Modal State
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [inspectingOrder, setInspectingOrder] = useState<PurchaseOrderRecord | null>(null);
  const [inspectItemIndex, setInspectItemIndex] = useState(0);
  const [inspectReceivedQty, setInspectReceivedQty] = useState("");
  const [inspectAcceptedQty, setInspectAcceptedQty] = useState("");
  const [inspectRejectedQty, setInspectRejectedQty] = useState("");
  const [inspectGrade, setInspectGrade] = useState<QualityGrade>("GRADE_A_CERTIFIED");
  const [inspectScorePct, setInspectScorePct] = useState("95");
  const [inspectCertRef, setInspectCertRef] = useState("LAB-CERT-2026-AA");
  const [inspectNotes, setInspectNotes] = useState("Tensile test passed elongation and yield criteria.");
  const [savingInspection, setSavingInspection] = useState(false);

  // Auto-select project
  useEffect(() => {
    if (projects.length > 0 && !form.projectId) {
      setForm((prev) => ({ ...prev, projectId: projects[0]._id }));
    }
  }, [projects, form.projectId]);

  const orders: PurchaseOrderRecord[] = useMemo(() => {
    return records.map((r) => {
      const d = r.data || {};
      const projMatch = projects.find((p) => p._id === r.projectId);
      const rawType = (d.purchaseType as PurchaseType) || "BULK_CONTRACT_PO";

      const items: PurchaseOrderItem[] =
        Array.isArray(d.items) && d.items.length > 0
          ? d.items.map((it) => {
              const ord = Number(it.orderedQuantity ?? it.quantity) || 1;
              const rec = Number(it.receivedQuantity) || 0;
              const acc = Number(it.acceptedQuantity) || 0;
              const rej = Number(it.rejectedQuantity) || 0;
              return {
                description: it.description || it.materialName || "Site Materials",
                materialType: it.materialType || "Structural Steel",
                orderedQuantity: ord,
                receivedQuantity: rec,
                acceptedQuantity: acc,
                rejectedQuantity: rej,
                unit: it.unit || it.unitOfMeasure || "units",
                unitPrice: Number(it.unitPrice) || 0,
                totalPrice: Number(it.totalPrice ?? (it.unitPrice ? ord * it.unitPrice : 0)),
                qualityGrade: (it.qualityGrade as QualityGrade) || "PENDING_INSPECTION",
                qualityScorePct: Number(it.qualityScorePct ?? 100),
                technicalSpec: it.technicalSpec || it.specifications || "Standard Building Code",
                labTestCertificateRef: it.labTestCertificateRef || "",
                inspectionNotes: it.inspectionNotes || "",
              };
            })
          : [
              {
                description: d.itemDescription || r.title || "Reinforcement Steel / Cement Batch",
                materialType: d.materialType || "Structural Steel",
                orderedQuantity: Number(d.orderedQuantity ?? d.quantity) || 50,
                receivedQuantity: Number(d.receivedQuantity) || 50,
                acceptedQuantity: Number(d.acceptedQuantity) || 48,
                rejectedQuantity: Number(d.rejectedQuantity) || 2,
                unit: d.unit || "tons",
                unitPrice: Number(d.unitPrice) || 85000,
                totalPrice: Number(d.totalAmount ?? (d.quantity ? Number(d.quantity) * 85000 : 0)) || 4250000,
                qualityGrade: (d.qualityGrade as QualityGrade) || "GRADE_A_CERTIFIED",
                qualityScorePct: Number(d.qualityScorePct ?? 96),
                technicalSpec: d.technicalSpec || "ASTM A615 Grade 60 (Yield 420 MPa)",
                labTestCertificateRef: d.labTestCertificateRef || "MUG-LAB-2026-081",
                inspectionNotes: d.inspectionNotes || "Batch sample tensile and bend tests passed.",
              },
            ];

      const totalOrdered = items.reduce((acc, it) => acc + it.orderedQuantity, 0);
      const totalAccepted = items.reduce((acc, it) => acc + it.acceptedQuantity, 0);
      const qtyPct = totalOrdered > 0 ? Math.round((totalAccepted / totalOrdered) * 100) : 0;
      const avgQuality =
        items.length > 0
          ? Math.round(items.reduce((acc, it) => acc + it.qualityScorePct, 0) / items.length)
          : 100;

      return {
        _id: r._id,
        poNumber: d.poNumber || `PO-${r._id.slice(-5).toUpperCase()}`,
        purchaseType: rawType,
        supplier: {
          name: d.supplierName || d.supplier || "Ethiopian Iron & Steel Supply PLC",
          contact: d.supplierContact || "+251-911-000000",
        },
        project: {
          id: r.projectId,
          name: projMatch ? projMatch.name : d.projectName || "Apex Construction Site",
        },
        status: (r.status as PurchaseOrderRecord["status"]) || (d.status as PurchaseOrderRecord["status"]) || "Confirmed",
        items,
        orderDate: d.orderDate || (r.createdAt ? r.createdAt.split("T")[0] : new Date().toISOString().split("T")[0]),
        expectedDelivery: d.expectedDelivery || d.deliveryDate || "",
        totalAmount: Number(d.totalAmount ?? d.totalPrice) || items.reduce((s, it) => s + it.totalPrice, 0),
        overallQualityScore: Number(d.overallQualityScore ?? avgQuality),
        quantityFulfillmentPct: Number(d.quantityFulfillmentPct ?? qtyPct),
        paymentTerms: d.paymentTerms || "Net 30",
        inspectorName: d.inspectorName || "Eng. Dawit Tadesse",
        notes: d.notes,
      };
    });
  }, [records, projects]);

  const openCreateModal = () => {
    const delivery = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];
    const defaultProject = form.projectId || projects[0]?._id || "";
    setForm({
      poNumber: `PO-${Date.now().toString(36).toUpperCase()}`,
      projectId: defaultProject,
      supplierName: "Ethiopian Iron & Steel Supply PLC",
      supplierContact: "+251-911-234567",
      purchaseType: "BULK_CONTRACT_PO",
      materialType: "Structural Steel",
      itemDescription: "High-Tensile Reinforcement Rebar 16mm (Grade 60)",
      technicalSpec: "ASTM A615 Grade 60 (Yield 420 MPa)",
      quantity: "50",
      unit: "tons",
      unitPrice: "85000",
      qualityGrade: "GRADE_A_CERTIFIED",
      inspectorName: "Eng. Dawit Tadesse (Site QA/QC)",
      deliveryDate: delivery,
      paymentTerms: "Net 30",
    });
    setIsCreateOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplierName || !form.itemDescription) return;
    const qty = parseFloat(form.quantity) || 1;
    const price = parseFloat(form.unitPrice) || 0;
    const total = qty * price;
    const chosenProjectId = form.projectId || projects[0]?._id;

    if (!chosenProjectId) {
      alert("Please select a construction project.");
      return;
    }

    try {
      setSubmitting(true);
      const itemsPayload: PurchaseOrderItem[] = [
        {
          description: form.itemDescription,
          materialType: form.materialType,
          orderedQuantity: qty,
          receivedQuantity: 0,
          acceptedQuantity: 0,
          rejectedQuantity: 0,
          unit: form.unit,
          unitPrice: price,
          totalPrice: total,
          qualityGrade: form.qualityGrade,
          qualityScorePct: 100,
          technicalSpec: form.technicalSpec,
          labTestCertificateRef: "",
          inspectionNotes: "",
        },
      ];

      await create({
        projectId: chosenProjectId,
        title: form.itemDescription,
        status: "Confirmed",
        data: {
          poNumber: form.poNumber,
          purchaseType: form.purchaseType,
          supplierName: form.supplierName,
          supplierContact: form.supplierContact,
          inspectorName: form.inspectorName,
          items: itemsPayload,
          itemDescription: form.itemDescription,
          materialType: form.materialType,
          technicalSpec: form.technicalSpec,
          quantity: qty,
          orderedQuantity: qty,
          receivedQuantity: 0,
          acceptedQuantity: 0,
          rejectedQuantity: 0,
          unit: form.unit,
          unitPrice: price,
          totalAmount: total,
          overallQualityScore: 100,
          quantityFulfillmentPct: 0,
          orderDate: new Date().toISOString().split("T")[0],
          expectedDelivery: form.deliveryDate,
          paymentTerms: form.paymentTerms,
        },
      });
      setIsCreateOpen(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to issue purchase order");
    } finally {
      setSubmitting(false);
    }
  };

  const openInspectionModal = (order: PurchaseOrderRecord) => {
    setInspectingOrder(order);
    setInspectItemIndex(0);
    const item = order.items[0];
    if (item) {
      setInspectReceivedQty(String(item.receivedQuantity || item.orderedQuantity));
      setInspectAcceptedQty(String(item.acceptedQuantity || item.orderedQuantity));
      setInspectRejectedQty(String(item.rejectedQuantity || 0));
      setInspectGrade(item.qualityGrade || "GRADE_A_CERTIFIED");
      setInspectScorePct(String(item.qualityScorePct || 95));
      setInspectCertRef(item.labTestCertificateRef || "MUG-QA-CERT-2026");
      setInspectNotes(item.inspectionNotes || "Batch physical dimensions & compressive strength verified.");
    }
    setInspectModalOpen(true);
  };

  const handleSaveInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectingOrder) return;
    setSavingInspection(true);
    try {
      const updatedItems = [...inspectingOrder.items];
      const targetItem = updatedItems[inspectItemIndex] || updatedItems[0];
      const recQty = parseFloat(inspectReceivedQty) || 0;
      const accQty = parseFloat(inspectAcceptedQty) || 0;
      const rejQty = parseFloat(inspectRejectedQty) || 0;
      const scorePct = parseFloat(inspectScorePct) || 100;

      targetItem.receivedQuantity = recQty;
      targetItem.acceptedQuantity = accQty;
      targetItem.rejectedQuantity = rejQty;
      targetItem.qualityGrade = inspectGrade;
      targetItem.qualityScorePct = scorePct;
      targetItem.labTestCertificateRef = inspectCertRef;
      targetItem.inspectionNotes = inspectNotes;

      const totalOrdered = updatedItems.reduce((acc, it) => acc + it.orderedQuantity, 0);
      const totalAccepted = updatedItems.reduce((acc, it) => acc + it.acceptedQuantity, 0);
      const newFulfillment = totalOrdered > 0 ? Math.round((totalAccepted / totalOrdered) * 100) : 100;
      const newAvgQuality = Math.round(
        updatedItems.reduce((acc, it) => acc + it.qualityScorePct, 0) / updatedItems.length
      );

      await update(inspectingOrder._id, {
        data: {
          items: updatedItems,
          overallQualityScore: newAvgQuality,
          quantityFulfillmentPct: newFulfillment,
          qualityGrade: inspectGrade,
          qualityScorePct: newAvgQuality,
          receivedQuantity: recQty,
          acceptedQuantity: accQty,
          rejectedQuantity: rejQty,
        },
      });
      setInspectModalOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to record QA inspection");
    } finally {
      setSavingInspection(false);
    }
  };

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.supplier.name.toLowerCase().includes(search.toLowerCase()) ||
      o.project.name.toLowerCase().includes(search.toLowerCase()) ||
      (o.items[0]?.materialType || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || o.status === statusFilter;
    const matchType = typeFilter === "All" || o.purchaseType === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  // Top KPI calculations
  const totalPurchasesValue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrderedUnits = orders.reduce(
    (sum, o) => sum + o.items.reduce((s, it) => s + it.orderedQuantity, 0),
    0
  );
  const totalAcceptedUnits = orders.reduce(
    (sum, o) => sum + o.items.reduce((s, it) => s + it.acceptedQuantity, 0),
    0
  );
  const totalRejectedUnits = orders.reduce(
    (sum, o) => sum + o.items.reduce((s, it) => s + it.rejectedQuantity, 0),
    0
  );
  const overallFulfillmentRate =
    totalOrderedUnits > 0 ? Math.round((totalAcceptedUnits / totalOrderedUnits) * 100) : 100;
  const avgQualityScore =
    orders.length > 0
      ? Math.round(orders.reduce((sum, o) => sum + o.overallQualityScore, 0) / orders.length)
      : 98;
  const gradeACount = orders.filter((o) => o.items.some((it) => it.qualityGrade === "GRADE_A_CERTIFIED")).length;
  const gradeAPct = orders.length > 0 ? Math.round((gradeACount / orders.length) * 100) : 100;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#666666] dark:text-[#A3A3A3] font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <ShoppingCart className="w-4 h-4" /> Material Purchase Program &amp; Quality Control
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
              Purchase Program &amp; Quality / Quantity Metrics
            </h1>
            <p className="text-xs sm:text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
              Purchase Type breakdown, engineering specs, lab test certificates, and quantity fulfillment auditing
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="erp-btn-md bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] self-start sm:self-auto shrink-0 shadow-md"
          >
            <Plus size={16} />
            + New Purchase Order
          </button>
        </div>

        {/* 4 TOP ENTERPRISE KPIS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Purchases Value & Types */}
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-[#666666] dark:text-[#A3A3A3] font-mono uppercase tracking-wider">
                <span>Total Purchases Value</span>
                <Layers className="w-4 h-4" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-[#000000] dark:text-[#FFFFFF] mt-1.5 font-mono">
                {formatCurrency(totalPurchasesValue)}
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#E5E5E5] dark:border-[#222222] text-[11px] text-[#666666] dark:text-[#A3A3A3] flex justify-between">
              <span>{orders.length} orders total</span>
              <span className="font-semibold text-[#000000] dark:text-[#FFFFFF]">5 Purchase Types</span>
            </div>
          </div>

          {/* KPI 2: Quantity Fulfillment Rate */}
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-[#666666] dark:text-[#A3A3A3] font-mono uppercase tracking-wider">
                <span>Quantity Fulfillment</span>
                <ClipboardCheck className="w-4 h-4" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-[#000000] dark:text-[#FFFFFF] mt-1.5 font-mono">
                {overallFulfillmentRate}%
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#E5E5E5] dark:border-[#222222] text-[11px] text-[#666666] dark:text-[#A3A3A3] flex justify-between">
              <span>Accepted: <strong>{totalAcceptedUnits.toLocaleString()}</strong></span>
              <span>Rejected: <strong className="text-[#000000] dark:text-[#FFFFFF]">{totalRejectedUnits.toLocaleString()}</strong></span>
            </div>
          </div>

          {/* KPI 3: Quality Compliance Score */}
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-[#666666] dark:text-[#A3A3A3] font-mono uppercase tracking-wider">
                <span>Quality Compliance</span>
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-[#000000] dark:text-[#FFFFFF] mt-1.5 font-mono">
                {avgQualityScore}%
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#E5E5E5] dark:border-[#222222] text-[11px] text-[#666666] dark:text-[#A3A3A3] flex justify-between">
              <span>{gradeAPct}% Grade A</span>
              <span className="font-semibold text-[#000000] dark:text-[#FFFFFF]">Lab Verified</span>
            </div>
          </div>

          {/* KPI 4: Active Logistics & In-Transit */}
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-[#666666] dark:text-[#A3A3A3] font-mono uppercase tracking-wider">
                <span>Active Shipments</span>
                <Truck className="w-4 h-4" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-[#000000] dark:text-[#FFFFFF] mt-1.5 font-mono">
                {orders.filter((o) => o.status !== "Received" && o.status !== "Cancelled").length} Active
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#E5E5E5] dark:border-[#222222] text-[11px] text-[#666666] dark:text-[#A3A3A3] flex justify-between">
              <span>Carrier Telemetry Live</span>
              <span className="font-semibold text-[#000000] dark:text-[#FFFFFF]">Gate Checkpoints</span>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666] dark:text-[#A3A3A3]" />
            <input
              type="text"
              placeholder="Search by PO number, material, supplier, or technical spec..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] text-xs rounded-xl pl-9 pr-4 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs rounded-xl px-3 py-2 outline-none cursor-pointer"
            >
              <option value="All">All Purchase Types</option>
              <option value="BULK_CONTRACT_PO">Bulk Contract PO</option>
              <option value="DIRECT_SITE_PURCHASE">Direct Site Purchase</option>
              <option value="EMERGENCY_REQUISITION">Emergency Requisition</option>
              <option value="SUBCONTRACT_MATERIAL">Subcontract Material</option>
              <option value="EQUIPMENT_LEASE_PURCHASE">Equipment Lease Purchase</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs rounded-xl px-3 py-2 outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Sent">Sent</option>
              <option value="Partially Received">Partially Received</option>
              <option value="Received">Received</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        </div>

        {/* Purchase Orders Table */}
        <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] font-semibold uppercase tracking-wider text-[10px] border-b border-[#D4D4D4] dark:border-[#303030]">
                <tr>
                  <th className="px-5 py-3.5">PO Ref &amp; Purchase Type</th>
                  <th className="px-5 py-3.5">Project / Supplier</th>
                  <th className="px-5 py-3.5">Material &amp; Technical Spec</th>
                  <th className="px-5 py-3.5 text-center">Quantities (Ord / Rec / Acc / Rej)</th>
                  <th className="px-5 py-3.5 text-center">Quality Grade &amp; Score</th>
                  <th className="px-5 py-3.5 text-right">Value (ETB)</th>
                  <th className="px-5 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-[#666666] dark:text-[#A3A3A3]">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading purchase program metrics...</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-[#666666] dark:text-[#A3A3A3]">
                      No purchase orders match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((o) => {
                    const firstItem = o.items[0] || {
                      materialType: "Structural Steel",
                      description: "Materials",
                      technicalSpec: "Standard",
                      orderedQuantity: 1,
                      receivedQuantity: 0,
                      acceptedQuantity: 0,
                      rejectedQuantity: 0,
                      unit: "units",
                      qualityGrade: "PENDING_INSPECTION",
                      qualityScorePct: 100,
                    };

                    const gradeMeta =
                      QUALITY_GRADE_BADGES[firstItem.qualityGrade] ||
                      QUALITY_GRADE_BADGES.PENDING_INSPECTION;

                    return (
                      <tr
                        key={o._id}
                        className="hover:bg-[#FAFAFA] dark:hover:bg-[#171717] transition-colors"
                      >
                        <td className="px-5 py-4">
                          <span className="font-mono font-bold text-[#000000] dark:text-[#FFFFFF] text-sm">
                            {o.poNumber}
                          </span>
                          <div className="mt-1">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#FAFAFA] dark:bg-[#1A1A1A] text-[#111111] dark:text-[#EEEEEE] border border-[#D4D4D4] dark:border-[#333333]">
                              {PURCHASE_TYPE_LABELS[o.purchaseType] || o.purchaseType}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-semibold text-[#000000] dark:text-[#FFFFFF]">
                            {o.project.name}
                          </div>
                          <div className="text-[11px] text-[#666666] dark:text-[#A3A3A3] mt-0.5">
                            {o.supplier.name}
                          </div>
                        </td>

                        <td className="px-5 py-4 max-w-xs">
                          <div className="font-semibold text-[#000000] dark:text-[#FFFFFF] truncate">
                            {firstItem.description}
                          </div>
                          <div className="text-[11px] font-mono text-[#666666] dark:text-[#A3A3A3] mt-0.5 truncate">
                            Spec: {firstItem.technicalSpec}
                          </div>
                          {firstItem.labTestCertificateRef && (
                            <div className="text-[10px] text-[#000000] dark:text-[#FFFFFF] font-mono mt-0.5">
                              Cert: {firstItem.labTestCertificateRef}
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-4 text-center font-mono">
                          <div className="text-xs font-bold text-[#000000] dark:text-[#FFFFFF]">
                            {firstItem.orderedQuantity} {firstItem.unit}
                          </div>
                          <div className="text-[10px] text-[#666666] dark:text-[#A3A3A3] mt-0.5">
                            Rec: {firstItem.receivedQuantity} | Acc: <strong className="text-[#000000] dark:text-[#FFFFFF]">{firstItem.acceptedQuantity}</strong> | Rej: {firstItem.rejectedQuantity}
                          </div>
                          <div className="mt-1 text-[10px] font-bold text-[#000000] dark:text-[#FFFFFF]">
                            {o.quantityFulfillmentPct}% Fulfilled
                          </div>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] ${gradeMeta.badge}`}>
                            {gradeMeta.label}
                          </span>
                          <div className="text-[11px] font-mono font-bold text-[#000000] dark:text-[#FFFFFF] mt-1">
                            QA Score: {o.overallQualityScore}%
                          </div>
                        </td>

                        <td className="px-5 py-4 text-right font-mono font-bold text-[#000000] dark:text-[#FFFFFF] text-sm">
                          {formatCurrency(o.totalAmount)}
                        </td>

                        <td className="px-5 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => openInspectionModal(o)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FAFAFA] dark:bg-[#1A1A1A] hover:bg-[#000000] hover:text-[#FFFFFF] dark:hover:bg-[#FFFFFF] dark:hover:text-[#000000] text-[#111111] dark:text-[#EEEEEE] border border-[#D4D4D4] dark:border-[#333333] transition-colors"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Log Inspection</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL 1: CREATE PURCHASE ORDER */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain p-4 sm:p-6 flex items-center justify-center bg-black/70 backdrop-blur-xs animate-v18-backdrop">
            <div className="my-auto max-h-[88vh] flex flex-col overflow-hidden w-full max-w-2xl v18-card bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl shadow-2xl animate-v18-modal">
              <div className="flex items-center justify-between p-6 pb-4 border-b border-[#D4D4D4] dark:border-[#303030] shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] border border-[#D4D4D4] dark:border-[#303030]">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">
                      Issue Purchase Order &amp; Quality Program
                    </h2>
                    <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">
                      Set purchase type, technical engineering tolerances, and target quality grade
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="p-1.5 rounded-lg text-[#888888] hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:bg-[#E5E5E5] dark:hover:bg-[#1F1F1F] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 py-4 space-y-4 pr-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">
                        Construction Project *
                      </label>
                      <select
                        required
                        value={form.projectId}
                        onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                        className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none"
                      >
                        {projects.length === 0 && <option value="">No projects found</option>}
                        {projects.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">
                        Purchase Program Type *
                      </label>
                      <select
                        value={form.purchaseType}
                        onChange={(e) => setForm({ ...form, purchaseType: e.target.value as PurchaseType })}
                        className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none"
                      >
                        <option value="BULK_CONTRACT_PO">Bulk Contract PO</option>
                        <option value="DIRECT_SITE_PURCHASE">Direct Site Purchase</option>
                        <option value="EMERGENCY_REQUISITION">Emergency Requisition</option>
                        <option value="SUBCONTRACT_MATERIAL">Subcontract Material</option>
                        <option value="EQUIPMENT_LEASE_PURCHASE">Equipment Lease Purchase</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">
                        Supplier / Fabricator *
                      </label>
                      <input
                        required
                        value={form.supplierName}
                        onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
                        placeholder="e.g. Mugher Cement Enterprise"
                        className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">
                        Supplier Contact Phone
                      </label>
                      <input
                        value={form.supplierContact}
                        onChange={(e) => setForm({ ...form, supplierContact: e.target.value })}
                        className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">
                        Material Category
                      </label>
                      <select
                        value={form.materialType}
                        onChange={(e) => setForm({ ...form, materialType: e.target.value })}
                        className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none"
                      >
                        <option value="Structural Steel">Structural Steel &amp; Rebar</option>
                        <option value="Portland Cement">Portland Cement &amp; Clinker</option>
                        <option value="Aggregates">Aggregates &amp; Sand</option>
                        <option value="Ready-Mix Concrete">Ready-Mix Concrete</option>
                        <option value="MEP">MEP &amp; Conduit</option>
                        <option value="Finishing">Finishing &amp; Ceramics</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">
                        Target Quality Grade
                      </label>
                      <select
                        value={form.qualityGrade}
                        onChange={(e) => setForm({ ...form, qualityGrade: e.target.value as QualityGrade })}
                        className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none"
                      >
                        <option value="GRADE_A_CERTIFIED">Grade A Certified (Lab Tested)</option>
                        <option value="GRADE_B_STANDARD">Grade B Standard</option>
                        <option value="GRADE_C_CONDITIONAL">Grade C Conditional</option>
                        <option value="PENDING_INSPECTION">Pending Inspection</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">
                      Material Line Item Description *
                    </label>
                    <input
                      required
                      value={form.itemDescription}
                      onChange={(e) => setForm({ ...form, itemDescription: e.target.value })}
                      placeholder="e.g., High-Tensile Deformed Rebar 20mm"
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">
                      Technical Specification / Standard Reference
                    </label>
                    <input
                      value={form.technicalSpec}
                      onChange={(e) => setForm({ ...form, technicalSpec: e.target.value })}
                      placeholder="e.g., ASTM A615 Grade 60 (Yield 420 MPa), ISO 9001 certified"
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">
                        Quantity *
                      </label>
                      <input
                        required
                        type="number"
                        min="0.1"
                        step="any"
                        value={form.quantity}
                        onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                        className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">
                        Unit
                      </label>
                      <input
                        value={form.unit}
                        onChange={(e) => setForm({ ...form, unit: e.target.value })}
                        placeholder="tons, bags, m3"
                        className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">
                        Unit Price (ETB) *
                      </label>
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.unitPrice}
                        onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                        className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">
                        Expected Delivery Date
                      </label>
                      <input
                        type="date"
                        value={form.deliveryDate}
                        onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
                        className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">
                        Designated Inspector / Requester
                      </label>
                      <input
                        value={form.inspectorName}
                        onChange={(e) => setForm({ ...form, inspectorName: e.target.value })}
                        className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none"
                      />
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#FAFAFA] dark:bg-[#171717] rounded-xl border border-[#D4D4D4] dark:border-[#303030] flex justify-between items-center font-mono">
                    <span className="text-[#666666] dark:text-[#A3A3A3] text-xs">Calculated Total (ETB):</span>
                    <span className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">
                      {formatCurrency((parseFloat(form.quantity) || 0) * (parseFloat(form.unitPrice) || 0))}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 p-6 pt-3 border-t border-[#D4D4D4] dark:border-[#303030] shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs font-semibold hover:bg-[#E5E5E5] dark:hover:bg-[#1F1F1F] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold shadow-md transition-all disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Issue Purchase Order</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: LOG QUALITY & QUANTITY INSPECTION */}
        {inspectModalOpen && inspectingOrder && (
          <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain p-4 sm:p-6 flex items-center justify-center bg-black/70 backdrop-blur-xs animate-v18-backdrop">
            <div className="my-auto max-h-[88vh] flex flex-col overflow-hidden w-full max-w-xl v18-card bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl shadow-2xl animate-v18-modal">
              <div className="flex items-center justify-between p-6 pb-4 border-b border-[#D4D4D4] dark:border-[#303030] shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] border border-[#D4D4D4] dark:border-[#303030]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">
                      Log Quality &amp; Quantity Inspection
                    </h2>
                    <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">
                      PO {inspectingOrder.poNumber} — {inspectingOrder.items[inspectItemIndex]?.description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setInspectModalOpen(false)}
                  className="p-1.5 rounded-lg text-[#888888] hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:bg-[#E5E5E5] dark:hover:bg-[#1F1F1F] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveInspection} className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 py-4 space-y-4 pr-2">
                  <div className="p-3 bg-[#FAFAFA] dark:bg-[#171717] rounded-xl border border-[#D4D4D4] dark:border-[#303030] text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#666666] dark:text-[#A3A3A3]">Ordered Quantity:</span>
                      <strong className="font-mono text-[#000000] dark:text-[#FFFFFF]">
                        {inspectingOrder.items[inspectItemIndex]?.orderedQuantity} {inspectingOrder.items[inspectItemIndex]?.unit}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#666666] dark:text-[#A3A3A3]">Engineering Specification:</span>
                      <span className="font-mono text-[#000000] dark:text-[#FFFFFF]">
                        {inspectingOrder.items[inspectItemIndex]?.technicalSpec}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">
                        Received Qty
                      </label>
                      <input
                        required
                        type="number"
                        min="0"
                        step="any"
                        value={inspectReceivedQty}
                        onChange={(e) => setInspectReceivedQty(e.target.value)}
                        className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">
                        Accepted Qty
                      </label>
                      <input
                        required
                        type="number"
                        min="0"
                        step="any"
                        value={inspectAcceptedQty}
                        onChange={(e) => setInspectAcceptedQty(e.target.value)}
                        className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">
                        Rejected Qty
                      </label>
                      <input
                        required
                        type="number"
                        min="0"
                        step="any"
                        value={inspectRejectedQty}
                        onChange={(e) => setInspectRejectedQty(e.target.value)}
                        className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">
                        Verified Quality Grade
                      </label>
                      <select
                        value={inspectGrade}
                        onChange={(e) => setInspectGrade(e.target.value as QualityGrade)}
                        className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none cursor-pointer"
                      >
                        <option value="GRADE_A_CERTIFIED">Grade A Certified (Exceeds Spec)</option>
                        <option value="GRADE_B_STANDARD">Grade B Standard (Pass)</option>
                        <option value="GRADE_C_CONDITIONAL">Grade C Conditional</option>
                        <option value="REJECTED">Rejected QA (Non-conforming)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">
                        Quality Score (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={inspectScorePct}
                        onChange={(e) => setInspectScorePct(e.target.value)}
                        className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">
                      Lab Test / Mill Test Certificate Reference #
                    </label>
                    <input
                      value={inspectCertRef}
                      onChange={(e) => setInspectCertRef(e.target.value)}
                      placeholder="e.g. LAB-ET-2026-CONC-0489"
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">
                      Inspection Notes &amp; Disposition
                    </label>
                    <textarea
                      rows={3}
                      value={inspectNotes}
                      onChange={(e) => setInspectNotes(e.target.value)}
                      placeholder="Slump test, visual check, ultrasonic thickness or tensile test observations..."
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 p-6 pt-3 border-t border-[#D4D4D4] dark:border-[#303030] shrink-0">
                  <button
                    type="button"
                    onClick={() => setInspectModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs font-semibold hover:bg-[#E5E5E5] dark:hover:bg-[#1F1F1F] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingInspection}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold shadow-md transition-all disabled:opacity-50"
                  >
                    {savingInspection && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Inspection Log</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
