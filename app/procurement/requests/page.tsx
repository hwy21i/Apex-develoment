"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, Filter, Eye, CheckCircle, XCircle, Clock,
  ChevronDown, Package, FileText, RefreshCw, AlertCircle
} from "lucide-react";

interface MaterialRequest {
  _id: string;
  requestNumber: string;
  project: { _id: string; name: string };
  requestedBy: { _id: string; name: string };
  status: "Draft" | "Pending" | "Approved" | "Rejected" | "Fulfilled";
  priority: "Low" | "Medium" | "High" | "Critical";
  items: Array<{
    material: { name: string; unit: string };
    quantityRequested: number;
    quantityApproved?: number;
    estimatedCost: number;
  }>;
  requiredDate: string;
  totalEstimatedCost: number;
  notes?: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
  Pending: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  Approved: "bg-green-500/20 text-green-400 border border-green-500/30",
  Rejected: "bg-red-500/20 text-red-400 border border-red-500/30",
  Fulfilled: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
};

const PRIORITY_COLORS: Record<string, string> = {
  Low: "bg-gray-500/20 text-gray-400",
  Medium: "bg-yellow-500/20 text-yellow-400",
  High: "bg-orange-500/20 text-orange-400",
  Critical: "bg-red-500/20 text-red-400",
};

const MOCK_REQUESTS: MaterialRequest[] = [
  {
    _id: "1",
    requestNumber: "MR-2024-001",
    project: { _id: "p1", name: "Addis Heights Tower" },
    requestedBy: { _id: "u1", name: "Abebe Kebede" },
    status: "Pending",
    priority: "High",
    items: [
      { material: { name: "Portland Cement (50kg)", unit: "bags" }, quantityRequested: 500, estimatedCost: 750000 },
      { material: { name: "Steel Rebar 16mm", unit: "tons" }, quantityRequested: 20, estimatedCost: 600000 },
    ],
    requiredDate: "2024-02-15",
    totalEstimatedCost: 1350000,
    notes: "Urgent for foundation work",
    createdAt: "2024-01-28T09:00:00Z",
  },
  {
    _id: "2",
    requestNumber: "MR-2024-002",
    project: { _id: "p2", name: "Ring Road Expansion" },
    requestedBy: { _id: "u2", name: "Tigist Alemu" },
    status: "Approved",
    priority: "Medium",
    items: [
      { material: { name: "Crushed Stone (20mm)", unit: "m³" }, quantityRequested: 150, estimatedCost: 225000 },
    ],
    requiredDate: "2024-02-20",
    totalEstimatedCost: 225000,
    createdAt: "2024-01-25T14:30:00Z",
  },
  {
    _id: "3",
    requestNumber: "MR-2024-003",
    project: { _id: "p1", name: "Addis Heights Tower" },
    requestedBy: { _id: "u3", name: "Dawit Haile" },
    status: "Draft",
    priority: "Low",
    items: [
      { material: { name: "Safety Helmets", unit: "pcs" }, quantityRequested: 30, estimatedCost: 45000 },
    ],
    requiredDate: "2024-03-01",
    totalEstimatedCost: 45000,
    createdAt: "2024-01-30T11:00:00Z",
  },
  {
    _id: "4",
    requestNumber: "MR-2024-004",
    project: { _id: "p3", name: "Bole Business Park" },
    requestedBy: { _id: "u1", name: "Abebe Kebede" },
    status: "Fulfilled",
    priority: "Critical",
    items: [
      { material: { name: "Structural Steel Beams", unit: "tons" }, quantityRequested: 50, estimatedCost: 3500000 },
    ],
    requiredDate: "2024-01-20",
    totalEstimatedCost: 3500000,
    createdAt: "2024-01-10T08:00:00Z",
  },
  {
    _id: "5",
    requestNumber: "MR-2024-005",
    project: { _id: "p2", name: "Ring Road Expansion" },
    requestedBy: { _id: "u2", name: "Tigist Alemu" },
    status: "Rejected",
    priority: "Medium",
    items: [
      { material: { name: "Bitumen 80/100", unit: "tons" }, quantityRequested: 100, estimatedCost: 850000 },
    ],
    requiredDate: "2024-02-10",
    totalEstimatedCost: 850000,
    notes: "Budget exceeded — revise quantities",
    createdAt: "2024-01-22T16:00:00Z",
  },
];

export default function ProcurementRequestsPage() {
  const [requests, setRequests] = useState<MaterialRequest[]>(MOCK_REQUESTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [selected, setSelected] = useState<MaterialRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const filtered = requests.filter((r) => {
    const matchSearch =
      r.requestNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.project.name.toLowerCase().includes(search.toLowerCase()) ||
      r.requestedBy.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || r.status === statusFilter;
    const matchPriority = priorityFilter === "All" || r.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "Pending").length,
    approved: requests.filter((r) => r.status === "Approved").length,
    totalValue: requests.reduce((s, r) => s + r.totalEstimatedCost, 0),
  };

  const handleApprove = (id: string) => {
    setRequests((prev) =>
      prev.map((r) => (r._id === id ? { ...r, status: "Approved" } : r))
    );
    setShowModal(false);
  };

  const handleReject = (id: string) => {
    setRequests((prev) =>
      prev.map((r) => (r._id === id ? { ...r, status: "Rejected" } : r))
    );
    setShowModal(false);
  };

  const fmt = (n: number) =>
    `ETB ${n.toLocaleString("en-ET", { minimumFractionDigits: 2 })}`;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Material Requests</h1>
            <p className="text-gray-400 text-sm mt-1">
              Manage and approve material requisitions from project sites
            </p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} />
            New Request
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Requests", value: stats.total, icon: FileText, color: "text-blue-400" },
            { label: "Pending Approval", value: stats.pending, icon: Clock, color: "text-yellow-400" },
            { label: "Approved", value: stats.approved, icon: CheckCircle, color: "text-green-400" },
            { label: "Total Value", value: fmt(stats.totalValue), icon: Package, color: "text-purple-400" },
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
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search requests..."
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
            {["All", "Draft", "Pending", "Approved", "Rejected", "Fulfilled"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            {["All", "Low", "Medium", "High", "Critical"].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/50 border-b border-gray-700">
                <tr>
                  {["Request #", "Project", "Requested By", "Items", "Required Date", "Total Value", "Priority", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-blue-400 font-medium">{r.requestNumber}</span>
                    </td>
                    <td className="px-4 py-3 text-white">{r.project.name}</td>
                    <td className="px-4 py-3 text-gray-300">{r.requestedBy.name}</td>
                    <td className="px-4 py-3 text-gray-300">{r.items.length} item{r.items.length > 1 ? "s" : ""}</td>
                    <td className="px-4 py-3 text-gray-300">
                      {new Date(r.requiredDate).toLocaleDateString("en-ET")}
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{fmt(r.totalEstimatedCost)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_COLORS[r.priority]}`}>
                        {r.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setSelected(r); setShowModal(true); }}
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
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle size={40} className="mx-auto mb-3 opacity-50" />
              <p>No requests match your filters</p>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {showModal && selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <div>
                  <h2 className="text-lg font-bold text-white">{selected.requestNumber}</h2>
                  <p className="text-gray-400 text-sm">{selected.project.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[selected.status]}`}>
                    {selected.status}
                  </span>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white ml-2">✕</button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-400">Requested by:</span> <span className="text-white ml-2">{selected.requestedBy.name}</span></div>
                  <div><span className="text-gray-400">Priority:</span> <span className={`ml-2 px-2 py-0.5 rounded text-xs ${PRIORITY_COLORS[selected.priority]}`}>{selected.priority}</span></div>
                  <div><span className="text-gray-400">Required date:</span> <span className="text-white ml-2">{new Date(selected.requiredDate).toLocaleDateString()}</span></div>
                  <div><span className="text-gray-400">Total value:</span> <span className="text-white font-bold ml-2">{fmt(selected.totalEstimatedCost)}</span></div>
                </div>
                {selected.notes && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-yellow-300 text-sm">
                    <strong>Notes:</strong> {selected.notes}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Requested Items</h3>
                  <div className="space-y-2">
                    {selected.items.map((item, i) => (
                      <div key={i} className="bg-gray-800 rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <p className="text-white font-medium">{item.material.name}</p>
                          <p className="text-gray-400 text-xs">{item.quantityRequested} {item.material.unit}</p>
                        </div>
                        <span className="text-white font-medium">{fmt(item.estimatedCost)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {selected.status === "Pending" && (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleApprove(selected._id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      <CheckCircle size={16} /> Approve Request
                    </button>
                    <button
                      onClick={() => handleReject(selected._id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      <XCircle size={16} /> Reject Request
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
