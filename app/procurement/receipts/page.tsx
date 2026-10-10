"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, Truck, CheckCircle, Clock, AlertTriangle,
  Eye, FileText, PackageCheck, Warehouse, ArrowUpRight, X
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
    status: "Verified" as GoodsReceipt["status"],
  });

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Goods Receipts (GRN)</h1>
            <p className="text-gray-400 text-sm mt-1">
              Confirm material deliveries, update inventory ledgers, and match purchase orders
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-[#C9A15A] hover:bg-[#B89248] text-slate-950 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus size={16} />
            Receive Delivery
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Total GRNs</p>
            <p className="text-xl font-bold text-white mt-1">{receipts.length}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Verified Into Inventory</p>
            <p className="text-xl font-bold text-green-400 mt-1">
              {receipts.filter((r) => r.status === "Verified").length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Flagged Discrepancies</p>
            <p className="text-xl font-bold text-red-400 mt-1">
              {receipts.filter((r) => r.status === "Discrepancy").length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Received Inventory Value</p>
            <p className="text-xl font-bold text-blue-400 mt-1">
              {fmt(receipts.reduce((sum, r) => sum + r.totalValue, 0))}
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by GRN#, PO#, Supplier, Delivery Note..."
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
            <option value="All">All Statuses</option>
            <option value="Verified">Verified</option>
            <option value="Discrepancy">Discrepancy</option>
            <option value="Pending Inspection">Pending Inspection</option>
          </select>
        </div>

        {/* Receipts table */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/50 border-b border-gray-700">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">GRN #</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">PO & Supplier</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Project & Warehouse</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Received Date</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Received By</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Value</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-blue-400 font-medium">{r.grnNumber}</span>
                      <p className="text-gray-500 text-xs mt-0.5">DN: {r.deliveryNoteNumber}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white font-medium">{r.supplierName}</span>
                      <p className="font-mono text-gray-400 text-xs mt-0.5">{r.poNumber}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white text-xs">{r.projectName}</p>
                      <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                        <Warehouse size={11} /> {r.warehouseName}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-xs">
                      {new Date(r.receivedDate).toLocaleDateString("en-ET")}
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{r.receivedBy}</td>
                    <td className="px-4 py-3 font-semibold text-white">{fmt(r.totalValue)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedReceipt(r)}
                        className="text-[#C9A15A] hover:text-[#d4b06f] p-1.5 rounded transition-colors"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <div className="bg-[#16181D] border border-[#2F333A] rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#2F333A]">
                <div>
                  <h3 className="text-lg font-bold text-white">Receive Material Delivery (GRN)</h3>
                  <p className="text-xs text-slate-400">Inspect inbound items, match delivery note and update inventory</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">GRN #</label>
                    <input
                      required
                      value={form.grnNumber}
                      onChange={(e) => setForm({ ...form, grnNumber: e.target.value })}
                      className="w-full bg-[#1C1F26] border border-[#2F333A] rounded-lg px-3 py-2 text-white font-mono focus:border-[#C9A15A] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">PO #</label>
                    <input
                      required
                      value={form.poNumber}
                      onChange={(e) => setForm({ ...form, poNumber: e.target.value })}
                      className="w-full bg-[#1C1F26] border border-[#2F333A] rounded-lg px-3 py-2 text-white font-mono focus:border-[#C9A15A] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Supplier Name</label>
                    <input
                      required
                      placeholder="e.g. Tekle Steel Works"
                      value={form.supplierName}
                      onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
                      className="w-full bg-[#1C1F26] border border-[#2F333A] rounded-lg px-3 py-2 text-white focus:border-[#C9A15A] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Delivery Note #</label>
                    <input
                      required
                      value={form.deliveryNoteNumber}
                      onChange={(e) => setForm({ ...form, deliveryNoteNumber: e.target.value })}
                      className="w-full bg-[#1C1F26] border border-[#2F333A] rounded-lg px-3 py-2 text-white font-mono focus:border-[#C9A15A] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Project Site</label>
                    <input
                      required
                      value={form.projectName}
                      onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                      className="w-full bg-[#1C1F26] border border-[#2F333A] rounded-lg px-3 py-2 text-white focus:border-[#C9A15A] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Warehouse / Depot</label>
                    <input
                      required
                      value={form.warehouseName}
                      onChange={(e) => setForm({ ...form, warehouseName: e.target.value })}
                      className="w-full bg-[#1C1F26] border border-[#2F333A] rounded-lg px-3 py-2 text-white focus:border-[#C9A15A] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Received Quantity (Units)</label>
                    <input
                      required
                      type="number"
                      placeholder="e.g. 250"
                      value={form.totalReceivedQty}
                      onChange={(e) => setForm({ ...form, totalReceivedQty: e.target.value })}
                      className="w-full bg-[#1C1F26] border border-[#2F333A] rounded-lg px-3 py-2 text-white focus:border-[#C9A15A] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Total Value (ETB)</label>
                    <input
                      required
                      type="number"
                      placeholder="e.g. 450000"
                      value={form.totalValue}
                      onChange={(e) => setForm({ ...form, totalValue: e.target.value })}
                      className="w-full bg-[#1C1F26] border border-[#2F333A] rounded-lg px-3 py-2 text-white focus:border-[#C9A15A] focus:outline-hidden font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Inspection Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as GoodsReceipt["status"] })}
                      className="w-full bg-[#1C1F26] border border-[#2F333A] rounded-lg px-3 py-2 text-white focus:border-[#C9A15A] focus:outline-hidden"
                    >
                      <option value="Verified">Verified & Accepted</option>
                      <option value="Pending Inspection">Pending Inspection</option>
                      <option value="Discrepancy">Discrepancy Flagged</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-300 font-medium block mb-1">Inspector / Receiver</label>
                    <input
                      required
                      value={form.receivedBy}
                      onChange={(e) => setForm({ ...form, receivedBy: e.target.value })}
                      className="w-full bg-[#1C1F26] border border-[#2F333A] rounded-lg px-3 py-2 text-white focus:border-[#C9A15A] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#2F333A]">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 rounded-lg bg-[#2A2D34] hover:bg-[#343842] text-slate-300 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#C9A15A] hover:bg-[#B89248] text-slate-950 font-bold"
                  >
                    Accept & Register GRN
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Receipt Details Modal */}
        {selectedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <div className="bg-[#16181D] border border-[#2F333A] rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#2F333A]">
                <div>
                  <h3 className="text-lg font-bold text-white font-mono">{selectedReceipt.grnNumber}</h3>
                  <p className="text-xs text-slate-400">Goods Receipt Note & Stock Intake Slip</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 bg-[#1C1F26] rounded-xl border border-[#2F333A]">
                  <div>
                    <p className="text-slate-400">Supplier</p>
                    <p className="font-semibold text-white mt-0.5">{selectedReceipt.supplierName}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Delivery Note #</p>
                    <p className="font-mono text-[#C9A15A] mt-0.5">{selectedReceipt.deliveryNoteNumber}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Associated PO</p>
                    <p className="font-mono text-slate-200 mt-0.5">{selectedReceipt.poNumber}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Warehouse Location</p>
                    <p className="text-slate-200 mt-0.5">{selectedReceipt.warehouseName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 p-3 bg-[#1C1F26] rounded-xl border border-[#2F333A] text-center">
                  <div>
                    <p className="text-slate-400">Received Qty</p>
                    <p className="font-bold text-white text-sm mt-0.5">{selectedReceipt.totalReceivedQty} units</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Total Value</p>
                    <p className="font-bold text-[#C9A15A] text-sm mt-0.5">{fmt(selectedReceipt.totalValue)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Status</p>
                    <span className={`inline-block px-2 py-0.5 rounded-full mt-1 text-[11px] font-semibold ${STATUS_BADGES[selectedReceipt.status]}`}>
                      {selectedReceipt.status}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#1C1F26]/70 rounded-xl border border-[#2F333A] space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Received By:</span>
                    <span>{selectedReceipt.receivedBy}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Receipt Date:</span>
                    <span>{new Date(selectedReceipt.receivedDate).toLocaleDateString("en-ET")}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#2F333A]">
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
                    className="px-3.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold text-xs"
                  >
                    Mark Verified & Post to Ledger
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="px-4 py-1.5 rounded-lg bg-[#2A2D34] hover:bg-[#343842] text-slate-300 font-medium text-xs"
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

