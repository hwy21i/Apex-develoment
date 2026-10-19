"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, Eye, ShoppingCart, CheckCircle, Clock,
  Truck, Package, AlertCircle, FileText, X
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
    poNumber: "PO-2024-0005",
    supplierName: "",
    supplierContact: "+251-911-000000",
    projectName: "Addis Heights Tower",
    itemDescription: "High-Tensile Reinforcement Rebar 16mm",
    quantity: "50",
    unit: "tons",
    unitPrice: "85000",
    deliveryDate: "2024-03-15",
    paymentTerms: "Net 30",
  });

  const openCreateModal = () => {
    const delivery = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];
    setForm({
      poNumber: `PO-2024-000${orders.length + 1}`,
      supplierName: "",
      supplierContact: "+251-911-000000",
      projectName: "Addis Heights Tower",
      itemDescription: "High-Tensile Reinforcement Rebar 16mm",
      quantity: "50",
      unit: "tons",
      unitPrice: "85000",
      deliveryDate: delivery,
      paymentTerms: "Net 30",
    });
    setIsCreateOpen(true);
  };

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

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Orders", value: stats.total, icon: ShoppingCart, color: "text-[#666666] dark:text-[#A3A3A3]" },
            { label: "In Progress", value: stats.pending, icon: Clock, color: "text-[#000000] dark:text-[#FFFFFF] dark:text-[#000000] dark:text-[#FFFFFF]" },
            { label: "Fully Received", value: stats.received, icon: Truck, color: "text-[#000000] dark:text-[#FFFFFF] dark:text-[#000000] dark:text-[#FFFFFF]" },
            { label: "Total PO Value", value: fmt(stats.totalValue), icon: FileText, color: "text-[#000000] dark:text-[#FFFFFF] dark:text-[#000000] dark:text-[#FFFFFF]" },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-4 sm:p-5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#F5F5F5] dark:bg-[#1F1F1F] dark:bg-[#171717] shrink-0">
                  <s.icon size={20} className={s.color} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider">{s.label}</p>
                  <p className="text-lg sm:text-xl font-black text-[#000000] dark:text-[#FFFFFF] mt-0.5">{s.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888888] dark:text-[#888888] dark:text-[#A3A3A3]" />
            <input
              type="text"
              placeholder="Search purchase orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] placeholder-[#888888] dark:placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF] shadow-xs"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF] shadow-xs"
          >
            {["All", "Draft", "Sent", "Confirmed", "Partially Received", "Received", "Cancelled"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#171717] border-b border-[#D4D4D4] dark:border-[#303030]">
                <tr>
                  {["PO Number", "Supplier", "Project", "Order Date", "Expected Delivery", "Total Amount", "Payment Terms", "Status", ""].map((h) => (
                    <th key={h} className="text-left text-[11px] font-bold text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
                {filtered.map((o) => (
                  <tr key={o._id} className="hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] dark:hover:bg-[#1F1F1F]/20 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-[#666666] dark:text-[#A3A3A3] font-bold text-xs">{o.poNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-[#000000] dark:text-[#FFFFFF] font-semibold">{o.supplier.name}</p>
                        <p className="text-[#888888] dark:text-[#888888] dark:text-[#A3A3A3] text-[11px]">{o.supplier.contact}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#000000] dark:text-[#FFFFFF]">{o.project.name}</td>
                    <td className="px-4 py-3 text-[#666666] dark:text-[#A3A3A3]">{new Date(o.orderDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-[#666666] dark:text-[#A3A3A3]">{new Date(o.expectedDelivery).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-[#000000] dark:text-[#FFFFFF] font-bold">{fmt(o.totalAmount)}</td>
                    <td className="px-4 py-3 text-[#666666] dark:text-[#A3A3A3] text-xs">{o.paymentTerms}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium w-fit ${STATUS_COLORS[o.status]}`}>
                        {STATUS_ICONS[o.status]}
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelected(selected?._id === o._id ? null : o)}
                        className="text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:bg-[#FAFAFA] dark:hover:bg-[#1F1F1F] p-1.5 rounded-lg transition-colors"
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
          <div className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030]">
              <h2 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF] font-mono">{selected.poNumber} — Details</h2>
              <button onClick={() => setSelected(null)} className="text-[#888888] dark:text-[#888888] dark:text-[#A3A3A3] hover:text-[#000000] dark:text-[#FFFFFF] text-xs font-semibold px-2 py-1 rounded-lg hover:bg-[#FAFAFA] dark:hover:bg-[#1F1F1F]">Close ✕</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div><p className="text-[#666666] dark:text-[#A3A3A3]">Supplier</p><p className="text-[#000000] dark:text-[#FFFFFF] font-semibold mt-0.5">{selected.supplier.name}</p></div>
              <div><p className="text-[#666666] dark:text-[#A3A3A3]">Contact</p><p className="text-[#000000] dark:text-[#FFFFFF] mt-0.5">{selected.supplier.contact}</p></div>
              <div><p className="text-[#666666] dark:text-[#A3A3A3]">Payment Terms</p><p className="text-[#000000] dark:text-[#FFFFFF] mt-0.5">{selected.paymentTerms}</p></div>
              <div><p className="text-[#666666] dark:text-[#A3A3A3]">Total</p><p className="text-[#000000] dark:text-[#FFFFFF] dark:text-[#000000] dark:text-[#FFFFFF] font-bold mt-0.5">{fmt(selected.totalAmount)}</p></div>
            </div>
            {selected.notes && (
              <div className="bg-black/5 dark:bg-white/10 border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-3 text-[#000000] dark:text-[#FFFFFF] dark:text-[#000000] dark:text-[#FFFFFF] text-xs">
                <strong>Notes:</strong> {selected.notes}
              </div>
            )}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-2">Line Items</h3>
              <table className="w-full text-xs">
                <thead className="text-[#666666] dark:text-[#A3A3A3] text-[11px] border-b border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030]">
                  <tr>
                    <th className="text-left py-2">Description</th>
                    <th className="text-right py-2">Qty</th>
                    <th className="text-right py-2">Unit</th>
                    <th className="text-right py-2">Unit Price</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
                  {selected.items.map((item, i) => (
                    <tr key={i}>
                      <td className="py-2.5 text-[#000000] dark:text-[#FFFFFF]">{item.description}</td>
                      <td className="py-2.5 text-right text-[#666666] dark:text-[#A3A3A3] dark:text-[#A3A3A3]">{item.quantity}</td>
                      <td className="py-2.5 text-right text-[#666666] dark:text-[#A3A3A3] dark:text-[#A3A3A3]">{item.unit}</td>
                      <td className="py-2.5 text-right text-[#666666] dark:text-[#A3A3A3] dark:text-[#A3A3A3]">{fmt(item.unitPrice)}</td>
                      <td className="py-2.5 text-right text-[#000000] dark:text-[#FFFFFF] font-semibold">{fmt(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030]">
                    <td colSpan={4} className="py-2.5 text-right text-[#666666] dark:text-[#A3A3A3] font-semibold">Grand Total</td>
                    <td className="py-2.5 text-right text-[#000000] dark:text-[#FFFFFF] dark:text-[#000000] dark:text-[#FFFFFF] font-bold">{fmt(selected.totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Create PO Modal */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030]">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] border border-[#D4D4D4] dark:border-[#303030]">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">Generate Purchase Order</h3>
                    <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Issue commercial contract order for material procurement</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="p-1.5 rounded-lg text-[#888888] dark:text-[#888888] hover:text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] dark:hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] dark:hover:bg-[#1F1F1F] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] font-semibold block mb-1">PO #</label>
                    <input
                      required
                      value={form.poNumber}
                      onChange={(e) => setForm({ ...form, poNumber: e.target.value })}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] font-mono focus:border-[#000000] dark:focus:border-[#FFFFFF] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] font-semibold block mb-1">Target Project</label>
                    <input
                      required
                      value={form.projectName}
                      onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] focus:border-[#000000] dark:focus:border-[#FFFFFF] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] font-semibold block mb-1">Supplier Company</label>
                    <input
                      required
                      placeholder="e.g. Tekle Steel Works Plc"
                      value={form.supplierName}
                      onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] placeholder-[#888888] dark:placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:border-[#000000] dark:focus:border-[#FFFFFF] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] font-semibold block mb-1">Contact Phone</label>
                    <input
                      value={form.supplierContact}
                      onChange={(e) => setForm({ ...form, supplierContact: e.target.value })}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] focus:border-[#000000] dark:focus:border-[#FFFFFF] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] font-semibold block mb-1">Item Description / Spec</label>
                  <input
                    required
                    value={form.itemDescription}
                    onChange={(e) => setForm({ ...form, itemDescription: e.target.value })}
                    className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] focus:border-[#000000] dark:focus:border-[#FFFFFF] outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] font-semibold block mb-1">Quantity</label>
                    <input
                      required
                      type="number"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] focus:border-[#000000] dark:focus:border-[#FFFFFF] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] font-semibold block mb-1">Unit</label>
                    <input
                      value={form.unit}
                      onChange={(e) => setForm({ ...form, unit: e.target.value })}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] focus:border-[#000000] dark:focus:border-[#FFFFFF] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] font-semibold block mb-1">Unit Price (ETB)</label>
                    <input
                      required
                      type="number"
                      value={form.unitPrice}
                      onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] focus:border-[#000000] dark:focus:border-[#FFFFFF] outline-none font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] font-semibold block mb-1">Expected Delivery</label>
                    <input
                      type="date"
                      value={form.deliveryDate}
                      onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] focus:border-[#000000] dark:focus:border-[#FFFFFF] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3] font-semibold block mb-1">Payment Terms</label>
                    <input
                      value={form.paymentTerms}
                      onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3.5 py-2.5 text-xs text-[#000000] dark:text-[#FFFFFF] focus:border-[#000000] dark:focus:border-[#FFFFFF] outline-none"
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#171717] rounded-xl border border-[#D4D4D4] dark:border-[#303030] flex justify-between items-center">
                  <span className="text-[#666666] dark:text-[#A3A3A3]">Total Purchase Order Value:</span>
                  <span className="text-sm font-bold text-[#666666] dark:text-[#A3A3A3]">
                    {fmt((parseFloat(form.quantity) || 0) * (parseFloat(form.unitPrice) || 0))}
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030]">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs font-semibold hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] dark:hover:bg-[#1F1F1F] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold shadow-md transition-all"
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
