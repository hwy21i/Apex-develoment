"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Users2,
  Plus,
  Search,
  Mail,
  Phone,
  Building,
  MapPin,
  FileText,
  DollarSign,
  Briefcase,
} from "lucide-react";

interface ClientRecord {
  _id: string;
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  status: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function fetchClients() {
    setLoading(true);
    try {
      const res = await fetch("/api/records/clients");
      const json = await res.json();
      if (json.success && json.data?.items) {
        setClients(
          json.data.items.map((item: any) => ({
            _id: item._id,
            name: item.title || item.data?.name || "Corporate Client",
            companyName: item.data?.companyName || "Commercial Developer",
            email: item.data?.email || "contact@client.et",
            phone: item.data?.phone || "+251 91 100 2233",
            address: item.data?.address || "Addis Ababa, Ethiopia",
            paymentTerms: item.data?.paymentTerms || "Net 30",
            status: item.status || "ACTIVE",
          }))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.companyName && c.companyName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <Users2 className="w-4 h-4" /> Client Relationship Management
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Enterprise Clients
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage project sponsors, developers, institutional clients, and contract terms.
            </p>
          </div>

          <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors shrink-0">
            <Plus className="w-4 h-4" /> Add Client
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search clients by name, company, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#141720] border border-[#262C3D] text-slate-200 text-xs rounded-lg pl-9 pr-3 py-2 outline-none focus:border-blue-500"
          />
        </div>

        {/* Clients Cards Grid */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">
            Loading clients...
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#2A3042] bg-[#141720] p-12 text-center">
            <Users2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h2 className="text-sm font-semibold text-slate-300">No client records found</h2>
            <p className="mt-1 text-xs text-slate-500">
              Add corporate clients and developers to associate them with projects.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredClients.map((client) => (
              <div
                key={client._id}
                className="rounded-xl border border-[#232733] bg-[#141720] p-5 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      {client.name}
                    </h3>
                    <p className="text-xs text-blue-400 font-medium mt-0.5">
                      {client.companyName}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {client.status}
                  </span>
                </div>

                <div className="pt-2 space-y-1.5 text-xs text-slate-400 border-t border-[#1F2330]">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{client.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Payment Terms: {client.paymentTerms}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

