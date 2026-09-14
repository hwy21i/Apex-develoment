"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, FileText, Download, Eye, Layers,
  Calendar, CheckCircle, ShieldCheck, Tag, Filter
} from "lucide-react";

interface ProjectDrawing {
  _id: string;
  docCode: string;
  title: string;
  discipline: "Architectural" | "Structural" | "MEP" | "Geotechnical" | "Landscape";
  projectName: string;
  revision: string;
  fileSize: string;
  uploadDate: string;
  approvedBy: string;
  status: "Issued for Construction (IFC)" | "Under Review" | "Superseded";
}

const MOCK_DOCS: ProjectDrawing[] = [
  {
    _id: "d1",
    docCode: "DWG-ARC-0104",
    title: "Typical Tower Floor Architectural Layout & Partition Details",
    discipline: "Architectural",
    projectName: "Addis Heights Tower",
    revision: "Rev C",
    fileSize: "14.2 MB",
    uploadDate: "2024-01-20",
    approvedBy: "Arch. Selamawit Bekele",
    status: "Issued for Construction (IFC)",
  },
  {
    _id: "d2",
    docCode: "DWG-STR-0201",
    title: "Level 10-15 Post-Tensioned Slab Reinforcement & Tendon Layout",
    discipline: "Structural",
    projectName: "Addis Heights Tower",
    revision: "Rev B",
    fileSize: "22.8 MB",
    uploadDate: "2024-02-01",
    approvedBy: "Eng. Dawit Haile",
    status: "Issued for Construction (IFC)",
  },
  {
    _id: "d3",
    docCode: "DWG-MEP-0050",
    title: "HVAC Ductwork & Chilled Water Riser Schematics",
    discipline: "MEP",
    projectName: "Bole Business Park",
    revision: "Rev A",
    fileSize: "18.5 MB",
    uploadDate: "2024-01-15",
    approvedBy: "Eng. Yonas Tulu",
    status: "Under Review",
  },
  {
    _id: "d4",
    docCode: "DWG-CIV-0012",
    title: "Outer Ring Road Kilometer 0-10 Geometric Alignment & Cross Sections",
    discipline: "Geotechnical",
    projectName: "Ring Road Expansion",
    revision: "Rev D",
    fileSize: "38.1 MB",
    uploadDate: "2023-11-10",
    approvedBy: "ERA Chief Surveyor",
    status: "Issued for Construction (IFC)",
  },
];

const STATUS_BADGES: Record<string, string> = {
  "Issued for Construction (IFC)": "bg-green-500/20 text-green-400 border border-green-500/30",
  "Under Review": "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  Superseded: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
};

export default function ProjectDocumentsPage() {
  const [docs, setDocs] = useState<ProjectDrawing[]>(MOCK_DOCS);
  const [search, setSearch] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState("All");

  const disciplines = ["All", "Architectural", "Structural", "MEP", "Geotechnical"];

  const filtered = docs.filter((d) => {
    const matchSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.docCode.toLowerCase().includes(search.toLowerCase()) ||
      d.projectName.toLowerCase().includes(search.toLowerCase());
    const matchDisc = disciplineFilter === "All" || d.discipline === disciplineFilter;
    return matchSearch && matchDisc;
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Project Engineering Drawings (IFC)</h1>
            <p className="text-gray-400 text-sm mt-1">
              Architectural blueprints, structural CAD revisions, MEP schematics, and site specifications
            </p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} />
            Upload Drawing
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search drawings by code, title, or project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={disciplineFilter}
            onChange={(e) => setDisciplineFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            {disciplines.map((disc) => (
              <option key={disc} value={disc}>{disc}</option>
            ))}
          </select>
        </div>

        {/* Drawings table */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/50 border-b border-gray-700">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Code & Revision</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Drawing Title</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Discipline</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Project</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Approved By</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.map((d) => (
                  <tr key={d._id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-blue-400 font-semibold text-xs">{d.docCode}</span>
                      <span className="ml-2 bg-blue-500/20 text-blue-300 text-[11px] px-1.5 py-0.5 rounded font-bold">
                        {d.revision}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{d.title}</p>
                      <p className="text-gray-500 text-xs">{d.fileSize}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{d.discipline}</td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{d.projectName}</td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{d.approvedBy}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[d.status]}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-blue-400 hover:text-blue-300 p-1" title="Download PDF Drawing">
                        <Download size={16} />
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

