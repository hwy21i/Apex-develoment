"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, Eye, ShoppingCart, CheckCircle, Clock,
  Truck, Package, AlertCircle, FileText, ChevronDown
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Purchase Orders</h1>
            <p className="text-gray-400 text-sm mt-1">
              Track and manage all procurement purchase orders
            </p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} />
            Create PO
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Orders", value: stats.total, icon: ShoppingCart, color: "text-blue-400" },
            { label: "In Progress", value: stats.pending, icon: Clock, color: "text-yellow-400" },
            { label: "Fully Received", value: stats.received, icon: Truck, color: "text-green-400" },
            { label: "Total PO Value", value: fmt(stats.totalValue), icon: FileText, color: "text-purple-400" },
          ].map((s) => (
            <div key={s.label} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <s.icon size={20} className={s.color} />
                <div>
                  <p className="text-xs text-gray-400">{s.label}</p>
                  <p className="text-lg font-bold text-white">{s.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search purchase orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            {["All", "Draft", "Sent", "Confirmed", "Partially Received", "Received", "Cancelled"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/50 border-b border-gray-700">
                <tr>
                  {["PO Number", "Supplier", "Project", "Order Date", "Expected Delivery", "Total Amount", "Payment Terms", "Status", ""].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.map((o) => (
                  <tr key={o._id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-blue-400 font-medium">{o.poNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white font-medium">{o.supplier.name}</p>
                        <p className="text-gray-400 text-xs">{o.supplier.contact}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{o.project.name}</td>
                    <td className="px-4 py-3 text-gray-300">{new Date(o.orderDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-gray-300">{new Date(o.expectedDelivery).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-white font-bold">{fmt(o.totalAmount)}</td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{o.paymentTerms}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium w-fit ${STATUS_COLORS[o.status]}`}>
                        {STATUS_ICONS[o.status]}
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelected(selected?._id === o._id ? null : o)}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
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
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{selected.poNumber} — Details</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white text-sm">Close ✕</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><p className="text-gray-400">Supplier</p><p className="text-white font-medium">{selected.supplier.name}</p></div>
              <div><p className="text-gray-400">Contact</p><p className="text-white">{selected.supplier.contact}</p></div>
              <div><p className="text-gray-400">Payment Terms</p><p className="text-white">{selected.paymentTerms}</p></div>
              <div><p className="text-gray-400">Total</p><p className="text-green-400 font-bold">{fmt(selected.totalAmount)}</p></div>
            </div>
            {selected.notes && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-yellow-300 text-sm">
                <strong>Notes:</strong> {selected.notes}
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Line Items</h3>
              <table className="w-full text-sm">
                <thead className="text-gray-400 text-xs">
                  <tr>
                    <th className="text-left py-2">Description</th>
                    <th className="text-right py-2">Qty</th>
                    <th className="text-right py-2">Unit</th>
                    <th className="text-right py-2">Unit Price</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {selected.items.map((item, i) => (
                    <tr key={i}>
                      <td className="py-2 text-white">{item.description}</td>
                      <td className="py-2 text-right text-gray-300">{item.quantity}</td>
                      <td className="py-2 text-right text-gray-300">{item.unit}</td>
                      <td className="py-2 text-right text-gray-300">{fmt(item.unitPrice)}</td>
                      <td className="py-2 text-right text-white font-medium">{fmt(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-600">
                    <td colSpan={4} className="py-2 text-right text-gray-400 font-medium">Grand Total</td>
                    <td className="py-2 text-right text-green-400 font-bold">{fmt(selected.totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
