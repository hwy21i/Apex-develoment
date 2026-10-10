"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, Eye, CheckCircle, XCircle, Clock,
  Package, FileText, AlertCircle, X, Loader2,
} from "lucide-react";
import { useRecords, type OperationalRecord } from "@/hooks/useRecords";
import { useCurrentUser } from "@/components/auth/UserProvider";
import { formatCurrency } from "@/lib/formatters/currency";

interface RequestItem {
  name: string;
  unit: string;
  quantityRequested: number;
  estimatedCost: number;
}

interface MaterialRequest {
  _id: string;
  requestNumber: string;
  projectId: string;
  requestedBy: string;
  status: string;
  priority: string;
  items: RequestItem[];
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

const STATUSES = ["Draft", "Pending", "Approved", "Rejected", "Fulfilled"];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];

function mapRecord(r: OperationalRecord): MaterialRequest {
  const d = r.data || {};
  const rawItems = Array.isArray(d.items) ? d.items : [];
  const items: RequestItem[] = rawItems.map((it: any) => ({
    name: it?.name || it?.material?.name || "—",
    unit: it?.unit || it?.material?.unit || "",
    quantityRequested: Number(it?.quantityRequested) || 0,
    estimatedCost: Number(it?.estimatedCost) || 0,
  }));
  const totalEstimatedCost =
    Number(d.totalEstimatedCost) || items.reduce((s, i) => s + i.estimatedCost, 0);
  return {
    _id: r._id,
    requestNumber: d.requestNumber || r.title || r._id.slice(-6),
    projectId: r.projectId,
    requestedBy: d.requestedBy || "—",
    status: r.status || d.status || "Draft",
    priority: d.priority || "Medium",
    items,
    requiredDate: d.requiredDate || r.createdAt,
    totalEstimatedCost,
    notes: d.notes,
    createdAt: r.createdAt,
  };
}

export default function ProcurementRequestsPage() {
  const { records, projects, projectName, loading, error, reload, create, update } = useRecords("procurement");
  const { user } = useCurrentUser();
  const requests = records.map(mapRecord);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [selected, setSelected] = useState<MaterialRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    projectId: "",
    requestNumber: "",
    priority: "Medium",
    requiredDate: "",
    materialName: "",
    unit: "",
    quantity: "",
    estimatedCost: "",
    notes: "",
  });

  const filtered = requests.filter((r) => {
    const matchSearch =
      r.requestNumber.toLowerCase().includes(search.toLowerCase()) ||
      projectName(r.projectId).toLowerCase().includes(search.toLowerCase()) ||
      r.requestedBy.toLowerCase().includes(search.toLowerCase());
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

  const fmt = (n: number) => formatCurrency(n);

  const changeStatus = async (id: string, status: string) => {
    setActionBusy(true);
    setActionError(null);
    try {
      await update(id, { status });
      setShowModal(false);
      setSelected(null);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to update request");
    } finally {
      setActionBusy(false);
    }
  };

  const openForm = () => {
    setForm((f) => ({ ...f, projectId: projects[0]?._id || "" }));
    setFormError(null);
    setFormOpen(true);
  };

  const submit = async () => {
    if (!form.projectId) {
      setFormError("Please select a project.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      const items = [
        {
          name: form.materialName,
          unit: form.unit,
          quantityRequested: Number(form.quantity) || 0,
          estimatedCost: Number(form.estimatedCost) || 0,
        },
      ];
      await create({
        projectId: form.projectId,
        title: form.requestNumber || undefined,
        status: "Pending",
        data: {
          requestNumber: form.requestNumber || undefined,
          priority: form.priority,
          requiredDate: form.requiredDate || undefined,
          requestedBy: user?.fullName || undefined,
          items,
          totalEstimatedCost: items[0].estimatedCost,
          notes: form.notes || undefined,
        },
      });
      setFormOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to create request");
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500";

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
          <button
            onClick={openForm}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
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
            <option value="All">All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="All">All</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-sm text-red-300">{error}</p>
              <button onClick={() => reload()} className="mt-3 text-xs font-medium text-blue-400 hover:text-blue-300">Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle size={40} className="mx-auto mb-3 opacity-50" />
              <p>{requests.length === 0 ? "No material requests yet." : "No requests match your filters."}</p>
            </div>
          ) : (
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
                      <td className="px-4 py-3"><span className="font-mono text-blue-400 font-medium">{r.requestNumber}</span></td>
                      <td className="px-4 py-3 text-white">{projectName(r.projectId)}</td>
                      <td className="px-4 py-3 text-gray-300">{r.requestedBy}</td>
                      <td className="px-4 py-3 text-gray-300">{r.items.length} item{r.items.length > 1 ? "s" : ""}</td>
                      <td className="px-4 py-3 text-gray-300">{r.requiredDate ? new Date(r.requiredDate).toLocaleDateString("en-ET") : "—"}</td>
                      <td className="px-4 py-3 text-white font-medium">{fmt(r.totalEstimatedCost)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_COLORS[r.priority] || PRIORITY_COLORS.Medium}`}>{r.priority}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] || STATUS_COLORS.Draft}`}>{r.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => { setSelected(r); setShowModal(true); setActionError(null); }} className="text-blue-400 hover:text-blue-300 transition-colors">
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  <p className="text-gray-400 text-sm">{projectName(selected.projectId)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[selected.status] || STATUS_COLORS.Draft}`}>{selected.status}</span>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white ml-2"><X size={18} /></button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-400">Requested by:</span> <span className="text-white ml-2">{selected.requestedBy}</span></div>
                  <div><span className="text-gray-400">Priority:</span> <span className={`ml-2 px-2 py-0.5 rounded text-xs ${PRIORITY_COLORS[selected.priority] || PRIORITY_COLORS.Medium}`}>{selected.priority}</span></div>
                  <div><span className="text-gray-400">Required date:</span> <span className="text-white ml-2">{selected.requiredDate ? new Date(selected.requiredDate).toLocaleDateString() : "—"}</span></div>
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
                    {selected.items.length === 0 && <p className="text-gray-500 text-sm">No line items.</p>}
                    {selected.items.map((item, i) => (
                      <div key={i} className="bg-gray-800 rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <p className="text-white font-medium">{item.name}</p>
                          <p className="text-gray-400 text-xs">{item.quantityRequested} {item.unit}</p>
                        </div>
                        <span className="text-white font-medium">{fmt(item.estimatedCost)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {actionError && <p className="text-xs text-red-300">{actionError}</p>}

                {selected.status === "Pending" && (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => changeStatus(selected._id, "Approved")}
                      disabled={actionBusy}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {actionBusy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} Approve Request
                    </button>
                    <button
                      onClick={() => changeStatus(selected._id, "Rejected")}
                      disabled={actionBusy}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {actionBusy ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />} Reject Request
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Create modal */}
        {formOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b border-gray-700 pb-4">
                <h2 className="text-lg font-bold text-white">New Material Request</h2>
                <button onClick={() => setFormOpen(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Project</label>
                  <select className={inputCls} value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                    {projects.length === 0 && <option value="">No accessible projects</option>}
                    {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Request #</label>
                    <input className={inputCls} value={form.requestNumber} onChange={(e) => setForm({ ...form, requestNumber: e.target.value })} placeholder="MR-2026-001" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Priority</label>
                    <select className={inputCls} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                      {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Required date</label>
                  <input type="date" className={inputCls} value={form.requiredDate} onChange={(e) => setForm({ ...form, requiredDate: e.target.value })} />
                </div>
                <div className="border-t border-gray-700 pt-3">
                  <p className="text-xs text-gray-400 mb-2">Line item</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Material</label>
                      <input className={inputCls} value={form.materialName} onChange={(e) => setForm({ ...form, materialName: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Unit</label>
                      <input className={inputCls} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="bags / tons / m³" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Quantity</label>
                      <input type="number" min="0" className={inputCls} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Estimated cost (ETB)</label>
                      <input type="number" min="0" className={inputCls} value={form.estimatedCost} onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Notes</label>
                  <textarea className={inputCls} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>

              {formError && <p className="text-xs text-red-300">{formError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setFormOpen(false)} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm">Cancel</button>
                <button onClick={submit} disabled={busy} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                  {busy && <Loader2 size={14} className="animate-spin" />}
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
