"use client";

import { FormEvent, useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { hasPermission } from "@/lib/rbac/permissions";
import { Plus, Search, Eye, CheckCircle, XCircle, Clock, Package, FileText } from "lucide-react";

interface MaterialRequest {
  _id: string;
  requestNumber: string;
  project: { _id: string; name: string };
  requestedBy: { _id: string; name: string };
  status: "Draft" | "Pending" | "Approved" | "Rejected" | "Fulfilled" | "Unspecified";
  priority: "Low" | "Medium" | "High" | "Critical";
  items: Array<{ material: { name: string; unit: string }; quantityRequested: number; quantityApproved?: number; estimatedCost: number }>;
  requiredDate: string;
  totalEstimatedCost: number;
  notes?: string;
  createdAt: string;
}

interface ProjectOption { _id: string; name: string }
interface MaterialOption { _id: string; name: string; unitOfMeasure: string; unitCost: number }
interface MaterialRequestApiRecord {
  _id: string;
  requestNumber: string;
  projectId?: { _id?: string; name?: string } | string;
  requestedBy?: { fullName?: string } | string;
  status: string;
  priority: string;
  items?: Array<{ materialName: string; unitOfMeasure: string; requestedQuantity: number; approvedQuantity?: number; estimatedUnitCost: number }>;
  requiredByDate: string;
  reason: string;
  createdAt: string;
  approvalNotes?: string;
}

const STATUS_LABELS: Record<string, MaterialRequest["status"]> = { DRAFT: "Draft", SUBMITTED: "Pending", APPROVED: "Approved", REJECTED: "Rejected", ORDERED: "Fulfilled", PARTIALLY_RECEIVED: "Fulfilled", RECEIVED: "Fulfilled", CANCELLED: "Rejected" };
const PRIORITY_LABELS: Record<string, MaterialRequest["priority"]> = { LOW: "Low", MEDIUM: "Medium", HIGH: "High", URGENT: "Critical" };
const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
  Pending: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  Approved: "bg-green-500/20 text-green-400 border border-green-500/30",
  Rejected: "bg-red-500/20 text-red-400 border border-red-500/30",
  Fulfilled: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  Unspecified: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
};
const PRIORITY_COLORS: Record<string, string> = {
  Low: "bg-gray-500/20 text-gray-400",
  Medium: "bg-yellow-500/20 text-yellow-400",
  High: "bg-orange-500/20 text-orange-400",
  Critical: "bg-red-500/20 text-red-400",
};

export default function ProcurementRequestsPage() {
  const { user } = useAuth();
  const canCreate = hasPermission(user, "MATERIAL_REQUEST_CREATE");
  const canApprove = hasPermission(user, "MATERIAL_REQUEST_APPROVE");
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [selected, setSelected] = useState<MaterialRequest | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  async function fetchRequests() {
    setLoading(true);
    try {
      const response = await fetch("/api/material-requests", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok || !json.success) {
        setError(json.error?.message || "Unable to load material requests.");
        return;
      }
      setRequests(((json.data?.items || []) as MaterialRequestApiRecord[]).map((record) => {
        const items = (record.items || []).map((item) => ({
          material: { name: item.materialName, unit: item.unitOfMeasure },
          quantityRequested: item.requestedQuantity,
          quantityApproved: item.approvedQuantity,
          estimatedCost: item.requestedQuantity * item.estimatedUnitCost,
        }));
        return {
          _id: record._id,
          requestNumber: record.requestNumber,
          project: { _id: typeof record.projectId === "object" ? record.projectId?._id || "" : record.projectId || "", name: typeof record.projectId === "object" ? record.projectId?.name || "Project unavailable" : "Project unavailable" },
          requestedBy: { _id: "", name: typeof record.requestedBy === "object" ? record.requestedBy?.fullName || "Unknown user" : "Unknown user" },
          status: STATUS_LABELS[record.status] || "Unspecified",
          priority: PRIORITY_LABELS[record.priority] || "Medium",
          items,
          requiredDate: record.requiredByDate,
          totalEstimatedCost: items.reduce((sum, item) => sum + item.estimatedCost, 0),
          notes: record.approvalNotes || record.reason,
          createdAt: record.createdAt,
        };
      }));
      setError("");
    } catch {
      setError("Unable to connect to the material request service.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => { void fetchRequests(); });
    fetch("/api/projects?limit=100").then(async (response) => { const json = await response.json(); if (response.ok && json.success) setProjects(json.data?.items || []); }).catch(() => {});
    fetch("/api/materials?limit=200").then(async (response) => { const json = await response.json(); if (response.ok && json.success) setMaterials(json.data?.items || []); }).catch(() => {});
  }, []);

  async function createRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/material-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: form.get("projectId"),
          materialId: form.get("materialId"),
          requestedQuantity: Number(form.get("requestedQuantity")),
          requiredByDate: form.get("requiredByDate"),
          priority: form.get("priority"),
          reason: form.get("reason"),
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        setFormError(json.error?.message || "Unable to submit material request.");
        return;
      }
      setShowCreateForm(false);
      await fetchRequests();
    } catch {
      setFormError("Unable to connect to the material request service.");
    } finally {
      setSaving(false);
    }
  }

  async function decideRequest(request: MaterialRequest, status: "APPROVED" | "REJECTED") {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/material-requests/${request._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        setError(json.error?.message || "Unable to update material request.");
        return;
      }
      setSelected(null);
      await fetchRequests();
    } catch {
      setError("Unable to connect to the material request service.");
    } finally {
      setSaving(false);
    }
  }

  const filtered = requests.filter((request) => {
    const matchesSearch = `${request.requestNumber} ${request.project.name} ${request.requestedBy.name}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (statusFilter === "All" || request.status === statusFilter) && (priorityFilter === "All" || request.priority === priorityFilter);
  });
  const stats = {
    total: requests.length,
    pending: requests.filter((request) => request.status === "Pending").length,
    approved: requests.filter((request) => request.status === "Approved").length,
    totalValue: requests.reduce((sum, request) => sum + request.totalEstimatedCost, 0),
  };
  const fmt = (amount: number) => `ETB ${amount.toLocaleString("en-ET", { minimumFractionDigits: 2 })}`;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h1 className="text-2xl font-bold text-white">Material Requests</h1><p className="mt-1 text-sm text-gray-400">Submit and review material requisitions for accessible projects.</p></div>
          {canCreate && <button type="button" onClick={() => { setFormError(""); setShowCreateForm(true); }} disabled={!projects.length || !materials.length} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"><Plus size={16} />New Request</button>}
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Total Requests", value: stats.total, icon: FileText, color: "text-blue-400" },
            { label: "Pending Approval", value: stats.pending, icon: Clock, color: "text-yellow-400" },
            { label: "Approved", value: stats.approved, icon: CheckCircle, color: "text-green-400" },
            { label: "Total Value", value: fmt(stats.totalValue), icon: Package, color: "text-purple-400" },
          ].map((stat) => <div key={stat.label} className="rounded-xl border border-gray-700 bg-gray-800 p-4"><div className="flex items-center gap-3"><stat.icon size={20} className={stat.color} /><div><p className="text-xs text-gray-400">{stat.label}</p><p className="text-lg font-bold text-white">{stat.value}</p></div></div></div>)}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative min-w-0 flex-1"><span className="sr-only">Search requests</span><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="search" placeholder="Search requests…" value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none" /></label>
          <select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">{["All", "Draft", "Pending", "Approved", "Rejected", "Fulfilled"].map((status) => <option key={status}>{status}</option>)}</select>
          <select aria-label="Filter by priority" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">{["All", "Low", "Medium", "High", "Critical"].map((priority) => <option key={priority}>{priority}</option>)}</select>
        </div>

        {error && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
        <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800"><div className="overflow-x-auto"><table className="w-full min-w-[880px] text-sm"><thead className="border-b border-gray-700 bg-gray-900/50"><tr>{["Request #", "Project", "Requested By", "Items", "Required Date", "Total Value", "Priority", "Status", "Actions"].map((heading) => <th key={heading} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">{heading}</th>)}</tr></thead><tbody className="divide-y divide-gray-700">{loading ? <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Loading material requests…</td></tr> : filtered.length === 0 ? <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">{requests.length ? "No requests match your filters." : "No material requests are available."}</td></tr> : filtered.map((request) => <tr key={request._id} className="hover:bg-gray-700/30"><td className="px-4 py-3 font-mono font-medium text-blue-400">{request.requestNumber}</td><td className="px-4 py-3 text-white">{request.project.name}</td><td className="px-4 py-3 text-gray-300">{request.requestedBy.name}</td><td className="px-4 py-3 text-gray-300">{request.items.length} item{request.items.length === 1 ? "" : "s"}</td><td className="px-4 py-3 text-gray-300">{new Date(request.requiredDate).toLocaleDateString("en-ET")}</td><td className="px-4 py-3 font-medium text-white">{fmt(request.totalEstimatedCost)}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs ${PRIORITY_COLORS[request.priority]}`}>{request.priority}</span></td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs ${STATUS_COLORS[request.status]}`}>{request.status}</span></td><td className="px-4 py-3"><button type="button" aria-label={`View ${request.requestNumber}`} onClick={() => setSelected(request)} className="rounded p-1 text-blue-400 hover:text-blue-300"><Eye size={16} /></button></td></tr>)}</tbody></table></div></div>

        {selected && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"><section role="dialog" aria-modal="true" aria-labelledby="request-dialog-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl"><div className="flex items-start justify-between gap-4 border-b border-gray-700 p-5"><div><h2 id="request-dialog-title" className="font-bold text-white">{selected.requestNumber}</h2><p className="mt-1 text-sm text-gray-400">{selected.project.name}</p></div><button type="button" aria-label="Close request details" onClick={() => setSelected(null)} className="text-gray-400 hover:text-white">×</button></div><div className="space-y-4 p-5"><p className="text-sm text-gray-300">{selected.notes}</p><div className="space-y-2">{selected.items.map((item, index) => <div key={`${item.material.name}-${index}`} className="flex flex-wrap justify-between gap-3 rounded-lg bg-gray-800 p-3 text-sm"><span className="text-white">{item.material.name} · {item.quantityRequested} {item.material.unit}</span><span className="text-gray-300">{fmt(item.estimatedCost)}</span></div>)}</div>{canApprove && selected.status === "Pending" && <div className="flex flex-col gap-3 pt-2 sm:flex-row"><button type="button" disabled={saving} onClick={() => void decideRequest(selected, "APPROVED")} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 py-2 text-sm font-medium text-white disabled:opacity-50"><CheckCircle size={16} />Approve Request</button><button type="button" disabled={saving} onClick={() => void decideRequest(selected, "REJECTED")} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 py-2 text-sm font-medium text-white disabled:opacity-50"><XCircle size={16} />Reject Request</button></div>}</div></section></div>}

        {showCreateForm && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"><form role="dialog" aria-modal="true" aria-labelledby="new-request-title" onSubmit={createRequest} className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-2xl border border-gray-700 bg-gray-900 p-5 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h2 id="new-request-title" className="text-lg font-semibold text-white">New material request</h2><p className="mt-1 text-sm text-gray-400">Choose one material and project for this request.</p></div><button type="button" aria-label="Close material request form" disabled={saving} onClick={() => setShowCreateForm(false)} className="text-xl text-gray-400">×</button></div>{formError && <p role="alert" className="text-sm text-rose-300">{formError}</p>}<label className="grid gap-1 text-sm text-gray-300">Project<select name="projectId" required className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white"><option value="">Select project</option>{projects.map((project) => <option key={project._id} value={project._id}>{project.name}</option>)}</select></label><label className="grid gap-1 text-sm text-gray-300">Material<select name="materialId" required className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white"><option value="">Select material</option>{materials.map((material) => <option key={material._id} value={material._id}>{material.name} · {material.unitOfMeasure}</option>)}</select></label><div className="grid gap-4 sm:grid-cols-3"><label className="grid gap-1 text-sm text-gray-300">Quantity<input name="requestedQuantity" type="number" min="1" step="1" required className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white" /></label><label className="grid gap-1 text-sm text-gray-300">Required by<input name="requiredByDate" type="date" required className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white" /></label><label className="grid gap-1 text-sm text-gray-300">Priority<select name="priority" defaultValue="MEDIUM" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white"><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></label></div><label className="grid gap-1 text-sm text-gray-300">Reason<textarea name="reason" minLength={2} maxLength={1000} required rows={3} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white" /></label><div className="flex justify-end gap-2"><button type="button" disabled={saving} onClick={() => setShowCreateForm(false)} className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-200">Cancel</button><button type="submit" disabled={saving || !projects.length || !materials.length} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Submitting…" : "Submit request"}</button></div></form></div>}
      </div>
    </AppShell>
  );
}
