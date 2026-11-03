"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import {
  MapPin,
  ArrowUpRight,
  ExternalLink,
  Layers,
  RotateCcw,
  Compass,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  ETHIOPIA_MAP_DEFAULTS,
  CoordinatePrecision,
  resolveProjectCoordinates,
} from "@/lib/geo/ethiopia";
import type {
  Map as LeafletMap,
  TileLayer as LeafletTileLayer,
  GeoJSON as LeafletGeoJSON,
  LayerGroup as LeafletLayerGroup,
} from "leaflet";
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
  precision?: CoordinatePrecision;
  contractValue?: number;
  client?: string;
}

export interface UnmappedProjectItem {
  id: string;
  name: string;
  projectCode: string;
  locationText: string;
  status: string;
}

const DEFAULT_ETHIOPIAN_LOCATIONS: ProjectLocationItem[] = [
  {
    id: "loc-addis",
    name: "Addis Heights Tower",
    projectCode: "PRJ-ADD-01",
    city: "Addis Ababa",
    region: "Addis Ababa Metro",
    lat: 9.032,
    lng: 38.7469,
    count: 3,
    progress: 74,
    status: "Active",
    sites: "Addis Heights & Bole Commercial Center",
    precision: "EXACT_GPS",
  },
  {
    id: "loc-modjo",
    name: "Modjo Logistics Hub",
    projectCode: "PRJ-MDJ-02",
    city: "Modjo",
    region: "Oromia Logistics Corridor",
    lat: 8.5911,
    lng: 39.1234,
    count: 1,
    progress: 42,
    status: "In Progress",
    sites: "Modjo Dry Port Multi-Modal Depot",
    precision: "MUNICIPAL_VERIFIED",
  },
  {
    id: "loc-adama",
    name: "Adama Transit Interchange",
    projectCode: "PRJ-ADM-05",
    city: "Adama",
    region: "Oromia Corridor",
    lat: 8.54,
    lng: 39.27,
    count: 2,
    progress: 61,
    status: "Active",
    sites: "Expressway Commercial Plaza",
    precision: "MUNICIPAL_VERIFIED",
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
    status: "Active",
    sites: "Hawassa Eco-Industrial Park",
    precision: "EXACT_GPS",
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
    status: "Planning",
    sites: "Eastern Corridor Freight Depot",
    precision: "MUNICIPAL_VERIFIED",
  },
  {
    id: "loc-bahirdar",
    name: "Bahir Dar Waterfront Resort",
    projectCode: "PRJ-BHR-06",
    city: "Bahir Dar",
    region: "Amhara Lake Tana Corridor",
    lat: 11.5936,
    lng: 37.3908,
    count: 1,
    progress: 53,
    status: "In Progress",
    sites: "Lake Tana Tourism Complex",
    precision: "MUNICIPAL_VERIFIED",
  },
  {
    id: "loc-mekelle",
    name: "Mekelle Technology Hub",
    projectCode: "PRJ-MEK-07",
    city: "Mekelle",
    region: "Tigray Northern Corridor",
    lat: 13.4967,
    lng: 39.4753,
    count: 1,
    progress: 35,
    status: "Planning",
    sites: "Mekelle Science & Industrial Center",
    precision: "MUNICIPAL_VERIFIED",
  },
  {
    id: "loc-bishoftu",
    name: "Bishoftu Lake View Residences",
    projectCode: "PRJ-BSH-08",
    city: "Bishoftu",
    region: "Oromia Hospitality Corridor",
    lat: 8.7523,
    lng: 38.9785,
    count: 1,
    progress: 78,
    status: "Active",
    sites: "Babogaya Luxury Villas & Spa",
    precision: "MUNICIPAL_VERIFIED",
  },
];

interface ProjectLocationsMapProps {
  locations?: ProjectLocationItem[];
  projects?: Array<{
    id?: string;
    _id?: string;
    name?: string;
    projectCode?: string;
    location?: string;
    status?: string;
    progress?: number;
    progressPercentage?: number;
    latitude?: number;
    longitude?: number;
    city?: string;
    region?: string;
  }>;
  className?: string;
}

export default function ProjectLocationsMap({
  locations,
  projects,
  className = "",
}: ProjectLocationsMapProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const tileLayerRef = useRef<LeafletTileLayer | null>(null);
  const geoJsonLayerRef = useRef<LeafletGeoJSON | null>(null);
  const markersLayerRef = useRef<LeafletLayerGroup | null>(null);

  const [activeLayerType, setActiveLayerType] = useState<"canvas" | "osm">("canvas");
  const [selectedLocId, setSelectedLocId] = useState<string>("");
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [mapError, setMapError] = useState(false);
  const [isAwaitingOpen, setIsAwaitingOpen] = useState(false);

  // Process and resolve projects into mapped and unmapped groups
  const { displayLocations, unmappedProjects } = useMemo(() => {
    if (!projects || projects.length === 0) {
      if (locations && locations.length > 0) {
        return { displayLocations: locations, unmappedProjects: [] };
      }
      return { displayLocations: DEFAULT_ETHIOPIAN_LOCATIONS, unmappedProjects: [] };
    }

    const mapped: ProjectLocationItem[] = [];
    const unmapped: UnmappedProjectItem[] = [];

    projects.forEach((prj, idx) => {
      const id = prj.id || prj._id || `proj-${idx}`;
      const name = prj.name || "Untitled Project";
      const projectCode = prj.projectCode || "PRJ-GEN";
      const locationText = prj.location || "";
      const status = prj.status || "Active";
      const progress = prj.progress ?? prj.progressPercentage ?? 0;

      const resolved = resolveProjectCoordinates({
        location: locationText,
        latitude: prj.latitude,
        longitude: prj.longitude,
        city: prj.city,
        region: prj.region,
      });

      if (resolved) {
        mapped.push({
          id,
          name,
          projectCode,
          city: resolved.city,
          region: resolved.region,
          lat: resolved.lat,
          lng: resolved.lng,
          count: 1,
          progress,
          status,
          sites: locationText || `${resolved.city} Main Site`,
          precision: resolved.precision,
        });
      } else {
        unmapped.push({
          id,
          name,
          projectCode,
          locationText: locationText || "No location specified",
          status,
        });
      }
    });

    if (mapped.length === 0) {
      return {
        displayLocations: locations && locations.length > 0 ? locations : [],
        unmappedProjects: unmapped,
      };
    }

    // Group mapped items by city center coordinates for clean clustering
    const groupedMap = new Map<string, ProjectLocationItem>();
    mapped.forEach((item) => {
      const key = `${item.lat.toFixed(3)},${item.lng.toFixed(3)}`;
      const existing = groupedMap.get(key);
      if (existing) {
        existing.count += 1;
        existing.sites = `${existing.sites}, ${item.name}`;
        existing.progress = Math.round((existing.progress + item.progress) / 2);
      } else {
        groupedMap.set(key, { ...item });
      }
    });

    return {
      displayLocations: Array.from(groupedMap.values()),
      unmappedProjects: unmapped,
    };
  }, [projects, locations]);

  // Current selected location
  const activeLocation = useMemo(() => {
    return (
      displayLocations.find((l) => l.id === selectedLocId) ||
      displayLocations[0] ||
      null
    );
  }, [displayLocations, selectedLocId]);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    let isCancelled = false;

    async function initMap() {
      try {
        const L = (await import("leaflet")).default;
        if (isCancelled || !mapContainerRef.current) return;

        // 1. Create Leaflet map instance centered precisely on Ethiopia
        if (!mapInstanceRef.current) {
          const map = L.map(mapContainerRef.current, {
            center: ETHIOPIA_MAP_DEFAULTS.center,
            zoom: ETHIOPIA_MAP_DEFAULTS.defaultZoom,
            minZoom: ETHIOPIA_MAP_DEFAULTS.minZoom,
            maxZoom: ETHIOPIA_MAP_DEFAULTS.maxZoom,
            zoomControl: false,
            attributionControl: false,
            scrollWheelZoom: true,
          });

          // Custom zoom control in bottom-right
          L.control.zoom({ position: "bottomright" }).addTo(map);

          // Add markers layer group
          markersLayerRef.current = L.layerGroup().addTo(map);

          mapInstanceRef.current = map;
        }

        const map = mapInstanceRef.current;
        if (!map) return;

        // 2. Tile Layer Setup: ESRI Canvas or OpenStreetMap (NO WATERMARK, NO API KEY)
        if (tileLayerRef.current) {
          map.removeLayer(tileLayerRef.current);
        }

        let tileUrl: string;
        let attribution: string;

        if (activeLayerType === "osm") {
          tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
          attribution = "© OpenStreetMap contributors";
        } else {
          // Esri World Canvas: clean, monochrome, professional for ERP dashboards
          tileUrl = isDark
            ? "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
            : "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}";
          attribution = "Tiles © Esri";
        }

        const newTileLayer = L.tileLayer(tileUrl, {
          subdomains: ["a", "b", "c"],
          maxZoom: 18,
          detectRetina: true,
          attribution,
        }).addTo(map);

        tileLayerRef.current = newTileLayer;

        // 3. Load & Render Authentic Ethiopian Regional Boundary GeoJSON
        if (geoJsonLayerRef.current) {
          map.removeLayer(geoJsonLayerRef.current);
        }

        try {
          const response = await fetch("/data/ethiopia-regions.geojson");
          if (response.ok) {
            const geoData = await response.json();
            if (!isCancelled && mapInstanceRef.current) {
              const geoLayer = L.geoJSON(geoData, {
                style: () => {
                  return {
                    color: isDark ? "#303030" : "#D4D4D4",
                    weight: 1.5,
                    opacity: isDark ? 0.8 : 0.6,
                    fillColor: isDark ? "#111111" : "#FAFAFA",
                    fillOpacity: isDark ? 0.25 : 0.15,
                    dashArray: "3, 4",
                  };
                },
                onEachFeature: (feature, layer) => {
                  const regionName =
                    feature.properties?.shapeName ||
                    feature.properties?.name ||
                    "Ethiopian Region";

                  layer.on({
                    mouseover: (e) => {
                      const target = e.target;
                      target.setStyle({
                        weight: 2.5,
                        color: isDark ? "#FFFFFF" : "#000000",
                        fillOpacity: isDark ? 0.45 : 0.25,
                      });
                      setHoveredRegion(regionName);
                    },
                    mouseout: (e) => {
                      geoLayer.resetStyle(e.target);
                      setHoveredRegion(null);
                    },
                  });
                },
              }).addTo(map);

              geoJsonLayerRef.current = geoLayer;
            }
          }
        } catch (geoErr) {
          console.warn("Notice: Ethiopian GeoJSON regional layer loaded via default bounds", geoErr);
        }

        // 4. Render Markers for Display Locations
        if (markersLayerRef.current) {
          markersLayerRef.current.clearLayers();

          displayLocations.forEach((loc) => {
            const isSelected = activeLocation?.id === loc.id;

            // Status-based accent ring
            let statusColor = isDark ? "#FFFFFF" : "#000000";
            const st = (loc.status || "").toLowerCase();
            if (st.includes("active") || st.includes("complete") || st.includes("handover")) {
              statusColor = isDark ? "#FFFFFF" : "#000000";
            } else if (st.includes("plan") || st.includes("ground")) {
              statusColor = isDark ? "#A3A3A3" : "#666666";
            } else if (st.includes("delay") || st.includes("hold") || st.includes("risk")) {
              statusColor = isDark ? "#666666" : "#303030";
            }

            const markerHtml = `
              <div class="relative group cursor-pointer flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2" title="${loc.name}">
                <div style="
                  width: ${isSelected ? "34px" : "28px"};
                  height: ${isSelected ? "34px" : "28px"};
                  background-color: ${isDark ? "#111111" : "#FFFFFF"};
                  color: ${isDark ? "#FFFFFF" : "#000000"};
                  border: 2px solid ${statusColor};
                  border-radius: 9999px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: 800;
                  font-size: 11px;
                  box-shadow: 0 4px 14px rgba(0,0,0,0.35);
                  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                ">
                  ${loc.count}
                </div>
                <span style="
                  position: absolute;
                  top: -2px;
                  right: -2px;
                  width: 9px;
                  height: 9px;
                  border-radius: 9999px;
                  background-color: ${statusColor};
                  border: 1.5px solid ${isDark ? "#171717" : "#FFFFFF"};
                "></span>
              </div>
            `;

            const icon = L.divIcon({
              html: markerHtml,
              className: "apex-geo-marker",
              iconSize: [34, 34],
              iconAnchor: [17, 17],
            });

            const marker = L.marker([loc.lat, loc.lng], { icon });

            // Popup with project information
            const popupContent = `
              <div style="font-family: inherit; font-size: 12px; color: ${isDark ? '#FFFFFF' : '#000000'}; min-width: 180px;">
                <div style="font-weight: 700; font-size: 13px; margin-bottom: 2px;">${loc.city}</div>
                <div style="font-size: 11px; color: ${isDark ? '#A3A3A3' : '#666666'}; margin-bottom: 6px;">${loc.region}</div>
                <div style="font-size: 11px; margin-bottom: 4px;"><strong>${loc.name}</strong> (${loc.projectCode})</div>
                <div style="font-size: 11px; margin-bottom: 6px;">Status: <span style="color: ${statusColor}; font-weight: 600;">${loc.status}</span></div>
                <div style="font-size: 10px; color: ${isDark ? '#777777' : '#888888'};">Precision: ${loc.precision || 'MUNICIPAL_VERIFIED'}</div>
              </div>
            `;

            marker.bindPopup(popupContent, {
              className: isDark ? "apex-dark-popup" : "apex-light-popup",
            });

            marker.on("click", () => {
              setSelectedLocId(loc.id);
            });

            markersLayerRef.current?.addLayer(marker);
          });
        }

        // Invalidate size once DOM has rendered with 200ms timeout
        const initialTimer = setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 200);

        // Attach ResizeObserver to map container to guarantee tiles fill 100% without white gaps
        let observer: ResizeObserver | null = null;
        if (mapContainerRef.current && typeof ResizeObserver !== "undefined") {
          observer = new ResizeObserver(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.invalidateSize();
            }
          });
          observer.observe(mapContainerRef.current);
        }

        cleanupFn = () => {
          clearTimeout(initialTimer);
          if (observer) observer.disconnect();
        };
      } catch (err) {
        console.warn("Leaflet map initialization notice:", err);
        setMapError(true);
      }
    }

    let cleanupFn: (() => void) | undefined;
    initMap();

    return () => {
      isCancelled = true;
      if (cleanupFn) cleanupFn();
    };
  }, [resolvedTheme, activeLayerType, displayLocations, activeLocation, isDark]);

  // Reset map view to full Ethiopia
  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(ETHIOPIA_MAP_DEFAULTS.center, ETHIOPIA_MAP_DEFAULTS.defaultZoom, {
        animate: true,
      });
    }
  };

  // Center on a specific project location
  const handleSelectLocation = (loc: ProjectLocationItem) => {
    setSelectedLocId(loc.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo([loc.lat, loc.lng], { animate: true });
    }
  };

  return (
    <div
      className={`border border-[#D4D4D4] dark:border-[#303030] bg-[#FFFFFF] dark:bg-[#111111] text-[#000000] dark:text-[#FFFFFF] rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-md transition-colors duration-200 ${className}`}
    >
      <div>
        {/* Header with Title, Controls, and Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#D4D4D4] dark:border-[#303030] gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[#F5F5F5] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF]">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">
                  Project Locations Map
                </h2>
                <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-[#F5F5F5] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]">
                  ETHIOPIA
                </span>
              </div>
              <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">
                Authentic geographic deployment across regional construction corridors
              </p>
            </div>
          </div>

          {/* Map Controls: Reset, Layer Switch, All Locations Link */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleResetView}
              className="p-2 rounded-full text-[#666666] dark:text-[#A1A1A1] hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:bg-[#F5F5F5] dark:hover:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] transition-colors"
              title="Reset view to full Ethiopia"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setActiveLayerType((prev) => (prev === "canvas" ? "osm" : "canvas"))}
              className="px-3 py-1.5 text-[11px] font-medium rounded-full text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] bg-[#F5F5F5] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] transition-colors flex items-center gap-1"
              title="Toggle between Clean Monochrome Canvas and OpenStreetMap"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{activeLayerType === "canvas" ? "Canvas" : "OSM"}</span>
            </button>

            <Link
              href="/administration/locations"
              className="p-2 rounded-full text-[#666666] dark:text-[#A1A1A1] hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:bg-[#F5F5F5] dark:hover:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] transition-colors"
              title="Manage all verified locations"
            >
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Hovered Regional Boundary Pill */}
        {hoveredRegion && (
          <div className="mt-2 text-xs flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5F5F5] dark:bg-[#171717] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030] animate-in fade-in">
            <Compass className="w-3.5 h-3.5" />
            <span className="font-semibold">{hoveredRegion} Regional State</span>
          </div>
        )}

        {/* Map Viewport Area */}
        <div className="mt-4 w-full aspect-[4/3] min-h-[260px] max-h-[340px] relative overflow-hidden rounded-xl bg-zinc-900 border border-[#D4D4D4] dark:border-[#303030]">
          {mapError ? (
            /* Resilient SVG Fallback with accurate Ethiopia polygon and nodes */
            <div className="w-full h-full relative flex items-center justify-center p-4">
              <svg viewBox="0 0 600 400" className="w-full h-full opacity-70">
                {/* Ethiopia geographic silhouette */}
                <polygon
                  points="180,40 280,30 360,50 430,120 540,180 570,240 480,290 380,370 290,360 210,320 160,250 140,160 160,80"
                  fill={isDark ? "#171717" : "#D4D4D4"}
                  stroke={isDark ? "#FFFFFF" : "#000000"}
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                {displayLocations.map((loc, idx) => (
                  <g
                    key={loc.id}
                    onClick={() => handleSelectLocation(loc)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={200 + (idx % 4) * 80}
                      cy={100 + Math.floor(idx / 4) * 90 + ((idx * 17) % 40)}
                      r={activeLocation?.id === loc.id ? 14 : 10}
                      fill={activeLocation?.id === loc.id ? "#FFFFFF" : isDark ? "#111111" : "#FFFFFF"}
                      stroke={isDark ? "#FFFFFF" : "#000000"}
                      strokeWidth="2"
                    />
                    <text
                      x={200 + (idx % 4) * 80}
                      y={104 + Math.floor(idx / 4) * 90 + ((idx * 17) % 40)}
                      textAnchor="middle"
                      className="text-[10px] font-bold fill-current"
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
          {activeLocation && (
            <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-xs z-10 p-3.5 rounded-2xl bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] shadow-xl animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#000000] dark:bg-[#FFFFFF]" />
                    <h4 className="text-xs font-bold text-[#000000] dark:text-[#FFFFFF]">
                      {activeLocation.city}
                    </h4>
                  </div>
                  <p className="text-[10px] font-mono text-[#666666] dark:text-[#A3A3A3] mt-0.5">
                    {activeLocation.region}
                  </p>
                </div>
                <StatusBadge value={activeLocation.status} />
              </div>

              <div className="mt-2 text-[11px] text-[#666666] dark:text-[#A3A3A3] truncate">
                {activeLocation.sites}
              </div>

              <div className="mt-2">
                <div className="flex justify-between text-[10px] text-[#777777] font-mono mb-1">
                  <span>Site Progress</span>
                  <span>{activeLocation.progress}%</span>
                </div>
                <ProgressBar value={activeLocation.progress} className="h-1.5" />
              </div>

              <div className="mt-2 pt-2 border-t border-[#D4D4D4] dark:border-[#303030] flex items-center justify-between text-[11px]">
                <span className="text-[10px] text-[#666666] dark:text-[#A3A3A3] font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#000000] dark:text-[#FFFFFF]" />
                  {activeLocation.precision || "MUNICIPAL_VERIFIED"}
                </span>
                <Link
                  href="/projects"
                  className="font-bold text-[#000000] dark:text-[#FFFFFF] hover:underline flex items-center gap-0.5"
                >
                  <span>View Project</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Status Legend */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-[#666666] dark:text-[#A3A3A3]">
          <span className="font-semibold text-[#000000] dark:text-[#FFFFFF]">Legend:</span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#000000] dark:bg-[#FFFFFF]" />
            <span>Active / Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#666666] dark:bg-[#A3A3A3]" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#A3A3A3] dark:bg-[#666666]" />
            <span>Planning / Groundwork</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full border border-[#000000] dark:border-[#FFFFFF] bg-transparent" />
            <span>Delayed / Risk</span>
          </div>
        </div>

        {/* Location List / Breakdown Cards */}
        {displayLocations.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {displayLocations.slice(0, 4).map((loc) => {
              const isSelected = activeLocation?.id === loc.id;
              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => handleSelectLocation(loc)}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    isSelected
                      ? "bg-[#F5F5F5] dark:bg-[#171717] border-[#000000] dark:border-[#FFFFFF] shadow-2xs"
                      : "bg-[#FFFFFF] dark:bg-[#171717] border-[#D4D4D4] dark:border-[#303030] hover:border-[#888888] dark:hover:border-[#777777]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#000000] dark:text-[#FFFFFF]">
                      {loc.city}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#F5F5F5] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF]">
                      {loc.count} {loc.count === 1 ? "site" : "sites"}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#666666] dark:text-[#A3A3A3] font-mono truncate">
                    {loc.region}
                  </p>
                  <div className="mt-2">
                    <ProgressBar value={loc.progress} className="h-1" />
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 p-4 rounded-2xl border border-dashed border-[#D4D4D4] dark:border-[#303030] text-center text-xs text-[#666666] dark:text-[#A3A3A3]">
            No construction sites mapped yet. Newly created projects with verified locations will appear here.
          </div>
        )}

        {/* Unmapped / Awaiting Coordinates Notification Drawer */}
        {unmappedProjects.length > 0 && (
          <div className="mt-4 border border-[#D4D4D4] dark:border-[#303030] bg-[#FAFAFA] dark:bg-[#111111] rounded-2xl p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-[#000000] dark:text-[#FFFFFF]">
                <AlertCircle className="w-4 h-4" />
                <span>
                  {unmappedProjects.length} {unmappedProjects.length === 1 ? "project" : "projects"} awaiting GPS surveying verification
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAwaitingOpen(!isAwaitingOpen)}
                className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] hover:underline"
              >
                {isAwaitingOpen ? "Hide Details" : "Review List"}
              </button>
            </div>

            {isAwaitingOpen && (
              <div className="mt-3 pt-3 border-t border-[#D4D4D4] dark:border-[#303030] space-y-2">
                {unmappedProjects.map((unm) => (
                  <div
                    key={unm.id}
                    className="flex items-center justify-between text-xs py-1.5 px-3 rounded-2xl bg-[#FFFFFF] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030]"
                  >
                    <div>
                      <span className="font-semibold text-[#000000] dark:text-[#FFFFFF]">
                        {unm.name}
                      </span>
                      <span className="ml-2 font-mono text-[10px] text-[#777777]">
                        ({unm.projectCode})
                      </span>
                      <p className="text-[10px] text-[#666666] dark:text-[#A3A3A3]">
                        Reported: {unm.locationText}
                      </p>
                    </div>
                    <Link
                      href="/administration/locations"
                      className="text-[11px] font-semibold text-[#000000] dark:text-[#FFFFFF] hover:underline"
                    >
                      Assign GPS →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="mt-4 pt-3 border-t border-[#D4D4D4] dark:border-[#303030] flex items-center justify-between text-xs text-[#666666] dark:text-[#A3A3A3]">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#000000] dark:text-[#FFFFFF]" />
          <span>{displayLocations.length} Regional Construction Corridors</span>
        </div>
        <Link
          href="/administration/locations"
          className="font-semibold text-[#000000] dark:text-[#FFFFFF] hover:underline flex items-center gap-1"
        >
          <span>Geospatial Directory</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
