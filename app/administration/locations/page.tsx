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
    let ignore = false;
    Promise.resolve().then(() => {
      if (!ignore) {
        fetchCountries();
      }
    });
    return () => {
      ignore = true;
    };
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
    "w-full bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-xl px-3 py-2 text-xs text-[#000000] dark:text-[#FFFFFF] placeholder-[#888888] dark:placeholder-[#666666] dark:placeholder-[#A3A3A3] focus:outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]";

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#666666] dark:text-[#A3A3A3] font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <Globe2 className="w-4 h-4" /> Administration &amp; Master Data
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
              Countries &amp; Locations Management
            </h1>
            <p className="text-xs sm:text-sm text-[#666666] dark:text-[#A3A3A3] dark:text-[#A3A3A3] mt-1">
              Multi-country hierarchy: Country → Region / State → City → Project Location
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddCountry(!showAddCountry)}
              className="inline-flex items-center justify-center gap-2 bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all hover:scale-[1.015] active:scale-[0.98] shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Country
            </button>
            <button
              onClick={() => setShowAddLocation(!showAddLocation)}
              className="inline-flex items-center justify-center gap-2 bg-white dark:bg-[#111111] hover:bg-[#E5E5E5] dark:hover:bg-[#2A2A2A] dark:hover:bg-[#1F1F1F] text-[#000000] dark:text-[#FFFFFF] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all hover:scale-[1.015] active:scale-[0.98] shadow-xs"
            >
              <MapPin className="w-4 h-4 text-[#666666] dark:text-[#A3A3A3]" /> New Site Location
            </button>
          </div>
        </div>

        {/* Feedback alerts */}
        {error && (
          <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/10 border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] dark:text-[#000000] dark:text-[#FFFFFF] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] border border-[#111111] dark:border-[#FFFFFF] font-semibold text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMsg}
          </div>
        )}

        {/* Add Country Drawer Form */}
        {showAddCountry && (
          <div className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-5 shadow-lg space-y-4 animate-in fade-in duration-150">
            <h2 className="text-sm font-bold text-[#000000] dark:text-[#FFFFFF] uppercase tracking-wider font-mono">
              Register New Country
            </h2>
            <form onSubmit={handleCreateCountry} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3]">Country Name *</label>
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
                <label className="text-xs font-semibold text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3]">Country Code (2-letter) *</label>
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
                <label className="text-xs font-semibold text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3]">Phone Code *</label>
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
                <label className="text-xs font-semibold text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3]">Currency Name *</label>
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
                <label className="text-xs font-semibold text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3]">Currency Code *</label>
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
                <label className="text-xs font-semibold text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3]">Currency Symbol *</label>
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
                <label className="text-xs font-semibold text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3]">Time Zone *</label>
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
                  className="px-4 py-2.5 bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold rounded-xl shadow-md transition-all"
                >
                  Save Country
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCountry(false)}
                  className="px-4 py-2.5 bg-[#F5F5F5] dark:bg-[#1F1F1F] dark:bg-[#171717] hover:bg-[#E5E5E5] dark:bg-[#303030] dark:hover:bg-[#1F1F1F]/80 text-[#000000] dark:text-[#FFFFFF] text-xs font-semibold rounded-xl border border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add Project Location Wizard */}
        {showAddLocation && (
          <div className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl p-5 shadow-lg space-y-4 animate-in fade-in duration-150">
            <h2 className="text-sm font-bold text-[#000000] dark:text-[#FFFFFF] uppercase tracking-wider font-mono flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#666666] dark:text-[#A3A3A3]" /> Register Project Site Location
            </h2>
            <form onSubmit={handleCreateLocation} className="space-y-4">
              <div className="max-w-md flex flex-col gap-1">
                <label className="text-xs font-semibold text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3]">Location / Site Name *</label>
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
              <div className="p-4 rounded-xl bg-[#FAFAFA] dark:bg-[#171717] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030]">
                <p className="text-xs font-mono uppercase text-[#666666] dark:text-[#A3A3A3] mb-3 font-semibold">
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
                  className="px-4 py-2.5 bg-[#F5F5F5] dark:bg-[#1F1F1F] dark:bg-[#171717] hover:bg-[#E5E5E5] dark:bg-[#303030] dark:hover:bg-[#1F1F1F]/80 text-[#000000] dark:text-[#FFFFFF] text-xs font-semibold rounded-xl border border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold rounded-xl shadow-md transition-all"
                >
                  Save Site Location
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Countries Table */}
        <div className="bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#000000] dark:text-[#FFFFFF]">Active Operating Countries</h2>
            <button
              onClick={fetchCountries}
              className="text-xs font-semibold text-[#666666] dark:text-[#A3A3A3] hover:text-[#666666] dark:text-[#A3A3A3] dark:hover:text-[#FFFFFF] flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAFA] dark:bg-[#171717]/80 dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] uppercase tracking-wider font-mono text-[10px] border-b border-[#D4D4D4] dark:border-[#303030] dark:border-[#303030]">
                <tr>
                  <th className="px-5 py-3">Country</th>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Currency</th>
                  <th className="px-5 py-3">Phone Prefix</th>
                  <th className="px-5 py-3">Time Zone</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4D4D4] dark:divide-[#303030]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-[#888888] dark:text-[#888888]">
                      Loading country records...
                    </td>
                  </tr>
                ) : countries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-[#888888] dark:text-[#888888]">
                      No operating countries registered yet. Click &quot;Add Country&quot; above.
                    </td>
                  </tr>
                ) : (
                  countries.map((c) => (
                    <tr key={c._id} className="hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] dark:hover:bg-[#1F1F1F]/20 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-[#000000] dark:text-[#FFFFFF]">{c.name}</td>
                      <td className="px-5 py-3.5 font-mono text-[#666666] dark:text-[#A3A3A3] font-semibold">{c.countryCode}</td>
                      <td className="px-5 py-3.5 text-[#444444] dark:text-[#D4D4D4] dark:text-[#A3A3A3]">
                        {c.currency} ({c.currencySymbol} / {c.currencyCode})
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[#666666] dark:text-[#A3A3A3]">{c.phoneCode}</td>
                      <td className="px-5 py-3.5 font-mono text-[#666666] dark:text-[#A3A3A3]">{c.timeZone}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] border border-[#111111] dark:border-[#FFFFFF] font-semibold">
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
