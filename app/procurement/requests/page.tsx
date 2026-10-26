"use client";

import React, { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  FileText,
  AlertCircle,
  X,
  Loader2,
  RefreshCw,
  ShoppingCart,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useCurrentUser } from "@/components/auth/UserProvider";
import { formatCurrency } from "@/lib/formatters/currency";

interface RequestItem {
  materialId?: string;
  materialName: string;
  unitOfMeasure: string;
  specifications?: string;
  requestedQuantity: number;
  estimatedUnitCost: number;
  totalEstimatedCost: number;
}

interface MaterialRequest {
  _id: string;
  requestNumber: string;
  projectId: {
    _id: string;
    name: string;
    projectCode?: string;
    budget?: number;
    totalBudget?: number;
    amountSpent?: number;
    committedCost?: number;
  } | string;
  requestedBy: {
    _id?: string;
    fullName: string;
    email?: string;
    role?: string;
  } | string;
  approvedBy?: {
    _id?: string;
    fullName: string;
    role?: string;
  } | string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "ORDERED" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  items: RequestItem[];
  requiredByDate: string;
  totalEstimatedCost: number;
  budgetStatus?: "WITHIN_BUDGET" | "BUDGET_WARNING" | "BUDGET_EXCEEDED";
  reason: string;
  approvalNotes?: string;
  rejectionReason?: string;
  convertedToPoId?: string;
  createdAt: string;
}

interface ProjectOption {
  _id: string;
  name: string;
  projectCode?: string;
  budget?: number;
  totalBudget?: number;
  amountSpent?: number;
  committedCost?: number;
}

interface SupplierOption {
  _id: string;
  name: string;
  phone?: string;
}

const STANDARD_UNITS = ["bags", "tonne", "tons", "kg", "m³", "m²", "m", "pcs", "liters", "boxes", "rolls"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export default function ProcurementRequestsPage() {
  const { user } = useCurrentUser();
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [selected, setSelected] = useState<MaterialRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReasonText, setRejectionReasonText] = useState("");

  // Convert to PO modal state
  const [showPoModal, setShowPoModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("Main Site Warehouse, Addis Ababa");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");

  // Create Request Modal State
  const [formOpen, setFormOpen] = useState(false);
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formProjectId, setFormProjectId] = useState("");
  const [formPriority, setFormPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [formRequiredDate, setFormRequiredDate] = useState("");
  const [formReason, setFormReason] = useState("");
  const [formItems, setFormItems] = useState<Array<{
    materialName: string;
    unitOfMeasure: string;
    specifications: string;
    requestedQuantity: number;
    estimatedUnitCost: number;
  }>>([
    { materialName: "", unitOfMeasure: "bags", specifications: "", requestedQuantity: 10, estimatedUnitCost: 950 },
  ]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [reqRes, projRes, suppRes] = await Promise.all([
        fetch("/api/procurement/requests?limit=100", { cache: "no-store" }),
        fetch("/api/projects?limit=50", { cache: "no-store" }),
        fetch("/api/suppliers?limit=50", { cache: "no-store" }),
      ]);

      const reqJson = await reqRes.json();
      if (!reqRes.ok || !reqJson.success) {
        throw new Error(reqJson.error?.message || "Failed to load requisitions.");
      }
      setRequests(reqJson.data?.items || []);

      if (projRes.ok) {
        const projJson = await projRes.json();
        if (projJson.success && projJson.data?.items) {
          setProjects(projJson.data.items);
          if (projJson.data.items.length > 0) {
            setFormProjectId((prev) => prev || projJson.data.items[0]._id);
          }
        }
      }

      if (suppRes.ok) {
        const suppJson = await suppRes.json();
        if (suppJson.success && suppJson.data?.items) {
          setSuppliers(suppJson.data.items);
          if (suppJson.data.items.length > 0) {
            setSelectedSupplierId(suppJson.data.items[0]._id);
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load procurement data.";
      setFetchError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getProjectName = (p: MaterialRequest["projectId"]) => {
    if (typeof p === "object" && p !== null) return p.name;
    const found = projects.find((x) => x._id === p);
    return found ? found.name : "Assigned Site";
  };

  const getRequesterName = (r: MaterialRequest["requestedBy"]) => {
    if (typeof r === "object" && r !== null) return r.fullName;
    return String(r || "Site Engineer");
  };

  const fmt = (n: number) => formatCurrency(n);

  const filteredRequests = requests.filter((r) => {
    const term = search.toLowerCase();
    const projName = getProjectName(r.projectId).toLowerCase();
    const reqName = getRequesterName(r.requestedBy).toLowerCase();
    const matchSearch =
      r.requestNumber.toLowerCase().includes(term) ||
      projName.includes(term) ||
      reqName.includes(term);
    const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
    const matchPriority = priorityFilter === "ALL" || r.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "SUBMITTED" || r.status === ("Pending" as unknown)).length,
    approved: requests.filter((r) => r.status === "APPROVED" || r.status === "ORDERED").length,
    totalValue: requests.reduce((s, r) => s + (r.totalEstimatedCost || 0), 0),
  };

  // Line Item Handlers
  const handleAddItem = () => {
    setFormItems([
      ...formItems,
      { materialName: "", unitOfMeasure: "pcs", specifications: "", requestedQuantity: 1, estimatedUnitCost: 100 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (formItems.length === 1) return;
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: "materialName" | "unitOfMeasure" | "specifications" | "requestedQuantity" | "estimatedUnitCost",
    value: string | number
  ) => {
    const copy = [...formItems];
    copy[index] = { ...copy[index], [field]: value };
    setFormItems(copy);
  };

  const formTotalEstimated = formItems.reduce(
    (sum, it) => sum + (Number(it.requestedQuantity) || 0) * (Number(it.estimatedUnitCost) || 0),
    0
  );

  // Submit Requisition
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProjectId) {
      setFormError("Please select a project.");
      return;
    }
    const hasEmpty = formItems.some((it) => !it.materialName.trim());
    if (hasEmpty) {
      setFormError("Please enter a name for all line items.");
      return;
    }
    if (!formReason.trim()) {
      setFormError("Requisition justification is required.");
      return;
    }

    setFormBusy(true);
    setFormError(null);
    try {
      const res = await fetch("/api/procurement/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: formProjectId,
          priority: formPriority,
          requiredByDate: formRequiredDate || undefined,
          reason: formReason.trim(),
          items: formItems.map((it) => ({
            materialName: it.materialName.trim(),
            unitOfMeasure: it.unitOfMeasure,
            specifications: it.specifications.trim() || undefined,
            requestedQuantity: Number(it.requestedQuantity) || 1,
            estimatedUnitCost: Number(it.estimatedUnitCost) || 0,
          })),
          status: "SUBMITTED",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to submit request.");
      }

      setFormOpen(false);
      setFormReason("");
      setFormItems([{ materialName: "", unitOfMeasure: "bags", specifications: "", requestedQuantity: 10, estimatedUnitCost: 950 }]);
      setActionSuccess(`Requisition ${json.data?.requestNumber || ""} submitted successfully!`);
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error submitting requisition.");
    } finally {
      setFormBusy(false);
    }
  };

  // Approve Requisition
  const handleApprove = async () => {
    if (!selected) return;
    setActionBusy(true);
    setActionError(null);
    try {
      const res = await fetch("/api/procurement/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected._id, action: "APPROVE", notes: "Approved by site management." }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.error || "Approval failed.");
      }

      setActionSuccess(`Requisition ${selected.requestNumber} approved.`);
      setShowDetailModal(false);
      setSelected(null);
      await loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Approval failed.");
    } finally {
      setActionBusy(false);
    }
  };

  // Reject Requisition
  const handleReject = async () => {
    if (!selected) return;
    if (!rejectionReasonText.trim()) {
      setActionError("A formal reason for rejection is required.");
      return;
    }
    setActionBusy(true);
    setActionError(null);
    try {
      const res = await fetch("/api/procurement/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected._id,
          action: "REJECT",
          rejectionReason: rejectionReasonText.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.error || "Rejection failed.");
      }

      setActionSuccess(`Requisition ${selected.requestNumber} rejected.`);
      setShowRejectModal(false);
      setShowDetailModal(false);
      setSelected(null);
      setRejectionReasonText("");
      await loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Rejection failed.");
    } finally {
      setActionBusy(false);
    }
  };

  // Convert to PO
  const handleConvertToPo = async () => {
    if (!selected) return;
    if (!selectedSupplierId) {
      setActionError("Please select a vendor/supplier to issue the Purchase Order.");
      return;
    }
    setActionBusy(true);
    setActionError(null);
    try {
      const res = await fetch("/api/procurement/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected._id,
          action: "CONVERT_TO_PO",
          supplierId: selectedSupplierId,
          deliveryAddress,
          expectedDeliveryDate: expectedDeliveryDate || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || json.error || "Failed to generate Purchase Order.");
      }

      setActionSuccess(`Purchase Order created: ${json.data?.purchaseOrder?.poNumber || "PO Generated"}`);
      setShowPoModal(false);
      setShowDetailModal(false);
      setSelected(null);
      await loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "PO generation failed.");
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#666666] dark:text-[#A3A3A3] font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <ShoppingCart className="w-4 h-4" /> Requisitions &amp; Procurement Controls
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
              Purchase Requisitions
            </h1>
            <p className="text-xs sm:text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
              Structured material requests, multi-unit specs, budget verification, and 1-click PO conversion.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => loadData()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => {
                setFormOpen(true);
                setFormError(null);
              }}
              className="erp-btn-md bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000]"
            >
              <Plus className="w-4 h-4" />
              <span>New Requisition</span>
            </button>
          </div>
        </div>

        {/* Global Feedback */}
        {actionSuccess && (
          <div className="p-3.5 rounded-xl bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] border border-[#111111] dark:border-[#FFFFFF] font-semibold text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess(null)} className="p-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-[#666666] dark:text-[#A3A3A3] text-xs font-mono uppercase mb-1">
              <span>Total Requisitions</span>
              <FileText className="w-4 h-4" />
            </div>
            <p className="text-2xl font-extrabold text-[#000000] dark:text-[#FFFFFF] font-mono">{stats.total}</p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-[#666666] dark:text-[#A3A3A3] text-xs font-mono uppercase mb-1">
              <span>Pending Review</span>
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-2xl font-extrabold text-[#000000] dark:text-[#FFFFFF] font-mono">{stats.pending}</p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-[#666666] dark:text-[#A3A3A3] text-xs font-mono uppercase mb-1">
              <span>Approved / Ordered</span>
              <CheckCircle className="w-4 h-4" />
            </div>
            <p className="text-2xl font-extrabold text-[#000000] dark:text-[#FFFFFF] font-mono">{stats.approved}</p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-[#666666] dark:text-[#A3A3A3] text-xs font-mono uppercase mb-1">
              <span>Total Requisition Value</span>
              <Package className="w-4 h-4" />
            </div>
            <p className="text-2xl font-extrabold text-[#000000] dark:text-[#FFFFFF] font-mono truncate">{fmt(stats.totalValue)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] dark:text-[#A3A3A3]" />
            <input
              type="text"
              placeholder="Search by requisition #, project, or requester..."
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
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="APPROVED">Approved</option>
            <option value="ORDERED">Ordered (PO Issued)</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3 py-2 text-xs text-[#000000] dark:text-[#FFFFFF]"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        {/* Requests Table */}
        <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider font-mono text-[10px] border-b border-[#D4D4D4] dark:border-[#303030]">
                <tr>
                  <th className="px-5 py-3">Req #</th>
                  <th className="px-5 py-3">Project Site</th>
                  <th className="px-5 py-3">Requester</th>
                  <th className="px-5 py-3">Items Spec</th>
                  <th className="px-5 py-3">Est. Value (ETB)</th>
                  <th className="px-5 py-3">Budget Check</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-[#666666] dark:text-[#A3A3A3]">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading purchase requests...</span>
                      </div>
                    </td>
                  </tr>
                ) : fetchError ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center">
                      <div className="max-w-md mx-auto space-y-3">
                        <AlertCircle className="w-8 h-8 text-[#666666] dark:text-[#A3A3A3] mx-auto" />
                        <p className="text-sm font-bold text-[#000000] dark:text-[#FFFFFF]">Unable to Load Requests</p>
                        <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">{fetchError}</p>
                        <button
                          onClick={() => loadData()}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Retry</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-[#666666] dark:text-[#A3A3A3]">
                      No purchase requisitions found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((r) => {
                    const itemCount = r.items?.length || 0;
                    return (
                      <tr key={r._id} className="hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] transition-colors">
                        <td className="px-5 py-3.5 font-mono font-bold text-[#000000] dark:text-[#FFFFFF]">
                          {r.requestNumber}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-[#000000] dark:text-[#FFFFFF]">
                          {getProjectName(r.projectId)}
                        </td>
                        <td className="px-5 py-3.5 text-[#666666] dark:text-[#A3A3A3]">
                          {getRequesterName(r.requestedBy)}
                        </td>
                        <td className="px-5 py-3.5 text-[#666666] dark:text-[#A3A3A3]">
                          {itemCount} item{itemCount !== 1 ? "s" : ""}
                          {r.items?.[0] && (
                            <span className="block text-[10px] truncate max-w-[140px] text-[#888888]">
                              {r.items[0].materialName}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 font-mono font-semibold text-[#000000] dark:text-[#FFFFFF]">
                          {fmt(r.totalEstimatedCost)}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                              r.budgetStatus === "BUDGET_EXCEEDED"
                                ? "bg-[#000000] text-[#FFFFFF] dark:bg-[#FFFFFF] dark:text-[#000000] border-transparent"
                                : r.budgetStatus === "BUDGET_WARNING"
                                ? "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border-[#000000] dark:border-[#FFFFFF]"
                                : "bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] border-[#D4D4D4] dark:border-[#303030]"
                            }`}
                          >
                            {r.budgetStatus === "BUDGET_EXCEEDED"
                              ? "EXCEEDS BUDGET"
                              : r.budgetStatus === "BUDGET_WARNING"
                              ? ">80% BUDGET"
                              : "OK"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF]">
                            {r.priority}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]">
                            {r.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => {
                              setSelected(r);
                              setShowDetailModal(true);
                              setActionError(null);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#D4D4D4] dark:border-[#303030] hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] text-xs font-semibold"
                          >
                            <Eye size={12} />
                            <span>Inspect</span>
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

        {/* Modal: Inspect & Workflow Details */}
        {showDetailModal && selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-v18-backdrop">
            <div className="v18-card animate-v18-modal bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl w-full erp-modal-lg shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#D4D4D4] dark:border-[#303030]">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-[#000000] dark:text-[#FFFFFF] font-mono">
                      {selected.requestNumber}
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border border-[#D4D4D4] dark:border-[#303030]">
                      {selected.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#666666] dark:text-[#A3A3A3] mt-0.5">
                    {getProjectName(selected.projectId)} &bull; Requested by {getRequesterName(selected.requestedBy)}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-1 rounded-lg text-[#888888] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {actionError && (
                <div className="p-3 rounded-xl bg-[#000000] text-[#FFFFFF] dark:bg-[#FFFFFF] dark:text-[#000000] text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Justification & Budget Indicator */}
              <div className="p-3 rounded-xl bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#000000] dark:text-[#FFFFFF]">Site Justification:</span>
                  <span className="font-mono text-[10px] uppercase text-[#666666] dark:text-[#A3A3A3]">
                    Priority: {selected.priority}
                  </span>
                </div>
                <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">{selected.reason}</p>
                {selected.rejectionReason && (
                  <div className="pt-2 border-t border-[#D4D4D4] dark:border-[#303030] text-xs text-[#000000] dark:text-[#FFFFFF] font-semibold">
                    Rejection Reason: {selected.rejectionReason}
                  </div>
                )}
              </div>

              {/* Line Items List */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] font-mono mb-2">
                  Requisition Line Items ({selected.items?.length || 0})
                </h3>
                <div className="border border-[#D4D4D4] dark:border-[#303030] rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAFAFA] dark:bg-[#171717] font-mono text-[10px] uppercase text-[#666666] dark:text-[#A3A3A3] border-b border-[#D4D4D4] dark:border-[#303030]">
                      <tr>
                        <th className="px-3 py-2">Material / Grade</th>
                        <th className="px-3 py-2">UOM</th>
                        <th className="px-3 py-2 text-right">Qty</th>
                        <th className="px-3 py-2 text-right">Est. Unit Price</th>
                        <th className="px-3 py-2 text-right">Total (ETB)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
                      {selected.items?.map((it, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 font-bold text-[#000000] dark:text-[#FFFFFF]">
                            {it.materialName}
                            {it.specifications && (
                              <span className="block text-[10px] font-mono font-normal text-[#666666] dark:text-[#A3A3A3]">
                                Spec: {it.specifications}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 font-mono text-[#666666] dark:text-[#A3A3A3]">{it.unitOfMeasure}</td>
                          <td className="px-3 py-2 font-mono text-right font-bold">{it.requestedQuantity}</td>
                          <td className="px-3 py-2 font-mono text-right">{fmt(it.estimatedUnitCost)}</td>
                          <td className="px-3 py-2 font-mono text-right font-bold">{fmt(it.totalEstimatedCost)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-[#FAFAFA] dark:bg-[#171717] border-t border-[#D4D4D4] dark:border-[#303030] font-bold">
                      <tr>
                        <td colSpan={4} className="px-3 py-2 text-right uppercase font-mono text-[10px]">Total Valuation:</td>
                        <td className="px-3 py-2 font-mono text-right">{fmt(selected.totalEstimatedCost)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Action Buttons Workflow */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-[#D4D4D4] dark:border-[#303030]">
                {selected.status === "SUBMITTED" && (
                  <>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      disabled={actionBusy}
                      className="px-4 py-2 rounded-xl border border-[#D4D4D4] dark:border-[#303030] text-xs font-bold hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F]"
                    >
                      Reject Requisition
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={actionBusy}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold disabled:opacity-50"
                    >
                      {actionBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      <span>Approve Requisition</span>
                    </button>
                  </>
                )}

                {selected.status === "APPROVED" && (
                  <button
                    onClick={() => setShowPoModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Convert to Purchase Order</span>
                  </button>
                )}

                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#D4D4D4] dark:border-[#303030] text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Rejection Reason Dialog */}
        {showRejectModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-v18-backdrop">
            <div className="v18-card animate-v18-modal bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl w-full erp-modal-sm shadow-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-[#000000] dark:text-[#FFFFFF]">
                Reject Requisition: {selected?.requestNumber}
              </h3>
              <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">
                Please provide a formal justification for rejecting this requisition. This will be transmitted to the site engineer.
              </p>
              <textarea
                required
                rows={3}
                placeholder="e.g., Exceeds phase budget, substitute with existing yard stock, or quote revised pricing..."
                value={rejectionReasonText}
                onChange={(e) => setRejectionReasonText(e.target.value)}
                className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-3 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionBusy}
                  className="px-4 py-1.5 rounded-xl bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold"
                >
                  {actionBusy ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Convert to PO Dialog */}
        {showPoModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-v18-backdrop">
            <div className="v18-card animate-v18-modal bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl w-full erp-modal-md shadow-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#D4D4D4] dark:border-[#303030]">
                <h3 className="text-sm font-bold text-[#000000] dark:text-[#FFFFFF]">
                  Convert Requisition to Purchase Order
                </h3>
                <button onClick={() => setShowPoModal(false)} className="text-[#888888]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">
                Generating a legally binding PO for {selected?.items?.length} items totaling{" "}
                <span className="font-bold text-[#000000] dark:text-[#FFFFFF]">{fmt(selected?.totalEstimatedCost || 0)}</span>.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Select Approved Vendor / Supplier *</label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-2.5 text-xs text-[#000000] dark:text-[#FFFFFF]"
                  >
                    {suppliers.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} {s.phone ? `(${s.phone})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Delivery Address</label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-2.5 text-xs text-[#000000] dark:text-[#FFFFFF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-2.5 text-xs text-[#000000] dark:text-[#FFFFFF]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowPoModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConvertToPo}
                  disabled={actionBusy}
                  className="px-4 py-1.5 rounded-xl bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold"
                >
                  {actionBusy ? "Issuing PO..." : "Issue Purchase Order"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Create Requisition Dialog */}
        {formOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-v18-backdrop">
            <div className="v18-card animate-v18-modal bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl w-full erp-modal-lg shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#D4D4D4] dark:border-[#303030]">
                <div>
                  <h2 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">
                    New Material Requisition
                  </h2>
                  <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">
                    Create multi-line item procurement request with quality specifications
                  </p>
                </div>
                <button onClick={() => setFormOpen(false)} className="text-[#888888]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-[#000000] text-[#FFFFFF] dark:bg-[#FFFFFF] dark:text-[#000000] text-xs font-bold">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Project Site *</label>
                    <select
                      required
                      value={formProjectId}
                      onChange={(e) => setFormProjectId(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-2.5 text-xs text-[#000000] dark:text-[#FFFFFF]"
                    >
                      {projects.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">Priority</label>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH" | "URGENT")}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-2.5 text-xs text-[#000000] dark:text-[#FFFFFF]"
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">Required On Site</label>
                    <input
                      type="date"
                      value={formRequiredDate}
                      onChange={(e) => setFormRequiredDate(e.target.value)}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-2 text-xs text-[#000000] dark:text-[#FFFFFF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Justification / Reason *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Foundation slab pour for Sector B milestone deliverables"
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                    className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-2.5 text-xs text-[#000000] dark:text-[#FFFFFF]"
                  />
                </div>

                {/* Multi-Item Line Builder */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-[#666666] dark:text-[#A3A3A3]">
                      Requisition Items ({formItems.length})
                    </h3>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#000000] dark:text-[#FFFFFF] underline"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Another Item</span>
                    </button>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {formItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-[#666666] dark:text-[#A3A3A3]">
                            Item #{idx + 1}
                          </span>
                          {formItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-[#888888] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Material Name (e.g. Portland Cement 42.5R)"
                            value={item.materialName}
                            onChange={(e) => handleItemChange(idx, "materialName", e.target.value)}
                            className="w-full bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-lg p-2 text-xs text-[#000000] dark:text-[#FFFFFF]"
                          />
                          <input
                            type="text"
                            placeholder="Engineering Spec (e.g. Grade 60, ASTM A615)"
                            value={item.specifications}
                            onChange={(e) => handleItemChange(idx, "specifications", e.target.value)}
                            className="w-full bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-lg p-2 text-xs text-[#000000] dark:text-[#FFFFFF]"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <select
                            value={item.unitOfMeasure}
                            onChange={(e) => handleItemChange(idx, "unitOfMeasure", e.target.value)}
                            className="w-full bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-lg p-2 text-xs text-[#000000] dark:text-[#FFFFFF]"
                          >
                            {STANDARD_UNITS.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            placeholder="Quantity"
                            value={item.requestedQuantity}
                            onChange={(e) => handleItemChange(idx, "requestedQuantity", Number(e.target.value))}
                            className="w-full bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-lg p-2 text-xs text-[#000000] dark:text-[#FFFFFF]"
                          />
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="Est. Unit Cost (ETB)"
                            value={item.estimatedUnitCost}
                            onChange={(e) => handleItemChange(idx, "estimatedUnitCost", Number(e.target.value))}
                            className="w-full bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-lg p-2 text-xs text-[#000000] dark:text-[#FFFFFF]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030]">
                    <span className="text-xs font-semibold uppercase font-mono">Estimated Requisition Total:</span>
                    <span className="text-base font-extrabold font-mono text-[#000000] dark:text-[#FFFFFF]">
                      {fmt(formTotalEstimated)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D4D4D4] dark:border-[#303030]">
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#D4D4D4] dark:border-[#303030] text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formBusy}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold"
                  >
                    {formBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    <span>Submit Requisition</span>
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
