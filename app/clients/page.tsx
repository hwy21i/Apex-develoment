"use client";

import React, { useState, useEffect, FormEvent } from "react";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { hasPermission } from "@/lib/rbac/permissions";
import {
  Users2,
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
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
  const { user } = useAuth();
  const canCreateClient = hasPermission(user, "CLIENT_CREATE");
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function fetchClients() {
    setLoading(true);
    try {
      const res = await fetch("/api/clients", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || "Unable to load clients.");
        return;
      }
      setClients((json.data?.items || []).map((item: ClientRecord) => ({
        _id: item._id,
        name: item.name,
        companyName: item.companyName || "—",
        email: item.email || "—",
        phone: item.phone || "—",
        address: item.address || "—",
        paymentTerms: item.paymentTerms || "Net 30",
        status: item.status || "UNKNOWN",
      })));
      setError("");
    } catch {
      setError("Unable to connect to the client service.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => { void fetchClients(); });
  }, []);

  async function createClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        setFormError(json.error?.message || "Unable to create client.");
        return;
      }
      setShowCreateForm(false);
      await fetchClients();
    } catch {
      setFormError("Unable to connect to the client service.");
    } finally {
      setSaving(false);
    }
  }

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

          {canCreateClient && <button type="button" onClick={() => { setFormError(""); setShowCreateForm(true); }} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors shrink-0">
            <Plus className="w-4 h-4" /> Add Client
          </button>}
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

        {error && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}

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

        {showCreateForm && <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"><form role="dialog" aria-modal="true" aria-labelledby="client-dialog-title" onSubmit={createClient} className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-2xl border border-gray-700 bg-gray-900 p-5 shadow-2xl"><div className="flex items-start justify-between gap-3"><div><h2 id="client-dialog-title" className="text-lg font-semibold text-white">Add client</h2><p className="mt-1 text-sm text-gray-400">Create a client profile for project and contract records.</p></div><button type="button" aria-label="Close client form" disabled={saving} onClick={() => setShowCreateForm(false)} className="px-2 text-xl text-gray-400">×</button></div>{formError && <p role="alert" className="text-sm text-rose-300">{formError}</p>}<label className="grid gap-1 text-sm text-gray-300">Client name<input name="name" required minLength={2} maxLength={160} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1 text-sm text-gray-300">Company<input name="companyName" maxLength={160} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white" /></label><label className="grid gap-1 text-sm text-gray-300">Email<input name="email" type="email" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white" /></label><label className="grid gap-1 text-sm text-gray-300">Phone<input name="phone" maxLength={30} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white" /></label><label className="grid gap-1 text-sm text-gray-300">Payment terms<input name="paymentTerms" defaultValue="Net 30" maxLength={80} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white" /></label></div><label className="grid gap-1 text-sm text-gray-300">Address<textarea name="address" maxLength={300} rows={2} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white" /></label><div className="flex justify-end gap-2"><button type="button" disabled={saving} onClick={() => setShowCreateForm(false)} className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-200">Cancel</button><button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save client"}</button></div></form></div>}
      </div>
    </AppShell>
  );
}
