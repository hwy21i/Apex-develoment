"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Megaphone, Plus, Search, Calendar, Tag, User,
  CheckCircle, AlertCircle, Pin, ShieldCheck
} from "lucide-react";

interface Announcement {
  _id: string;
  title: string;
  category: "Company Wide" | "HSE Safety Alert" | "Procurement Notice" | "HR Directive";
  author: string;
  publishDate: string;
  isPinned: boolean;
  priority: "High" | "Normal" | "Urgent";
  content: string;
}

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    _id: "anc1",
    title: "Mandatory Safety Stand-Down: High Elevation Fall Protection Protocol",
    category: "HSE Safety Alert",
    author: "Dr. Aster Kebede (HSE Superintendent)",
    publishDate: "2024-02-05",
    isPinned: true,
    priority: "Urgent",
    content: "All site teams at Addis Heights Tower must halt overhead deck casting until 100% inspection of perimeter safety netting, toe-boards, and static lifeline anchorage points is completed and signed off by the site HSE officer.",
  },
  {
    _id: "anc2",
    title: "Updated Ethiopian Birr Vendor Withholding Tax Certificate Submission Guidelines",
    category: "Procurement Notice",
    author: "Henok Tadesse (Finance Director)",
    publishDate: "2024-02-01",
    isPinned: false,
    priority: "High",
    content: "In compliance with Ministry of Revenues circular, all purchase order payments exceeding ETB 50,000 are subject to 2% withholding at source. Vendors must submit their official TIN receipts prior to final balance disbursement.",
  },
  {
    _id: "anc3",
    title: "Annual Labor Day & Public Holiday Operational Roster Guidelines",
    category: "HR Directive",
    author: "Human Resources Directorate",
    publishDate: "2024-01-25",
    isPinned: false,
    priority: "Normal",
    content: "Critical concrete pours and continuous road excavation work over the upcoming holiday weekend will be compensated at 2.0x overtime rate. Site engineers must submit shift rosters by Thursday 17:00.",
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Company Wide": "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  "HSE Safety Alert": "bg-red-500/20 text-red-400 border border-red-500/30",
  "Procurement Notice": "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  "HR Directive": "bg-green-500/20 text-green-400 border border-green-500/30",
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
  const [search, setSearch] = useState("");

  const filtered = announcements.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Company Announcements & Bulletins</h1>
            <p className="text-gray-400 text-sm mt-1">
              Executive directives, HSE safety stand-downs, commercial memos, and holiday rosters
            </p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} />
            Post Announcement
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search announcements and safety notices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Announcements list */}
        <div className="space-y-4">
          {filtered.map((a) => (
            <div
              key={a._id}
              className={`bg-gray-800 border rounded-xl p-5 hover:border-gray-600 transition-colors ${
                a.isPinned ? "border-yellow-500/50" : "border-gray-700"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {a.isPinned && (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-bold border border-yellow-500/30">
                        <Pin size={12} /> Pinned
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${CATEGORY_COLORS[a.category]}`}>
                      {a.category}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(a.publishDate).toLocaleDateString("en-ET")}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">{a.title}</h3>
                  <p className="text-sm text-gray-300 leading-relaxed max-w-4xl">{a.content}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-700/60 flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <User size={13} className="text-gray-500" /> {a.author}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

