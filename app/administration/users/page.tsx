"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, User, Shield, Mail, Phone,
  CheckCircle, XCircle, Lock, Edit, Trash2, Eye
} from "lucide-react";
import { RoleType } from "@/types/erp";

interface SystemUser {
  _id: string;
  name: string;
  email: string;
  role: RoleType;
  phone: string;
  status: "Active" | "Inactive" | "Suspended";
  lastLogin: string;
  assignedProjects: string[];
}

const MOCK_USERS: SystemUser[] = [
  {
    _id: "u1",
    name: "Abebe Kebede",
    email: "abebe@construction-erp.et",
    role: "Project Manager",
    phone: "+251-91-100-0002",
    status: "Active",
    lastLogin: "2024-02-07 09:42",
    assignedProjects: ["Addis Heights Tower", "Bole Business Park"],
  },
  {
    _id: "u2",
    name: "Tigist Alemu",
    email: "tigist@construction-erp.et",
    role: "Procurement Officer",
    phone: "+251-91-100-0004",
    status: "Active",
    lastLogin: "2024-02-07 10:15",
    assignedProjects: ["Portfolio Wide"],
  },
  {
    _id: "u3",
    name: "Dawit Haile",
    email: "dawit@construction-erp.et",
    role: "Site Engineer",
    phone: "+251-91-100-0003",
    status: "Active",
    lastLogin: "2024-02-07 07:12",
    assignedProjects: ["Addis Heights Tower"],
  },
  {
    _id: "u4",
    name: "Henok Tadesse",
    email: "henok@construction-erp.et",
    role: "Accountant",
    phone: "+251-91-100-0006",
    status: "Active",
    lastLogin: "2024-02-07 08:30",
    assignedProjects: ["Portfolio Wide"],
  },
  {
    _id: "u5",
    name: "Kassahun Bekele",
    email: "kassahun@construction-erp.et",
    role: "Warehouse Manager",
    phone: "+251-91-100-0005",
    status: "Active",
    lastLogin: "2024-02-06 17:04",
    assignedProjects: ["Central Logistics Hub"],
  },
  {
    _id: "u6",
    name: "System Super Administrator",
    email: "admin@construction-erp.et",
    role: "Admin",
    phone: "+251-91-100-0001",
    status: "Active",
    lastLogin: "2024-02-07 11:20",
    assignedProjects: ["All System Functions"],
  },
];

const ROLE_COLORS: Record<string, string> = {
  Admin: "bg-red-500/20 text-red-400 border border-red-500/30",
  "Project Manager": "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  "Site Engineer": "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  "Procurement Officer": "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  "Warehouse Manager": "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30",
  Accountant: "bg-green-500/20 text-green-400 border border-green-500/30",
  "HR Manager": "bg-pink-500/20 text-pink-400 border border-pink-500/30",
  Worker: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
  Client: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<SystemUser[]>(MOCK_USERS);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search);
    const matchRole = roleFilter === "All" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">User Accounts & Access Credentials</h1>
            <p className="text-gray-400 text-sm mt-1">
              Provision ERP accounts, assign operational roles, reset credentials, and monitor session status
            </p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} />
            Invite User
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Total System Users</p>
            <p className="text-xl font-bold text-white mt-1">{users.length}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Active Accounts</p>
            <p className="text-xl font-bold text-green-400 mt-1">
              {users.filter((u) => u.status === "Active").length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Administrators</p>
            <p className="text-xl font-bold text-red-400 mt-1">
              {users.filter((u) => u.role === "Admin").length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Site Engineers & PMs</p>
            <p className="text-xl font-bold text-blue-400 mt-1">
              {users.filter((u) => u.role === "Project Manager" || u.role === "Site Engineer").length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Project Manager">Project Manager</option>
            <option value="Site Engineer">Site Engineer</option>
            <option value="Procurement Officer">Procurement Officer</option>
            <option value="Warehouse Manager">Warehouse Manager</option>
            <option value="Accountant">Accountant</option>
            <option value="HR Manager">HR Manager</option>
            <option value="Worker">Worker</option>
            <option value="Client">Client</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/50 border-b border-gray-700">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">User & Email</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">ERP Role</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Phone</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Assigned Projects</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Last Active</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{u.name}</p>
                      <p className="text-gray-400 text-xs font-mono">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role]}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{u.phone}</td>
                    <td className="px-4 py-3 text-gray-300 text-xs">
                      {u.assignedProjects.join(", ")}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs font-mono">{u.lastLogin}</td>
                    <td className="px-4 py-3">
                      <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full text-xs font-medium">
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-blue-400 hover:text-blue-300 p-1" title="Edit Permissions">
                        <Edit size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

