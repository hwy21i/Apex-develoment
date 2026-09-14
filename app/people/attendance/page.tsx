"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Calendar, CheckCircle, XCircle, Clock, AlertTriangle,
  Search, Users, HardHat, FileSpreadsheet, Plus
} from "lucide-react";

interface AttendanceRecord {
  _id: string;
  workerName: string;
  trade: string;
  projectName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: "Present" | "Late" | "Absent" | "Half Day" | "Excused";
  hoursWorked: number;
  overtimeHours: number;
}

const MOCK_ATTENDANCE: AttendanceRecord[] = [
  {
    _id: "att1",
    workerName: "Girma Mengistu",
    trade: "Lead Steel Fixer",
    projectName: "Addis Heights Tower",
    date: "2024-02-07",
    checkIn: "07:00 AM",
    checkOut: "05:00 PM",
    status: "Present",
    hoursWorked: 8,
    overtimeHours: 2,
  },
  {
    _id: "att2",
    workerName: "Tamrat Desta",
    trade: "Master Mason",
    projectName: "Addis Heights Tower",
    date: "2024-02-07",
    checkIn: "07:45 AM",
    checkOut: "04:30 PM",
    status: "Late",
    hoursWorked: 8,
    overtimeHours: 0,
  },
  {
    _id: "att3",
    workerName: "Biniyam Bekele",
    trade: "Excavator Operator",
    projectName: "Ring Road Expansion",
    date: "2024-02-07",
    checkIn: "06:30 AM",
    checkOut: "05:30 PM",
    status: "Present",
    hoursWorked: 8,
    overtimeHours: 3,
  },
  {
    _id: "att4",
    workerName: "Kassahun Tulu",
    trade: "Formwork Carpenter",
    projectName: "Bole Business Park",
    date: "2024-02-07",
    checkIn: "--",
    checkOut: "--",
    status: "Excused",
    hoursWorked: 0,
    overtimeHours: 0,
  },
  {
    _id: "att5",
    workerName: "Yared Abera",
    trade: "Certified Welder",
    projectName: "Addis Heights Tower",
    date: "2024-02-07",
    checkIn: "07:00 AM",
    checkOut: "12:00 PM",
    status: "Half Day",
    hoursWorked: 4,
    overtimeHours: 0,
  },
];

const STATUS_BADGES: Record<string, string> = {
  Present: "bg-green-500/20 text-green-400 border border-green-500/30",
  Late: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  Absent: "bg-red-500/20 text-red-400 border border-red-500/30",
  "Half Day": "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  Excused: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
};

export default function PeopleAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>(MOCK_ATTENDANCE);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("2024-02-07");

  const filtered = records.filter(
    (r) =>
      r.workerName.toLowerCase().includes(search.toLowerCase()) ||
      r.projectName.toLowerCase().includes(search.toLowerCase()) ||
      r.trade.toLowerCase().includes(search.toLowerCase())
  );

  const presentCount = records.filter((r) => r.status === "Present" || r.status === "Late").length;
  const totalOvertime = records.reduce((s, r) => s + r.overtimeHours, 0);

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
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} />
            Clock Worker In
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Total Shift Headcount</p>
            <p className="text-xl font-bold text-white mt-1">{records.length}</p>
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
              {((presentCount / records.length) * 100).toFixed(0)}%
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
                    <td className="px-4 py-3 text-gray-300 text-xs">{r.projectName}</td>
                    <td className="px-4 py-3 font-mono text-gray-300 text-xs">{r.checkIn}</td>
                    <td className="px-4 py-3 font-mono text-gray-300 text-xs">{r.checkOut}</td>
                    <td className="px-4 py-3 text-center text-white font-medium">{r.hoursWorked}</td>
                    <td className="px-4 py-3 text-center text-blue-400 font-bold">
                      {r.overtimeHours > 0 ? `+${r.overtimeHours}` : "0"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[r.status]}`}>
                        {r.status}
                      </span>
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

