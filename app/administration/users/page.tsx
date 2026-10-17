"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, Edit, Loader2, X, ShieldCheck,
} from "lucide-react";
import { RoleType, SYSTEM_ROLES } from "@/types/erp";

interface AssignedProject {
  _id: string;
  name?: string;
  projectCode?: string;
}

interface SystemUser {
  _id: string;
  fullName: string;
  username: string;
  email: string;
  role: RoleType;
  phone?: string;
  department?: string;
  position?: string;
  isActive: boolean;
  lastLogin?: string;
  assignedProjects: (AssignedProject | string)[];
  createdAt: string;
}

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

function projectNames(list: (AssignedProject | string)[]): string {
  if (!list || list.length === 0) return "—";
  return list
    .map((p) => (typeof p === "string" ? p : p.name || p.projectCode || "—"))
    .join(", ");
}

function formatDate(iso?: string): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "Never";
  return d.toLocaleString("en-ET", { dateStyle: "medium", timeStyle: "short" });
}

interface InviteForm {
  fullName: string;
  username: string;
  email: string;
  password: string;
  phone: string;
  department: string;
  position: string;
  role: RoleType;
}

const EMPTY_INVITE: InviteForm = {
  fullName: "",
  username: "",
  email: "",
  password: "",
  phone: "",
  department: "",
  position: "",
  role: "Worker",
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState<InviteForm>(EMPTY_INVITE);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteBusy, setInviteBusy] = useState(false);

  const [editTarget, setEditTarget] = useState<SystemUser | null>(null);
  const [editRole, setEditRole] = useState<RoleType>("Worker");
  const [editActive, setEditActive] = useState(true);
  const [editError, setEditError] = useState<string | null>(null);
  const [editBusy, setEditBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/users", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to load users");
      }
      setUsers(json.data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    Promise.resolve().then(() => {
      if (!ignore) {
        load();
      }
    });
    return () => {
      ignore = true;
    };
  }, [load]);

  const filtered = users.filter((u) => {
    const matchSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || "").includes(search);
    const matchRole = roleFilter === "All" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const openInvite = () => {
    setInviteForm(EMPTY_INVITE);
    setInviteError(null);
    setInviteOpen(true);
  };

  const submitInvite = async () => {
    setInviteBusy(true);
    setInviteError(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: inviteForm.fullName,
          username: inviteForm.username,
          email: inviteForm.email,
          password: inviteForm.password,
          phone: inviteForm.phone || undefined,
          department: inviteForm.department || undefined,
          position: inviteForm.position || undefined,
          role: inviteForm.role,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to create user");
      }
      setInviteOpen(false);
      await load();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setInviteBusy(false);
    }
  };

  const openEdit = (u: SystemUser) => {
    setEditTarget(u);
    setEditRole(u.role);
    setEditActive(u.isActive);
    setEditError(null);
  };

  const submitEdit = async () => {
    if (!editTarget) return;
    setEditBusy(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/users/${editTarget._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: editRole, isActive: editActive }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to update user");
      }
      setEditTarget(null);
      await load();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setEditBusy(false);
    }
  };

  const inputCls =
    "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500";

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">User Accounts &amp; Access Credentials</h1>
            <p className="text-gray-400 text-sm mt-1">
              Provision ERP accounts, assign operational roles, reset credentials, and monitor session status
            </p>
          </div>
          <button
            onClick={openInvite}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
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
              {users.filter((u) => u.isActive).length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Administrators</p>
            <p className="text-xl font-bold text-red-400 mt-1">
              {users.filter((u) => u.role === "Admin").length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Site Engineers &amp; PMs</p>
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
            {SYSTEM_ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
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
              <button
                onClick={() => { setLoading(true); load(); }}
                className="mt-3 text-xs font-medium text-blue-400 hover:text-blue-300"
              >
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <ShieldCheck size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">
                {users.length === 0 ? "No user accounts found." : "No users match your filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-900/50 border-b border-gray-700">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">User &amp; Email</th>
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
                        <p className="text-white font-medium">{u.fullName}</p>
                        <p className="text-gray-400 text-xs font-mono">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] || ROLE_COLORS.Worker}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-xs">{u.phone || "—"}</td>
                      <td className="px-4 py-3 text-gray-300 text-xs">
                        {projectNames(u.assignedProjects)}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs font-mono">{formatDate(u.lastLogin)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                            u.isActive
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                          }`}
                        >
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEdit(u)}
                          className="text-blue-400 hover:text-blue-300 p-1"
                          title="Edit role & status"
                        >
                          <Edit size={16} />
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

      {/* Invite modal */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-gray-700 pb-4">
              <h2 className="text-lg font-bold text-white">Invite New User</h2>
              <button onClick={() => setInviteOpen(false)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Full name</label>
                <input className={inputCls} value={inviteForm.fullName}
                  onChange={(e) => setInviteForm({ ...inviteForm, fullName: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Username</label>
                  <input className={inputCls} value={inviteForm.username}
                    onChange={(e) => setInviteForm({ ...inviteForm, username: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Role</label>
                  <select className={inputCls} value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as RoleType })}>
                    {SYSTEM_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Email</label>
                <input type="email" className={inputCls} value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Temporary password</label>
                <input type="password" className={inputCls} value={inviteForm.password}
                  onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Phone</label>
                  <input className={inputCls} value={inviteForm.phone}
                    onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Department</label>
                  <input className={inputCls} value={inviteForm.department}
                    onChange={(e) => setInviteForm({ ...inviteForm, department: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Position</label>
                <input className={inputCls} value={inviteForm.position}
                  onChange={(e) => setInviteForm({ ...inviteForm, position: e.target.value })} />
              </div>
            </div>

            {inviteError && <p className="text-xs text-red-300">{inviteError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setInviteOpen(false)}
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm">
                Cancel
              </button>
              <button onClick={submitInvite} disabled={inviteBusy}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                {inviteBusy && <Loader2 size={14} className="animate-spin" />}
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-700 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Edit Access</h2>
                <p className="text-gray-400 text-xs font-mono">{editTarget.email}</p>
              </div>
              <button onClick={() => setEditTarget(null)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">ERP Role</label>
                <select className={inputCls} value={editRole}
                  onChange={(e) => setEditRole(e.target.value as RoleType)}>
                  {SYSTEM_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-200">
                <input type="checkbox" checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                  className="w-4 h-4 accent-blue-600" />
                Account active
              </label>
            </div>

            {editError && <p className="text-xs text-red-300">{editError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditTarget(null)}
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm">
                Cancel
              </button>
              <button onClick={submitEdit} disabled={editBusy}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                {editBusy && <Loader2 size={14} className="animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
