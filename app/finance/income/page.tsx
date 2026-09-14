"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  TrendingUp, Search, DollarSign, BarChart3, PieChart,
  ArrowUpRight, Building2, Layers, CheckCircle
} from "lucide-react";

interface IncomeStream {
  _id: string;
  projectName: string;
  contractValue: number;
  variationOrders: number;
  totalContractRevenue: number;
  billedRevenue: number;
  recognizedRevenue: number; // Percentage of Completion (PoC)
  costIncurred: number;
  grossMargin: number;
  marginPct: number;
}

const MOCK_INCOME: IncomeStream[] = [
  {
    _id: "inc1",
    projectName: "Addis Heights Tower",
    contractValue: 48000000,
    variationOrders: 3200000,
    totalContractRevenue: 51200000,
    billedRevenue: 23205000,
    recognizedRevenue: 24576000, // 48% progress
    costIncurred: 18450000,
    grossMargin: 6126000,
    marginPct: 24.9,
  },
  {
    _id: "inc2",
    projectName: "Ring Road Expansion",
    contractValue: 36000000,
    variationOrders: 1800000,
    totalContractRevenue: 37800000,
    billedRevenue: 15470000,
    recognizedRevenue: 16254000, // 43% progress
    costIncurred: 13100000,
    grossMargin: 3154000,
    marginPct: 19.4,
  },
  {
    _id: "inc3",
    projectName: "Bole Business Park",
    contractValue: 28500000,
    variationOrders: 0,
    totalContractRevenue: 28500000,
    billedRevenue: 7310000,
    recognizedRevenue: 7980000, // 28% progress
    costIncurred: 6200000,
    grossMargin: 1780000,
    marginPct: 22.3,
  },
];

export default function FinanceIncomePage() {
  const [incomes, setIncomes] = useState<IncomeStream[]>(MOCK_INCOME);
  const [search, setSearch] = useState("");

  const filtered = incomes.filter((i) =>
    i.projectName.toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (n: number) =>
    `ETB ${n.toLocaleString("en-ET", { minimumFractionDigits: 2 })}`;

  const totalContract = incomes.reduce((s, i) => s + i.totalContractRevenue, 0);
  const totalRecognized = incomes.reduce((s, i) => s + i.recognizedRevenue, 0);
  const totalCosts = incomes.reduce((s, i) => s + i.costIncurred, 0);
  const totalGrossProfit = totalRecognized - totalCosts;
  const overallMargin = ((totalGrossProfit / totalRecognized) * 100).toFixed(1);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Revenue & Project Profitability</h1>
            <p className="text-gray-400 text-sm mt-1">
              Percentage of Completion (PoC) revenue recognition, contract values, and gross margin analysis
            </p>
          </div>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Total Contract Bookings</p>
            <p className="text-xl font-bold text-white mt-1">{fmt(totalContract)}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Recognized Revenue (PoC)</p>
            <p className="text-xl font-bold text-blue-400 mt-1">{fmt(totalRecognized)}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Recognized Gross Profit</p>
            <p className="text-xl font-bold text-green-400 mt-1">{fmt(totalGrossProfit)}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <p className="text-xs text-gray-400">Portfolio Blended Margin</p>
            <p className="text-xl font-bold text-purple-400 mt-1">{overallMargin}%</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search project profitability..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Income table */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/50 border-b border-gray-700">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Project</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Contract Value</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Variations</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">PoC Recognized</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Cost Incurred</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Gross Margin</th>
                  <th className="text-right text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.map((i) => (
                  <tr key={i._id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{i.projectName}</td>
                    <td className="px-4 py-3 text-right text-gray-300">{fmt(i.contractValue)}</td>
                    <td className="px-4 py-3 text-right text-blue-400 font-medium">+{fmt(i.variationOrders)}</td>
                    <td className="px-4 py-3 text-right font-bold text-white">{fmt(i.recognizedRevenue)}</td>
                    <td className="px-4 py-3 text-right text-gray-400">{fmt(i.costIncurred)}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-400">{fmt(i.grossMargin)}</td>
                    <td className="px-4 py-3 text-right font-bold text-purple-400">{i.marginPct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

