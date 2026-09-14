"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, Wrench, Calendar, AlertTriangle, CheckCircle,
  Clock, DollarSign, FileText, ChevronRight
} from "lucide-react";

interface MaintenanceRecord {
  _id: string;
  maintenanceCode: string;
  assetCode: string;
  equipmentName: string;
  serviceType: "Routine 250hr Service" | "Major 1000hr Overhaul" | "Emergency Breakdown" | "Safety Inspection";
  serviceDate: string;
  nextServiceDue: string;
  costETB: number;
  serviceProvider: string;
  status: "Completed" | "In Progress" | "Scheduled";
  description: string;
  partsReplaced: string;
}

const MOCK_MAINTENANCE: MaintenanceRecord[] = [
  {
    _id: "m1",
    maintenanceCode: "MNT-2024-0041",
    assetCode: "EQ-EXC-04",
    equipmentName: "CAT 320D Hydraulic Excavator",
    serviceType: "Routine 250hr Service",
    serviceDate: "2024-01-20",
    nextServiceDue: "2024-04-20",
    costETB: 48500,
    serviceProvider: "Ries Engineering S.C. (Caterpillar Dealer)",
    status: "Completed",
    description: "Hydraulic oil change, primary/secondary fuel filters, engine oil replacement and track tension check",
    partsReplaced: "Engine oil filters, air filter element, hydraulic oil",
  },
  {
    _id: "m2",
    maintenanceCode: "MNT-2024-0042",
    assetCode: "EQ-CRN-01",
    equipmentName: "Potain Tower Crane 50m",
    serviceType: "Safety Inspection",
    serviceDate: "2024-02-02",
    nextServiceDue: "2024-05-02",
    costETB: 25000,
    serviceProvider: "National Third-Party Lifting Inspector",
    status: "Completed",
    description: "Non-destructive testing (NDT) on mast pins, wire rope caliper check, load cell calibration",
    partsReplaced: "Hoist limit switch micro-sensors",
  },
  {
    _id: "m3",
    maintenanceCode: "MNT-2024-0043",
    assetCode: "EQ-MIX-02",
    equipmentName: "Schwing Stetter Transit Mixer 8m³",
    serviceType: "Emergency Breakdown",
    serviceDate: "2024-02-06",
    nextServiceDue: "2024-05-06",
    costETB: 82000,
    serviceProvider: "Central Mechanical Workshop",
    status: "In Progress",
    description: "Hydraulic pump replacement for mixing drum gearbox after sudden pressure loss",
    partsReplaced: "Rexroth hydraulic axial piston pump",
  },
  {
    _id: "m4",
    maintenanceCode: "MNT-2024-0044",
    assetCode: "EQ-GEN-01",
    equipmentName: "Cummins 500kVA Soundproof Generator",
    serviceType: "Routine 250hr Service",
    serviceDate: "2024-02-18",
    nextServiceDue: "2024-05-18",
    costETB: 35000,
    serviceProvider: "Internal Mechanical Team",
    status: "Scheduled",
    description: "Coolant flushing, battery bank health test, alternator terminal tightening",
    partsReplaced: "Scheduled - coolant & belts",
  },
];

const STATUS_BADGES: Record<string, string> = {
  Completed: "bg-green-500/20 text-green-400 border border-green-500/30",
  "In Progress": "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  Scheduled: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
};

export default function EquipmentMaintenancePage() {
  const [records, setRecords] = useState<MaintenanceRecord[]>(MOCK_MAINTENANCE);
  const [search, setSearch] = useState("");

  const filtered = records.filter(
    (r) =>
      r.equipmentName.toLowerCase().includes(search.toLowerCase()) ||
      r.assetCode.toLowerCase().includes(search.toLowerCase()) ||
      r.serviceType.toLowerCase().includes(search.toLowerCase()) ||
      r.maintenanceCode.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (n: number) =>
    `ETB ${n.toLocaleString("en-ET", { minimumFractionDigits: 2 })}`;

  const totalSpent = records.reduce((s, r) => s + r.costETB, 0);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Equipment Maintenance & Service Logs</h1>
            <p className="text-gray-400 text-sm mt-1">
              Preventive service schedules, breakdown repairs, OEM parts replacement, and inspection certifications
            </p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} />
            Log Maintenance
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Total Work Orders</p>
            <p className="text-xl font-bold text-white mt-1">{records.length}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Completed Service</p>
            <p className="text-xl font-bold text-green-400 mt-1">
              {records.filter((r) => r.status === "Completed").length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Current In-Shop / Overhaul</p>
            <p className="text-xl font-bold text-yellow-400 mt-1">
              {records.filter((r) => r.status === "In Progress").length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Total Maintenance Spend</p>
            <p className="text-xl font-bold text-blue-400 mt-1">{fmt(totalSpent)}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by equipment, asset code, service type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Maintenance records table */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/50 border-b border-gray-700">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Log # & Equipment</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Service Type</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Service Date</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Next Due Date</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Provider / Shop</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Cost</th>
                  <th className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-blue-400 text-xs font-semibold">{r.maintenanceCode}</span>
                      <p className="text-white font-medium">{r.equipmentName}</p>
                      <p className="font-mono text-gray-500 text-xs">{r.assetCode}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white text-xs font-medium">{r.serviceType}</p>
                      <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{r.description}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-xs">
                      {new Date(r.serviceDate).toLocaleDateString("en-ET")}
                    </td>
                    <td className="px-4 py-3 text-blue-400 text-xs font-medium">
                      {new Date(r.nextServiceDue).toLocaleDateString("en-ET")}
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{r.serviceProvider}</td>
                    <td className="px-4 py-3 text-right font-bold text-white">{fmt(r.costETB)}</td>
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

