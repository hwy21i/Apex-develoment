"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, FileSignature, Download, ShieldCheck,
  Calendar, CheckCircle, Clock, AlertTriangle, Eye
} from "lucide-react";

interface ContractDocument {
  _id: string;
  contractRef: string;
  title: string;
  partyType: "Prime Client" | "Subcontractor" | "Consultant" | "Material Supplier";
  contractingParty: string;
  projectName: string;
  effectiveDate: string;
  expiryDate: string;
  contractValueETB: number;
  status: "Active" | "Under Review" | "Expired" | "Completed";
  signedBy: string;
}

const MOCK_CONTRACTS: ContractDocument[] = [
  {
    _id: "c1",
    contractRef: "CTR-CL-2023-01",
    title: "Prime Turnkey Construction Agreement (FIDIC Red Book)",
    partyType: "Prime Client",
    contractingParty: "Zemen Real Estate S.C.",
    projectName: "Addis Heights Tower",
    effectiveDate: "2023-04-01",
    expiryDate: "2025-06-30",
    contractValueETB: 48000000,
    status: "Active",
    signedBy: "Managing Director & Zemen CEO",
  },
  {
    _id: "c2",
    contractRef: "CTR-SUB-2023-04",
    title: "Deep Shoring & Dewatering Subcontract",
    partyType: "Subcontractor",
    contractingParty: "Abyssinia Shoring & Geotech Works Plc",
    projectName: "Addis Heights Tower",
    effectiveDate: "2023-05-15",
    expiryDate: "2023-10-15",
    contractValueETB: 4200000,
    status: "Completed",
    signedBy: "Project Director",
  },
  {
    _id: "c3",
    contractRef: "CTR-GOV-2023-09",
    title: "ERA Civil Works Highway Contract #ERA/CR/2023/18",
    partyType: "Prime Client",
    contractingParty: "Ethiopian Roads Administration (ERA)",
    projectName: "Ring Road Expansion",
    effectiveDate: "2023-08-01",
    expiryDate: "2025-12-31",
    contractValueETB: 36000000,
    status: "Active",
    signedBy: "ERA Director General",
  },
  {
    _id: "c4",
    contractRef: "CTR-SUP-2024-02",
    title: "Structural Steel Long-Term Supply & Pricing Framework",
    partyType: "Material Supplier",
    contractingParty: "Tekle Steel Works Plc",
    projectName: "Portfolio Wide",
    effectiveDate: "2024-01-01",
    expiryDate: "2024-12-31",
    contractValueETB: 15000000,
    status: "Active",
    signedBy: "Procurement Director",
  },
];

const STATUS_BADGES: Record<string, string> = {
  Active: "bg-green-500/20 text-green-400 border border-green-500/30",
  "Under Review": "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  Completed: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  Expired: "bg-red-500/20 text-red-400 border border-red-500/30",
};

export default function ContractsVaultPage() {
  const [contracts, setContracts] = useState<ContractDocument[]>(MOCK_CONTRACTS);
  const [search, setSearch] = useState("");

  const filtered = contracts.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.contractRef.toLowerCase().includes(search.toLowerCase()) ||
      c.contractingParty.toLowerCase().includes(search.toLowerCase()) ||
      c.projectName.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (n: number) =>
    `ETB ${n.toLocaleString("en-ET", { minimumFractionDigits: 2 })}`;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Contracts Vault & Legal Agreements</h1>
            <p className="text-gray-400 text-sm mt-1">
              Prime client contracts, FIDIC agreements, trade subcontracts, and supplier master agreements
            </p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} />
            Archive New Contract
          </button>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Total Legal Instruments</p>
            <p className="text-xl font-bold text-white mt-1">{contracts.length}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Active Agreements</p>
            <p className="text-xl font-bold text-green-400 mt-1">
              {contracts.filter((c) => c.status === "Active").length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Total Contract Value</p>
            <p className="text-xl font-bold text-blue-400 mt-1">
              {fmt(contracts.reduce((s, c) => s + c.contractValueETB, 0))}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Prime Client Contracts</p>
            <p className="text-xl font-bold text-purple-400 mt-1">
              {contracts.filter((c) => c.partyType === "Prime Client").length}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search contracts by party, project, ref..."
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
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Contract Ref & Type</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Contract Agreement Title</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Counterparty</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Project</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Contract Value</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-blue-400 font-semibold text-xs">{c.contractRef}</span>
                      <p className="text-gray-400 text-xs mt-0.5">{c.partyType}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{c.title}</p>
                      <p className="text-gray-500 text-xs">Signed by: {c.signedBy}</p>
                    </td>
                    <td className="px-4 py-3 text-white text-xs font-medium">{c.contractingParty}</td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{c.projectName}</td>
                    <td className="px-4 py-3 text-right font-bold text-white">{fmt(c.contractValueETB)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[c.status]}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-blue-400 hover:text-blue-300 p-1" title="Download Signed PDF">
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

