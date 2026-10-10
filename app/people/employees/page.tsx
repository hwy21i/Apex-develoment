"use client";

import React, { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  UserSquare2,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import { useRecords, type OperationalRecord } from "@/hooks/useRecords";

interface EmployeeRecord {
  _id: string;
  name: string;
  employeeId: string;
  department: string;
  position: string;
  employeeType: string;
  phone: string;
  status: string;
}

const STATUSES = ["ACTIVE", "ON_LEAVE", "TERMINATED"];
const EMPLOYEE_TYPES = ["Full-time", "Part-time", "Contract", "Daily Laborer", "Internship"];

const STATUS_BADGES: Record<string, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  ON_LEAVE: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  TERMINATED: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
};

function mapRecord(r: OperationalRecord): EmployeeRecord {
  const d = r.data || {};
  return {
    _id: r._id,
    name: r.title || d.fullName || "Unnamed Employee",
    employeeId: d.employeeId || "EMP-" + r._id.slice(-4).toUpperCase(),
    department: d.department || "—",
    position: d.position || "—",
    employeeType: d.employeeType || "Full-time",
    phone: d.phone || "—",
    status: r.status || "ACTIVE",
  };
}

const EMPTY_FORM = {
  projectId: "",
  fullName: "",
  employeeId: "",
  department: "",
  position: "",
  employeeType: "Full-time",
  email: "",
  phone: "",
  hireDate: "",
  status: "ACTIVE",
};

export default function PeopleEmployeesPage() {
  const { records, projects, loading, error, reload, create } = useRecords("employees");
  const employees = records.map(mapRecord);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const openForm = () => {
    setForm({ ...EMPTY_FORM, projectId: projects[0]?._id || "" });
    setFormError(null);
    setFormOpen(true);
  };

  const submit = async () => {
    if (!form.projectId) {
      setFormError("Please select a project.");
      return;
    }
    if (!form.fullName.trim()) {
      setFormError("Full name is required.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await create({
        projectId: form.projectId,
        title: form.fullName.trim(),
        status: form.status,
        data: {
          fullName: form.fullName.trim(),
          employeeId: form.employeeId,
          department: form.department,
          position: form.position,
          employeeType: form.employeeType,
          email: form.email,
          phone: form.phone,
          hireDate: form.hireDate || undefined,
        },
      });
      setFormOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to onboard employee");
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "w-full bg-[#141720] border border-[#262C3D] rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500";

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <UserSquare2 className="w-4 h-4" /> Human Resources & Workforce
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Workforce & Personnel Directory
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Engineers, project managers, foremen, trade crews, and administrative staff.
            </p>
          </div>

          <button
            onClick={openForm}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> Onboard Employee
          </button>
        </div>

        {/* Employees Table */}
        <div className="bg-[#141720] border border-[#232733] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#181B24] text-slate-400 uppercase tracking-wider font-mono text-[11px] border-b border-[#232733]">
                <tr>
                  <th className="px-5 py-3">Employee ID</th>
                  <th className="px-5 py-3">Full Name</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3">Position</th>
                  <th className="px-5 py-3">Employment Type</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202432]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading personnel directory...
                      </span>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center">
                      <p className="text-slate-400">{error}</p>
                      <button
                        onClick={() => reload()}
                        className="mt-2 text-xs font-semibold text-blue-400 hover:text-blue-300"
                      >
                        Retry
                      </button>
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                      No employee records found. Click &quot;Onboard Employee&quot; above.
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp._id} className="hover:bg-[#1A1E29] transition-colors">
                      <td className="px-5 py-3.5 font-mono font-semibold text-blue-400">
                        {emp.employeeId}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-white">
                        {emp.name}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">
                        {emp.department}
                      </td>
                      <td className="px-5 py-3.5 text-slate-300">
                        {emp.position}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">
                        {emp.employeeType}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-400">
                        {emp.phone}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            STATUS_BADGES[emp.status] || STATUS_BADGES.ACTIVE
                          }`}
                        >
                          {emp.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111420] border border-[#262C3D] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#232733] pb-4">
              <h2 className="text-base font-bold text-white">Onboard Employee</h2>
              <button onClick={() => setFormOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Assigned Project</label>
                <select
                  className={inputCls}
                  value={form.projectId}
                  onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                >
                  {projects.length === 0 && <option value="">No accessible projects</option>}
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Full Name *</label>
                  <input
                    className={inputCls}
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Employee ID</label>
                  <input
                    className={inputCls}
                    value={form.employeeId}
                    onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                    placeholder="EMP-2026-0001"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Department</label>
                  <input
                    className={inputCls}
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    placeholder="Civil Engineering"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Position</label>
                  <input
                    className={inputCls}
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                    placeholder="Site Engineer"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Employment Type</label>
                  <select
                    className={inputCls}
                    value={form.employeeType}
                    onChange={(e) => setForm({ ...form, employeeType: e.target.value })}
                  >
                    {EMPLOYEE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Hire Date</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={form.hireDate}
                    onChange={(e) => setForm({ ...form, hireDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Email</label>
                  <input
                    type="email"
                    className={inputCls}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Phone</label>
                  <input
                    className={inputCls}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+251 ..."
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Status</label>
                <select
                  className={inputCls}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </select>
              </div>
            </div>

            {formError && <p className="text-xs text-rose-300">{formError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setFormOpen(false)}
                className="bg-[#1A1E29] hover:bg-[#232733] text-white px-4 py-2 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={busy}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Employee
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
