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
  Active: "bg-green-500/20 text-green-400 border border-green-500/30",
  Returned: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
  "Transfer Scheduled": "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
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
    "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500";

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Equipment Site Assignments</h1>
            <p className="text-gray-400 text-sm mt-1">
              Fleet mobilization, operator dispatching, location tracking, and plant utilization
            </p>
          </div>
          <button
            onClick={openForm}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Mobilize Equipment
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Deployed Assets</p>
            <p className="text-xl font-bold text-white mt-1">{assignments.length}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Active On Site</p>
            <p className="text-xl font-bold text-green-400 mt-1">
              {assignments.filter((a) => a.status === "Active").length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Transfers Scheduled</p>
            <p className="text-xl font-bold text-yellow-400 mt-1">
              {assignments.filter((a) => a.status === "Transfer Scheduled").length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Fleet Operating Hours</p>
            <p className="text-xl font-bold text-blue-400 mt-1">
              {assignments.reduce((s, a) => s + a.operatingHours, 0).toLocaleString()} hrs
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by equipment, code, project, or operator..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
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
              <button onClick={() => reload()} className="mt-3 text-xs font-medium text-blue-400 hover:text-blue-300">
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Truck size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">
                {assignments.length === 0 ? "No equipment mobilized yet." : "No assignments match your search."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-900/50 border-b border-gray-700">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Asset Code & Machine</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Assigned Site</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Designated Operator</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Mobilization Period</th>
                    <th className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Total Run Hours</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Status</th>
                    <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filtered.map((a) => (
                    <tr key={a._id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-blue-400 font-semibold text-xs">{a.assetCode}</span>
                        <p className="text-white font-medium">{a.equipmentName}</p>
                        <p className="text-gray-400 text-xs">{a.type}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white text-xs font-medium">{a.assignedProject}</p>
                        <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                          <MapPin size={11} /> {a.siteLocation}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-200 text-xs flex items-center gap-1">
                          <User size={12} /> {a.assignedOperator}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-xs">
                        {new Date(a.startDate).toLocaleDateString("en-ET")} →{" "}
                        {a.expectedEndDate ? new Date(a.expectedEndDate).toLocaleDateString("en-ET") : "—"}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-white font-bold">
                        {a.operatingHours.toLocaleString()} hrs
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[a.status] || STATUS_BADGES.Active}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => openReassign(a)} className="text-blue-400 hover:text-blue-300 p-1" title="Transfer / Reassign">
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
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-gray-700 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Transfer / Reassign</h2>
                <p className="text-gray-400 text-xs font-mono">{reassigning.assetCode} · {reassigning.equipmentName}</p>
              </div>
              <button onClick={() => setReassigning(null)} className="text-gray-400 hover:text-white"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Assigned project</label>
                <select className={inputCls} value={reassignForm.projectId} onChange={(e) => setReassignForm({ ...reassignForm, projectId: e.target.value })}>
                  {projects.length === 0 && <option value="">No accessible projects</option>}
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Site location</label>
                <input className={inputCls} value={reassignForm.siteLocation} onChange={(e) => setReassignForm({ ...reassignForm, siteLocation: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Designated operator</label>
                <input className={inputCls} value={reassignForm.assignedOperator} onChange={(e) => setReassignForm({ ...reassignForm, assignedOperator: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Assignment start date</label>
                  <input type="date" className={inputCls} value={reassignForm.startDate} onChange={(e) => setReassignForm({ ...reassignForm, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Expected end date</label>
                  <input type="date" className={inputCls} value={reassignForm.expectedEndDate} onChange={(e) => setReassignForm({ ...reassignForm, expectedEndDate: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Status</label>
                <select className={inputCls} value={reassignForm.status} onChange={(e) => setReassignForm({ ...reassignForm, status: e.target.value })}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {reassignError && <p className="text-xs text-red-300">{reassignError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setReassigning(null)} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={submitReassign} disabled={reassignBusy} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
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
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-gray-700 pb-4">
              <h2 className="text-lg font-bold text-white">Mobilize Equipment</h2>
              <button onClick={() => setFormOpen(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Assigned project</label>
                <select className={inputCls} value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                  {projects.length === 0 && <option value="">No accessible projects</option>}
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Asset code</label>
                  <input className={inputCls} value={form.assetCode} onChange={(e) => setForm({ ...form, assetCode: e.target.value })} placeholder="EQ-EXC-04" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Equipment type</label>
                  <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Equipment name</label>
                <input className={inputCls} value={form.equipmentName} onChange={(e) => setForm({ ...form, equipmentName: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Site location</label>
                <input className={inputCls} value={form.siteLocation} onChange={(e) => setForm({ ...form, siteLocation: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Designated operator</label>
                <input className={inputCls} value={form.assignedOperator} onChange={(e) => setForm({ ...form, assignedOperator: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Assignment start date</label>
                  <input type="date" className={inputCls} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Expected end date</label>
                  <input type="date" className={inputCls} value={form.expectedEndDate} onChange={(e) => setForm({ ...form, expectedEndDate: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Operating hours</label>
                  <input type="number" min="0" className={inputCls} value={form.operatingHours} onChange={(e) => setForm({ ...form, operatingHours: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Status</label>
                  <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {formError && <p className="text-xs text-red-300">{formError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setFormOpen(false)} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={submit} disabled={busy} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
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
