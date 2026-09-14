"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, Building, Users, Shield, DollarSign,
  Briefcase, CheckCircle, ChevronRight, HardHat
} from "lucide-react";

interface Department {
  _id: string;
  code: string;
  name: string;
  headOfDepartment: string;
  headTitle: string;
  headcount: number;
  activeProjects: number;
  monthlyPayrollETB: number;
  description: string;
}

const MOCK_DEPARTMENTS: Department[] = [
  {
    _id: "dept1",
    code: "ENG-CIVIL",
    name: "Civil Engineering & Structural Works",
    headOfDepartment: "Eng. Dawit Haile",
    headTitle: "Chief Structural Engineer",
    headcount: 42,
    activeProjects: 3,
    monthlyPayrollETB: 1250000,
    description: "Structural design, concrete mix approvals, rebar inspection, and foundation monitoring",
  },
  {
    _id: "dept2",
    code: "PROC-LOG",
    name: "Procurement & Supply Chain Logistics",
    headOfDepartment: "Tigist Alemu",
    headTitle: "Procurement Director",
    headcount: 14,
    activeProjects: 3,
    monthlyPayrollETB: 480000,
    description: "Vendor qualification, international import clearance, local bulk purchasing, and GRN validation",
  },
  {
    _id: "dept3",
    code: "FIN-ACCT",
    name: "Finance, Commercial & Cost Control",
    headOfDepartment: "Henok Tadesse",
    headTitle: "Finance Director",
    headcount: 11,
    activeProjects: 3,
    monthlyPayrollETB: 520000,
    description: "Budget variance monitoring, client progress invoicing (IPC), treasury, and site expense vouchers",
  },
  {
    _id: "dept4",
    code: "HSE-SAFE",
    name: "Health, Safety & Environment (HSE)",
    headOfDepartment: "Dr. Aster Kebede",
    headTitle: "HSE Superintendent",
    headcount: 8,
    activeProjects: 3,
    monthlyPayrollETB: 290000,
    description: "Site safety compliance, toolbox talks, hazard identification, and OSHA / Ethiopian labor standards",
  },
  {
    _id: "dept5",
    code: "EQP-MECH",
    name: "Plant, Machinery & Fleet Maintenance",
    headOfDepartment: "Ato Berhanu Negash",
    headTitle: "Fleet Workshop Manager",
    headcount: 19,
    activeProjects: 3,
    monthlyPayrollETB: 580000,
    description: "Heavy plant mobilization, crane safety certifications, preventive maintenance, and diesel logistics",
  },
];

export default function PeopleDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>(MOCK_DEPARTMENTS);
  const [search, setSearch] = useState("");

  const filtered = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.headOfDepartment.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (n: number) =>
    `ETB ${n.toLocaleString("en-ET", { minimumFractionDigits: 2 })}`;

  const totalPersonnel = departments.reduce((s, d) => s + d.headcount, 0);
  const totalMonthlyPayroll = departments.reduce((s, d) => s + d.monthlyPayrollETB, 0);

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
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
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
            <p className="text-xl font-bold text-purple-400 mt-1">3 Projects</p>
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
                <button className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
                  View Roster <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

