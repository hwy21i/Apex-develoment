"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import {
  Folder, FileText, FileSignature, Receipt, Plus,
  Search, Download, Eye, Upload, Filter, Calendar
} from "lucide-react";

export default function DocumentsHubPage() {
  const [search, setSearch] = useState("");

  const categories = [
    {
      title: "Project Engineering Drawings (IFC)",
      description: "Architectural blueprints, structural CAD sheets, and MEP schematics",
      icon: Folder,
      href: "/documents/projects",
      count: "128 files",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      title: "Contracts & Legal Agreements",
      description: "Prime client turnkey contracts, FIDIC terms, subcontracts, and NDAs",
      icon: FileSignature,
      href: "/documents/contracts",
      count: "34 contracts",
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
    {
      title: "Scanned Receipts & Payment Vouchers",
      description: "Site fuel tickets, bank deposit slips, and verified petty cash slips",
      icon: Receipt,
      href: "/documents/receipts",
      count: "412 vouchers",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
  ];

  const recentUploads = [
    {
      name: "Addis Heights - Level 12 Rebar Shop Drawings (Rev C).pdf",
      category: "Engineering Drawings",
      uploadedBy: "Eng. Dawit Haile",
      date: "2024-02-07",
      size: "18.4 MB",
    },
    {
      name: "Tekle Steel Master Supply Agreement 2024 Signed.pdf",
      category: "Contracts",
      uploadedBy: "Tigist Alemu",
      date: "2024-02-05",
      size: "4.2 MB",
    },
    {
      name: "Fuel Slip Voucher - TotalEnergies Bole Crane Refuel.pdf",
      category: "Receipts",
      uploadedBy: "Abebe Kebede",
      date: "2024-02-04",
      size: "1.1 MB",
    },
    {
      name: "Ring Road Station 8+400 Compaction Test Lab Certificate.pdf",
      category: "Engineering Drawings",
      uploadedBy: "ERA Laboratory",
      date: "2024-02-03",
      size: "3.7 MB",
    },
  ];

  const filtered = recentUploads.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.category.toLowerCase().includes(search.toLowerCase()) ||
      u.uploadedBy.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Document Management Vault</h1>
            <p className="text-gray-400 text-sm mt-1">
              Centralized repository for engineering drawings, legal contracts, permits, and scanned vouchers
            </p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Upload size={16} />
            Upload Document
          </button>
        </div>

        {/* Categories cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {categories.map((cat, idx) => (
            <Link
              key={idx}
              href={cat.href}
              className="bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-xl p-5 block transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl ${cat.bg}`}>
                  <cat.icon size={22} className={cat.color} />
                </div>
                <span className="text-xs text-gray-400 font-mono">{cat.count}</span>
              </div>
              <h3 className="text-base font-bold text-white mt-4 group-hover:text-blue-400 transition-colors">
                {cat.title}
              </h3>
              <p className="text-xs text-gray-400 mt-1">{cat.description}</p>
            </Link>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search recent files by title, uploader, or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Recent files list */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-sm font-bold text-white">Recent Vault Activity & Revisions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/50 border-b border-gray-700">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Document Title</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Vault Section</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Uploaded By</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Date</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Size</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium flex items-center gap-2">
                        <FileText size={15} className="text-blue-400 flex-shrink-0" />
                        {item.name}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{item.category}</td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{item.uploadedBy}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(item.date).toLocaleDateString("en-ET")}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-400 text-xs">{item.size}</td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-blue-400 hover:text-blue-300 p-1" title="Download">
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

