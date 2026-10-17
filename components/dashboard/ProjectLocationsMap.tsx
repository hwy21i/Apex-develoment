"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MapPin, ArrowUpRight, ExternalLink, Layers } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Map as LeafletMap, TileLayer as LeafletTileLayer, Marker as LeafletMarker } from "leaflet";
import "leaflet/dist/leaflet.css";

export interface ProjectLocationItem {
  id: string;
  name: string;
  projectCode: string;
  city: string;
  region: string;
  lat: number;
  lng: number;
  count: number;
  progress: number;
  status: string;
  sites: string;
}

const DEFAULT_LOCATIONS: ProjectLocationItem[] = [
  {
    id: "loc-addis",
    name: "Addis Heights Tower",
    projectCode: "PRJ-ADD-01",
    city: "Addis Ababa",
    region: "Central Hub",
    lat: 9.032,
    lng: 38.7469,
    count: 2,
    progress: 74,
    status: "Active",
    sites: "Addis Heights & Bole Commercial Center",
  },
  {
    id: "loc-modjo",
    name: "Modjo Logistics Hub",
    projectCode: "PRJ-MDJ-02",
    city: "Modjo Hub",
    region: "Oromia Logistics Corridor",
    lat: 8.5911,
    lng: 39.1234,
    count: 1,
    progress: 42,
    status: "Active",
    sites: "Modjo Dry Port Multi-Modal",
  },
  {
    id: "loc-hawassa",
    name: "Hawassa Industrial Extension",
    projectCode: "PRJ-HAW-03",
    city: "Hawassa",
    region: "Sidama Special Economic Zone",
    lat: 7.0504,
    lng: 38.4955,
    count: 1,
    progress: 84,
    status: "Phase 3 Handover",
    sites: "Hawassa Eco-Industrial Park",
  },
  {
    id: "loc-diredawa",
    name: "Dire Dawa Corridor Depot",
    projectCode: "PRJ-DIR-04",
    city: "Dire Dawa",
    region: "Eastern Trade Free Zone",
    lat: 9.5931,
    lng: 41.8661,
    count: 1,
    progress: 29,
    status: "Groundwork",
    sites: "Eastern Corridor Depot",
  },
];

interface ProjectLocationsMapProps {
  locations?: ProjectLocationItem[];
  className?: string;
}

export default function ProjectLocationsMap({
  locations = DEFAULT_LOCATIONS,
  className = "",
}: ProjectLocationsMapProps) {
  const { resolvedTheme } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const tileLayerRef = useRef<LeafletTileLayer | null>(null);
  const markersRef = useRef<LeafletMarker[]>([]);

  const [selectedLoc, setSelectedLoc] = useState<ProjectLocationItem>(locations[0]);
  const [mapError, setMapError] = useState(false);

  // Initialize and update Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let isCancelled = false;

    async function initLeaflet() {
      try {
        const L = (await import("leaflet")).default;

        if (isCancelled) return;

        // Create map if not yet instantiated
        if (!mapInstanceRef.current && mapContainerRef.current) {
          const map = L.map(mapContainerRef.current, {
            center: [8.8, 39.5],
            zoom: 6,
            zoomControl: false,
            attributionControl: false,
            scrollWheelZoom: false,
          });

          // Add compact zoom control in top right
          L.control.zoom({ position: "topright" }).addTo(map);

          mapInstanceRef.current = map;
        }

        const map = mapInstanceRef.current;
        if (!map) return;

        // Switch monochrome tile layer according to current theme
        if (tileLayerRef.current) {
          map.removeLayer(tileLayerRef.current);
        }

        const isDark = resolvedTheme === "dark";
        const tileUrl = isDark
          ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

        const newTileLayer = L.tileLayer(tileUrl, {
          subdomains: "abcd",
          maxZoom: 18,
          detectRetina: true,
        }).addTo(map);

        tileLayerRef.current = newTileLayer;

        // Clear existing markers
        markersRef.current.forEach((m) => map.removeLayer(m));
        markersRef.current = [];

        // Plot project locations
        locations.forEach((loc) => {
          const isSelected = selectedLoc?.id === loc.id;

          const markerHtml = `
            <div style="cursor: pointer;" class="group relative flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2">
              <div style="
                width: ${isSelected ? "32px" : "26px"};
                height: ${isSelected ? "32px" : "26px"};
                background-color: ${isDark ? (isSelected ? "#FFFFFF" : "#1F1F1F") : (isSelected ? "#111111" : "#FFFFFF")};
                color: ${isDark ? (isSelected ? "#111111" : "#FFFFFF") : (isSelected ? "#FFFFFF" : "#111111")};
                border: 2px solid ${isDark ? "#FFFFFF" : "#111111"};
                border-radius: 9999px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 800;
                font-size: 11px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                transition: all 0.2s ease;
              ">
                ${loc.count}
              </div>
              <span style="
                position: absolute;
                top: -2px;
                right: -2px;
                width: 8px;
                height: 8px;
                border-radius: 9999px;
                background-color: #10B981;
                border: 1.5px solid ${isDark ? "#111111" : "#FFFFFF"};
              "></span>
            </div>
          `;

          const customIcon = L.divIcon({
            html: markerHtml,
            className: "custom-map-marker",
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          const marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(map);

          marker.on("click", () => {
            setSelectedLoc(loc);
            map.panTo([loc.lat, loc.lng], { animate: true });
          });

          markersRef.current.push(marker);
        });
      } catch (err) {
        console.warn("Leaflet map initialization notice:", err);
        setMapError(true);
      }
    }

    initLeaflet();

    return () => {
      isCancelled = true;
    };
  }, [resolvedTheme, locations, selectedLoc]);

  return (
    <div className={`border border-[#E5E7EB] dark:border-[#2A2A2A] bg-[#FFFFFF] dark:bg-[#1F1F1F] text-[#111827] dark:text-[#FFFFFF] rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xs ${className}`}>
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB] dark:border-[#2A2A2A]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#F3F4F6] dark:bg-[#141414] border border-[#E5E7EB] dark:border-[#2A2A2A] text-[#111827] dark:text-[#FFFFFF]">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111827] dark:text-[#FFFFFF]">
                Project Locations Map
              </h2>
              <p className="text-xs text-[#6B7280] dark:text-[#A1A1A1]">
                Geographic deployment across regional construction corridors
              </p>
            </div>
          </div>
          <Link
            href="/administration/locations"
            className="p-1.5 rounded-lg text-[#6B7280] dark:text-[#A1A1A1] hover:text-[#111827] dark:hover:text-[#FFFFFF] hover:bg-[#F3F4F6] dark:hover:bg-[#252525] transition-colors"
            title="Manage all locations"
          >
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Real Geographic Map Surface */}
        <div className="mt-4 relative rounded-xl overflow-hidden border border-[#E5E7EB] dark:border-[#2A2A2A] h-52 sm:h-64 bg-[#F3F4F6] dark:bg-[#141414]">
          {mapError ? (
            /* Resilient SVG Map Fallback if tile server is unavailable */
            <div className="w-full h-full relative flex items-center justify-center p-4">
              <svg viewBox="0 0 600 360" className="w-full h-full opacity-60">
                {/* Ethiopia regional geographic outline polygon */}
                <path
                  d="M 120,80 L 220,50 L 320,60 L 420,90 L 510,130 L 540,190 L 460,260 L 340,320 L 240,300 L 170,260 L 110,210 L 90,140 Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  className="text-[#9CA3AF] dark:text-[#383838]"
                />
                {/* Plotted regional nodes */}
                {locations.map((loc, i) => (
                  <g key={loc.id} onClick={() => setSelectedLoc(loc)} className="cursor-pointer">
                    <circle
                      cx={180 + i * 85}
                      cy={110 + (i % 2) * 60 + i * 15}
                      r="14"
                      className={`${
                        selectedLoc?.id === loc.id
                          ? "fill-[#111111] dark:fill-[#FFFFFF] stroke-[#FFFFFF] dark:stroke-[#111111]"
                          : "fill-[#F3F4F6] dark:fill-[#1F1F1F] stroke-[#111111] dark:stroke-[#FFFFFF]"
                      }`}
                      strokeWidth="2"
                    />
                    <text
                      x={180 + i * 85}
                      y={114 + (i % 2) * 60 + i * 15}
                      textAnchor="middle"
                      className={`text-[10px] font-bold ${
                        selectedLoc?.id === loc.id
                          ? "fill-[#FFFFFF] dark:fill-[#111111]"
                          : "fill-[#111111] dark:fill-[#FFFFFF]"
                      }`}
                    >
                      {loc.count}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          ) : (
            <div ref={mapContainerRef} className="w-full h-full z-0" />
          )}

          {/* Active Location Floating Inspector Badge */}
          {selectedLoc && (
            <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-xs z-10 p-3 rounded-xl bg-[#FFFFFF]/95 dark:bg-[#1F1F1F]/95 backdrop-blur-md border border-[#E5E7EB] dark:border-[#2A2A2A] shadow-lg animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                    <h4 className="text-xs font-bold text-[#111827] dark:text-[#FFFFFF]">
                      {selectedLoc.city}
                    </h4>
                  </div>
                  <p className="text-[10px] font-mono text-[#6B7280] dark:text-[#A1A1A1] mt-0.5">
                    {selectedLoc.region}
                  </p>
                </div>
                <StatusBadge value={selectedLoc.status} />
              </div>

              <div className="mt-2 text-[11px] text-[#4B5563] dark:text-[#A1A1A1] truncate">
                {selectedLoc.sites}
              </div>

              <div className="mt-2 pt-2 border-t border-[#E5E7EB] dark:border-[#2A2A2A] flex items-center justify-between text-[11px]">
                <span className="text-[#6B7280] dark:text-[#A1A1A1] font-mono">
                  {selectedLoc.progress}% Progress
                </span>
                <Link
                  href="/projects"
                  className="font-bold text-[#111827] dark:text-[#FFFFFF] hover:underline flex items-center gap-0.5"
                >
                  <span>View Sites</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Location List / Breakdown Cards */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {locations.map((loc) => {
            const isSelected = selectedLoc?.id === loc.id;
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => {
                  setSelectedLoc(loc);
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.panTo([loc.lat, loc.lng], { animate: true });
                  }
                }}
                className={`p-3 rounded-xl text-left border transition-all ${
                  isSelected
                    ? "bg-[#F3F4F6] dark:bg-[#141414] border-[#111111] dark:border-[#FFFFFF] shadow-2xs"
                    : "bg-[#FFFFFF] dark:bg-[#141414] border-[#E5E7EB] dark:border-[#2A2A2A] hover:border-[#9CA3AF] dark:hover:border-[#777777]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#111827] dark:text-[#FFFFFF]">
                    {loc.city}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FFFFFF] dark:bg-[#1F1F1F] border border-[#E5E7EB] dark:border-[#2A2A2A] text-[#111827] dark:text-[#FFFFFF]">
                    {loc.count} active
                  </span>
                </div>
                <p className="text-[10px] text-[#6B7280] dark:text-[#A1A1A1] font-mono truncate">
                  {loc.region}
                </p>
                <div className="mt-2">
                  <ProgressBar value={loc.progress} className="h-1" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Card Footer */}
      <div className="mt-4 pt-3 border-t border-[#E5E7EB] dark:border-[#2A2A2A] flex items-center justify-between text-xs text-[#6B7280] dark:text-[#A1A1A1]">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" />
          <span>{locations.length} Strategic Construction Hubs</span>
        </div>
        <Link
          href="/administration/locations"
          className="font-semibold text-[#111827] dark:text-[#FFFFFF] hover:underline"
        >
          Manage Map Data →
        </Link>
      </div>
    </div>
  );
}

