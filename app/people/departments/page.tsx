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
    "w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3 py-2 text-sm text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]";

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#000000] dark:text-[#FFFFFF]">Departments & Organizational Units</h1>
            <p className="text-[#666666] dark:text-[#A3A3A3] text-sm mt-1">
              Divisional leadership, workforce allocations, and departmental payroll budgets
            </p>
          </div>
          <button
            onClick={openForm}
            className="flex items-center gap-2 bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Create Department
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Total Departments</p>
            <p className="text-xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1">{departments.length}</p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Company Staff Headcount</p>
            <p className="text-xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1">{totalPersonnel}</p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Monthly Direct Payroll</p>
            <p className="text-xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1">{fmt(totalMonthlyPayroll)}</p>
          </div>
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-4">
            <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">Active Site Deployments</p>
            <p className="text-xl font-bold text-[#000000] dark:text-[#FFFFFF] mt-1">{deployedProjects} Projects</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] dark:text-[#A3A3A3]" />
          <input
            type="text"
            placeholder="Search departments or heads of division..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl pl-9 pr-4 py-2 text-sm text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
          />
        </div>

        {/* Department cards grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-[#666666] dark:text-[#A3A3A3]">
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-6 text-center">
            <p className="text-sm text-[#000000] dark:text-[#FFFFFF] font-medium">{error}</p>
            <button onClick={() => reload()} className="mt-3 text-xs font-medium text-[#000000] dark:text-[#FFFFFF] hover:text-[#000000] dark:text-[#FFFFFF]">
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-12 text-center text-[#666666] dark:text-[#A3A3A3]">
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
                className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-5 flex flex-col justify-between hover:border-[#D4D4D4] dark:border-[#303030] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[#000000] dark:text-[#FFFFFF] font-semibold">
                      {dept.code}
                    </span>
                    <span className="text-xs text-[#666666] dark:text-[#A3A3A3] flex items-center gap-1">
                      <Users size={13} /> {dept.headcount} staff
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF] mt-2">{dept.name}</h3>
                  <p className="text-xs text-[#666666] dark:text-[#A3A3A3] mt-1 line-clamp-2">{dept.description}</p>

                  <div className="mt-4 pt-3 border-t border-[#D4D4D4] dark:border-[#303030]/60 space-y-2">
                    <div>
                      <p className="text-[11px] text-[#666666] dark:text-[#A3A3A3]">Head of Department</p>
                      <p className="text-sm text-[#000000] dark:text-[#FFFFFF] font-medium">{dept.headOfDepartment}</p>
                      <p className="text-[11px] text-[#666666] dark:text-[#A3A3A3]">{dept.headTitle}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-[#666666] dark:text-[#A3A3A3]">Monthly Payroll Allocation</p>
                      <p className="text-sm font-semibold text-[#000000] dark:text-[#FFFFFF]">{fmt(dept.monthlyPayrollETB)}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#D4D4D4] dark:border-[#303030] flex justify-end">
                  <button
                    onClick={() => setViewing(dept)}
                    className="text-xs text-[#000000] dark:text-[#FFFFFF] hover:text-[#000000] dark:text-[#FFFFFF] font-medium flex items-center gap-1"
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
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#D4D4D4] dark:border-[#303030] pb-4">
              <div>
                <h2 className="text-lg font-bold text-[#000000] dark:text-[#FFFFFF]">{viewing.name}</h2>
                <p className="text-[#666666] dark:text-[#A3A3A3] text-xs font-mono">{viewing.code} · {projectName(viewing.projectId)}</p>
              </div>
              <button onClick={() => setViewing(null)} className="text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"><X size={18} /></button>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-[#666666] dark:text-[#A3A3A3] text-xs">Head of Department</dt><dd className="text-white">{viewing.headOfDepartment}</dd></div>
              <div><dt className="text-[#666666] dark:text-[#A3A3A3] text-xs">Title</dt><dd className="text-white">{viewing.headTitle || "—"}</dd></div>
              <div><dt className="text-[#666666] dark:text-[#A3A3A3] text-xs">Headcount</dt><dd className="text-white">{viewing.headcount} staff</dd></div>
              <div><dt className="text-[#666666] dark:text-[#A3A3A3] text-xs">Active projects</dt><dd className="text-white">{viewing.activeProjects}</dd></div>
              <div><dt className="text-[#666666] dark:text-[#A3A3A3] text-xs">Monthly payroll</dt><dd className="text-[#000000] dark:text-[#FFFFFF] font-bold">{fmt(viewing.monthlyPayrollETB)}</dd></div>
              <div><dt className="text-[#666666] dark:text-[#A3A3A3] text-xs">Assigned project</dt><dd className="text-white">{projectName(viewing.projectId)}</dd></div>
            </dl>
            {viewing.description && (
              <p className="text-xs text-[#333333] dark:text-[#D4D4D4] bg-[#FAFAFA] dark:bg-[#171717] rounded-lg p-3">{viewing.description}</p>
            )}
            <div className="flex justify-end">
              <button onClick={() => setViewing(null)} className="bg-[#F5F5F5] dark:bg-[#1F1F1F] border border-[#D4D4D4] dark:border-[#303030] hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] text-[#000000] dark:text-[#FFFFFF] px-4 py-2 rounded-lg text-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#D4D4D4] dark:border-[#303030] pb-4">
              <h2 className="text-lg font-bold text-[#000000] dark:text-[#FFFFFF]">Create Department</h2>
              <button onClick={() => setFormOpen(false)} className="text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Project (or company-wide project)</label>
                <select className={inputCls} value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                  {projects.length === 0 && <option value="">No accessible projects</option>}
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Department code</label>
                  <input className={inputCls} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="ENG-CIVIL" />
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Headcount</label>
                  <input type="number" min="0" className={inputCls} value={form.headcount} onChange={(e) => setForm({ ...form, headcount: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Department name</label>
                <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Head / manager</label>
                  <input className={inputCls} value={form.headOfDepartment} onChange={(e) => setForm({ ...form, headOfDepartment: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Head title</label>
                  <input className={inputCls} value={form.headTitle} onChange={(e) => setForm({ ...form, headTitle: e.target.value })} placeholder="Chief Structural Engineer" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Active projects</label>
                  <input type="number" min="0" className={inputCls} value={form.activeProjects} onChange={(e) => setForm({ ...form, activeProjects: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Monthly payroll (ETB)</label>
                  <input type="number" min="0" className={inputCls} value={form.monthlyPayrollETB} onChange={(e) => setForm({ ...form, monthlyPayrollETB: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#666666] dark:text-[#A3A3A3] block mb-1">Description</label>
                <textarea className={inputCls} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>

            {formError && <p className="text-xs text-[#000000] dark:text-[#FFFFFF]">{formError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setFormOpen(false)} className="bg-[#F5F5F5] dark:bg-[#1F1F1F] border border-[#D4D4D4] dark:border-[#303030] hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] text-[#000000] dark:text-[#FFFFFF] px-4 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={submit} disabled={busy} className="bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
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
