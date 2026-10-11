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
      setError("Failed to communicate with master records service");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCountries();
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
          countryCode: countryCode.toUpperCase(),
          phoneCode,
          currency,
          currencyCode: currencyCode.toUpperCase(),
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

  const inputCls =
    "w-full bg-slate-50 dark:bg-[#1A2D42]/90 border border-slate-200 dark:border-[#AAB7B7]/25 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-[#D4D8DD] placeholder-slate-400 dark:placeholder-[#AAB7B7]/50 focus:outline-none focus:border-[#C0C8CA]";

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#C0C8CA] font-mono text-xs font-bold uppercase tracking-wider mb-1">
              <Globe2 className="w-4 h-4" /> Administration &amp; Master Data
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-[#D4D8DD] tracking-tight">
              Countries &amp; Locations Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#AAB7B7] mt-1">
              Multi-country hierarchy: Country → Region / State → City → Project Location
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddCountry(!showAddCountry)}
              className="inline-flex items-center justify-center gap-2 bg-[#C0C8CA] hover:bg-white text-[#1A2D42] font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all hover:scale-[1.015] active:scale-[0.98] shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Country
            </button>
            <button
              onClick={() => setShowAddLocation(!showAddLocation)}
              className="inline-flex items-center justify-center gap-2 bg-white dark:bg-[#1A2D42] hover:bg-slate-100 dark:hover:bg-[#2E4156] text-slate-800 dark:text-[#D4D8DD] border border-slate-200 dark:border-[#AAB7B7]/25 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all hover:scale-[1.015] active:scale-[0.98] shadow-xs"
            >
              <MapPin className="w-4 h-4 text-[#C0C8CA]" /> New Site Location
            </button>
          </div>
        </div>

        {/* Feedback alerts */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMsg}
          </div>
        )}

        {/* Add Country Drawer Form */}
        {showAddCountry && (
          <div className="bg-white dark:bg-[#1A2D42] border border-slate-200 dark:border-[#AAB7B7]/25 rounded-2xl p-5 shadow-lg space-y-4 animate-in fade-in duration-150">
            <h2 className="text-sm font-bold text-slate-900 dark:text-[#D4D8DD] uppercase tracking-wider font-mono">
              Register New Country
            </h2>
            <form onSubmit={handleCreateCountry} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-[#AAB7B7]">Country Name *</label>
                <input
                  type="text"
                  required
                  value={countryName}
                  onChange={(e) => setCountryName(e.target.value)}
                  placeholder="e.g. Ethiopia"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-[#AAB7B7]">Country Code (2-letter) *</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ET"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-[#AAB7B7]">Phone Code *</label>
                <input
                  type="text"
                  required
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value)}
                  placeholder="e.g. +251"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-[#AAB7B7]">Currency Name *</label>
                <input
                  type="text"
                  required
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="e.g. Ethiopian Birr"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-[#AAB7B7]">Currency Code *</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ETB"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-[#AAB7B7]">Currency Symbol *</label>
                <input
                  type="text"
                  required
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  placeholder="e.g. Br"
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-[#AAB7B7]">Time Zone *</label>
                <input
                  type="text"
                  required
                  value={timeZone}
                  onChange={(e) => setTimeZone(e.target.value)}
                  placeholder="e.g. Africa/Addis_Ababa"
                  className={inputCls}
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#C0C8CA] hover:bg-white text-[#1A2D42] text-xs font-bold rounded-xl shadow-md transition-all"
                >
                  Save Country
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCountry(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-[#2E4156] hover:bg-slate-200 dark:hover:bg-[#2E4156]/80 text-slate-700 dark:text-[#D4D8DD] text-xs font-semibold rounded-xl border border-slate-200 dark:border-[#2E4156] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add Project Location Wizard */}
        {showAddLocation && (
          <div className="bg-white dark:bg-[#1A2D42] border border-slate-200 dark:border-[#AAB7B7]/25 rounded-2xl p-5 shadow-lg space-y-4 animate-in fade-in duration-150">
            <h2 className="text-sm font-bold text-slate-900 dark:text-[#D4D8DD] uppercase tracking-wider font-mono flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#C0C8CA]" /> Register Project Site Location
            </h2>
            <form onSubmit={handleCreateLocation} className="space-y-4">
              <div className="max-w-md flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-[#AAB7B7]">Location / Site Name *</label>
                <input
                  type="text"
                  required
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Bole Medhanialem High-Rise Site Plot"
                  className={inputCls}
                />
              </div>

              {/* Hierarchical Cascaded Selector */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#2E4156]/30 border border-slate-200 dark:border-[#2E4156]">
                <p className="text-xs font-mono uppercase text-[#C0C8CA] mb-3 font-semibold">
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
                  className="px-4 py-2.5 bg-slate-100 dark:bg-[#2E4156] hover:bg-slate-200 dark:hover:bg-[#2E4156]/80 text-slate-700 dark:text-[#D4D8DD] text-xs font-semibold rounded-xl border border-slate-200 dark:border-[#2E4156] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#C0C8CA] hover:bg-white text-[#1A2D42] text-xs font-bold rounded-xl shadow-md transition-all"
                >
                  Save Site Location
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Countries Table */}
        <div className="bg-white dark:bg-[#1A2D42] border border-slate-200 dark:border-[#AAB7B7]/25 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-[#2E4156] flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-[#D4D8DD]">Active Operating Countries</h2>
            <button
              onClick={fetchCountries}
              className="text-xs font-semibold text-slate-500 hover:text-[#C0C8CA] dark:text-[#AAB7B7] dark:hover:text-[#D4D8DD] flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-[#2E4156]/40 text-slate-500 dark:text-[#AAB7B7] uppercase tracking-wider font-mono text-[10px] border-b border-slate-200 dark:border-[#2E4156]">
                <tr>
                  <th className="px-5 py-3">Country</th>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Currency</th>
                  <th className="px-5 py-3">Phone Prefix</th>
                  <th className="px-5 py-3">Time Zone</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2E4156]/50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                      Loading country records...
                    </td>
                  </tr>
                ) : countries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                      No operating countries registered yet. Click &quot;Add Country&quot; above.
                    </td>
                  </tr>
                ) : (
                  countries.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/70 dark:hover:bg-[#2E4156]/20 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-[#D4D8DD]">{c.name}</td>
                      <td className="px-5 py-3.5 font-mono text-[#C0C8CA] font-semibold">{c.countryCode}</td>
                      <td className="px-5 py-3.5 text-slate-700 dark:text-[#AAB7B7]">
                        {c.currency} ({c.currencySymbol} / {c.currencyCode})
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-500 dark:text-[#AAB7B7]">{c.phoneCode}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-500 dark:text-[#AAB7B7]">{c.timeZone}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
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
