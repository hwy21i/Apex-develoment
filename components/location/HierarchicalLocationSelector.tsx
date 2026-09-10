"use client";

import React, { useEffect, useState, useId } from "react";

export interface HierarchicalLocationValue {
  countryId: string;
  countryName?: string;
  regionId: string;
  regionName?: string;
  cityId: string;
  cityName?: string;
  district?: string;
  address?: string;
}

interface LocationSelectorProps {
  value: HierarchicalLocationValue;
  onChange: (val: HierarchicalLocationValue) => void;
  required?: boolean;
  disabled?: boolean;
}

interface CountryOption {
  _id: string;
  name: string;
  countryCode: string;
  currencyCode: string;
}

interface RegionOption {
  _id: string;
  name: string;
  regionCode?: string;
}

interface CityOption {
  _id: string;
  name: string;
  cityCode?: string;
}

export default function HierarchicalLocationSelector({
  value,
  onChange,
  required = false,
  disabled = false,
}: LocationSelectorProps) {
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [regions, setRegions] = useState<RegionOption[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);

  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const countrySelectId = useId();
  const regionSelectId = useId();
  const citySelectId = useId();
  const districtInputId = useId();
  const addressInputId = useId();

  // Load countries on mount
  useEffect(() => {
    let mounted = true;
    async function fetchCountries() {
      setLoadingCountries(true);
      try {
        const res = await fetch("/api/countries");
        const json = await res.json();
        if (json.success && mounted) {
          setCountries(json.data.items || []);
        }
      } catch (err) {
        console.error("Failed to load countries:", err);
      } finally {
        if (mounted) setLoadingCountries(false);
      }
    }
    fetchCountries();
    return () => {
      mounted = false;
    };
  }, []);

  // Load regions when countryId changes
  useEffect(() => {
    if (!value.countryId) {
      setRegions([]);
      setCities([]);
      return;
    }

    let mounted = true;
    async function fetchRegions() {
      setLoadingRegions(true);
      try {
        const res = await fetch(`/api/regions?countryId=${value.countryId}`);
        const json = await res.json();
        if (json.success && mounted) {
          setRegions(json.data.items || []);
        }
      } catch (err) {
        console.error("Failed to load regions:", err);
      } finally {
        if (mounted) setLoadingRegions(false);
      }
    }
    fetchRegions();
    return () => {
      mounted = false;
    };
  }, [value.countryId]);

  // Load cities when regionId changes
  useEffect(() => {
    if (!value.regionId) {
      setCities([]);
      return;
    }

    let mounted = true;
    async function fetchCities() {
      setLoadingCities(true);
      try {
        const res = await fetch(`/api/cities?regionId=${value.regionId}`);
        const json = await res.json();
        if (json.success && mounted) {
          setCities(json.data.items || []);
        }
      } catch (err) {
        console.error("Failed to load cities:", err);
      } finally {
        if (mounted) setLoadingCities(false);
      }
    }
    fetchCities();
    return () => {
      mounted = false;
    };
  }, [value.regionId]);

  const handleCountryChange = (cId: string) => {
    const selected = countries.find((c) => c._id === cId);
    onChange({
      ...value,
      countryId: cId,
      countryName: selected?.name || "",
      regionId: "",
      regionName: "",
      cityId: "",
      cityName: "",
    });
  };

  const handleRegionChange = (rId: string) => {
    const selected = regions.find((r) => r._id === rId);
    onChange({
      ...value,
      regionId: rId,
      regionName: selected?.name || "",
      cityId: "",
      cityName: "",
    });
  };

  const handleCityChange = (ctId: string) => {
    const selected = cities.find((c) => c._id === ctId);
    onChange({
      ...value,
      cityId: ctId,
      cityName: selected?.name || "",
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Country Selector */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={countrySelectId} className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Country {required && <span className="text-red-400">*</span>}
        </label>
        <select
          id={countrySelectId}
          value={value.countryId || ""}
          onChange={(e) => handleCountryChange(e.target.value)}
          disabled={disabled || loadingCountries}
          required={required}
          className="bg-[#1B1E24] border border-[#3F434C] text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 disabled:opacity-50"
        >
          <option value="">
            {loadingCountries ? "Loading countries..." : "Select Country"}
          </option>
          {countries.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name} ({c.countryCode})
            </option>
          ))}
        </select>
      </div>

      {/* 2. Region Selector */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={regionSelectId} className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Region / State {required && <span className="text-red-400">*</span>}
        </label>
        <select
          id={regionSelectId}
          value={value.regionId || ""}
          onChange={(e) => handleRegionChange(e.target.value)}
          disabled={disabled || !value.countryId || loadingRegions}
          required={required}
          className="bg-[#1B1E24] border border-[#3F434C] text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 disabled:opacity-50"
        >
          <option value="">
            {!value.countryId
              ? "Select country first"
              : loadingRegions
              ? "Loading regions..."
              : "Select Region"}
          </option>
          {regions.map((r) => (
            <option key={r._id} value={r._id}>
              {r.name} {r.regionCode ? `(${r.regionCode})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* 3. City Selector */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={citySelectId} className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          City {required && <span className="text-red-400">*</span>}
        </label>
        <select
          id={citySelectId}
          value={value.cityId || ""}
          onChange={(e) => handleCityChange(e.target.value)}
          disabled={disabled || !value.regionId || loadingCities}
          required={required}
          className="bg-[#1B1E24] border border-[#3F434C] text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 disabled:opacity-50"
        >
          <option value="">
            {!value.regionId
              ? "Select region first"
              : loadingCities
              ? "Loading cities..."
              : "Select City"}
          </option>
          {cities.map((ct) => (
            <option key={ct._id} value={ct._id}>
              {ct.name} {ct.cityCode ? `(${ct.cityCode})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* 4. District / Zone */}
      <div className="flex flex-col gap-1.5 md:col-span-1">
        <label htmlFor={districtInputId} className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          District / Sub-City / Zone
        </label>
        <input
          id={districtInputId}
          type="text"
          value={value.district || ""}
          onChange={(e) => onChange({ ...value, district: e.target.value })}
          placeholder="e.g. Bole Sub-city / Woreda 03"
          disabled={disabled}
          className="bg-[#1B1E24] border border-[#3F434C] text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 disabled:opacity-50"
        />
      </div>

      {/* 5. Address */}
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <label htmlFor={addressInputId} className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Site Address {required && <span className="text-red-400">*</span>}
        </label>
        <input
          id={addressInputId}
          type="text"
          value={value.address || ""}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
          placeholder="e.g. Africa Avenue, Olympia Roundabout, Site Plot #4"
          disabled={disabled}
          required={required}
          className="bg-[#1B1E24] border border-[#3F434C] text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 disabled:opacity-50"
        />
      </div>
    </div>
  );
}

