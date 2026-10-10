"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Search, Loader2, X, Users, Plus,
} from "lucide-react";
import { useRecords, type OperationalRecord } from "@/hooks/useRecords";
import { useCurrentUser } from "@/components/auth/UserProvider";

interface AttendanceRecord {
  _id: string;
  workerName: string;
  trade: string;
  projectId: string;
  site: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: string;
  hoursWorked: number;
  overtimeHours: number;
  recordedBy: string;
}

const STATUS_BADGES: Record<string, string> = {
  Present: "bg-green-500/20 text-green-400 border border-green-500/30",
  Late: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  Absent: "bg-red-500/20 text-red-400 border border-red-500/30",
  "Half Day": "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  Excused: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
};

const STATUSES = ["Present", "Late", "Absent", "Half Day", "Excused"];

function mapRecord(r: OperationalRecord): AttendanceRecord {
  const d = r.data || {};
  return {
    _id: r._id,
    workerName: d.workerName || r.title || "—",
    trade: d.trade || "—",
    projectId: r.projectId,
    site: d.site || "",
    date: d.date || (r.createdAt ? r.createdAt.slice(0, 10) : ""),
    checkIn: d.checkIn || "--",
    checkOut: d.checkOut || "--",
    status: r.status || d.status || "Present",
    hoursWorked: Number(d.hoursWorked ?? d.hours) || 0,
    overtimeHours: Number(d.overtimeHours) || 0,
    recordedBy: d.recordedBy || r.createdBy || "—",
  };
}

const EMPTY_FORM = {
  projectId: "",
  workerName: "",
  trade: "",
  site: "",
  date: "",
  checkIn: "",
  checkOut: "",
  hoursWorked: "",
  overtimeHours: "",
  status: "Present",
};

export default function PeopleAttendancePage() {
  const { records: rawRecords, projects, projectName, loading, error, reload, create } =
    useRecords("attendance");
  const { user } = useCurrentUser();
  const records = rawRecords.map(mapRecord);

  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const dayRecords = selectedDate ? records.filter((r) => r.date === selectedDate) : records;

  const filtered = dayRecords.filter(
    (r) =>
      r.workerName.toLowerCase().includes(search.toLowerCase()) ||
      (r.site || projectName(r.projectId)).toLowerCase().includes(search.toLowerCase()) ||
      r.trade.toLowerCase().includes(search.toLowerCase())
  );

  const presentCount = dayRecords.filter((r) => r.status === "Present" || r.status === "Late").length;
  const totalOvertime = dayRecords.reduce((s, r) => s + r.overtimeHours, 0);
  const attendanceRate = dayRecords.length > 0 ? (presentCount / dayRecords.length) * 100 : 0;

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
    setBusy(true);
    setFormError(null);
    try {
      await create({
        projectId: form.projectId,
        title: form.workerName || undefined,
        status: form.status,
        data: {
          workerName: form.workerName,
          trade: form.trade,
          site: form.site,
          date: form.date || undefined,
          checkIn: form.checkIn,
          checkOut: form.checkOut,
          hoursWorked: Number(form.hoursWorked) || 0,
          overtimeHours: Number(form.overtimeHours) || 0,
          recordedBy: user?.fullName || "",
        },
      });
      setFormOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to record attendance");
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
            <h1 className="text-2xl font-bold text-white">Daily Muster Roll & Attendance</h1>
            <p className="text-gray-400 text-sm mt-1">
              Biometric logs, daily site roll call, overtime hours, and shift management
            </p>
          </div>
          <button
            onClick={openForm}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Clock Worker In
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Total Shift Headcount</p>
            <p className="text-xl font-bold text-white mt-1">{dayRecords.length}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">On Duty Today</p>
            <p className="text-xl font-bold text-green-400 mt-1">{presentCount}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Shift Overtime Logged</p>
            <p className="text-xl font-bold text-blue-400 mt-1">{totalOvertime} hrs</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Attendance Rate</p>
            <p className="text-xl font-bold text-yellow-400 mt-1">
              {attendanceRate.toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by worker name, trade, project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Attendance table */}
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
              <Users size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">
                {records.length === 0 ? "No attendance records logged yet." : "No attendance records match your filters."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-900/50 border-b border-gray-700">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Worker & Trade</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Site Location</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Clock In</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Clock Out</th>
                    <th className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Reg. Hours</th>
                    <th className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">OT Hours</th>
                    <th className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filtered.map((r) => (
                    <tr key={r._id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{r.workerName}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{r.trade}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-xs">{r.site || projectName(r.projectId)}</td>
                      <td className="px-4 py-3 font-mono text-gray-300 text-xs">{r.checkIn}</td>
                      <td className="px-4 py-3 font-mono text-gray-300 text-xs">{r.checkOut}</td>
                      <td className="px-4 py-3 text-center text-white font-medium">{r.hoursWorked}</td>
                      <td className="px-4 py-3 text-center text-blue-400 font-bold">
                        {r.overtimeHours > 0 ? `+${r.overtimeHours}` : "0"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[r.status] || STATUS_BADGES.Present}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-gray-700 pb-4">
              <h2 className="text-lg font-bold text-white">Clock Worker In</h2>
              <button onClick={() => setFormOpen(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Project</label>
                <select className={inputCls} value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                  {projects.length === 0 && <option value="">No accessible projects</option>}
                  {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Worker name</label>
                  <input className={inputCls} value={form.workerName} onChange={(e) => setForm({ ...form, workerName: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Trade</label>
                  <input className={inputCls} value={form.trade} onChange={(e) => setForm({ ...form, trade: e.target.value })} placeholder="Mason, Carpenter, Welder..." />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Site location</label>
                  <input className={inputCls} value={form.site} onChange={(e) => setForm({ ...form, site: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Date</label>
                  <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Check in</label>
                  <input type="time" className={inputCls} value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Check out</label>
                  <input type="time" className={inputCls} value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Regular hours</label>
                  <input type="number" min="0" step="0.5" className={inputCls} value={form.hoursWorked} onChange={(e) => setForm({ ...form, hoursWorked: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">OT hours</label>
                  <input type="number" min="0" step="0.5" className={inputCls} value={form.overtimeHours} onChange={(e) => setForm({ ...form, overtimeHours: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Status</label>
                  <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-[11px] text-gray-500">
                Recorded by: <span className="text-gray-400">{user?.fullName || "Unknown user"}</span>
              </p>
            </div>

            {formError && <p className="text-xs text-red-300">{formError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setFormOpen(false)} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={submit} disabled={busy} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
                {busy && <Loader2 size={14} className="animate-spin" />}
                Save Attendance
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
