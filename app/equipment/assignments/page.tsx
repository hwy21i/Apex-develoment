"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, Truck, Calendar, MapPin, User,
  CheckCircle, Clock, ArrowRightLeft, Eye
} from "lucide-react";

interface EquipmentAssignment {
  _id: string;
  assetCode: string;
  equipmentName: string;
  type: string;
  assignedProject: string;
  siteLocation: string;
  assignedOperator: string;
  startDate: string;
  expectedEndDate: string;
  status: "Active" | "Returned" | "Transfer Scheduled";
  operatingHours: number;
}

const MOCK_ASSIGNMENTS: EquipmentAssignment[] = [
  {
    _id: "ea1",
    assetCode: "EQ-CRN-01",
    equipmentName: "Potain Tower Crane 50m",
    type: "Tower Crane",
    assignedProject: "Addis Heights Tower",
    siteLocation: "Addis Ababa (Bole Site)",
    assignedOperator: "Binyam Tadesse (Cert. Crane Op)",
    startDate: "2023-06-01",
    expectedEndDate: "2024-08-30",
    status: "Active",
    operatingHours: 1420,
  },
  {
    _id: "ea2",
    assetCode: "EQ-EXC-04",
    equipmentName: "CAT 320D Hydraulic Excavator",
    type: "Excavator",
    assignedProject: "Ring Road Expansion",
    siteLocation: "Oromia / Addis Ababa Outer Ring",
    assignedOperator: "Biniyam Bekele",
    startDate: "2023-09-15",
    expectedEndDate: "2024-05-15",
    status: "Active",
    operatingHours: 980,
  },
  {
    _id: "ea3",
    assetCode: "EQ-MIX-02",
    equipmentName: "Schwing Stetter Transit Mixer 8m³",
    type: "Concrete Mixer",
    assignedProject: "Addis Heights Tower",
    siteLocation: "Addis Ababa (Bole Site)",
    assignedOperator: "Kassahun Desta",
    startDate: "2024-01-10",
    expectedEndDate: "2024-03-30",
    status: "Active",
    operatingHours: 320,
  },
  {
    _id: "ea4",
    assetCode: "EQ-GEN-01",
    equipmentName: "Cummins 500kVA Soundproof Generator",
    type: "Generator",
    assignedProject: "Bole Business Park",
    siteLocation: "Bole Industrial Zone",
    assignedOperator: "Mulugeta Worku (Site Electrician)",
    startDate: "2023-11-01",
    expectedEndDate: "2024-04-01",
    status: "Transfer Scheduled",
    operatingHours: 760,
  },
];

const STATUS_BADGES: Record<string, string> = {
  Active: "bg-green-500/20 text-green-400 border border-green-500/30",
  Returned: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
  "Transfer Scheduled": "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
};

export default function EquipmentAssignmentsPage() {
  const [assignments, setAssignments] = useState<EquipmentAssignment[]>(MOCK_ASSIGNMENTS);
  const [search, setSearch] = useState("");

  const filtered = assignments.filter((a) =>
    a.equipmentName.toLowerCase().includes(search.toLowerCase()) ||
    a.assetCode.toLowerCase().includes(search.toLowerCase()) ||
    a.assignedProject.toLowerCase().includes(search.toLowerCase()) ||
    a.assignedOperator.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Equipment Site Assignments</h1>
            <p className="text-gray-400 text-sm mt-1">
              Fleet mobilization, operator dispatching, location tracking, and plant utilization
            </p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} />
            Mobilize Equipment
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Deployed Assets</p>
            <p className="text-xl font-bold text-white mt-1">{assignments.length}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Active On Site</p>
            <p className="text-xl font-bold text-green-400 mt-1">
              {assignments.filter((a) => a.status === "Active").length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Transfers Scheduled</p>
            <p className="text-xl font-bold text-yellow-400 mt-1">
              {assignments.filter((a) => a.status === "Transfer Scheduled").length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Fleet Operating Hours</p>
            <p className="text-xl font-bold text-blue-400 mt-1">
              {assignments.reduce((s, a) => s + a.operatingHours, 0).toLocaleString()} hrs
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by equipment, code, project, or operator..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/50 border-b border-gray-700">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Asset Code & Machine</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Assigned Site</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Designated Operator</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Mobilization Period</th>
                  <th className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Total Run Hours</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.map((a) => (
                  <tr key={a._id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-blue-400 font-semibold text-xs">{a.assetCode}</span>
                      <p className="text-white font-medium">{a.equipmentName}</p>
                      <p className="text-gray-400 text-xs">{a.type}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white text-xs font-medium">{a.assignedProject}</p>
                      <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                        <MapPin size={11} /> {a.siteLocation}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-200 text-xs flex items-center gap-1">
                        <User size={12} /> {a.assignedOperator}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-xs">
                      {new Date(a.startDate).toLocaleDateString("en-ET")} → {new Date(a.expectedEndDate).toLocaleDateString("en-ET")}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-white font-bold">
                      {a.operatingHours.toLocaleString()} hrs
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[a.status]}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-blue-400 hover:text-blue-300 p-1" title="Transfer / Reassign">
                        <ArrowRightLeft size={16} />
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

