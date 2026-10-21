"use client";

import React, { useState, useMemo } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, ShoppingCart, CheckCircle,
  Truck, Package, AlertCircle, FileText, X, Loader2
} from "lucide-react";
import { useRecords } from "@/hooks/useRecords";

interface PurchaseOrder {
  _id: string;
  poNumber: string;
  supplier: { name: string; contact: string };
  project: { name: string };
  status: "Draft" | "Sent" | "Confirmed" | "Partially Received" | "Received" | "Cancelled";
  items: Array<{
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
  }>;
  orderDate: string;
  expectedDelivery: string;
  totalAmount: number;
  paymentTerms: string;
  notes?: string;
}

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Sent: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Confirmed: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  "Partially Received": "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Received: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Cancelled: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  Draft: <FileText size={12} />,
  Sent: <ShoppingCart size={12} />,
  Confirmed: <CheckCircle size={12} />,
  "Partially Received": <Package size={12} />,
  Received: <Truck size={12} />,
  Cancelled: <AlertCircle size={12} />,
};

export default function PurchaseOrdersPage() {
  const { records, projects, loading, create } = useRecords("procurement");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState<PurchaseOrder | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    poNumber: "",
    projectId: "",
    supplierName: "",
    supplierContact: "+251-911-000000",
    itemDescription: "High-Tensile Reinforcement Rebar 16mm",
    quantity: "50",
    unit: "tons",
    unitPrice: "85000",
    deliveryDate: "",
    paymentTerms: "Net 30",
  });

  const orders: PurchaseOrder[] = useMemo(() => {
    return records.map((r) => {
      const d = r.data || {};
      const projMatch = projects.find((p) => p._id === r.projectId);
      const items = Array.isArray(d.items) && d.items.length > 0
        ? d.items
        : [
            {
              description: d.itemDescription || r.title || "Materials Order",
              quantity: Number(d.quantity) || 1,
              unit: d.unit || "units",
              unitPrice: Number(d.unitPrice) || 0,
              totalPrice: Number(d.totalAmount ?? d.totalPrice) || 0,
            },
          ];

      return {
        _id: r._id,
        poNumber: d.poNumber || `PO-${r._id.slice(-5).toUpperCase()}`,
        supplier: {
          name: d.supplierName || d.supplier || "Vendor / Supplier",
          contact: d.supplierContact || "+251-911-000000",
        },
        project: {
          name: projMatch ? projMatch.name : d.projectName || "Enterprise Site",
        },
        status: (r.status as PurchaseOrder["status"]) || (d.status as PurchaseOrder["status"]) || "Sent",
        items,
        orderDate: d.orderDate || (r.createdAt ? r.createdAt.split("T")[0] : new Date().toISOString().split("T")[0]),
        expectedDelivery: d.expectedDelivery || d.deliveryDate || "",
        totalAmount: Number(d.totalAmount ?? d.totalPrice) || 0,
        paymentTerms: d.paymentTerms || "Net 30",
        notes: d.notes,
      };
    });
  }, [records, projects]);

  const openCreateModal = () => {
    const delivery = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];
    const defaultProject = projects[0]?._id || "";
    setForm({
      poNumber: `PO-${Date.now().toString(36).toUpperCase()}`,
      projectId: defaultProject,
      supplierName: "",
      supplierContact: "+251-911-000000",
      itemDescription: "Portland Cement (50kg bags)",
      quantity: "500",
      unit: "bags",
      unitPrice: "1650",
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
      await create({
        projectId: chosenProjectId,
        title: form.itemDescription,
        status: "Sent",
        data: {
          poNumber: form.poNumber,
          supplierName: form.supplierName,
          supplierContact: form.supplierContact,
          itemDescription: form.itemDescription,
          quantity: qty,
          unit: form.unit,
          unitPrice: price,
          totalAmount: total,
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

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.supplier.name.toLowerCase().includes(search.toLowerCase()) ||
      o.project.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => ["Sent", "Confirmed"].includes(o.status)).length,
    received: orders.filter((o) => o.status === "Received").length,
    totalValue: orders.reduce((s, o) => s + o.totalAmount, 0),
  };

  const fmt = (n: number) =>
    `ETB ${n.toLocaleString("en-ET", { minimumFractionDigits: 2 })}`;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#666666] dark:text-[#A3A3A3] font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <ShoppingCart className="w-4 h-4" /> Material Procurement &amp; Logistics
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
              Purchase Orders
            </h1>
            <p className="text-xs sm:text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
              Track and manage all procurement purchase orders, delivery schedules, and contracts
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all self-start sm:self-auto shrink-0"
          >
            <Plus size={16} />
            Create PO
          </button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4 shadow-xs">
            <span className="text-xs text-[#666666] dark:text-[#A3A3A3] font-mono uppercase tracking-wider">Total Orders</span>
            <div className="text-2xl font-black text-[#000000] dark:text-[#FFFFFF] mt-1">{stats.total}</div>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4 shadow-xs">
            <span className="text-xs text-[#666666] dark:text-[#A3A3A3] font-mono uppercase tracking-wider">Pending Delivery</span>
            <div className="text-2xl font-black text-[#000000] dark:text-[#FFFFFF] mt-1">{stats.pending}</div>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4 shadow-xs">
            <span className="text-xs text-[#666666] dark:text-[#A3A3A3] font-mono uppercase tracking-wider">Completed Receipts</span>
            <div className="text-2xl font-black text-[#000000] dark:text-[#FFFFFF] mt-1">{stats.received}</div>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4 shadow-xs">
            <span className="text-xs text-[#666666] dark:text-[#A3A3A3] font-mono uppercase tracking-wider">Committed Capital</span>
            <div className="text-xl font-black text-[#000000] dark:text-[#FFFFFF] mt-1">{fmt(stats.totalValue)}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666] dark:text-[#A3A3A3]" />
            <input
              type="text"
              placeholder="Search by PO number, supplier, or project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FFFFFF] dark:bg-[#1F1F1F] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] text-xs rounded-xl pl-9 pr-4 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {["All", "Draft", "Sent", "Confirmed", "Partially Received", "Received", "Cancelled"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === st
                    ? "bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] font-bold"
                    : "bg-[#FFFFFF] dark:bg-[#1F1F1F] text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Loading / Empty / Table */}
        {loading ? (
          <div className="p-12 text-center text-xs text-[#666666] dark:text-[#A3A3A3] animate-pulse">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#000000] dark:text-[#FFFFFF]" />
            Loading purchase orders from database...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#1F1F1F] p-12 text-center">
            <ShoppingCart className="w-10 h-10 text-[#666666] dark:text-[#A3A3A3] mx-auto mb-3" />
            <h3 className="text-base font-semibold text-[#000000] dark:text-[#FFFFFF]">
              {search || statusFilter !== "All" ? "No matching purchase orders" : "No purchase orders recorded"}
            </h3>
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3] mt-1">
              Issue your first purchase order to initiate procurement and delivery tracking.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold rounded-xl"
            >
              <Plus size={14} /> Create Purchase Order
            </button>
          </div>
        ) : (
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#D4D4D4] dark:border-[#303030] bg-[#F5F5F5] dark:bg-[#171717] font-mono text-[#666666] dark:text-[#A3A3A3]">
                    <th className="py-3 px-4">PO Number</th>
                    <th className="py-3 px-4">Project</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Order Date</th>
                    <th className="py-3 px-4">Delivery Due</th>
                    <th className="py-3 px-4 text-right">Total Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
                  {filtered.map((order) => (
                    <tr
                      key={order._id}
                      onClick={() => setSelected(order)}
                      className="cursor-pointer hover:bg-[#FAFAFA] dark:hover:bg-[#171717] transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#000000] dark:text-[#FFFFFF]">
                        {order.poNumber}
                      </td>
                      <td className="py-3.5 px-4 text-[#000000] dark:text-[#FFFFFF] font-medium">
                        {order.project.name}
                      </td>
                      <td className="py-3.5 px-4 text-[#666666] dark:text-[#A3A3A3]">
                        {order.supplier.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#666666] dark:text-[#A3A3A3]">
                        {order.orderDate}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#666666] dark:text-[#A3A3A3]">
                        {order.expectedDelivery || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#000000] dark:text-[#FFFFFF]">
                        {fmt(order.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_COLORS[order.status] || STATUS_COLORS.Draft}`}>
                          {STATUS_ICONS[order.status]}
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: View Details */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#D4D4D4] dark:border-[#303030]">
                <div>
                  <h3 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF] font-mono">
                    {selected.poNumber}
                  </h3>
                  <p className="text-xs text-[#666666] dark:text-[#A3A3A3] mt-0.5">
                    {selected.project.name}
                  </p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="text-[#666666] hover:text-[#000000] dark:text-[#A3A3A3] dark:hover:text-[#FFFFFF]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#666666] dark:text-[#A3A3A3]">Supplier:</span>
                  <div className="font-bold text-[#000000] dark:text-[#FFFFFF]">{selected.supplier.name}</div>
                  <div className="text-[11px] text-[#888888]">{selected.supplier.contact}</div>
                </div>
                <div>
                  <span className="text-[#666666] dark:text-[#A3A3A3]">Delivery Date:</span>
                  <div className="font-mono font-bold text-[#000000] dark:text-[#FFFFFF]">{selected.expectedDelivery || "—"}</div>
                  <div className="text-[11px] text-[#888888]">Terms: {selected.paymentTerms}</div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-[#D4D4D4] dark:border-[#303030] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F5F5F5] dark:bg-[#171717] font-mono text-[#666666] dark:text-[#A3A3A3]">
                    <tr>
                      <th className="p-2.5">Item Description</th>
                      <th className="p-2.5 text-right">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
                    {selected.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 text-[#000000] dark:text-[#FFFFFF]">{it.description}</td>
                        <td className="p-2.5 text-right font-mono">{it.quantity} {it.unit}</td>
                        <td className="p-2.5 text-right font-mono">{fmt(it.unitPrice)}</td>
                        <td className="p-2.5 text-right font-mono font-bold">{fmt(it.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center pt-2 font-mono">
                <span className="text-xs font-semibold text-[#666666] dark:text-[#A3A3A3]">Order Total:</span>
                <span className="text-base font-black text-[#000000] dark:text-[#FFFFFF]">{fmt(selected.totalAmount)}</span>
              </div>

              <div className="pt-3 border-t border-[#D4D4D4] dark:border-[#303030] flex justify-end">
                <button
                  onClick={() => setSelected(null)}
                  className="px-4 py-2 bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Create PO */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#D4D4D4] dark:border-[#303030]">
                <h3 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">
                  Create Purchase Order
                </h3>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="text-[#666666] hover:text-[#000000] dark:text-[#A3A3A3] dark:hover:text-[#FFFFFF]"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
                <div>
                  <label className="text-[#444444] dark:text-[#A3A3A3] font-semibold block mb-1">Select Construction Project</label>
                  <select
                    value={form.projectId}
                    onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                    required
                    className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none"
                  >
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>{p.name} ({p.projectCode || "PRJ"})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#444444] dark:text-[#A3A3A3] font-semibold block mb-1">Supplier / Vendor Name</label>
                    <input
                      required
                      placeholder="e.g. Tekle Steel Works"
                      value={form.supplierName}
                      onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[#444444] dark:text-[#A3A3A3] font-semibold block mb-1">Contact Phone</label>
                    <input
                      value={form.supplierContact}
                      onChange={(e) => setForm({ ...form, supplierContact: e.target.value })}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[#444444] dark:text-[#A3A3A3] font-semibold block mb-1">Material / Item Specification</label>
                  <input
                    required
                    value={form.itemDescription}
                    onChange={(e) => setForm({ ...form, itemDescription: e.target.value })}
                    className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[#444444] dark:text-[#A3A3A3] font-semibold block mb-1">Quantity</label>
                    <input
                      required
                      type="number"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[#444444] dark:text-[#A3A3A3] font-semibold block mb-1">Unit</label>
                    <input
                      value={form.unit}
                      onChange={(e) => setForm({ ...form, unit: e.target.value })}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[#444444] dark:text-[#A3A3A3] font-semibold block mb-1">Unit Price (ETB)</label>
                    <input
                      required
                      type="number"
                      value={form.unitPrice}
                      onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#444444] dark:text-[#A3A3A3] font-semibold block mb-1">Expected Delivery Date</label>
                    <input
                      type="date"
                      value={form.deliveryDate}
                      onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[#444444] dark:text-[#A3A3A3] font-semibold block mb-1">Payment Terms</label>
                    <input
                      value={form.paymentTerms}
                      onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] outline-none"
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-[#FAFAFA] dark:bg-[#171717] rounded-xl border border-[#D4D4D4] dark:border-[#303030] flex justify-between items-center font-mono">
                  <span className="text-[#666666] dark:text-[#A3A3A3]">Total Order Value:</span>
                  <span className="text-sm font-bold text-[#000000] dark:text-[#FFFFFF]">
                    {fmt((parseFloat(form.quantity) || 0) * (parseFloat(form.unitPrice) || 0))}
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#D4D4D4] dark:border-[#303030]">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs font-semibold hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] transition-colors"
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
      </div>
    </AppShell>
  );
}
