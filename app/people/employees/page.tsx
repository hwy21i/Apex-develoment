"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Users,
  UserSquare2,
  HardHat,
  Plus,
  Search,
  Mail,
  Phone,
  Briefcase,
  Clock,
  CheckCircle2,
} from "lucide-react";

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

export default function PeopleEmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEmployees() {
      setLoading(true);
      try {
        const res = await fetch("/api/records/employees");
        const json = await res.json();
        if (json.success && json.data?.items) {
          setEmployees(
            json.data.items.map((emp: any) => ({
              _id: emp._id,
              name: emp.title || "Kenenisa Tulu",
              employeeId: emp.data?.employeeId || "EMP-2026-" + emp._id.slice(-4).toUpperCase(),
              department: emp.data?.department || "Civil Engineering",
              position: emp.data?.position || "Lead Structural Engineer",
              employeeType: emp.data?.employeeType || "Full-time",
              phone: emp.data?.phone || "+251 92 345 6789",
              status: emp.status || "ACTIVE",
            }))
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchEmployees();
  }, []);

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

          <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors shrink-0">
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
                      Loading personnel directory...
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
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {emp.status}
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
    </AppShell>
  );
}

