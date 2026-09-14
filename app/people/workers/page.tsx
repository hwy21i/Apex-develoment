"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, Users, HardHat, Phone, MapPin,
  CheckCircle, Clock, AlertCircle, Eye, Calendar, Award
} from "lucide-react";

interface SiteWorker {
  _id: string;
  workerId: string;
  fullName: string;
  trade: string; // Mason, Carpenter, Electrician, Steel Fixer, Welder, General Laborer
  assignedProject: string;
  dailyWageETB: number;
  phone: string;
  emergencyContact: string;
  status: "Active" | "On Leave" | "Suspended";
  safetyCertified: boolean;
  joinDate: string;
}

const MOCK_WORKERS: SiteWorker[] = [
  {
    _id: "w1",
    workerId: "WRK-1041",
    fullName: "Girma Mengistu",
    trade: "Lead Steel Fixer",
    assignedProject: "Addis Heights Tower",
    dailyWageETB: 850,
    phone: "+251-91-123-4567",
    emergencyContact: "+251-91-987-6543 (Spouse)",
    status: "Active",
    safetyCertified: true,
    joinDate: "2023-04-10",
  },
  {
    _id: "w2",
    workerId: "WRK-1042",
    fullName: "Tamrat Desta",
    trade: "Master Mason",
    assignedProject: "Addis Heights Tower",
    dailyWageETB: 900,
    phone: "+251-92-234-5678",
    emergencyContact: "+251-92-876-5432 (Brother)",
    status: "Active",
    safetyCertified: true,
    joinDate: "2023-05-15",
  },
  {
    _id: "w3",
    workerId: "WRK-1043",
    fullName: "Biniyam Bekele",
    trade: "Excavator Operator",
    assignedProject: "Ring Road Expansion",
    dailyWageETB: 1100,
    phone: "+251-93-345-6789",
    emergencyContact: "+251-93-765-4321 (Father)",
    status: "Active",
    safetyCertified: true,
    joinDate: "2023-02-01",
  },
  {
    _id: "w4",
    workerId: "WRK-1044",
    fullName: "Kassahun Tulu",
    trade: "Formwork Carpenter",
    assignedProject: "Bole Business Park",
    dailyWageETB: 800,
    phone: "+251-94-456-7890",
    emergencyContact: "+251-94-654-3210 (Wife)",
    status: "On Leave",
    safetyCertified: true,
    joinDate: "2023-08-20",
  },
  {
    _id: "w5",
    workerId: "WRK-1045",
    fullName: "Yared Abera",
    trade: "Certified Welder",
    assignedProject: "Addis Heights Tower",
    dailyWageETB: 950,
    phone: "+251-95-567-8901",
    emergencyContact: "+251-95-543-2109 (Mother)",
    status: "Active",
    safetyCertified: false,
    joinDate: "2024-01-10",
  },
];

const STATUS_BADGES: Record<string, string> = {
  Active: "bg-green-500/20 text-green-400 border border-green-500/30",
  "On Leave": "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  Suspended: "bg-red-500/20 text-red-400 border border-red-500/30",
};

export default function WorkersRosterPage() {
  const [workers, setWorkers] = useState<SiteWorker[]>(MOCK_WORKERS);
  const [search, setSearch] = useState("");
  const [tradeFilter, setTradeFilter] = useState("All");

  const trades = ["All", ...Array.from(new Set(MOCK_WORKERS.map((w) => w.trade)))];

  const filtered = workers.filter((w) => {
    const matchSearch =
      w.fullName.toLowerCase().includes(search.toLowerCase()) ||
      w.workerId.toLowerCase().includes(search.toLowerCase()) ||
      w.assignedProject.toLowerCase().includes(search.toLowerCase());
    const matchTrade = tradeFilter === "All" || w.trade === tradeFilter;
    return matchSearch && matchTrade;
  });

  const fmt = (n: number) =>
    `ETB ${n.toLocaleString("en-ET", { minimumFractionDigits: 2 })}`;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Daily Labor & Craft Workers</h1>
            <p className="text-gray-400 text-sm mt-1">
              Field trades, daily wage rates, safety certification, and site assignments
            </p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} />
            Register Worker
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Total Registered Trades</p>
            <p className="text-xl font-bold text-white mt-1">{workers.length}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Active On Site</p>
            <p className="text-xl font-bold text-green-400 mt-1">
              {workers.filter((w) => w.status === "Active").length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Safety Certified</p>
            <p className="text-xl font-bold text-blue-400 mt-1">
              {workers.filter((w) => w.safetyCertified).length} / {workers.length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Avg Daily Wage Rate</p>
            <p className="text-xl font-bold text-yellow-400 mt-1">
              {fmt(workers.reduce((s, w) => s + w.dailyWageETB, 0) / workers.length)}
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by worker name, ID, project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={tradeFilter}
            onChange={(e) => setTradeFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            {trades.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Workers table */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/50 border-b border-gray-700">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Worker ID & Name</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Trade / Skill</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Site Assignment</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Phone & Emergency</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Daily Wage</th>
                  <th className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Safety PPE</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.map((w) => (
                  <tr key={w._id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-blue-400 text-xs font-semibold">{w.workerId}</span>
                      <p className="text-white font-medium">{w.fullName}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{w.trade}</td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{w.assignedProject}</td>
                    <td className="px-4 py-3">
                      <p className="text-white text-xs">{w.phone}</p>
                      <p className="text-gray-500 text-[11px]">{w.emergencyContact}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-white">{fmt(w.dailyWageETB)} / day</td>
                    <td className="px-4 py-3 text-center">
                      {w.safetyCertified ? (
                        <span className="inline-flex items-center gap-1 text-green-400 text-xs">
                          <CheckCircle size={14} /> Certified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-yellow-400 text-xs">
                          <Clock size={14} /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[w.status]}`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-blue-400 hover:text-blue-300 p-1" title="View Dossier">
                        <Eye size={16} />
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

