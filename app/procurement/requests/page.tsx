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
  Draft: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Pending: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Approved: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Rejected: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Fulfilled: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
};

const PRIORITY_COLORS: Record<string, string> = {
  Low: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Medium: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  High: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Critical: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
};

const STATUSES = ["Draft", "Pending", "Approved", "Rejected", "Fulfilled"];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];

function mapRecord(r: OperationalRecord): MaterialRequest {
  const d = r.data || {};
  const rawItems = Array.isArray(d.items) ? d.items : [];
  const items: RequestItem[] = rawItems.map((it: unknown) => {
    const item = it as {
      name?: string;
      material?: { name?: string; unit?: string };
      unit?: string;
      quantityRequested?: number | string;
      estimatedCost?: number | string;
    } | null;
    return {
      name: item?.name || item?.material?.name || "—",
      unit: item?.unit || item?.material?.unit || "",
      quantityRequested: Number(item?.quantityRequested) || 0,
      estimatedCost: Number(item?.estimatedCost) || 0,
    };
  });
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
    "w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3 py-2 text-sm text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]";

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#000000] dark:text-[#FFFFFF]">Material Requests</h1>
            <p className="text-[#666666] dark:text-[#A3A3A3] text-sm mt-1">
              Manage and approve material requisitions from project sites
            </p>
          </div>
          <button
            onClick={openForm}
            className="flex items-center gap-2 bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            New Request
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Requests", value: stats.total, icon: FileText, color: "text-[#000000] dark:text-[#FFFFFF]" },
            { label: "Pending Approval", value: stats.pending, icon: Clock, color: "text-[#000000] dark:text-[#FFFFFF]" },
            { label: "Approved", value: stats.approved, icon: CheckCircle, color: "text-[#000000] dark:text-[#FFFFFF]" },
            { label: "Total Value", value: fmt(stats.totalValue), icon: Package, color: "text-[#000000] dark:text-[#FFFFFF]" },
          ].map((s) => (
            <div key={s.label} className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-4">
              <div className="flex items-center gap-3">
                <s.icon size={20} className={s.color} />
                <div>
                  <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">{s.label}</p>
                  <p className="text-lg font-bold text-[#000000] dark:text-[#FFFFFF]">{s.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] dark:text-[#A3A3A3]" />
            <input
              type="text"
              placeholder="Search requests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl pl-9 pr-4 py-2 text-sm text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3 py-2 text-sm text-[#000000] dark:text-[#FFFFFF] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
          >
            <option value="All">All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3 py-2 text-sm text-[#000000] dark:text-[#FFFFFF] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
          >
            <option value="All">All</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-[#666666] dark:text-[#A3A3A3]">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-sm text-[#000000] dark:text-[#FFFFFF] font-medium">{error}</p>
              <button onClick={() => reload()} className="mt-3 text-xs font-medium text-[#000000] dark:text-[#FFFFFF] hover:text-[#000000] dark:text-[#FFFFFF]">Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-[#666666] dark:text-[#A3A3A3]">
              <AlertCircle size={40} className="mx-auto mb-3 opacity-50" />
              <p>{requests.length === 0 ? "No material requests yet." : "No requests match your filters."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] border-b border-[#D4D4D4] dark:border-[#303030]">
                  <tr>
                    {["Request #", "Project", "Requested By", "Items", "Required Date", "Total Value", "Priority", "Status", "Actions"].map((h) => (
                      <th key={h} className="text-left text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
                  {filtered.map((r) => (
                    <tr key={r._id} className="hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] transition-colors">
                      <td className="px-4 py-3"><span className="font-mono text-[#000000] dark:text-[#FFFFFF] font-medium">{r.requestNumber}</span></td>
                      <td className="px-4 py-3 text-white">{projectName(r.projectId)}</td>
                      <td className="px-4 py-3 text-[#333333] dark:text-[#D4D4D4]">{r.requestedBy}</td>
                      <td className="px-4 py-3 text-[#333333] dark:text-[#D4D4D4]">{r.items.length} item{r.items.length > 1 ? "s" : ""}</td>
                      <td className="px-4 py-3 text-[#333333] dark:text-[#D4D4D4]">{r.requiredDate ? new Date(r.requiredDate).toLocaleDateString("en-ET") : "—"}</td>
                      <td className="px-4 py-3 text-[#000000] dark:text-[#FFFFFF] font-medium">{fmt(r.totalEstimatedCost)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_COLORS[r.priority] || PRIORITY_COLORS.Medium}`}>{r.priority}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] || STATUS_COLORS.Draft}`}>{r.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => { setSelected(r); setShowModal(true); setActionError(null); }} className="text-[#000000] dark:text-[#FFFFFF] hover:text-[#000000] dark:text-[#FFFFFF] transition-colors">
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
            <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl w-full max-w-2xl shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-[#D4D4D4] dark:border-[#303030]">
                <div>
                  <h2 className="text-lg font-bold text-[#000000] dark:text-[#FFFFFF]">{selected.requestNumber}</h2>
                  <p className="text-[#666666] dark:text-[#A3A3A3] text-sm">{projectName(selected.projectId)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[selected.status] || STATUS_COLORS.Draft}`}>{selected.status}</span>
                  <button onClick={() => setShowModal(false)} className="text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] ml-2"><X size={18} /></button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-[#666666] dark:text-[#A3A3A3]">Requested by:</span> <span className="text-white ml-2">{selected.requestedBy}</span></div>
                  <div><span className="text-[#666666] dark:text-[#A3A3A3]">Priority:</span> <span className={`ml-2 px-2 py-0.5 rounded text-xs ${PRIORITY_COLORS[selected.priority] || PRIORITY_COLORS.Medium}`}>{selected.priority}</span></div>
                  <div><span className="text-[#666666] dark:text-[#A3A3A3]">Required date:</span> <span className="text-white ml-2">{selected.requiredDate ? new Date(selected.requiredDate).toLocaleDateString() : "—"}</span></div>
                  <div><span className="text-[#666666] dark:text-[#A3A3A3]">Total value:</span> <span className="text-[#000000] dark:text-[#FFFFFF] font-bold ml-2">{fmt(selected.totalEstimatedCost)}</span></div>
                </div>
                {selected.notes && (
                  <div className="bg-black/5 dark:bg-white/10 border border-[#D4D4D4] dark:border-[#303030] rounded-lg p-3 text-[#000000] dark:text-[#FFFFFF] text-sm">
                    <strong>Notes:</strong> {selected.notes}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-medium text-[#333333] dark:text-[#D4D4D4] mb-2">Requested Items</h3>
                  <div className="space-y-2">
                    {selected.items.length === 0 && <p className="text-[#666666] dark:text-[#A3A3A3] text-sm">No line items.</p>}
                    {selected.items.map((item, i) => (
                      <div key={i} className="bg-[#FAFAFA] dark:bg-[#171717] rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <p className="text-[#000000] dark:text-[#FFFFFF] font-medium">{item.name}</p>
                          <p className="text-[#666666] dark:text-[#A3A3A3] text-xs">{item.quantityRequested} {item.unit}</p>
                        </div>
                        <span className="text-[#000000] dark:text-[#FFFFFF] font-medium">{fmt(item.estimatedCost)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {actionError && <p className="text-xs text-[#000000] dark:text-[#FFFFFF]">{actionError}</p>}

                {selected.status === "Pending" && (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => changeStatus(selected._id, "Approved")}
                      disabled={actionBusy}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {actionBusy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} Approve Request
                    </button>
                    <button
                      onClick={() => changeStatus(selected._id, "Rejected")}
                      disabled={actionBusy}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
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
            <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between border-b border-[#D4D4D4] dark:border-[#303030] pb-4">
                <h2 className="text-lg font-bold text-[#000000] dark:text-[#FFFFFF]">New Material Request</h2>
                <button onClick={() => setFormOpen(false)} className="text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"><X size={18} /></button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Project</label>
                  <select className={inputCls} value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                    {projects.length === 0 && <option value="">No accessible projects</option>}
                    {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Request #</label>
                    <input className={inputCls} value={form.requestNumber} onChange={(e) => setForm({ ...form, requestNumber: e.target.value })} placeholder="MR-2026-001" />
                  </div>
                  <div>
                    <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Priority</label>
                    <select className={inputCls} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                      {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Required date</label>
                  <input type="date" className={inputCls} value={form.requiredDate} onChange={(e) => setForm({ ...form, requiredDate: e.target.value })} />
                </div>
                <div className="border-t border-[#D4D4D4] dark:border-[#303030] pt-3">
                  <p className="text-xs text-[#666666] dark:text-[#A3A3A3] mb-2">Line item</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Material</label>
                      <input className={inputCls} value={form.materialName} onChange={(e) => setForm({ ...form, materialName: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Unit</label>
                      <input className={inputCls} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="bags / tons / m³" />
                    </div>
                    <div>
                      <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Quantity</label>
                      <input type="number" min="0" className={inputCls} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Estimated cost (ETB)</label>
                      <input type="number" min="0" className={inputCls} value={form.estimatedCost} onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Notes</label>
                  <textarea className={inputCls} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>

              {formError && <p className="text-xs text-[#000000] dark:text-[#FFFFFF]">{formError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setFormOpen(false)} className="bg-[#F5F5F5] dark:bg-[#1F1F1F] border border-[#D4D4D4] dark:border-[#303030] hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] text-[#000000] dark:text-[#FFFFFF] px-4 py-2 rounded-lg text-sm">Cancel</button>
                <button onClick={submit} disabled={busy} className="bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
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
