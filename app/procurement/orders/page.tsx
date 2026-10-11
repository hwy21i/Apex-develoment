"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, Eye, ShoppingCart, CheckCircle, Clock,
  Truck, Package, AlertCircle, FileText, ChevronDown, X
} from "lucide-react";

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
  Draft: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
  Sent: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  Confirmed: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  "Partially Received": "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  Received: "bg-green-500/20 text-green-400 border border-green-500/30",
  Cancelled: "bg-red-500/20 text-red-400 border border-red-500/30",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  Draft: <FileText size={12} />,
  Sent: <ShoppingCart size={12} />,
  Confirmed: <CheckCircle size={12} />,
  "Partially Received": <Package size={12} />,
  Received: <Truck size={12} />,
  Cancelled: <AlertCircle size={12} />,
};

const MOCK_POS: PurchaseOrder[] = [
  {
    _id: "1",
    poNumber: "PO-2024-0001",
    supplier: { name: "Addis Construction Supply Co.", contact: "+251-11-234-5678" },
    project: { name: "Addis Heights Tower" },
    status: "Confirmed",
    items: [
      { description: "Portland Cement (50kg bags)", quantity: 500, unit: "bags", unitPrice: 1500, totalPrice: 750000 },
      { description: "Steel Rebar 16mm", quantity: 20, unit: "tons", unitPrice: 30000, totalPrice: 600000 },
    ],
    orderDate: "2024-01-29",
    expectedDelivery: "2024-02-10",
    totalAmount: 1350000,
    paymentTerms: "Net 30",
  },
  {
    _id: "2",
    poNumber: "PO-2024-0002",
    supplier: { name: "Ethiopian Aggregate Industries", contact: "+251-11-345-6789" },
    project: { name: "Ring Road Expansion" },
    status: "Received",
    items: [
      { description: "Crushed Stone 20mm", quantity: 150, unit: "m³", unitPrice: 1500, totalPrice: 225000 },
    ],
    orderDate: "2024-01-26",
    expectedDelivery: "2024-02-05",
    totalAmount: 225000,
    paymentTerms: "50% advance, 50% on delivery",
  },
  {
    _id: "3",
    poNumber: "PO-2024-0003",
    supplier: { name: "Tekle Steel Works", contact: "+251-11-456-7890" },
    project: { name: "Bole Business Park" },
    status: "Partially Received",
    items: [
      { description: "H-Beam Steel 200x200", quantity: 30, unit: "tons", unitPrice: 65000, totalPrice: 1950000 },
      { description: "Steel Columns", quantity: 20, unit: "tons", unitPrice: 62000, totalPrice: 1240000 },
    ],
    orderDate: "2024-01-15",
    expectedDelivery: "2024-01-31",
    totalAmount: 3190000,
    paymentTerms: "Net 45",
  },
  {
    _id: "4",
    poNumber: "PO-2024-0004",
    supplier: { name: "SafeGuard Ethiopia", contact: "+251-11-567-8901" },
    project: { name: "Addis Heights Tower" },
    status: "Sent",
    items: [
      { description: "Safety Helmets (Class A)", quantity: 50, unit: "pcs", unitPrice: 850, totalPrice: 42500 },
      { description: "Safety Boots Size 40-45", quantity: 50, unit: "pairs", unitPrice: 1200, totalPrice: 60000 },
    ],
    orderDate: "2024-01-30",
    expectedDelivery: "2024-02-15",
    totalAmount: 102500,
    paymentTerms: "On delivery",
    notes: "Ensure EN 397 certified helmets",
  },
  {
    _id: "5",
    poNumber: "PO-2024-0005",
    supplier: { name: "Bitumen Ethiopia Ltd.", contact: "+251-11-678-9012" },
    project: { name: "Ring Road Expansion" },
    status: "Draft",
    items: [
      { description: "Bitumen 80/100", quantity: 80, unit: "tons", unitPrice: 9500, totalPrice: 760000 },
    ],
    orderDate: "2024-02-01",
    expectedDelivery: "2024-02-20",
    totalAmount: 760000,
    paymentTerms: "Net 30",
  },
];

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>(MOCK_POS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState<PurchaseOrder | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [form, setForm] = useState({
    poNumber: `PO-2024-000${orders.length + 1}`,
    supplierName: "",
    supplierContact: "+251-911-000000",
    projectName: "Addis Heights Tower",
    itemDescription: "High-Tensile Reinforcement Rebar 16mm",
    quantity: "50",
    unit: "tons",
    unitPrice: "85000",
    deliveryDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    paymentTerms: "Net 30",
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplierName || !form.itemDescription) return;
    const qty = parseFloat(form.quantity) || 1;
    const price = parseFloat(form.unitPrice) || 0;
    const total = qty * price;

    const newOrder: PurchaseOrder = {
      _id: `po-${Date.now()}`,
      poNumber: form.poNumber,
      supplier: { name: form.supplierName, contact: form.supplierContact },
      project: { name: form.projectName },
      status: "Sent",
      items: [
        {
          description: form.itemDescription,
          quantity: qty,
          unit: form.unit,
          unitPrice: price,
          totalPrice: total,
        },
      ],
      orderDate: new Date().toISOString().split("T")[0],
      expectedDelivery: form.deliveryDate,
      totalAmount: total,
      paymentTerms: form.paymentTerms,
    };

    setOrders([newOrder, ...orders]);
    setIsCreateOpen(false);
    setForm({
      poNumber: `PO-2024-000${orders.length + 2}`,
      supplierName: "",
      supplierContact: "+251-911-000000",
      projectName: "Addis Heights Tower",
      itemDescription: "High-Tensile Reinforcement Rebar 16mm",
      quantity: "50",
      unit: "tons",
      unitPrice: "85000",
      deliveryDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      paymentTerms: "Net 30",
    });
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
            <div className="flex items-center gap-2 text-[#C0C8CA] font-mono text-xs font-bold uppercase tracking-wider mb-1">
              <ShoppingCart className="w-4 h-4" /> Material Procurement &amp; Logistics
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[#D4D8DD] tracking-tight">
              Purchase Orders
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#AAB7B7] mt-1">
              Track and manage all procurement purchase orders, delivery schedules, and contracts
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 bg-[#C0C8CA] hover:bg-white text-[#1A2D42] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all self-start sm:self-auto shrink-0"
          >
            <Plus size={16} />
            Create PO
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Orders", value: stats.total, icon: ShoppingCart, color: "text-[#C0C8CA]" },
            { label: "In Progress", value: stats.pending, icon: Clock, color: "text-amber-500 dark:text-amber-400" },
            { label: "Fully Received", value: stats.received, icon: Truck, color: "text-emerald-500 dark:text-emerald-400" },
            { label: "Total PO Value", value: fmt(stats.totalValue), icon: FileText, color: "text-blue-500 dark:text-blue-400" },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-[#1A2D42] border border-slate-200 dark:border-[#AAB7B7]/25 rounded-2xl p-4 sm:p-5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#2E4156]/50 shrink-0">
                  <s.icon size={20} className={s.color} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-[#AAB7B7] uppercase tracking-wider">{s.label}</p>
                  <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-[#D4D8DD] mt-0.5">{s.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#AAB7B7]" />
            <input
              type="text"
              placeholder="Search purchase orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-[#1A2D42] border border-slate-200 dark:border-[#AAB7B7]/25 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-[#D4D8DD] placeholder-slate-400 dark:placeholder-[#AAB7B7]/50 focus:outline-none focus:border-[#C0C8CA] shadow-xs"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white dark:bg-[#1A2D42] border border-slate-200 dark:border-[#AAB7B7]/25 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#D4D8DD] focus:outline-none focus:border-[#C0C8CA] shadow-xs"
          >
            {["All", "Draft", "Sent", "Confirmed", "Partially Received", "Received", "Cancelled"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-[#1A2D42] border border-slate-200 dark:border-[#AAB7B7]/25 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-[#2E4156]/40 border-b border-slate-200 dark:border-[#AAB7B7]/25">
                <tr>
                  {["PO Number", "Supplier", "Project", "Order Date", "Expected Delivery", "Total Amount", "Payment Terms", "Status", ""].map((h) => (
                    <th key={h} className="text-left text-[11px] font-bold text-slate-500 dark:text-[#AAB7B7] uppercase tracking-wider px-4 py-3.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2E4156]/50">
                {filtered.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50 dark:hover:bg-[#2E4156]/20 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-[#C0C8CA] font-bold text-xs">{o.poNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-slate-900 dark:text-[#D4D8DD] font-semibold">{o.supplier.name}</p>
                        <p className="text-slate-400 dark:text-[#AAB7B7] text-[11px]">{o.supplier.contact}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-[#D4D8DD]">{o.project.name}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-[#AAB7B7]">{new Date(o.orderDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-[#AAB7B7]">{new Date(o.expectedDelivery).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-slate-900 dark:text-[#D4D8DD] font-bold">{fmt(o.totalAmount)}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-[#AAB7B7] text-xs">{o.paymentTerms}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium w-fit ${STATUS_COLORS[o.status]}`}>
                        {STATUS_ICONS[o.status]}
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelected(selected?._id === o._id ? null : o)}
                        className="text-[#C0C8CA] hover:text-white hover:bg-[#2E4156] p-1.5 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="bg-white dark:bg-[#1A2D42] border border-slate-200 dark:border-[#AAB7B7]/25 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2E4156]">
              <h2 className="text-base font-bold text-slate-900 dark:text-[#D4D8DD] font-mono">{selected.poNumber} — Details</h2>
              <button onClick={() => setSelected(null)} className="text-slate-400 dark:text-[#AAB7B7] hover:text-white text-xs font-semibold px-2 py-1 rounded-lg hover:bg-[#2E4156]">Close ✕</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div><p className="text-slate-500 dark:text-[#AAB7B7]">Supplier</p><p className="text-slate-900 dark:text-[#D4D8DD] font-semibold mt-0.5">{selected.supplier.name}</p></div>
              <div><p className="text-slate-500 dark:text-[#AAB7B7]">Contact</p><p className="text-slate-700 dark:text-[#D4D8DD] mt-0.5">{selected.supplier.contact}</p></div>
              <div><p className="text-slate-500 dark:text-[#AAB7B7]">Payment Terms</p><p className="text-slate-700 dark:text-[#D4D8DD] mt-0.5">{selected.paymentTerms}</p></div>
              <div><p className="text-slate-500 dark:text-[#AAB7B7]">Total</p><p className="text-emerald-500 dark:text-emerald-400 font-bold mt-0.5">{fmt(selected.totalAmount)}</p></div>
            </div>
            {selected.notes && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-amber-600 dark:text-amber-400 text-xs">
                <strong>Notes:</strong> {selected.notes}
              </div>
            )}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#AAB7B7] mb-2">Line Items</h3>
              <table className="w-full text-xs">
                <thead className="text-slate-500 dark:text-[#AAB7B7] text-[11px] border-b border-slate-100 dark:border-[#2E4156]">
                  <tr>
                    <th className="text-left py-2">Description</th>
                    <th className="text-right py-2">Qty</th>
                    <th className="text-right py-2">Unit</th>
                    <th className="text-right py-2">Unit Price</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#2E4156]/50">
                  {selected.items.map((item, i) => (
                    <tr key={i}>
                      <td className="py-2.5 text-slate-900 dark:text-[#D4D8DD]">{item.description}</td>
                      <td className="py-2.5 text-right text-slate-600 dark:text-[#AAB7B7]">{item.quantity}</td>
                      <td className="py-2.5 text-right text-slate-600 dark:text-[#AAB7B7]">{item.unit}</td>
                      <td className="py-2.5 text-right text-slate-600 dark:text-[#AAB7B7]">{fmt(item.unitPrice)}</td>
                      <td className="py-2.5 text-right text-slate-900 dark:text-[#D4D8DD] font-semibold">{fmt(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 dark:border-[#2E4156]">
                    <td colSpan={4} className="py-2.5 text-right text-slate-500 dark:text-[#AAB7B7] font-semibold">Grand Total</td>
                    <td className="py-2.5 text-right text-emerald-500 dark:text-emerald-400 font-bold">{fmt(selected.totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Create PO Modal */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#1A2D42] border border-slate-200 dark:border-[#AAB7B7]/25 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2E4156]">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#2E4156] text-[#C0C8CA] border border-[#AAB7B7]/25">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-[#D4D8DD]">Generate Purchase Order</h3>
                    <p className="text-xs text-slate-500 dark:text-[#AAB7B7]">Issue commercial contract order for material procurement</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-[#AAB7B7] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2E4156] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 dark:text-[#AAB7B7] font-semibold block mb-1">PO #</label>
                    <input
                      required
                      value={form.poNumber}
                      onChange={(e) => setForm({ ...form, poNumber: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-[#1A2D42]/90 border border-slate-200 dark:border-[#AAB7B7]/25 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#D4D8DD] font-mono focus:border-[#C0C8CA] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 dark:text-[#AAB7B7] font-semibold block mb-1">Target Project</label>
                    <input
                      required
                      value={form.projectName}
                      onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-[#1A2D42]/90 border border-slate-200 dark:border-[#AAB7B7]/25 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#D4D8DD] focus:border-[#C0C8CA] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 dark:text-[#AAB7B7] font-semibold block mb-1">Supplier Company</label>
                    <input
                      required
                      placeholder="e.g. Tekle Steel Works Plc"
                      value={form.supplierName}
                      onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-[#1A2D42]/90 border border-slate-200 dark:border-[#AAB7B7]/25 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#D4D8DD] placeholder-slate-400 dark:placeholder-[#AAB7B7]/50 focus:border-[#C0C8CA] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 dark:text-[#AAB7B7] font-semibold block mb-1">Contact Phone</label>
                    <input
                      value={form.supplierContact}
                      onChange={(e) => setForm({ ...form, supplierContact: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-[#1A2D42]/90 border border-slate-200 dark:border-[#AAB7B7]/25 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#D4D8DD] focus:border-[#C0C8CA] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-700 dark:text-[#AAB7B7] font-semibold block mb-1">Item Description / Spec</label>
                  <input
                    required
                    value={form.itemDescription}
                    onChange={(e) => setForm({ ...form, itemDescription: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#1A2D42]/90 border border-slate-200 dark:border-[#AAB7B7]/25 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#D4D8DD] focus:border-[#C0C8CA] outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-700 dark:text-[#AAB7B7] font-semibold block mb-1">Quantity</label>
                    <input
                      required
                      type="number"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-[#1A2D42]/90 border border-slate-200 dark:border-[#AAB7B7]/25 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#D4D8DD] focus:border-[#C0C8CA] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 dark:text-[#AAB7B7] font-semibold block mb-1">Unit</label>
                    <input
                      value={form.unit}
                      onChange={(e) => setForm({ ...form, unit: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-[#1A2D42]/90 border border-slate-200 dark:border-[#AAB7B7]/25 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#D4D8DD] focus:border-[#C0C8CA] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 dark:text-[#AAB7B7] font-semibold block mb-1">Unit Price (ETB)</label>
                    <input
                      required
                      type="number"
                      value={form.unitPrice}
                      onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-[#1A2D42]/90 border border-slate-200 dark:border-[#AAB7B7]/25 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#D4D8DD] focus:border-[#C0C8CA] outline-none font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 dark:text-[#AAB7B7] font-semibold block mb-1">Expected Delivery</label>
                    <input
                      type="date"
                      value={form.deliveryDate}
                      onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-[#1A2D42]/90 border border-slate-200 dark:border-[#AAB7B7]/25 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#D4D8DD] focus:border-[#C0C8CA] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 dark:text-[#AAB7B7] font-semibold block mb-1">Payment Terms</label>
                    <input
                      value={form.paymentTerms}
                      onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-[#1A2D42]/90 border border-slate-200 dark:border-[#AAB7B7]/25 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#D4D8DD] focus:border-[#C0C8CA] outline-none"
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-[#2E4156]/30 rounded-xl border border-slate-200 dark:border-[#AAB7B7]/25 flex justify-between items-center">
                  <span className="text-slate-500 dark:text-[#AAB7B7]">Total Purchase Order Value:</span>
                  <span className="text-sm font-bold text-[#C0C8CA]">
                    {fmt((parseFloat(form.quantity) || 0) * (parseFloat(form.unitPrice) || 0))}
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#2E4156]">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#AAB7B7]/25 text-slate-700 dark:text-[#D4D8DD] text-xs font-semibold hover:bg-slate-100 dark:hover:bg-[#2E4156] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#C0C8CA] hover:bg-white text-[#1A2D42] text-xs font-bold shadow-md transition-all"
                  >
                    Issue Purchase Order
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
