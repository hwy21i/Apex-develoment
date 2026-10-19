"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ShoppingBag,
  Plus,
  Search,
  CheckCircle2,
  X,
  Trash2,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters/currency";
import { useRecords } from "@/hooks/useRecords";

interface OrderItem {
  _id: string;
  orderNumber: string;
  supplier: string;
  itemDescription: string;
  category: string;
  quantity: number;
  unit: string;
  totalAmount: number;
  orderDate: string;
  expectedDelivery?: string;
  status: "REQUESTED" | "APPROVED" | "ORDERED" | "DELIVERED" | "REJECTED";
}

const STATUSES = ["ALL", "REQUESTED", "APPROVED", "ORDERED", "DELIVERED", "REJECTED"];

export default function ProjectProcurementPage() {
  const params = useParams();
  const projectId = String(params?.projectId || "");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const {
    records: procurementRecords,
    loading,
    reload: reloadProcurement,
    create: createProcurementRecord,
    update: updateProcurementRecord,
    remove: removeProcurementRecord,
  } = useRecords("procurement", projectId);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formSupplier, setFormSupplier] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("Cement & Aggregates");
  const [formQty, setFormQty] = useState("500");
  const [formUnit, setFormUnit] = useState("bags");
  const [formAmount, setFormAmount] = useState("425000");
  const [formExpectedDate, setFormExpectedDate] = useState("");

  const orders: OrderItem[] = useMemo(() => {
    return procurementRecords.map((r) => {
      const d = r.data || {};
      return {
        _id: r._id,
        orderNumber: d.orderNumber || r.title || `PO-${r._id.slice(-5).toUpperCase()}`,
        supplier: d.supplier || "Vendor / Supplier",
        itemDescription: d.itemDescription || r.title || "Materials Order",
        category: d.category || "General Materials",
        quantity: Number(d.quantity) || 0,
        unit: d.unit || "units",
        totalAmount: Number(d.totalAmount ?? d.estimatedCost) || 0,
        orderDate: d.orderDate || (r.createdAt ? r.createdAt.split("T")[0] : new Date().toISOString().split("T")[0]),
        expectedDelivery: d.expectedDelivery,
        status: (r.status as OrderItem["status"]) || (d.status as OrderItem["status"]) || "REQUESTED",
      };
    });
  }, [procurementRecords]);

  const stats = useMemo(() => {
    const total = orders.length;
    const totalCommitted = orders
      .filter((o) => o.status === "ORDERED" || o.status === "DELIVERED")
      .reduce((acc, o) => acc + o.totalAmount, 0);
    const pendingOrders = orders.filter((o) => o.status === "REQUESTED" || o.status === "APPROVED").length;
    const deliveredCount = orders.filter((o) => o.status === "DELIVERED").length;
    return { total, totalCommitted, pendingOrders, deliveredCount };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter !== "ALL" && order.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          order.orderNumber.toLowerCase().includes(q) ||
          order.supplier.toLowerCase().includes(q) ||
          order.itemDescription.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [orders, statusFilter, search]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSupplier.trim() || !formDescription.trim()) {
      setFeedback({ type: "error", message: "Supplier and description are required." });
      return;
    }

    try {
      setSubmitting(true);
      const poNum = `PO-${Date.now().toString().slice(-6)}`;
      const amtNum = Number(formAmount) || 0;

      await createProcurementRecord({
        projectId,
        title: `${poNum}: ${formSupplier.trim()} - ${formDescription.trim()}`,
        status: "REQUESTED",
        data: {
          orderNumber: poNum,
          supplier: formSupplier.trim(),
          itemDescription: formDescription.trim(),
          category: formCategory,
          quantity: Number(formQty) || 0,
          unit: formUnit,
          totalAmount: amtNum,
          orderDate: new Date().toISOString().split("T")[0],
          expectedDelivery: formExpectedDate || undefined,
          status: "REQUESTED",
        },
      });

      setFeedback({ type: "success", message: `Procurement order ${poNum} created.` });
      setShowAddModal(false);
      setFormSupplier("");
      setFormDescription("");
      reloadProcurement();
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error creating order" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (order: OrderItem, newStatus: OrderItem["status"]) => {
    try {
      await updateProcurementRecord(order._id, {
        status: newStatus,
        data: { status: newStatus },
      });
      setFeedback({ type: "success", message: `Order marked as ${newStatus}.` });
      reloadProcurement();
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Error updating status" });
    }
  };

  const handleDeleteOrder = async () => {
    if (!deletingId) return;
    try {
      setSubmitting(true);
      await removeProcurementRecord(deletingId);
      setFeedback({ type: "success", message: "Order removed." });
      setShowDeleteModal(false);
      setDeletingId(null);
      reloadProcurement();
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Failed to delete order" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border text-sm transition-all ${
            feedback.type === "success"
              ? "bg-[#FAFAFA] dark:bg-[#111111] border-[#000000] dark:border-[#FFFFFF] text-[#000000] dark:text-[#FFFFFF]"
              : "bg-[#FAFAFA] dark:bg-[#111111] border-[#303030] text-[#000000] dark:text-[#FFFFFF]"
          }`}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#000000] dark:text-[#FFFFFF]" />
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-md text-[#666666] dark:text-[#A3A3A3]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header and Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4D4D4] dark:border-[#303030]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]">
              Supply Chain & Vendor Requisitions
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#000000] dark:text-[#FFFFFF]">
            Project Procurement
          </h2>
          <p className="text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
            Purchase requests, supplier quotations, committed purchase orders, and delivery tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/procurement"
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] text-[#000000] dark:text-[#FFFFFF] hover:bg-[#FAFAFA] dark:hover:bg-[#171717] transition-colors"
          >
            All Company POs
          </Link>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Purchase Request
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Total Orders</p>
          <p className="text-2xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">{stats.total}</p>
        </div>
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Committed Value</p>
          <p className="text-xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">
            {formatCurrency(stats.totalCommitted)}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Pending Fulfillment</p>
          <p className="text-2xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">{stats.pendingOrders}</p>
        </div>
        <div className="p-4 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <p className="text-xs font-medium text-[#666666] dark:text-[#A3A3A3]">Delivered to Site</p>
          <p className="text-2xl font-bold font-mono text-[#000000] dark:text-[#FFFFFF] mt-1">{stats.deliveredCount}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] dark:text-[#A3A3A3]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search PO #, supplier, or items..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "All Statuses" : s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 border border-[#D4D4D4] dark:border-[#303030] rounded-xl bg-[#FFFFFF] dark:bg-[#111111]">
          <Loader2 className="w-7 h-7 animate-spin text-[#000000] dark:text-[#FFFFFF] mb-2" />
          <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Loading procurement orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-[#D4D4D4] dark:border-[#303030] rounded-xl bg-[#FFFFFF] dark:bg-[#111111]">
          <ShoppingBag className="w-10 h-10 text-[#666666] dark:text-[#A3A3A3] mb-3" />
          <h3 className="text-base font-semibold text-[#000000] dark:text-[#FFFFFF]">No purchase requests yet</h3>
          <p className="text-xs text-[#666666] dark:text-[#A3A3A3] max-w-sm mt-1 mb-5">
            Create material requisitions and purchase orders for cement, rebar, timber, and equipment.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000]"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create First Requisition
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] font-mono uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]">
                <th className="py-3 px-4 font-semibold">PO # / Supplier</th>
                <th className="py-3 px-4 font-semibold">Items Description</th>
                <th className="py-3 px-4 font-semibold text-right">Quantity</th>
                <th className="py-3 px-4 font-semibold text-right">Committed (ETB)</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
              {filteredOrders.map((order) => (
                <tr key={order._id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#171717] transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#000000] dark:text-[#FFFFFF]">{order.supplier}</div>
                    <div className="text-[10px] font-mono text-[#666666] dark:text-[#A3A3A3]">{order.orderNumber}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-[#000000] dark:text-[#FFFFFF]">{order.itemDescription}</div>
                    <div className="text-[10px] text-[#666666] dark:text-[#A3A3A3]">{order.category}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[#000000] dark:text-[#FFFFFF]">
                    {order.quantity.toLocaleString()} {order.unit}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#000000] dark:text-[#FFFFFF]">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] bg-black/5 dark:bg-white/5">
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {order.status === "REQUESTED" && (
                        <button
                          onClick={() => handleStatusUpdate(order, "APPROVED")}
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold border border-[#D4D4D4] dark:border-[#303030] hover:bg-black/5 dark:hover:bg-white/5 text-[#000000] dark:text-[#FFFFFF]"
                        >
                          Approve
                        </button>
                      )}
                      {order.status === "APPROVED" && (
                        <button
                          onClick={() => handleStatusUpdate(order, "ORDERED")}
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold border border-[#D4D4D4] dark:border-[#303030] hover:bg-black/5 dark:hover:bg-white/5 text-[#000000] dark:text-[#FFFFFF]"
                        >
                          Place Order
                        </button>
                      )}
                      {order.status === "ORDERED" && (
                        <button
                          onClick={() => handleStatusUpdate(order, "DELIVERED")}
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold border border-[#D4D4D4] dark:border-[#303030] hover:bg-black/5 dark:hover:bg-white/5 text-[#000000] dark:text-[#FFFFFF]"
                        >
                          Confirm Delivery
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setDeletingId(order._id);
                          setShowDeleteModal(true);
                        }}
                        className="p-1 rounded-md border border-[#D4D4D4] dark:border-[#303030] text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE ORDER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#D4D4D4] dark:border-[#303030]">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-[#000000] dark:text-[#FFFFFF]" />
                <h3 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">New Purchase Requisition</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Supplier / Vendor *
                </label>
                <input
                  type="text"
                  required
                  value={formSupplier}
                  onChange={(e) => setFormSupplier(e.target.value)}
                  placeholder="e.g. Muger Cement Enterprise"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Item Description *
                </label>
                <input
                  type="text"
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. High-tensile steel rebar Ø16mm grade 60"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Category *
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                >
                  <option value="Cement & Aggregates">Cement & Aggregates</option>
                  <option value="Steel & Rebar">Steel & Rebar</option>
                  <option value="Structural Timber">Structural Timber</option>
                  <option value="MEP & Piping">MEP & Piping</option>
                  <option value="Electrical Supplies">Electrical Supplies</option>
                  <option value="Finishing & Tiles">Finishing & Tiles</option>
                  <option value="Safety & Tools">Safety & Tools</option>
                  <option value="Heavy Equipment Rental">Heavy Equipment Rental</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formQty}
                    onChange={(e) => setFormQty(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                    Total Estimated ETB
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
                  Required On Site By
                </label>
                <input
                  type="date"
                  value={formExpectedDate}
                  onChange={(e) => setFormExpectedDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] font-mono focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D4D4D4] dark:border-[#303030]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold border border-[#D4D4D4] dark:border-[#303030] rounded-xl text-[#000000] dark:text-[#FFFFFF] hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2 text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] rounded-xl hover:opacity-90 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] p-6 shadow-2xl">
            <div className="flex items-center space-x-3 text-[#000000] dark:text-[#FFFFFF] mb-3">
              <div className="p-2 rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-black/5 dark:bg-white/5">
                <Trash2 className="w-5 h-5 text-[#000000] dark:text-[#FFFFFF]" />
              </div>
              <h3 className="text-base font-bold">Remove Order</h3>
            </div>
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] leading-relaxed">
              Are you sure you want to delete this procurement requisition?
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingId(null);
                }}
                className="px-4 py-2 text-xs font-semibold border border-[#D4D4D4] dark:border-[#303030] rounded-xl text-[#000000] dark:text-[#FFFFFF] hover:bg-black/5 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteOrder}
                className="inline-flex items-center px-4 py-2 text-xs font-bold bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] rounded-xl hover:opacity-90 disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                Confirm Deletion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
