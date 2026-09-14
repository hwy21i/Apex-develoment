"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus,
  Clock, MapPin, CheckCircle, AlertTriangle, Users, HardHat
} from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  project: string;
  date: string;
  time: string;
  type: "Pour" | "Inspection" | "Delivery" | "Milestone" | "Meeting";
  location: string;
  participants: string;
}

const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: "e1",
    title: "12th Floor Slab Concrete Pour (450m³)",
    project: "Addis Heights Tower",
    date: "2024-02-12",
    time: "06:00 AM - 04:00 PM",
    type: "Pour",
    location: "Level 12 Deck",
    participants: "Structural Team & Ready-Mix Fleet",
  },
  {
    id: "e2",
    title: "Municipal Structural Authority Inspection",
    project: "Addis Heights Tower",
    date: "2024-02-11",
    time: "10:00 AM - 12:00 PM",
    type: "Inspection",
    location: "Site Office & Deck",
    participants: "Lead Engineer & City Inspector",
  },
  {
    id: "e3",
    title: "High-Tensile Rebar Delivery (30 Tons)",
    project: "Bole Business Park",
    date: "2024-02-14",
    time: "08:30 AM",
    type: "Delivery",
    location: "Main Gate Laydown Yard",
    participants: "Logistics Team & Tekle Steel",
  },
  {
    id: "e4",
    title: "Client Monthly Progress & IPC-03 Review",
    project: "Ring Road Expansion",
    date: "2024-02-15",
    time: "02:00 PM - 04:00 PM",
    type: "Meeting",
    location: "ERA Headquarters Boardroom",
    participants: "Project Director, ERA Consultant",
  },
  {
    id: "e5",
    title: "Subgrade Compaction Density Testing",
    project: "Ring Road Expansion",
    date: "2024-02-16",
    time: "09:00 AM",
    type: "Inspection",
    location: "Km 8+400 Station",
    participants: "Materials Laboratory Technician",
  },
];

const TYPE_COLORS: Record<string, string> = {
  Pour: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  Inspection: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  Delivery: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  Meeting: "bg-green-500/20 text-green-400 border border-green-500/30",
  Milestone: "bg-red-500/20 text-red-400 border border-red-500/30",
};

export default function ProjectCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>(MOCK_EVENTS);
  const [typeFilter, setTypeFilter] = useState("All");

  const filtered = events.filter((e) => typeFilter === "All" || e.type === typeFilter);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Site Operations Calendar</h1>
            <p className="text-gray-400 text-sm mt-1">
              Concrete pours, consultant inspections, bulk deliveries, client meetings, and critical dates
            </p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} />
            Schedule Site Activity
          </button>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2">
          {["All", "Pour", "Inspection", "Delivery", "Meeting"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === t
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white border border-gray-700"
              }`}
            >
              {t === "All" ? "All Operations" : `${t}s`}
            </button>
          ))}
        </div>

        {/* Timeline schedule list */}
        <div className="space-y-4">
          {filtered.map((event) => (
            <div
              key={event.id}
              className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${TYPE_COLORS[event.type]}`}>
                    {event.type}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">{event.project}</span>
                </div>
                <h3 className="text-base font-bold text-white">{event.title}</h3>
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock size={13} className="text-gray-500" /> {event.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-gray-500" /> {event.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={13} className="text-gray-500" /> {event.participants}
                  </span>
                </div>
              </div>

              <div className="bg-gray-900/60 border border-gray-700/60 rounded-xl px-4 py-3 text-center min-w-[120px]">
                <p className="text-[11px] uppercase tracking-wider text-blue-400 font-bold">
                  {new Date(event.date).toLocaleDateString("en-ET", { month: "short" })}
                </p>
                <p className="text-2xl font-black text-white">
                  {new Date(event.date).getDate()}
                </p>
                <p className="text-[11px] text-gray-400">
                  {new Date(event.date).toLocaleDateString("en-ET", { weekday: "short" })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

