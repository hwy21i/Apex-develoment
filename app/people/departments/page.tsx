"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, Building, Users, ChevronRight, X, Loader2,
} from "lucide-react";
import { useRecords, type OperationalRecord } from "@/hooks/useRecords";
import { formatCurrency } from "@/lib/formatters/currency";

interface Department {
  _id: string;
  projectId: string;
  code: string;
  name: string;
  headOfDepartment: string;
  headTitle: string;
  headcount: number;
  activeProjects: number;
  monthlyPayrollETB: number;
  description: string;
}

function mapRecord(r: OperationalRecord): Department {
  const d = r.data || {};
  return {
    _id: r._id,
    projectId: r.projectId,
    code: d.code || r._id.slice(-6),
    name: r.title || d.name || "Unnamed department",
    headOfDepartment: d.headOfDepartment || d.head || d.manager || "—",
    headTitle: d.headTitle || "",
    headcount: Number(d.headcount) || 0,
    activeProjects: Number(d.activeProjects) || 0,
    monthlyPayrollETB: Number(d.monthlyPayrollETB ?? d.monthlyPayroll) || 0,
    description: d.description || "",
  };
}

const EMPTY_FORM = {
  projectId: "",
  code: "",
  name: "",
  headOfDepartment: "",
  headTitle: "",
  headcount: "",
  activeProjects: "",
  monthlyPayrollETB: "",
  description: "",
};

export default function PeopleDepartmentsPage() {
  const { records, projects, projectName, loading, error, reload, create } = useRecords("departments");
  const departments = records.map(mapRecord);

  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<Department | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.headOfDepartment.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (n: number) => formatCurrency(n);

  const totalPersonnel = departments.reduce((s, d) => s + d.headcount, 0);
  const totalMonthlyPayroll = departments.reduce((s, d) => s + d.monthlyPayrollETB, 0);
  const deployedProjects = new Set(departments.map((d) => d.projectId)).size;

  const openForm = () => {
    setForm({ ...EMPTY_FORM, projectId: projects[0]?._id || "" });
    setFormError(null);
    setFormOpen(true);
  };

  const submit = async () => {
    if (!form.projectId) {
      setFormError("Please select a project (or the company-wide project).");
      return;
    }
    if (!form.name.trim()) {
      setFormError("Please enter a department name.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await create({
        projectId: form.projectId,
        title: form.name.trim(),
        data: {
          code: form.code || undefined,
          name: form.name.trim(),
          headOfDepartment: form.headOfDepartment,
          headTitle: form.headTitle,
          headcount: Number(form.headcount) || 0,
          activeProjects: Number(form.activeProjects) || 0,
          monthlyPayrollETB: Number(form.monthlyPayrollETB) || 0,
          description: form.description,
        },
      });
      setFormOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to create department");
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500";

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Departments & Organizational Units</h1>
            <p className="text-gray-400 text-sm mt-1">
              Divisional leadership, workforce allocations, and departmental payroll budgets
            </p>
          </div>
          <button
            onClick={openForm}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Create Department
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Total Departments</p>
            <p className="text-xl font-bold text-white mt-1">{departments.length}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Company Staff Headcount</p>
            <p className="text-xl font-bold text-green-400 mt-1">{totalPersonnel}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Monthly Direct Payroll</p>
            <p className="text-xl font-bold text-blue-400 mt-1">{fmt(totalMonthlyPayroll)}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Active Site Deployments</p>
            <p className="text-xl font-bold text-purple-400 mt-1">{deployedProjects} Projects</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search departments or heads of division..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Department cards grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-center">
            <p className="text-sm text-red-300">{error}</p>
            <button onClick={() => reload()} className="mt-3 text-xs font-medium text-blue-400 hover:text-blue-300">
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center text-gray-400">
            <Building size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">
              {departments.length === 0 ? "No departments created yet." : "No departments match your search."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((dept) => (
              <div
                key={dept._id}
                className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col justify-between hover:border-gray-600 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-semibold">
                      {dept.code}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Users size={13} /> {dept.headcount} staff
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-2">{dept.name}</h3>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{dept.description}</p>

                  <div className="mt-4 pt-3 border-t border-gray-700/60 space-y-2">
                    <div>
                      <p className="text-[11px] text-gray-400">Head of Department</p>
                      <p className="text-sm text-white font-medium">{dept.headOfDepartment}</p>
                      <p className="text-[11px] text-gray-400">{dept.headTitle}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400">Monthly Payroll Allocation</p>
                      <p className="text-sm font-semibold text-green-400">{fmt(dept.monthlyPayrollETB)}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-700 flex justify-end">
                  <button
                    onClick={() => setViewing(dept)}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                  >
                    View Roster <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View / details modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-700 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">{viewing.name}</h2>
                <p className="text-gray-400 text-xs font-mono">{viewing.code} · {projectName(viewing.projectId)}</p>
              </div>
              <button onClick={() => setViewing(null)} className="text-gray-400 hover:text-white"><X size={18} /></button>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-gray-400 text-xs">Head of Department</dt><dd className="text-white">{viewing.headOfDepartment}</dd></div>
              <div><dt className="text-gray-400 text-xs">Title</dt><dd className="text-white">{viewing.headTitle || "—"}</dd></div>
              <div><dt className="text-gray-400 text-xs">Headcount</dt><dd className="text-white">{viewing.headcount} staff</dd></div>
              <div><dt className="text-gray-400 text-xs">Active projects</dt><dd className="text-white">{viewing.activeProjects}</dd></div>
              <div><dt className="text-gray-400 text-xs">Monthly payroll</dt><dd className="text-white font-bold">{fmt(viewing.monthlyPayrollETB)}</dd></div>
              <div><dt className="text-gray-400 text-xs">Assigned project</dt><dd className="text-white">{projectName(viewing.projectId)}</dd></div>
            </dl>
            {viewing.description && (
              <p className="text-xs text-gray-300 bg-gray-800 rounded-lg p-3">{viewing.description}</p>
            )}
            <div className="flex justify-end">
              <button onClick={() => setViewing(null)} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-gray-700 pb-4">
              <h2 className="text-lg font-bold text-white">Create Department</h2>
              <button onClick={() => setFormOpen(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Project (or company-wide project)</label>
                <select className={inputCls} value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                  {projects.length === 0 && <option value="">No accessible projects</option>}
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Department code</label>
                  <input className={inputCls} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="ENG-CIVIL" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Headcount</label>
                  <input type="number" min="0" className={inputCls} value={form.headcount} onChange={(e) => setForm({ ...form, headcount: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Department name</label>
                <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Head / manager</label>
                  <input className={inputCls} value={form.headOfDepartment} onChange={(e) => setForm({ ...form, headOfDepartment: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Head title</label>
                  <input className={inputCls} value={form.headTitle} onChange={(e) => setForm({ ...form, headTitle: e.target.value })} placeholder="Chief Structural Engineer" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Active projects</label>
                  <input type="number" min="0" className={inputCls} value={form.activeProjects} onChange={(e) => setForm({ ...form, activeProjects: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Monthly payroll (ETB)</label>
                  <input type="number" min="0" className={inputCls} value={form.monthlyPayrollETB} onChange={(e) => setForm({ ...form, monthlyPayrollETB: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Description</label>
                <textarea className={inputCls} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>

            {formError && <p className="text-xs text-red-300">{formError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setFormOpen(false)} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={submit} disabled={busy} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                {busy && <Loader2 size={14} className="animate-spin" />}
                Create Department
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
