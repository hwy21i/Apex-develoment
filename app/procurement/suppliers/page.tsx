"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Plus, Search, Building2, Phone, Mail, MapPin,
  Star, FileText, CheckCircle, Clock, AlertCircle, Eye, Edit
} from "lucide-react";

interface Supplier {
  _id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  rating: number;
  status: "Active" | "Pending" | "Blacklisted";
  tinNumber: string;
  paymentTerms: string;
  totalOrders: number;
  totalSpent: number;
}

const MOCK_SUPPLIERS: Supplier[] = [
  {
    _id: "s1",
    name: "Addis Construction Supply Co.",
    contactPerson: "Solomon Tadesse",
    email: "sales@addisconstructionsupply.et",
    phone: "+251-11-234-5678",
    address: "Bole Sub-City, Woreda 03, Addis Ababa",
    category: "Cement & Aggregates",
    rating: 4.8,
    status: "Active",
    tinNumber: "0012345678",
    paymentTerms: "Net 30",
    totalOrders: 24,
    totalSpent: 4850000,
  },
  {
    _id: "s2",
    name: "Tekle Steel Works Plc",
    contactPerson: "Tekle Wolde",
    email: "orders@teklessteel.com",
    phone: "+251-11-456-7890",
    address: "Akaki Kality Industrial Zone, Addis Ababa",
    category: "Structural Steel & Rebar",
    rating: 4.6,
    status: "Active",
    tinNumber: "0023456789",
    paymentTerms: "Net 45",
    totalOrders: 18,
    totalSpent: 9200000,
  },
  {
    _id: "s3",
    name: "Ethiopian Aggregate Industries",
    contactPerson: "Marta Getachew",
    email: "info@ethioaggregate.et",
    phone: "+251-11-345-6789",
    address: "Gelam Quarry Site, Oromia",
    category: "Sand, Gravel & Crushed Stone",
    rating: 4.2,
    status: "Active",
    tinNumber: "0034567890",
    paymentTerms: "50% Advance, 50% Delivery",
    totalOrders: 15,
    totalSpent: 1650000,
  },
  {
    _id: "s4",
    name: "SafeGuard Ethiopia Safety Gear",
    contactPerson: "Yonas Berhanu",
    email: "yonas@safeguardethiopia.com",
    phone: "+251-11-567-8901",
    address: "Kirkos Sub-City, Addis Ababa",
    category: "Safety Equipment & PPE",
    rating: 4.9,
    status: "Active",
    tinNumber: "0045678901",
    paymentTerms: "On Delivery",
    totalOrders: 8,
    totalSpent: 340000,
  },
  {
    _id: "s5",
    name: "Rift Valley Bitumen Imports",
    contactPerson: "Daniel Kassa",
    email: "daniel@riftbitumen.et",
    phone: "+251-11-678-9012",
    address: "Dukem Free Trade Zone",
    category: "Asphalt & Bituminous Products",
    rating: 3.5,
    status: "Pending",
    tinNumber: "0056789012",
    paymentTerms: "LC / Bank Guarantee",
    totalOrders: 2,
    totalSpent: 1520000,
  },
];

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-green-500/20 text-green-400 border border-green-500/30",
  Pending: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  Blacklisted: "bg-red-500/20 text-red-400 border border-red-500/30",
};

export default function SuppliersDirectoryPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState<Supplier | null>(null);

  const categories = ["All", ...Array.from(new Set(MOCK_SUPPLIERS.map((s) => s.category)))];

  const filtered = suppliers.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      s.tinNumber.includes(search);
    const matchCategory = categoryFilter === "All" || s.category === categoryFilter;
    const matchStatus = statusFilter === "All" || s.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  const fmt = (n: number) =>
    `ETB ${n.toLocaleString("en-ET", { minimumFractionDigits: 2 })}`;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Suppliers Directory</h1>
            <p className="text-gray-400 text-sm mt-1">
              Qualified vendors, material providers, and trade contractors
            </p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} />
            Add Supplier
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Total Vendors</p>
            <p className="text-xl font-bold text-white mt-1">{suppliers.length}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Active Vendors</p>
            <p className="text-xl font-bold text-green-400 mt-1">
              {suppliers.filter((s) => s.status === "Active").length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Total Procurement Value</p>
            <p className="text-xl font-bold text-blue-400 mt-1">
              {fmt(suppliers.reduce((sum, s) => sum + s.totalSpent, 0))}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Avg. Rating</p>
            <p className="text-xl font-bold text-yellow-400 mt-1">
              {(suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length).toFixed(1)} / 5.0
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by vendor name, contact, TIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Blacklisted">Blacklisted</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/50 border-b border-gray-700">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Supplier</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Category</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Contact</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">TIN / Terms</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Rating</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Total Spend</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-white font-medium">{s.name}</span>
                        <div className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                          <MapPin size={11} /> {s.address}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{s.category}</td>
                    <td className="px-4 py-3">
                      <p className="text-white text-xs font-medium">{s.contactPerson}</p>
                      <p className="text-gray-400 text-xs">{s.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-gray-300 text-xs">TIN: {s.tinNumber}</p>
                      <p className="text-gray-400 text-xs">{s.paymentTerms}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-yellow-400 font-medium">
                        <Star size={13} className="fill-yellow-400" />
                        {s.rating}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {fmt(s.totalSpent)}
                      <p className="text-gray-400 text-xs font-normal">{s.totalOrders} orders</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[s.status]}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelected(s)}
                        className="text-blue-400 hover:text-blue-300 p-1"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Supplier detail modal */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-start justify-between border-b border-gray-700 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">{selected.name}</h2>
                  <p className="text-gray-400 text-sm">{selected.category}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white">✕</button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Contact Person</p>
                  <p className="text-white font-medium">{selected.contactPerson}</p>
                </div>
                <div>
                  <p className="text-gray-400">Phone</p>
                  <p className="text-white font-medium">{selected.phone}</p>
                </div>
                <div>
                  <p className="text-gray-400">Email</p>
                  <p className="text-white font-medium">{selected.email}</p>
                </div>
                <div>
                  <p className="text-gray-400">TIN Number</p>
                  <p className="text-white font-mono">{selected.tinNumber}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-400">Physical Address</p>
                  <p className="text-white">{selected.address}</p>
                </div>
                <div>
                  <p className="text-gray-400">Payment Terms</p>
                  <p className="text-white">{selected.paymentTerms}</p>
                </div>
                <div>
                  <p className="text-gray-400">Lifetime Orders & Spend</p>
                  <p className="text-green-400 font-bold">{fmt(selected.totalSpent)} ({selected.totalOrders} POs)</p>
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setSelected(null)}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

