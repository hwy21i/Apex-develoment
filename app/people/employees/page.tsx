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
  ACTIVE: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  ON_LEAVE: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
  TERMINATED: "bg-[#FAFAFA] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]",
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
    "w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3 py-2 text-xs text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]";

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#666666] dark:text-[#A3A3A3] font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <UserSquare2 className="w-4 h-4" /> Human Resources & Workforce
            </div>
            <h1 className="text-2xl font-bold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
              Workforce & Personnel Directory
            </h1>
            <p className="text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
              Engineers, project managers, foremen, trade crews, and administrative staff.
            </p>
          </div>

          <button
            onClick={openForm}
            className="erp-btn-md bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] shrink-0"
          >
            <Plus className="w-4 h-4" /> Onboard Employee
          </button>
        </div>

        {/* Employees Table */}
        <div className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#333333] dark:text-[#D4D4D4]">
              <thead className="bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider font-mono text-[11px] border-b border-[#D4D4D4] dark:border-[#303030]">
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
              <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-[#666666] dark:text-[#A3A3A3]">
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading personnel directory...
                      </span>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center">
                      <p className="text-[#888888] dark:text-[#888888]">{error}</p>
                      <button
                        onClick={() => reload()}
                        className="mt-2 text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] hover:text-[#000000] dark:text-[#FFFFFF]"
                      >
                        Retry
                      </button>
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-[#666666] dark:text-[#A3A3A3]">
                      No employee records found. Click &quot;Onboard Employee&quot; above.
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp._id} className="hover:bg-[#FAFAFA] dark:hover:bg-[#171717] transition-colors">
                      <td className="px-5 py-3.5 font-mono font-semibold text-[#000000] dark:text-[#FFFFFF]">
                        {emp.employeeId}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-white">
                        {emp.name}
                      </td>
                      <td className="px-5 py-3.5 text-[#888888] dark:text-[#888888]">
                        {emp.department}
                      </td>
                      <td className="px-5 py-3.5 text-[#333333] dark:text-[#D4D4D4]">
                        {emp.position}
                      </td>
                      <td className="px-5 py-3.5 text-[#888888] dark:text-[#888888]">
                        {emp.employeeType}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[#888888] dark:text-[#888888]">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-v18-backdrop">
          <div className="v18-card animate-v18-modal bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] rounded-2xl w-full erp-modal-md p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#D4D4D4] dark:border-[#303030] pb-4">
              <h2 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">Onboard Employee</h2>
              <button onClick={() => setFormOpen(false)} className="text-[#888888] dark:text-[#888888] hover:text-[#000000] dark:hover:text-[#FFFFFF]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-[#888888] dark:text-[#888888] block mb-1">Assigned Project</label>
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
                  <label className="text-[11px] text-[#888888] dark:text-[#888888] block mb-1">Full Name *</label>
                  <input
                    className={inputCls}
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#888888] dark:text-[#888888] block mb-1">Employee ID</label>
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
                  <label className="text-[11px] text-[#888888] dark:text-[#888888] block mb-1">Department</label>
                  <input
                    className={inputCls}
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    placeholder="Civil Engineering"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#888888] dark:text-[#888888] block mb-1">Position</label>
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
                  <label className="text-[11px] text-[#888888] dark:text-[#888888] block mb-1">Employment Type</label>
                  <select
                    className={inputCls}
                    value={form.employeeType}
                    onChange={(e) => setForm({ ...form, employeeType: e.target.value })}
                  >
                    {EMPLOYEE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-[#888888] dark:text-[#888888] block mb-1">Hire Date</label>
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
                  <label className="text-[11px] text-[#888888] dark:text-[#888888] block mb-1">Email</label>
                  <input
                    type="email"
                    className={inputCls}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#888888] dark:text-[#888888] block mb-1">Phone</label>
                  <input
                    className={inputCls}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+251 ..."
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-[#888888] dark:text-[#888888] block mb-1">Status</label>
                <select
                  className={inputCls}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </select>
              </div>
            </div>

            {formError && <p className="text-xs text-[#000000] dark:text-[#FFFFFF] bg-black/5 dark:bg-white/10 p-2 rounded">{formError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setFormOpen(false)}
                className="bg-[#FAFAFA] hover:bg-[#E5E5E5] dark:bg-[#171717] dark:hover:bg-[#1F1F1F] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030] px-4 py-2 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={busy}
                className="bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center gap-2"
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
