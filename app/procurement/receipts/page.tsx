"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, Eye, PackageCheck, Warehouse, X
} from "lucide-react";

interface GoodsReceipt {
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
  totalValue: number;
  deliveryNoteNumber: string;
}

const MOCK_RECEIPTS: GoodsReceipt[] = [
  {
    _id: "grn1",
    grnNumber: "GRN-2024-0089",
    poNumber: "PO-2024-0002",
    supplierName: "Ethiopian Aggregate Industries",
    projectName: "Ring Road Expansion",
    warehouseName: "Site Warehouse A - Ring Road",
    receivedDate: "2024-02-04",
    receivedBy: "Kassahun Bekele (Storekeeper)",
    status: "Verified",
    itemsCount: 1,
    totalReceivedQty: 150,
    totalValue: 225000,
    deliveryNoteNumber: "DN-9941",
  },
  {
    _id: "grn2",
    grnNumber: "GRN-2024-0090",
    poNumber: "PO-2024-0003",
    supplierName: "Tekle Steel Works Plc",
    projectName: "Bole Business Park",
    warehouseName: "Central Logistics Hub",
    receivedDate: "2024-02-02",
    receivedBy: "Mulugeta Assefa (Quality Officer)",
    status: "Discrepancy",
    itemsCount: 2,
    totalReceivedQty: 28,
    totalValue: 1820000,
    deliveryNoteNumber: "DN-4412",
  },
  {
    _id: "grn3",
    grnNumber: "GRN-2024-0091",
    poNumber: "PO-2024-0001",
    supplierName: "Addis Construction Supply Co.",
    projectName: "Addis Heights Tower",
    warehouseName: "Addis Heights Main Store",
    receivedDate: "2024-02-06",
    receivedBy: "Solomon Worku (Site Engineer)",
    status: "Pending Inspection",
    itemsCount: 2,
    totalReceivedQty: 500,
    totalValue: 750000,
    deliveryNoteNumber: "DN-8802",
  },
];

const STATUS_BADGES: Record<string, string> = {
  Verified: "bg-green-500/20 text-green-400 border border-green-500/30",
  Discrepancy: "bg-red-500/20 text-red-400 border border-red-500/30",
  "Pending Inspection": "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
};

export default function GoodsReceiptsPage() {
  const [receipts, setReceipts] = useState<GoodsReceipt[]>(MOCK_RECEIPTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<GoodsReceipt | null>(null);

  const [form, setForm] = useState({
    grnNumber: "GRN-2024-0094",
    poNumber: "PO-2024-0004",
    supplierName: "",
    projectName: "Addis Heights Tower",
    warehouseName: "Addis Heights Main Store",
    receivedDate: "2024-03-01",
    receivedBy: "Solomon Worku (Site Engineer)",
    deliveryNoteNumber: "DN-1001",
    totalReceivedQty: "",
    totalValue: "",
    status: "Verified" as GoodsReceipt["status"],
  });

  const openCreateModal = () => {
    const today = new Date().toISOString().split("T")[0];
    setForm({
      grnNumber: `GRN-2024-00${Math.floor(92 + Math.random() * 50)}`,
      poNumber: "PO-2024-0004",
      supplierName: "",
      projectName: "Addis Heights Tower",
      warehouseName: "Addis Heights Main Store",
      receivedDate: today,
      receivedBy: "Solomon Worku (Site Engineer)",
      deliveryNoteNumber: `DN-${Math.floor(1000 + Math.random() * 9000)}`,
      totalReceivedQty: "",
      totalValue: "",
      status: "Verified",
    });
    setIsCreateOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.supplierName || !form.totalValue) return;
    const newGrn: GoodsReceipt = {
      _id: `grn-${Date.now()}`,
      grnNumber: form.grnNumber,
      poNumber: form.poNumber,
      supplierName: form.supplierName,
      projectName: form.projectName,
      warehouseName: form.warehouseName,
      receivedDate: form.receivedDate,
      receivedBy: form.receivedBy,
      status: form.status,
      itemsCount: 1,
      totalReceivedQty: parseFloat(form.totalReceivedQty) || 100,
      totalValue: parseFloat(form.totalValue) || 0,
      deliveryNoteNumber: form.deliveryNoteNumber,
    };
    setReceipts([newGrn, ...receipts]);
    setIsCreateOpen(false);
    setForm({
      grnNumber: `GRN-2024-00${Math.floor(92 + Math.random() * 50)}`,
      poNumber: "PO-2024-0004",
      supplierName: "",
      projectName: "Addis Heights Tower",
      warehouseName: "Addis Heights Main Store",
      receivedDate: new Date().toISOString().split("T")[0],
      receivedBy: "Solomon Worku (Site Engineer)",
      deliveryNoteNumber: `DN-${Math.floor(1000 + Math.random() * 9000)}`,
      totalReceivedQty: "",
      totalValue: "",
      status: "Verified",
    });
  };

  const filtered = receipts.filter((r) => {
    const matchSearch =
      r.grnNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.supplierName.toLowerCase().includes(search.toLowerCase()) ||
      r.deliveryNoteNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const fmt = (n: number) =>
    `ETB ${n.toLocaleString("en-ET", { minimumFractionDigits: 2 })}`;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#C0C8CA] font-mono text-xs font-bold uppercase tracking-wider mb-1">
              <PackageCheck className="w-4 h-4" /> Inbound Logistics &amp; Quality Intake
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[#D4D8DD] tracking-tight">
              Goods Receipts (GRN)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-[#AAB7B7] mt-1">
              Confirm material deliveries, update inventory ledgers, and match purchase orders
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-[#C0C8CA] hover:bg-white text-[#1A2D42] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all self-start sm:self-auto shrink-0"
          >
            <Plus size={16} />
            Receive Delivery
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#1A2D42] border border-slate-200 dark:border-[#AAB7B7]/25 rounded-2xl p-4 sm:p-5 shadow-xs">
            <p className="text-xs font-semibold text-slate-500 dark:text-[#AAB7B7] uppercase tracking-wider">Total GRNs</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#D4D8DD] mt-1">{receipts.length}</p>
          </div>
          <div className="bg-white dark:bg-[#1A2D42] border border-slate-200 dark:border-[#AAB7B7]/25 rounded-2xl p-4 sm:p-5 shadow-xs">
            <p className="text-xs font-semibold text-slate-500 dark:text-[#AAB7B7] uppercase tracking-wider">Verified Into Inventory</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-500 dark:text-emerald-400 mt-1">
              {receipts.filter((r) => r.status === "Verified").length}
            </p>
          </div>
          <div className="bg-white dark:bg-[#1A2D42] border border-slate-200 dark:border-[#AAB7B7]/25 rounded-2xl p-4 sm:p-5 shadow-xs">
            <p className="text-xs font-semibold text-slate-500 dark:text-[#AAB7B7] uppercase tracking-wider">Flagged Discrepancies</p>
            <p className="text-xl sm:text-2xl font-black text-rose-500 dark:text-rose-400 mt-1">
              {receipts.filter((r) => r.status === "Discrepancy").length}
            </p>
          </div>
          <div className="bg-white dark:bg-[#1A2D42] border border-slate-200 dark:border-[#AAB7B7]/25 rounded-2xl p-4 sm:p-5 shadow-xs">
            <p className="text-xs font-semibold text-slate-500 dark:text-[#AAB7B7] uppercase tracking-wider">Received Inventory Value</p>
            <p className="text-xl sm:text-2xl font-black text-[#C0C8CA] mt-1">
              {fmt(receipts.reduce((sum, r) => sum + r.totalValue, 0))}
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#AAB7B7]" />
            <input
              type="text"
              placeholder="Search by GRN#, PO#, Supplier, Delivery Note..."
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
            <option value="All">All Statuses</option>
            <option value="Verified">Verified</option>
            <option value="Discrepancy">Discrepancy</option>
            <option value="Pending Inspection">Pending Inspection</option>
          </select>
        </div>

        {/* Receipts table */}
        <div className="bg-white dark:bg-[#1A2D42] border border-slate-200 dark:border-[#AAB7B7]/25 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-[#2E4156]/40 border-b border-slate-200 dark:border-[#AAB7B7]/25">
                <tr>
                  <th className="text-left text-[11px] font-bold text-slate-500 dark:text-[#AAB7B7] uppercase tracking-wider px-4 py-3.5">GRN #</th>
                  <th className="text-left text-[11px] font-bold text-slate-500 dark:text-[#AAB7B7] uppercase tracking-wider px-4 py-3.5">PO &amp; Supplier</th>
                  <th className="text-left text-[11px] font-bold text-slate-500 dark:text-[#AAB7B7] uppercase tracking-wider px-4 py-3.5">Project &amp; Warehouse</th>
                  <th className="text-left text-[11px] font-bold text-slate-500 dark:text-[#AAB7B7] uppercase tracking-wider px-4 py-3.5">Received Date</th>
                  <th className="text-left text-[11px] font-bold text-slate-500 dark:text-[#AAB7B7] uppercase tracking-wider px-4 py-3.5">Received By</th>
                  <th className="text-left text-[11px] font-bold text-slate-500 dark:text-[#AAB7B7] uppercase tracking-wider px-4 py-3.5">Value</th>
                  <th className="text-left text-[11px] font-bold text-slate-500 dark:text-[#AAB7B7] uppercase tracking-wider px-4 py-3.5">Status</th>
                  <th className="text-right text-[11px] font-bold text-slate-500 dark:text-[#AAB7B7] uppercase tracking-wider px-4 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2E4156]/50">
                {filtered.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-[#2E4156]/20 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-[#C0C8CA] font-bold">{r.grnNumber}</span>
                      <p className="text-slate-400 dark:text-[#AAB7B7] text-[11px] mt-0.5">DN: {r.deliveryNoteNumber}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-900 dark:text-[#D4D8DD] font-semibold">{r.supplierName}</span>
                      <p className="font-mono text-slate-400 dark:text-[#AAB7B7] text-[11px] mt-0.5">{r.poNumber}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-900 dark:text-[#D4D8DD] text-xs">{r.projectName}</p>
                      <p className="text-slate-400 dark:text-[#AAB7B7] text-[11px] flex items-center gap-1 mt-0.5">
                        <Warehouse size={11} /> {r.warehouseName}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-[#AAB7B7]">
                      {new Date(r.receivedDate).toLocaleDateString("en-ET")}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-[#D4D8DD]">{r.receivedBy}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-[#D4D8DD]">{fmt(r.totalValue)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_BADGES[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedReceipt(r)}
                        className="text-[#C0C8CA] hover:text-white hover:bg-[#2E4156] p-1.5 rounded-lg transition-colors"
                        title="View GRN Document"
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

        {/* Receive Delivery Modal */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#1A2D42] border border-slate-200 dark:border-[#AAB7B7]/25 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2E4156]">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#2E4156] text-[#C0C8CA] border border-[#AAB7B7]/25">
                    <PackageCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-[#D4D8DD]">Receive Material Delivery (GRN)</h3>
                    <p className="text-xs text-slate-500 dark:text-[#AAB7B7]">Inspect inbound items, match delivery note and update inventory</p>
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
                    <label className="text-slate-700 dark:text-[#AAB7B7] font-semibold block mb-1">GRN #</label>
                    <input
                      required
                      value={form.grnNumber}
                      onChange={(e) => setForm({ ...form, grnNumber: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-[#1A2D42]/90 border border-slate-200 dark:border-[#AAB7B7]/25 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#D4D8DD] font-mono focus:border-[#C0C8CA] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 dark:text-[#AAB7B7] font-semibold block mb-1">PO #</label>
                    <input
                      required
                      value={form.poNumber}
                      onChange={(e) => setForm({ ...form, poNumber: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-[#1A2D42]/90 border border-slate-200 dark:border-[#AAB7B7]/25 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#D4D8DD] font-mono focus:border-[#C0C8CA] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 dark:text-[#AAB7B7] font-semibold block mb-1">Supplier Name</label>
                    <input
                      required
                      placeholder="e.g. Tekle Steel Works"
                      value={form.supplierName}
                      onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-[#1A2D42]/90 border border-slate-200 dark:border-[#AAB7B7]/25 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#D4D8DD] placeholder-slate-400 dark:placeholder-[#AAB7B7]/50 focus:border-[#C0C8CA] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 dark:text-[#AAB7B7] font-semibold block mb-1">Delivery Note #</label>
                    <input
                      required
                      value={form.deliveryNoteNumber}
                      onChange={(e) => setForm({ ...form, deliveryNoteNumber: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-[#1A2D42]/90 border border-slate-200 dark:border-[#AAB7B7]/25 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#D4D8DD] font-mono focus:border-[#C0C8CA] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 dark:text-[#AAB7B7] font-semibold block mb-1">Project Site</label>
                    <input
                      required
                      value={form.projectName}
                      onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-[#1A2D42]/90 border border-slate-200 dark:border-[#AAB7B7]/25 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#D4D8DD] focus:border-[#C0C8CA] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 dark:text-[#AAB7B7] font-semibold block mb-1">Warehouse / Depot</label>
                    <input
                      required
                      value={form.warehouseName}
                      onChange={(e) => setForm({ ...form, warehouseName: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-[#1A2D42]/90 border border-slate-200 dark:border-[#AAB7B7]/25 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#D4D8DD] focus:border-[#C0C8CA] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 dark:text-[#AAB7B7] font-semibold block mb-1">Received Quantity (Units)</label>
                    <input
                      required
                      type="number"
                      placeholder="e.g. 250"
                      value={form.totalReceivedQty}
                      onChange={(e) => setForm({ ...form, totalReceivedQty: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-[#1A2D42]/90 border border-slate-200 dark:border-[#AAB7B7]/25 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#D4D8DD] focus:border-[#C0C8CA] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 dark:text-[#AAB7B7] font-semibold block mb-1">Total Value (ETB)</label>
                    <input
                      required
                      type="number"
                      placeholder="e.g. 450000"
                      value={form.totalValue}
                      onChange={(e) => setForm({ ...form, totalValue: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-[#1A2D42]/90 border border-slate-200 dark:border-[#AAB7B7]/25 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#D4D8DD] focus:border-[#C0C8CA] outline-none font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 dark:text-[#AAB7B7] font-semibold block mb-1">Inspection Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as GoodsReceipt["status"] })}
                      className="w-full bg-slate-50 dark:bg-[#1A2D42]/90 border border-slate-200 dark:border-[#AAB7B7]/25 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#D4D8DD] focus:border-[#C0C8CA] outline-none"
                    >
                      <option value="Verified">Verified &amp; Accepted</option>
                      <option value="Pending Inspection">Pending Inspection</option>
                      <option value="Discrepancy">Discrepancy Flagged</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-700 dark:text-[#AAB7B7] font-semibold block mb-1">Inspector / Receiver</label>
                    <input
                      required
                      value={form.receivedBy}
                      onChange={(e) => setForm({ ...form, receivedBy: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-[#1A2D42]/90 border border-slate-200 dark:border-[#AAB7B7]/25 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#D4D8DD] focus:border-[#C0C8CA] outline-none"
                    />
                  </div>
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
                    Accept &amp; Register GRN
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Receipt Details Modal */}
        {selectedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#1A2D42] border border-slate-200 dark:border-[#AAB7B7]/25 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2E4156]">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#2E4156] text-[#C0C8CA] border border-[#AAB7B7]/25">
                    <PackageCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-[#D4D8DD] font-mono">{selectedReceipt.grnNumber}</h3>
                    <p className="text-xs text-slate-500 dark:text-[#AAB7B7]">Goods Receipt Note &amp; Stock Intake Slip</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-[#AAB7B7] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#2E4156] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-[#2E4156]/30 rounded-xl border border-slate-200 dark:border-[#AAB7B7]/25">
                  <div>
                    <p className="text-slate-500 dark:text-[#AAB7B7]">Supplier</p>
                    <p className="font-semibold text-slate-900 dark:text-[#D4D8DD] mt-0.5">{selectedReceipt.supplierName}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-[#AAB7B7]">Delivery Note #</p>
                    <p className="font-mono text-[#C0C8CA] font-bold mt-0.5">{selectedReceipt.deliveryNoteNumber}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-[#AAB7B7]">Associated PO</p>
                    <p className="font-mono text-slate-700 dark:text-[#D4D8DD] mt-0.5">{selectedReceipt.poNumber}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-[#AAB7B7]">Warehouse Location</p>
                    <p className="text-slate-700 dark:text-[#D4D8DD] mt-0.5">{selectedReceipt.warehouseName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 dark:bg-[#2E4156]/30 rounded-xl border border-slate-200 dark:border-[#AAB7B7]/25 text-center">
                  <div>
                    <p className="text-slate-500 dark:text-[#AAB7B7]">Received Qty</p>
                    <p className="font-bold text-slate-900 dark:text-[#D4D8DD] text-sm mt-0.5">{selectedReceipt.totalReceivedQty} units</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-[#AAB7B7]">Total Value</p>
                    <p className="font-bold text-[#C0C8CA] text-sm mt-0.5">{fmt(selectedReceipt.totalValue)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-[#AAB7B7]">Status</p>
                    <span className={`inline-block px-2 py-0.5 rounded-full mt-1 text-[11px] font-semibold ${STATUS_BADGES[selectedReceipt.status]}`}>
                      {selectedReceipt.status}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-[#2E4156]/20 rounded-xl border border-slate-200 dark:border-[#AAB7B7]/25 space-y-1">
                  <div className="flex justify-between text-slate-700 dark:text-[#D4D8DD]">
                    <span className="text-slate-500 dark:text-[#AAB7B7]">Received By:</span>
                    <span>{selectedReceipt.receivedBy}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 dark:text-[#D4D8DD]">
                    <span className="text-slate-500 dark:text-[#AAB7B7]">Receipt Date:</span>
                    <span>{new Date(selectedReceipt.receivedDate).toLocaleDateString("en-ET")}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#2E4156]">
                {selectedReceipt.status !== "Verified" && (
                  <button
                    type="button"
                    onClick={() => {
                      setReceipts(receipts.map((rec) =>
                        rec._id === selectedReceipt._id
                          ? { ...rec, status: "Verified" }
                          : rec
                      ));
                      setSelectedReceipt(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                  >
                    Mark Verified &amp; Post to Ledger
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#AAB7B7]/25 text-slate-700 dark:text-[#D4D8DD] hover:bg-slate-100 dark:hover:bg-[#2E4156] font-semibold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

