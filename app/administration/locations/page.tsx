"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import HierarchicalLocationSelector, {
  HierarchicalLocationValue,
} from "@/components/location/HierarchicalLocationSelector";
import { Globe2, MapPin, Plus, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

interface CountryData {
  _id: string;
  name: string;
  countryCode: string;
  currency: string;
  currencyCode: string;
  currencySymbol: string;
  phoneCode: string;
  timeZone: string;
  status: string;
}

export default function CountriesAndLocationsPage() {
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // New Country Form State
  const [showAddCountry, setShowAddCountry] = useState(false);
  const [countryName, setCountryName] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("+251");
  const [currency, setCurrency] = useState("Ethiopian Birr");
  const [currencyCode, setCurrencyCode] = useState("ETB");
  const [currencySymbol, setCurrencySymbol] = useState("Br");
  const [timeZone, setTimeZone] = useState("Africa/Addis_Ababa");

  // New Location Wizard State
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [hierarchy, setHierarchy] = useState<HierarchicalLocationValue>({
    countryId: "",
    regionId: "",
    cityId: "",
    district: "",
    address: "",
  });

  async function fetchCountries() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/countries");
      const json = await res.json();
      if (json.success) {
        setCountries(json.data.items || []);
      } else {
        setError(json.error?.message || "Failed to load countries");
      }
    } catch {
      setError("Network error loading countries");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(fetchCountries);
  }, []);

  async function handleCreateCountry(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/countries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: countryName,
          countryCode,
          phoneCode,
          currency,
          currencyCode,
          currencySymbol,
          timeZone,
          status: "ACTIVE",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(`Country "${countryName}" created successfully.`);
        setShowAddCountry(false);
        setCountryName("");
        setCountryCode("");
        fetchCountries();
      } else {
        setError(json.error?.message || "Failed to create country");
      }
    } catch {
      setError("Network error creating country");
    }
  }

  async function handleCreateLocation(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!hierarchy.countryId || !hierarchy.regionId || !hierarchy.cityId || !hierarchy.address) {
      setError("Please fill all required hierarchy fields (Country, Region, City, Address)");
      return;
    }

    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: locationName,
          countryId: hierarchy.countryId,
          regionId: hierarchy.regionId,
          cityId: hierarchy.cityId,
          district: hierarchy.district,
          address: hierarchy.address,
          status: "ACTIVE",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(`Location "${locationName}" registered successfully.`);
        setShowAddLocation(false);
        setLocationName("");
      } else {
        setError(json.error?.message || "Failed to create location");
      }
    } catch {
      setError("Network error creating location");
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <Globe2 className="w-4 h-4" /> Administration & Master Data
            </div>
            <h1 className="font-slab text-3xl font-bold text-slate-900 tracking-tight dark:text-slate-100">
              Countries & Locations Management
            </h1>
            <p className="text-sm text-slate-500 mt-1 dark:text-slate-500 dark:text-slate-400">
              Multi-country hierarchy: Country → Region / State → City → Project Location
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddCountry(!showAddCountry)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-slate-100 text-xs font-semibold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Country
            </button>
            <button
              onClick={() => setShowAddLocation(!showAddLocation)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 dark:bg-[#22252B] dark:hover:bg-[#2A2D34] dark:text-slate-900 dark:text-slate-100 dark:border-[#3F434C] text-xs font-semibold transition-colors shadow-sm"
            >
              <MapPin className="w-4 h-4 text-blue-400" /> New Site Location
            </button>
          </div>
        </div>

        {/* Feedback alerts */}
        {error && (
          <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        {successMsg && (
          <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMsg}
          </div>
        )}

        {/* Add Country Drawer Form */}
        {showAddCountry && (
          <div className="bg-white dark:bg-[#1C1F24] border border-slate-200 dark:border-[#2F333A] rounded-xl p-5 shadow-lg space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono">
              Register New Country
            </h2>
            <form onSubmit={handleCreateCountry} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500 dark:text-slate-400">Country Name *</label>
                <input
                  type="text"
                  required
                  value={countryName}
                  onChange={(e) => setCountryName(e.target.value)}
                  placeholder="e.g. Ethiopia"
                  className="bg-white dark:bg-[#22252B] border border-slate-200 dark:border-[#3F434C] rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500 dark:text-slate-400">Country Code (2-letter) *</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ET"
                  className="bg-white dark:bg-[#22252B] border border-slate-200 dark:border-[#3F434C] rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 uppercase outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500 dark:text-slate-400">Phone Code *</label>
                <input
                  type="text"
                  required
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value)}
                  placeholder="e.g. +251"
                  className="bg-white dark:bg-[#22252B] border border-slate-200 dark:border-[#3F434C] rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500 dark:text-slate-400">Currency Name *</label>
                <input
                  type="text"
                  required
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="e.g. Ethiopian Birr"
                  className="bg-white dark:bg-[#22252B] border border-slate-200 dark:border-[#3F434C] rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500 dark:text-slate-400">Currency Code *</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ETB"
                  className="bg-white dark:bg-[#22252B] border border-slate-200 dark:border-[#3F434C] rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 uppercase outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500 dark:text-slate-400">Currency Symbol *</label>
                <input
                  type="text"
                  required
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  placeholder="e.g. Br"
                  className="bg-white dark:bg-[#22252B] border border-slate-200 dark:border-[#3F434C] rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-500 dark:text-slate-400">Time Zone *</label>
                <input
                  type="text"
                  required
                  value={timeZone}
                  onChange={(e) => setTimeZone(e.target.value)}
                  placeholder="e.g. Africa/Addis_Ababa"
                  className="bg-white dark:bg-[#22252B] border border-slate-200 dark:border-[#3F434C] rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-slate-100 text-xs font-semibold rounded-lg shadow-sm"
                >
                  Save Country
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCountry(false)}
                  className="px-4 py-2 bg-white dark:bg-[#22252B] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 text-xs font-semibold rounded-lg border border-slate-200 dark:border-[#3F434C]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add Project Location Wizard */}
        {showAddLocation && (
          <div className="bg-white dark:bg-[#1C1F24] border border-slate-200 dark:border-[#2F333A] rounded-xl p-5 shadow-lg space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-400" /> Register Project Site Location
            </h2>
            <form onSubmit={handleCreateLocation} className="space-y-4">
              <div className="max-w-md flex flex-col gap-1">
                <label className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Location / Site Name *</label>
                <input
                  type="text"
                  required
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Bole Medhanialem High-Rise Site Plot"
                  className="bg-white dark:bg-[#22252B] border border-slate-200 dark:border-[#3F434C] rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              {/* Hierarchical Cascaded Selector */}
              <div className="p-4 rounded-xl bg-[#0E1016] border border-[#222736]">
                <p className="text-xs font-mono uppercase text-blue-400 mb-3 font-semibold">
                  Hierarchical Cascading Selector
                </p>
                <HierarchicalLocationSelector
                  value={hierarchy}
                  onChange={setHierarchy}
                  required
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddLocation(false)}
                  className="px-4 py-2 bg-white dark:bg-[#22252B] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 text-xs font-semibold rounded-lg border border-slate-200 dark:border-[#3F434C]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-slate-100 text-xs font-semibold rounded-lg shadow-sm"
                >
                  Save Site Location
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Countries Table */}
        <div className="bg-white dark:bg-[#1C1F24] border border-slate-200 dark:border-[#2F333A] rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-[#2F333A] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Active Operating Countries</h2>
            <button
              onClick={fetchCountries}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-400 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#181B24] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono text-[11px] border-b border-slate-200 dark:border-[#2F333A]">
                <tr>
                  <th className="px-5 py-3">Country</th>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Currency</th>
                  <th className="px-5 py-3">Phone Prefix</th>
                  <th className="px-5 py-3">Time Zone</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202432]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      Loading country records...
                    </td>
                  </tr>
                ) : countries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      No operating countries registered yet. Click &quot;Add Country&quot; above.
                    </td>
                  </tr>
                ) : (
                  countries.map((c) => (
                    <tr key={c._id} className="hover:bg-[#1A1E29] transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-slate-100">{c.name}</td>
                      <td className="px-5 py-3.5 font-mono text-blue-400">{c.countryCode}</td>
                      <td className="px-5 py-3.5">
                        {c.currency} ({c.currencySymbol} / {c.currencyCode})
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-500 dark:text-slate-400">{c.phoneCode}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-500 dark:text-slate-400">{c.timeZone}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
