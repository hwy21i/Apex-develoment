"use client";

import React, { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Users2,
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  X,
  Loader2,
} from "lucide-react";
import { useRecords, type OperationalRecord } from "@/hooks/useRecords";

interface ClientRecord {
  _id: string;
  projectId: string;
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  status: string;
}

const STATUSES = ["ACTIVE", "PROSPECT", "INACTIVE"];

function mapRecord(r: OperationalRecord): ClientRecord {
  const d = r.data || {};
  return {
    _id: r._id,
    projectId: r.projectId,
    name: r.title || d.name || "Corporate Client",
    companyName: d.companyName || "—",
    email: d.email || "—",
    phone: d.phone || "—",
    address: d.address || "—",
    paymentTerms: d.paymentTerms || "Net 30",
    status: r.status || "ACTIVE",
  };
}

const EMPTY_FORM = {
  projectId: "",
  name: "",
  companyName: "",
  email: "",
  phone: "",
  address: "",
  paymentTerms: "Net 30",
  status: "ACTIVE",
};

export default function ClientsPage() {
  const { records, projects, loading, error, reload, create } = useRecords("clients");
  const clients = records.map(mapRecord);

  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
    if (!form.name.trim()) {
      setFormError("Client name is required.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await create({
        projectId: form.projectId,
        title: form.name.trim(),
        status: form.status,
        data: {
          name: form.name.trim(),
          companyName: form.companyName,
          email: form.email,
          phone: form.phone,
          address: form.address,
          paymentTerms: form.paymentTerms,
        },
      });
      setFormOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to create client");
    } finally {
      setBusy(false);
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.companyName && c.companyName.toLowerCase().includes(search.toLowerCase()))
  );

  const inputCls =
    "w-full bg-[#141720] border border-[#262C3D] rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500";

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

          <button
            onClick={openForm}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors shrink-0"
          >
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
          <div className="flex items-center justify-center gap-2 py-12 text-xs text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading clients...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-dashed border-[#2A3042] bg-[#141720] p-12 text-center">
            <p className="text-xs text-rose-300">{error}</p>
            <button
              onClick={() => reload()}
              className="mt-3 text-xs font-semibold text-blue-400 hover:text-blue-300"
            >
              Retry
            </button>
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

      {/* Create modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111420] border border-[#262C3D] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#232733] pb-4">
              <h2 className="text-base font-bold text-white">Add Client</h2>
              <button onClick={() => setFormOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Associated Project</label>
                <select
                  className={inputCls}
                  value={form.projectId}
                  onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                >
                  {projects.length === 0 && <option value="">No accessible projects</option>}
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Client Name *</label>
                  <input
                    className={inputCls}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Addis Real Estate PLC"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Company</label>
                  <input
                    className={inputCls}
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Email</label>
                  <input
                    type="email"
                    className={inputCls}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Phone</label>
                  <input
                    className={inputCls}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+251 ..."
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Address</label>
                <input
                  className={inputCls}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Payment Terms</label>
                  <input
                    className={inputCls}
                    value={form.paymentTerms}
                    onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                    placeholder="Net 30"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Status</label>
                  <select
                    className={inputCls}
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {formError && <p className="text-xs text-rose-300">{formError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setFormOpen(false)}
                className="bg-[#1A1E29] hover:bg-[#232733] text-white px-4 py-2 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={busy}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Client
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
