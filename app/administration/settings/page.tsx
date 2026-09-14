"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Settings, Save, Globe, DollarSign, Shield,
  Database, Bell, CheckCircle, Sliders
} from "lucide-react";

export default function SystemSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "Apex Construction & Engineering Plc",
    taxRegistrationNumber: "0018942315",
    currencyCode: "ETB",
    currencySymbol: "Br",
    vatRatePct: 15,
    withholdingTaxPct: 2,
    retentionRatePct: 5,
    fiscalYearStart: "July 8 (Hamle 1)",
    defaultLanguage: "English (US) / Amharic",
    twoFactorEnforced: true,
    sessionTimeoutMinutes: 60,
    notificationEmails: "admin@construction-erp.et, finance@construction-erp.et",
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">System Global Settings</h1>
            <p className="text-gray-400 text-sm mt-1">
              Company legal entity data, Ethiopian Birr financial parameters, tax rates, and security enforcement
            </p>
          </div>
          {saved && (
            <span className="flex items-center gap-1.5 text-green-400 text-xs bg-green-500/20 border border-green-500/30 px-3 py-1.5 rounded-lg">
              <CheckCircle size={14} /> Settings Saved
            </span>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Company Profile */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-gray-700 pb-2">
              <Globe size={16} className="text-blue-400" />
              Corporate Identity & Legal Entity
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">Company Legal Name</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-gray-400 block mb-1">TIN / Tax Registration Number</label>
                <input
                  type="text"
                  value={formData.taxRegistrationNumber}
                  onChange={(e) => setFormData({ ...formData, taxRegistrationNumber: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Financial & Tax Parameters */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-gray-700 pb-2">
              <DollarSign size={16} className="text-green-400" />
              Ethiopian Financial & Fiscal Parameters
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">Base Currency</label>
                <input
                  type="text"
                  value={`${formData.currencyCode} (${formData.currencySymbol})`}
                  disabled
                  className="w-full bg-gray-900/50 border border-gray-700/60 rounded-lg px-3 py-2 text-gray-300 font-bold"
                />
              </div>
              <div>
                <label className="text-gray-400 block mb-1">VAT Rate (%)</label>
                <input
                  type="number"
                  value={formData.vatRatePct}
                  onChange={(e) => setFormData({ ...formData, vatRatePct: Number(e.target.value) })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Withholding Tax Rate (%)</label>
                <input
                  type="number"
                  value={formData.withholdingTaxPct}
                  onChange={(e) => setFormData({ ...formData, withholdingTaxPct: Number(e.target.value) })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Default Retention Hold (%)</label>
                <input
                  type="number"
                  value={formData.retentionRatePct}
                  onChange={(e) => setFormData({ ...formData, retentionRatePct: Number(e.target.value) })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Fiscal Calendar</label>
                <input
                  type="text"
                  value={formData.fiscalYearStart}
                  onChange={(e) => setFormData({ ...formData, fiscalYearStart: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Security & Access */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-gray-700 pb-2">
              <Shield size={16} className="text-purple-400" />
              Security Policies & Session Timeout
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="twoFactor"
                  checked={formData.twoFactorEnforced}
                  onChange={(e) => setFormData({ ...formData, twoFactorEnforced: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 bg-gray-900 border-gray-700 focus:ring-blue-500"
                />
                <label htmlFor="twoFactor" className="text-gray-300">
                  Enforce Two-Factor Authentication (2FA) for Managers & Admins
                </label>
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Session Inactivity Timeout (Minutes)</label>
                <input
                  type="number"
                  value={formData.sessionTimeoutMinutes}
                  onChange={(e) => setFormData({ ...formData, sessionTimeoutMinutes: Number(e.target.value) })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-blue-600/30"
            >
              <Save size={16} />
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

