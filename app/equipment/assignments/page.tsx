"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, Truck, MapPin, User,
  ArrowRightLeft, X, Loader2,
} from "lucide-react";
import { useRecords, type OperationalRecord } from "@/hooks/useRecords";

interface EquipmentAssignment {
  _id: string;
  projectId: string;
  assetCode: string;
  equipmentName: string;
  type: string;
  assignedProject: string;
  siteLocation: string;
  assignedOperator: string;
  startDate: string;
  expectedEndDate: string;
  status: string;
  operatingHours: number;
}

const STATUS_BADGES: Record<string, string> = {
  Active: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  Returned: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  "Transfer Scheduled": "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
};

const STATUSES = ["Active", "Transfer Scheduled", "Returned"];
const TYPES = ["Tower Crane", "Excavator", "Concrete Mixer", "Generator", "Loader", "Dump Truck", "Other"];

export default function EquipmentAssignmentsPage() {
  const { records, projects, projectName, loading, error, reload, create, update } = useRecords("equipment");

  const mapRecord = (r: OperationalRecord): EquipmentAssignment => {
    const d = r.data || {};
    return {
      _id: r._id,
      projectId: r.projectId,
      assetCode: d.assetCode || r._id.slice(-6),
      equipmentName: d.equipmentName || r.title || "Unnamed asset",
      type: d.type || "Other",
      assignedProject: d.assignedProjectName || projectName(r.projectId),
      siteLocation: d.siteLocation || d.location || "—",
      assignedOperator: d.assignedOperator || d.operator || "—",
      startDate: d.startDate || d.assignedDate || r.createdAt,
      expectedEndDate: d.expectedEndDate || "",
      status: r.status || d.status || "Active",
      operatingHours: Number(d.operatingHours) || 0,
    };
  };

  const assignments = records.map(mapRecord);

  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    projectId: "",
    assetCode: "",
    equipmentName: "",
    type: "Excavator",
    siteLocation: "",
    assignedOperator: "",
    startDate: "",
    expectedEndDate: "",
    status: "Active",
    operatingHours: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [reassigning, setReassigning] = useState<EquipmentAssignment | null>(null);
  const [reassignForm, setReassignForm] = useState({
    projectId: "",
    siteLocation: "",
    assignedOperator: "",
    startDate: "",
    expectedEndDate: "",
    status: "Active",
  });
  const [reassignError, setReassignError] = useState<string | null>(null);
  const [reassignBusy, setReassignBusy] = useState(false);

  const filtered = assignments.filter((a) =>
    a.equipmentName.toLowerCase().includes(search.toLowerCase()) ||
    a.assetCode.toLowerCase().includes(search.toLowerCase()) ||
    a.assignedProject.toLowerCase().includes(search.toLowerCase()) ||
    a.assignedOperator.toLowerCase().includes(search.toLowerCase())
  );

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
    if (!form.equipmentName.trim()) {
      setFormError("Please enter the equipment name.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await create({
        projectId: form.projectId,
        title: form.equipmentName.trim(),
        status: form.status,
        data: {
          assetCode: form.assetCode || undefined,
          equipmentName: form.equipmentName.trim(),
          type: form.type,
          siteLocation: form.siteLocation,
          assignedOperator: form.assignedOperator,
          startDate: form.startDate || undefined,
          assignedDate: form.startDate || undefined,
          expectedEndDate: form.expectedEndDate || undefined,
          operatingHours: Number(form.operatingHours) || 0,
        },
      });
      setFormOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to mobilize equipment");
    } finally {
      setBusy(false);
    }
  };

  const openReassign = (a: EquipmentAssignment) => {
    setReassigning(a);
    setReassignForm({
      projectId: a.projectId,
      siteLocation: a.siteLocation === "—" ? "" : a.siteLocation,
      assignedOperator: a.assignedOperator === "—" ? "" : a.assignedOperator,
      startDate: a.startDate ? a.startDate.slice(0, 10) : "",
      expectedEndDate: a.expectedEndDate ? a.expectedEndDate.slice(0, 10) : "",
      status: a.status,
    });
    setReassignError(null);
  };

  const submitReassign = async () => {
    if (!reassigning) return;
    if (!reassignForm.projectId) {
      setReassignError("Please select a project.");
      return;
    }
    setReassignBusy(true);
    setReassignError(null);
    try {
      await update(reassigning._id, {
        status: reassignForm.status,
        data: {
          assignedTo: reassignForm.assignedOperator || undefined,
          assignedProjectId: reassignForm.projectId,
          assignedProjectName: projectName(reassignForm.projectId),
          assignedDate: reassignForm.startDate || undefined,
          siteLocation: reassignForm.siteLocation,
          assignedOperator: reassignForm.assignedOperator,
          startDate: reassignForm.startDate || undefined,
          expectedEndDate: reassignForm.expectedEndDate || undefined,
          reassignedAt: new Date().toISOString(),
        },
      });
      setReassigning(null);
    } catch (e) {
      setReassignError(e instanceof Error ? e.message : "Failed to reassign equipment");
    } finally {
      setReassignBusy(false);
    }
  };

  const inputCls =
    "w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3 py-2 text-sm text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]";

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#000000] dark:text-[#FFFFFF]">Equipment Site Assignments</h1>
            <p className="text-[#666666] dark:text-[#A3A3A3] text-sm mt-1">
              Fleet mobilization, operator dispatching, location tracking, and plant utilization
            </p>
          </div>
          <button
            onClick={openForm}
            className="flex items-center gap-2 bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Mobilize Equipment
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Deployed Assets</p>
            <p className="text-xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1">{assignments.length}</p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Active On Site</p>
            <p className="text-xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1">
              {assignments.filter((a) => a.status === "Active").length}
            </p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Transfers Scheduled</p>
            <p className="text-xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1">
              {assignments.filter((a) => a.status === "Transfer Scheduled").length}
            </p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Fleet Operating Hours</p>
            <p className="text-xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1">
              {assignments.reduce((s, a) => s + a.operatingHours, 0).toLocaleString()} hrs
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] dark:text-[#A3A3A3]" />
          <input
            type="text"
            placeholder="Search by equipment, code, project, or operator..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl pl-9 pr-4 py-2 text-sm text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
          />
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
              <button onClick={() => reload()} className="mt-3 text-xs font-medium text-[#000000] dark:text-[#FFFFFF] hover:text-[#000000] dark:text-[#FFFFFF]">
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-[#666666] dark:text-[#A3A3A3]">
              <Truck size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">
                {assignments.length === 0 ? "No equipment mobilized yet." : "No assignments match your search."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] border-b border-[#D4D4D4] dark:border-[#303030]">
                  <tr>
                    <th className="text-left text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Asset Code & Machine</th>
                    <th className="text-left text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Assigned Site</th>
                    <th className="text-left text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Designated Operator</th>
                    <th className="text-left text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Mobilization Period</th>
                    <th className="text-center text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Total Run Hours</th>
                    <th className="text-left text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Status</th>
                    <th className="text-right text-xs font-medium text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
                  {filtered.map((a) => (
                    <tr key={a._id} className="hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-[#000000] dark:text-[#FFFFFF] font-semibold text-xs">{a.assetCode}</span>
                        <p className="text-[#000000] dark:text-[#FFFFFF] font-medium">{a.equipmentName}</p>
                        <p className="text-[#666666] dark:text-[#A3A3A3] text-xs">{a.type}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white text-xs font-medium">{a.assignedProject}</p>
                        <p className="text-[#666666] dark:text-[#A3A3A3] text-xs flex items-center gap-1 mt-0.5">
                          <MapPin size={11} /> {a.siteLocation}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[#000000] dark:text-[#FFFFFF] text-xs flex items-center gap-1">
                          <User size={12} /> {a.assignedOperator}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-[#333333] dark:text-[#D4D4D4] text-xs">
                        {new Date(a.startDate).toLocaleDateString("en-ET")} →{" "}
                        {a.expectedEndDate ? new Date(a.expectedEndDate).toLocaleDateString("en-ET") : "—"}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-[#000000] dark:text-[#FFFFFF] font-bold">
                        {a.operatingHours.toLocaleString()} hrs
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[a.status] || STATUS_BADGES.Active}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => openReassign(a)} className="text-[#000000] dark:text-[#FFFFFF] hover:text-[#000000] dark:text-[#FFFFFF] p-1" title="Transfer / Reassign">
                          <ArrowRightLeft size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Transfer / Reassign modal */}
      {reassigning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#D4D4D4] dark:border-[#303030] pb-4">
              <div>
                <h2 className="text-lg font-bold text-[#000000] dark:text-[#FFFFFF]">Transfer / Reassign</h2>
                <p className="text-[#666666] dark:text-[#A3A3A3] text-xs font-mono">{reassigning.assetCode} · {reassigning.equipmentName}</p>
              </div>
              <button onClick={() => setReassigning(null)} className="text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Assigned project</label>
                <select className={inputCls} value={reassignForm.projectId} onChange={(e) => setReassignForm({ ...reassignForm, projectId: e.target.value })}>
                  {projects.length === 0 && <option value="">No accessible projects</option>}
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Site location</label>
                <input className={inputCls} value={reassignForm.siteLocation} onChange={(e) => setReassignForm({ ...reassignForm, siteLocation: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Designated operator</label>
                <input className={inputCls} value={reassignForm.assignedOperator} onChange={(e) => setReassignForm({ ...reassignForm, assignedOperator: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Assignment start date</label>
                  <input type="date" className={inputCls} value={reassignForm.startDate} onChange={(e) => setReassignForm({ ...reassignForm, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Expected end date</label>
                  <input type="date" className={inputCls} value={reassignForm.expectedEndDate} onChange={(e) => setReassignForm({ ...reassignForm, expectedEndDate: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Status</label>
                <select className={inputCls} value={reassignForm.status} onChange={(e) => setReassignForm({ ...reassignForm, status: e.target.value })}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {reassignError && <p className="text-xs text-[#000000] dark:text-[#FFFFFF]">{reassignError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setReassigning(null)} className="bg-[#F5F5F5] dark:bg-[#1F1F1F] border border-[#D4D4D4] dark:border-[#303030] hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] text-[#000000] dark:text-[#FFFFFF] px-4 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={submitReassign} disabled={reassignBusy} className="bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                {reassignBusy && <Loader2 size={14} className="animate-spin" />}
                Save Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#D4D4D4] dark:border-[#303030] pb-4">
              <h2 className="text-lg font-bold text-[#000000] dark:text-[#FFFFFF]">Mobilize Equipment</h2>
              <button onClick={() => setFormOpen(false)} className="text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Assigned project</label>
                <select className={inputCls} value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                  {projects.length === 0 && <option value="">No accessible projects</option>}
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Asset code</label>
                  <input className={inputCls} value={form.assetCode} onChange={(e) => setForm({ ...form, assetCode: e.target.value })} placeholder="EQ-EXC-04" />
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Equipment type</label>
                  <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Equipment name</label>
                <input className={inputCls} value={form.equipmentName} onChange={(e) => setForm({ ...form, equipmentName: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Site location</label>
                <input className={inputCls} value={form.siteLocation} onChange={(e) => setForm({ ...form, siteLocation: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Designated operator</label>
                <input className={inputCls} value={form.assignedOperator} onChange={(e) => setForm({ ...form, assignedOperator: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Assignment start date</label>
                  <input type="date" className={inputCls} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Expected end date</label>
                  <input type="date" className={inputCls} value={form.expectedEndDate} onChange={(e) => setForm({ ...form, expectedEndDate: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Operating hours</label>
                  <input type="number" min="0" className={inputCls} value={form.operatingHours} onChange={(e) => setForm({ ...form, operatingHours: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Status</label>
                  <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {formError && <p className="text-xs text-[#000000] dark:text-[#FFFFFF]">{formError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setFormOpen(false)} className="bg-[#F5F5F5] dark:bg-[#1F1F1F] border border-[#D4D4D4] dark:border-[#303030] hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] text-[#000000] dark:text-[#FFFFFF] px-4 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={submit} disabled={busy} className="bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                {busy && <Loader2 size={14} className="animate-spin" />}
                Mobilize
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
