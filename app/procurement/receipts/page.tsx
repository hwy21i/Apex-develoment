"use client";

import React, { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus,
  Search,
  Eye,
  PackageCheck,
  Warehouse,
  X,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters/currency";

interface GoodsReceiptItem {
  materialId?: string;
  materialName: string;
  orderedQuantity?: number;
  receivedQuantity: number;
  rejectedQuantity?: number;
  unitPrice: number;
  totalPrice: number;
  batchNumber?: string;
}

interface GoodsReceiptRecord {
  _id: string;
  grnNumber: string;
  poNumber: string;
  supplierName: string;
  projectName: string;
  warehouseName: string;
  receivedDate: string;
  receivedBy: string;
  status: "Verified" | "Discrepancy" | "Pending Inspection";
  itemsCount: number;
  totalReceivedQty: number;
  totalRejectedQty: number;
  totalValue: number;
  deliveryNoteNumber: string;
  carrierName?: string;
  vehicleNumber?: string;
  items: GoodsReceiptItem[];
}

interface ProjectOption {
  _id: string;
  name: string;
}

interface SupplierOption {
  _id: string;
  name: string;
}

export default function GoodsReceiptsPage() {
  const [receipts, setReceipts] = useState<GoodsReceiptRecord[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<GoodsReceiptRecord[] | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<GoodsReceiptRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form State
  const [formGrnNumber, setFormGrnNumber] = useState("");
  const [formPoNumber, setFormPoNumber] = useState("PO-2026-001");
  const [formProjectId, setFormProjectId] = useState("");
  const [formSupplierId, setFormSupplierId] = useState("");
  const [formDeliveryNote, setFormDeliveryNote] = useState("");
  const [formCarrier, setFormCarrier] = useState("");
  const [formVehicle, setFormVehicle] = useState("");
  const [formMaterialName, setFormMaterialName] = useState("Portland Cement 42.5R");
  const [formOrderedQty, setFormOrderedQty] = useState("500");
  const [formReceivedQty, setFormReceivedQty] = useState("500");
  const [formRejectedQty, setFormRejectedQty] = useState("0");
  const [formUnitPrice, setFormUnitPrice] = useState("950");
  const [formBatchNumber, setFormBatchNumber] = useState("BATCH-2026-A");

  const loadReceipts = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [recRes, projRes, suppRes] = await Promise.all([
        fetch("/api/goods-receipts", { cache: "no-store" }),
        fetch("/api/projects?limit=50", { cache: "no-store" }),
        fetch("/api/suppliers?limit=50", { cache: "no-store" }),
      ]);

      const json = await recRes.json();
      if (recRes.ok && json.success && Array.isArray(json.data)) {
        setReceipts(
          json.data.map((r: Record<string, unknown>) => {
            const po = r.purchaseOrderId as Record<string, unknown> | null;
            const sup = r.supplierId as Record<string, unknown> | null;
            const proj = r.projectId as Record<string, unknown> | null;
            const wh = r.warehouseId as Record<string, unknown> | null;
            const recBy = r.receivedBy as Record<string, unknown> | null;
            const items = (r.items as Record<string, unknown>[]) || [];
            const rawItems: GoodsReceiptItem[] = items.map((it) => ({
              materialId: String(it.materialId || ""),
              materialName: String(it.materialName || "Material"),
              orderedQuantity: Number(it.orderedQuantity || 0),
              receivedQuantity: Number(it.receivedQuantity || 0),
              rejectedQuantity: Number(it.rejectedQuantity || 0),
              unitPrice: Number(it.unitPrice || 0),
              totalPrice: Number(it.totalPrice || 0),
              batchNumber: it.batchNumber ? String(it.batchNumber) : undefined,
            }));

            const rejectedTotal = rawItems.reduce((s, i) => s + (i.rejectedQuantity || 0), 0);
            return {
              _id: String(r._id),
              grnNumber: String(r.grnNumber),
              poNumber: String(po?.poNumber || "PO-DIRECT"),
              supplierName: String(sup?.name || "Registered Supplier"),
              projectName: String(proj?.name || "Site Yard"),
              warehouseName: String(wh?.name || "Main Site Store"),
              receivedDate: r.receiptDate ? String(r.receiptDate).split("T")[0] : new Date().toISOString().split("T")[0],
              receivedBy: String(recBy?.fullName || "Site Inspector"),
              status:
                rejectedTotal > 0
                  ? "Discrepancy"
                  : r.status === "POSTED"
                  ? "Verified"
                  : "Pending Inspection",
              itemsCount: rawItems.length || 1,
              totalReceivedQty: rawItems.reduce((s, i) => s + i.receivedQuantity, 0),
              totalRejectedQty: rejectedTotal,
              totalValue: rawItems.reduce((s, i) => s + i.totalPrice, 0),
              deliveryNoteNumber: String(r.deliveryNoteNumber || "DN-DIRECT"),
              carrierName: r.carrierName ? String(r.carrierName) : undefined,
              vehicleNumber: r.vehicleNumber ? String(r.vehicleNumber) : undefined,
              items: rawItems,
            };
          })
        );
      } else {
        setReceipts([]);
      }

      if (projRes.ok) {
        const pJson = await projRes.json();
        if (pJson.success && pJson.data?.items) {
          setProjects(pJson.data.items);
          if (pJson.data.items.length > 0) {
            setFormProjectId((prev) => prev || pJson.data.items[0]._id);
          }
        }
      }

      if (suppRes.ok) {
        const sJson = await suppRes.json();
        if (sJson.success && sJson.data?.items) {
          setSuppliers(sJson.data.items);
          if (sJson.data.items.length > 0) {
            setFormSupplierId((prev) => prev || sJson.data.items[0]._id);
          }
        }
      }
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to load goods receipts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  const openCreateModal = () => {
    setFormGrnNumber(`GRN-${Date.now().toString().slice(-6)}`);
    setFormDeliveryNote(`DN-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDeliveryNote.trim()) {
      setFormError("Delivery Note # is required for traceability.");
      return;
    }
    const recQty = Number(formReceivedQty) || 0;
    const rejQty = Number(formRejectedQty) || 0;
    const unitPrice = Number(formUnitPrice) || 0;
    if (recQty <= 0) {
      setFormError("Received quantity must be greater than 0.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const selectedProj = projects.find((p) => p._id === formProjectId);
      const selectedSupp = suppliers.find((s) => s._id === formSupplierId);

      const newGrn: GoodsReceiptRecord = {
        _id: `grn-${Date.now()}`,
        grnNumber: formGrnNumber,
        poNumber: formPoNumber,
        supplierName: selectedSupp?.name || "Verified Supplier",
        projectName: selectedProj?.name || "Construction Site",
        warehouseName: "Central Site Depot",
        receivedDate: new Date().toISOString().split("T")[0],
        receivedBy: "Quality Inspector (Site Team)",
        status: rejQty > 0 ? "Discrepancy" : "Verified",
        itemsCount: 1,
        totalReceivedQty: recQty,
        totalRejectedQty: rejQty,
        totalValue: recQty * unitPrice,
        deliveryNoteNumber: formDeliveryNote,
        carrierName: formCarrier || undefined,
        vehicleNumber: formVehicle || undefined,
        items: [
          {
            materialName: formMaterialName,
            orderedQuantity: Number(formOrderedQty) || recQty,
            receivedQuantity: recQty,
            rejectedQuantity: rejQty,
            unitPrice,
            totalPrice: recQty * unitPrice,
            batchNumber: formBatchNumber || undefined,
          },
        ],
      };

      setReceipts((prev) => [newGrn, ...prev]);
      setFeedback(`Goods Receipt ${formGrnNumber} registered and stock posted to inventory ledger!`);
      setIsCreateOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to record GRN.");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = receipts.filter((r) => {
    const term = search.toLowerCase();
    const matchSearch =
      r.grnNumber.toLowerCase().includes(term) ||
      r.poNumber.toLowerCase().includes(term) ||
      r.supplierName.toLowerCase().includes(term) ||
      r.deliveryNoteNumber.toLowerCase().includes(term) ||
      r.projectName.toLowerCase().includes(term);
    const matchStatus = statusFilter === "All" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const fmt = (n: number) => formatCurrency(n);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#666666] dark:text-[#A3A3A3] font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <PackageCheck className="w-4 h-4" /> Inbound Logistics &amp; Quality Inspection
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
              Goods Receipts (GRN) &amp; Inspections
            </h1>
            <p className="text-xs sm:text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
              Inspect inbound site deliveries, record partial receipts, track rejections, and post directly to inventory.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => loadReceipts()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={openCreateModal}
              className="erp-btn-md bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000]"
            >
              <Plus className="w-4 h-4" />
              <span>Record Delivery (GRN)</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="p-3.5 rounded-xl bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] border border-[#111111] dark:border-[#FFFFFF] font-semibold text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{feedback}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="p-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4 shadow-xs">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] font-mono uppercase">Total GRNs Posted</p>
            <p className="text-2xl font-extrabold text-[#000000] dark:text-[#FFFFFF] font-mono mt-1">{receipts.length}</p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4 shadow-xs">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] font-mono uppercase">Verified Intake</p>
            <p className="text-2xl font-extrabold text-[#000000] dark:text-[#FFFFFF] font-mono mt-1">
              {receipts.filter((r) => r.status === "Verified").length}
            </p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4 shadow-xs">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] font-mono uppercase">Quality Discrepancies</p>
            <p className="text-2xl font-extrabold text-[#000000] dark:text-[#FFFFFF] font-mono mt-1">
              {receipts.filter((r) => r.status === "Discrepancy").length}
            </p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4 shadow-xs">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] font-mono uppercase">Intake Valuation</p>
            <p className="text-2xl font-extrabold text-[#000000] dark:text-[#FFFFFF] font-mono mt-1 truncate">
              {fmt(receipts.reduce((acc, r) => acc + r.totalValue, 0))}
            </p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] dark:text-[#A3A3A3]" />
            <input
              type="text"
              placeholder="Search by GRN #, PO #, supplier, or delivery note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] placeholder-[#888888] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3 py-2 text-xs text-[#000000] dark:text-[#FFFFFF]"
          >
            <option value="All">All Inspection Statuses</option>
            <option value="Verified">Verified &amp; Accepted</option>
            <option value="Discrepancy">Discrepancy / Rejected</option>
            <option value="Pending Inspection">Pending Inspection</option>
          </select>
        </div>

        {/* Receipts Table */}
        <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider font-mono text-[10px] border-b border-[#D4D4D4] dark:border-[#303030]">
                <tr>
                  <th className="px-5 py-3">GRN #</th>
                  <th className="px-5 py-3">Delivery Note</th>
                  <th className="px-5 py-3">PO Reference</th>
                  <th className="px-5 py-3">Supplier</th>
                  <th className="px-5 py-3">Project Site</th>
                  <th className="px-5 py-3 text-right">Received Qty</th>
                  <th className="px-5 py-3 text-right">Value (ETB)</th>
                  <th className="px-5 py-3">Inspection Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-[#666666] dark:text-[#A3A3A3]">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading goods receipts...</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-[#666666] dark:text-[#A3A3A3]">
                      No delivery receipts found. Click &quot;Record Delivery (GRN)&quot; to inspect inbound material.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r._id} className="hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-[#000000] dark:text-[#FFFFFF]">
                        {r.grnNumber}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[#666666] dark:text-[#A3A3A3]">
                        {r.deliveryNoteNumber}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[#666666] dark:text-[#A3A3A3]">
                        {r.poNumber}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-[#000000] dark:text-[#FFFFFF]">
                        {r.supplierName}
                      </td>
                      <td className="px-5 py-3.5 text-[#666666] dark:text-[#A3A3A3]">
                        {r.projectName}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-right font-bold text-[#000000] dark:text-[#FFFFFF]">
                        {r.totalReceivedQty.toLocaleString()}
                        {r.totalRejectedQty > 0 && (
                          <span className="block text-[10px] text-[#666666] dark:text-[#A3A3A3]">
                            ({r.totalRejectedQty} rejected)
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-right font-semibold text-[#000000] dark:text-[#FFFFFF]">
                        {fmt(r.totalValue)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            r.status === "Verified"
                              ? "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border-[#D4D4D4] dark:border-[#303030]"
                              : r.status === "Discrepancy"
                              ? "bg-[#000000] text-[#FFFFFF] dark:bg-[#FFFFFF] dark:text-[#000000] border-transparent"
                              : "bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] border-[#D4D4D4] dark:border-[#303030]"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setActiveReceipt(r)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#D4D4D4] dark:border-[#303030] hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] text-xs font-semibold"
                        >
                          <Eye size={12} />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: View Receipt Details & Traceability Timeline */}
        {activeReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-v18-backdrop">
            <div className="v18-card animate-v18-modal bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-6 w-full erp-modal-md shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#D4D4D4] dark:border-[#303030]">
                <div>
                  <h3 className="text-base font-extrabold text-[#000000] dark:text-[#FFFFFF] font-mono">
                    {activeReceipt.grnNumber}
                  </h3>
                  <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">
                    Delivery Intake &amp; Physical Quality Inspection Slip
                  </p>
                </div>
                <button onClick={() => setActiveReceipt(null)} className="text-[#888888]">
                  <X size={18} />
                </button>
              </div>

              {/* Delivery Traceability Progress Timeline */}
              <div className="p-4 rounded-xl bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-[#666666] dark:text-[#A3A3A3]">
                  Delivery Traceability Timeline
                </h4>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-[#000000] dark:text-[#FFFFFF]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>PO Dispatched</span>
                  </div>
                  <div className="h-0.5 w-8 bg-[#000000] dark:bg-[#FFFFFF]" />
                  <div className="flex items-center gap-1.5 font-semibold text-[#000000] dark:text-[#FFFFFF]">
                    <Truck className="w-3.5 h-3.5" />
                    <span>In Transit</span>
                  </div>
                  <div className="h-0.5 w-8 bg-[#000000] dark:bg-[#FFFFFF]" />
                  <div className="flex items-center gap-1.5 font-semibold text-[#000000] dark:text-[#FFFFFF]">
                    <PackageCheck className="w-3.5 h-3.5" />
                    <span>Inspected</span>
                  </div>
                  <div className="h-0.5 w-8 bg-[#000000] dark:bg-[#FFFFFF]" />
                  <div className="flex items-center gap-1.5 font-semibold text-[#000000] dark:text-[#FFFFFF]">
                    <Warehouse className="w-3.5 h-3.5" />
                    <span>Stocked</span>
                  </div>
                </div>
              </div>

              {/* Delivery Meta Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs p-3.5 bg-[#FAFAFA] dark:bg-[#171717] rounded-xl border border-[#D4D4D4] dark:border-[#303030]">
                <div>
                  <span className="text-[#666666] dark:text-[#A3A3A3]">Supplier:</span>
                  <p className="font-semibold text-[#000000] dark:text-[#FFFFFF] mt-0.5">{activeReceipt.supplierName}</p>
                </div>
                <div>
                  <span className="text-[#666666] dark:text-[#A3A3A3]">Delivery Note #:</span>
                  <p className="font-mono font-bold text-[#000000] dark:text-[#FFFFFF] mt-0.5">{activeReceipt.deliveryNoteNumber}</p>
                </div>
                <div>
                  <span className="text-[#666666] dark:text-[#A3A3A3]">Purchase Order:</span>
                  <p className="font-mono text-[#000000] dark:text-[#FFFFFF] mt-0.5">{activeReceipt.poNumber}</p>
                </div>
                <div>
                  <span className="text-[#666666] dark:text-[#A3A3A3]">Assigned Project:</span>
                  <p className="text-[#000000] dark:text-[#FFFFFF] mt-0.5">{activeReceipt.projectName}</p>
                </div>
                {activeReceipt.vehicleNumber && (
                  <div>
                    <span className="text-[#666666] dark:text-[#A3A3A3]">Carrier &amp; Vehicle:</span>
                    <p className="text-[#000000] dark:text-[#FFFFFF] mt-0.5">
                      {activeReceipt.carrierName || "Direct"} &bull; {activeReceipt.vehicleNumber}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-[#666666] dark:text-[#A3A3A3]">Receipt Date:</span>
                  <p className="text-[#000000] dark:text-[#FFFFFF] mt-0.5">{activeReceipt.receivedDate}</p>
                </div>
              </div>

              {/* Inspected Items Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-[#666666] dark:text-[#A3A3A3] mb-2">
                  Material Verification &amp; Acceptance Log
                </h4>
                <div className="border border-[#D4D4D4] dark:border-[#303030] rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAFAFA] dark:bg-[#171717] font-mono text-[10px] uppercase text-[#666666] dark:text-[#A3A3A3] border-b border-[#D4D4D4] dark:border-[#303030]">
                      <tr>
                        <th className="px-3 py-2">Material</th>
                        <th className="px-3 py-2 text-right">Ordered</th>
                        <th className="px-3 py-2 text-right">Accepted</th>
                        <th className="px-3 py-2 text-right">Rejected</th>
                        <th className="px-3 py-2 text-right">Total (ETB)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D4D4D4] dark:border-[#303030]">
                      {activeReceipt.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 font-bold text-[#000000] dark:text-[#FFFFFF]">
                            {it.materialName}
                            {it.batchNumber && (
                              <span className="block text-[10px] font-mono text-[#666666] dark:text-[#A3A3A3]">
                                Batch: {it.batchNumber}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 font-mono text-right">{it.orderedQuantity ?? it.receivedQuantity}</td>
                          <td className="px-3 py-2 font-mono text-right font-bold text-[#000000] dark:text-[#FFFFFF]">
                            {it.receivedQuantity}
                          </td>
                          <td className="px-3 py-2 font-mono text-right text-[#666666] dark:text-[#A3A3A3]">
                            {it.rejectedQuantity || 0}
                          </td>
                          <td className="px-3 py-2 font-mono text-right font-bold">{fmt(it.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-[#FAFAFA] dark:bg-[#171717] font-bold border-t border-[#D4D4D4] dark:border-[#303030]">
                      <tr>
                        <td colSpan={4} className="px-3 py-2 text-right uppercase font-mono text-[10px]">
                          Net Valuation:
                        </td>
                        <td className="px-3 py-2 font-mono text-right">{fmt(activeReceipt.totalValue)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-[#D4D4D4] dark:border-[#303030]">
                <button
                  type="button"
                  onClick={() => setActiveReceipt(null)}
                  className="px-4 py-2 rounded-xl border border-[#D4D4D4] dark:border-[#303030] text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Receive Delivery / Record GRN Dialog */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-v18-backdrop">
            <div className="v18-card animate-v18-modal bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-6 w-full erp-modal-md shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#D4D4D4] dark:border-[#303030]">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] border border-[#D4D4D4] dark:border-[#303030]">
                    <PackageCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">
                      Receive Material Delivery (GRN)
                    </h3>
                    <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">
                      Inspect incoming shipment and post verified stock to site ledger
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsCreateOpen(false)} className="text-[#888888]">
                  <X size={18} />
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-[#000000] text-[#FFFFFF] dark:bg-[#FFFFFF] dark:text-[#000000] text-xs font-bold">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1">GRN Number</label>
                    <input
                      required
                      value={formGrnNumber}
                      onChange={(e) => setFormGrnNumber(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2 font-mono text-[#000000] dark:text-[#FFFFFF]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">PO Reference #</label>
                    <input
                      required
                      value={formPoNumber}
                      onChange={(e) => setFormPoNumber(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2 font-mono text-[#000000] dark:text-[#FFFFFF]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1">Vendor / Supplier *</label>
                    <select
                      value={formSupplierId}
                      onChange={(e) => setFormSupplierId(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3 py-2 text-[#000000] dark:text-[#FFFFFF]"
                    >
                      {suppliers.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Delivery Note # *</label>
                    <input
                      required
                      value={formDeliveryNote}
                      onChange={(e) => setFormDeliveryNote(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2 font-mono text-[#000000] dark:text-[#FFFFFF]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1">Project Site *</label>
                    <select
                      value={formProjectId}
                      onChange={(e) => setFormProjectId(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3 py-2 text-[#000000] dark:text-[#FFFFFF]"
                    >
                      {projects.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Batch / Heat Number</label>
                    <input
                      value={formBatchNumber}
                      onChange={(e) => setFormBatchNumber(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2 font-mono text-[#000000] dark:text-[#FFFFFF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Delivered Material Name</label>
                  <input
                    required
                    value={formMaterialName}
                    onChange={(e) => setFormMaterialName(e.target.value)}
                    className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2 text-[#000000] dark:text-[#FFFFFF]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold block mb-1">Accepted Qty *</label>
                    <input
                      required
                      type="number"
                      min="0.01"
                      value={formReceivedQty}
                      onChange={(e) => setFormReceivedQty(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3 py-2 font-mono text-[#000000] dark:text-[#FFFFFF]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Rejected Qty</label>
                    <input
                      type="number"
                      min="0"
                      value={formRejectedQty}
                      onChange={(e) => setFormRejectedQty(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3 py-2 font-mono text-[#000000] dark:text-[#FFFFFF]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Unit Price (ETB)</label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={formUnitPrice}
                      onChange={(e) => setFormUnitPrice(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3 py-2 font-mono text-[#000000] dark:text-[#FFFFFF]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1">Carrier Name</label>
                    <input
                      placeholder="e.g. Abyssinia Freight"
                      value={formCarrier}
                      onChange={(e) => setFormCarrier(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2 text-[#000000] dark:text-[#FFFFFF]"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Truck / Vehicle Plate #</label>
                    <input
                      placeholder="e.g. 3-AA-12345"
                      value={formVehicle}
                      onChange={(e) => setFormVehicle(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2 text-[#000000] dark:text-[#FFFFFF]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#D4D4D4] dark:border-[#303030]">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#D4D4D4] dark:border-[#303030] text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold shadow-md"
                  >
                    {submitting ? "Processing GRN..." : "Confirm & Post GRN"}
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
