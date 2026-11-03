"use client";

import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    if (projects.length > 0 && !form.projectId) {
      setForm((prev) => ({ ...prev, projectId: projects[0]._id }));
    }
  }, [projects, form.projectId]);

  const openForm = () => {
    setForm({ ...EMPTY_FORM, projectId: form.projectId || projects[0]?._id || "" });
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
    "w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3 py-2 text-xs text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]";

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#666666] dark:text-[#A3A3A3] font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <Users2 className="w-4 h-4" /> Client Relationship Management
            </div>
            <h1 className="text-2xl font-bold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
              Enterprise Clients
            </h1>
            <p className="text-sm text-[#666666] dark:text-[#A3A3A3] mt-1">
              Manage project sponsors, developers, institutional clients, and contract terms.
            </p>
          </div>

          <button
            onClick={openForm}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] text-xs font-semibold shadow-md transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Client
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#666666] dark:text-[#A3A3A3]" />
          <input
            type="text"
            placeholder="Search clients by name, company, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] text-[#D4D4D4] dark:text-[#444444] text-xs rounded-lg pl-9 pr-3 py-2 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
          />
        </div>

        {/* Clients Cards Grid */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-xs text-[#666666] dark:text-[#A3A3A3]">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading clients...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-dashed border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] p-12 text-center">
            <p className="text-xs text-[#000000] dark:text-[#FFFFFF] bg-black/5 dark:bg-white/10 p-2 rounded">{error}</p>
            <button
              onClick={() => reload()}
              className="mt-3 text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] hover:text-[#000000] dark:text-[#FFFFFF]"
            >
              Retry
            </button>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] p-12 text-center">
            <Users2 className="w-10 h-10 text-[#666666] dark:text-[#A3A3A3] mx-auto mb-3" />
            <h2 className="text-sm font-semibold text-[#333333] dark:text-[#D4D4D4]">No client records found</h2>
            <p className="mt-1 text-xs text-[#666666] dark:text-[#A3A3A3]">
              Add corporate clients and developers to associate them with projects.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredClients.map((client) => (
              <div
                key={client._id}
                className="rounded-xl border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] p-5 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      {client.name}
                    </h3>
                    <p className="text-xs text-[#000000] dark:text-[#FFFFFF] font-medium mt-0.5">
                      {client.companyName}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] border border-[#111111] dark:border-[#FFFFFF] font-semibold">
                    {client.status}
                  </span>
                </div>

                <div className="pt-2 space-y-1.5 text-xs text-[#666666] dark:text-[#A3A3A3] border-t border-[#D4D4D4] dark:border-[#303030]">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[#666666] dark:text-[#A3A3A3] shrink-0" />
                    <span>{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#666666] dark:text-[#A3A3A3] shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#666666] dark:text-[#A3A3A3] shrink-0" />
                    <span>{client.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-[#666666] dark:text-[#A3A3A3] shrink-0" />
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
        <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain p-4 sm:p-6 flex items-center justify-center bg-black/70 backdrop-blur-xs animate-v18-backdrop">
          <div className="my-auto max-h-[88vh] flex flex-col overflow-hidden w-full max-w-lg v18-card bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] rounded-2xl shadow-2xl animate-v18-modal">
            <div className="flex items-start justify-between border-b border-[#D4D4D4] dark:border-[#303030] p-6 pb-4 shrink-0">
              <h2 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">Add Client</h2>
              <button onClick={() => setFormOpen(false)} className="text-[#888888] dark:text-[#888888] hover:text-[#000000] dark:hover:text-[#FFFFFF]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 py-4 space-y-3 pr-2">
              <div>
                <label className="text-[11px] text-[#888888] dark:text-[#888888] block mb-1">Associated Project</label>
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
                  <label className="text-[11px] text-[#888888] dark:text-[#888888] block mb-1">Client Name *</label>
                  <input
                    className={inputCls}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Addis Real Estate PLC"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#888888] dark:text-[#888888] block mb-1">Company</label>
                  <input
                    className={inputCls}
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#888888] dark:text-[#888888] block mb-1">Email</label>
                  <input
                    type="email"
                    className={inputCls}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#888888] dark:text-[#888888] block mb-1">Phone</label>
                  <input
                    className={inputCls}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+251 ..."
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-[#888888] dark:text-[#888888] block mb-1">Address</label>
                <input
                  className={inputCls}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#888888] dark:text-[#888888] block mb-1">Payment Terms</label>
                  <input
                    className={inputCls}
                    value={form.paymentTerms}
                    onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                    placeholder="Net 30"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#888888] dark:text-[#888888] block mb-1">Status</label>
                  <select
                    className={inputCls}
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              {formError && <p className="text-xs text-[#000000] dark:text-[#FFFFFF] bg-black/5 dark:bg-white/10 p-2 rounded">{formError}</p>}
            </div>

            <div className="flex justify-end gap-2 p-6 pt-3 border-t border-[#D4D4D4] dark:border-[#303030] shrink-0">
              <button
                onClick={() => setFormOpen(false)}
                className="bg-[#FAFAFA] hover:bg-[#E5E5E5] dark:bg-[#171717] dark:hover:bg-[#1F1F1F] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030] px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={busy}
                className="bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50 flex items-center gap-2"
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
