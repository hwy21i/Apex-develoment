"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Navigation,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
  Calendar,
  X,
  ShieldCheck,
  Building2,
  Phone,
  ArrowRight,
  CircleDot,
  Download,
} from "lucide-react";
import { getCached, setCached } from "@/lib/client-cache";
import { downloadReportPdf } from "@/lib/exportPdf";

export interface CheckpointItem {
  _id?: string;
  stage: string;
  locationName: string;
  timestamp: string;
  statusNote: string;
  loggedBy: string;
  conditionOnCheck: "INTACT" | "MINOR_VARIANCE" | "DAMAGED";
}

export interface DeliveryShipment {
  _id: string;
  trackingNumber: string;
  poNumber: string;
  projectId?: { _id: string; name: string; projectCode?: string; location?: string };
  purchaseType?: string;
  materialSummary: string;
  carrierName: string;
  driverName: string;
  driverPhone: string;
  vehiclePlate: string;
  originLocation: string;
  currentLocation: string;
  destinationSite: string;
  status:
    | "ORDER_CONFIRMED"
    | "AT_SUPPLIER_HUB"
    | "DISPATCHED"
    | "IN_TRANSIT_CHECKPOINT"
    | "ARRIVED_AT_SITE"
    | "INSPECTED_AND_STORED"
    | "DELAYED";
  progressPercentage: number;
  estimatedArrival: string;
  checkpoints: CheckpointItem[];
  createdAt: string;
  updatedAt: string;
}

const SIX_STAGES = [
  { id: "ORDER_CONFIRMED", label: "Order Confirmed" },
  { id: "AT_SUPPLIER_HUB", label: "Supplier Hub" },
  { id: "DISPATCHED", label: "Dispatched" },
  { id: "IN_TRANSIT_CHECKPOINT", label: "In-Transit Checkpoints" },
  { id: "ARRIVED_AT_SITE", label: "Arrived at Site" },
  { id: "INSPECTED_AND_STORED", label: "Quality Verified & Stored" },
];

const STAGE_ORDER: Record<string, number> = {
  ORDER_CONFIRMED: 0,
  AT_SUPPLIER_HUB: 1,
  DISPATCHED: 2,
  IN_TRANSIT_CHECKPOINT: 3,
  ARRIVED_AT_SITE: 4,
  INSPECTED_AND_STORED: 5,
  DELAYED: 3,
};

export default function LiveDeliveryTracker() {
  const [deliveries, setDeliveries] = useState<DeliveryShipment[]>(() => {
    return getCached<DeliveryShipment[]>("procurement_deliveries") || [];
  });
  const [loading, setLoading] = useState<boolean>(() => {
    return !getCached<DeliveryShipment[]>("procurement_deliveries");
  });
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New Checkpoint Modal State
  const [checkpointModalOpen, setCheckpointModalOpen] = useState(false);
  const [targetShipment, setTargetShipment] = useState<DeliveryShipment | null>(null);
  const [checkStage, setCheckStage] = useState("IN_TRANSIT_CHECKPOINT");
  const [checkLocation, setCheckLocation] = useState("");
  const [checkCondition, setCheckCondition] = useState<"INTACT" | "MINOR_VARIANCE" | "DAMAGED">("INTACT");
  const [checkNote, setCheckNote] = useState("");
  const [savingCheckpoint, setSavingCheckpoint] = useState(false);

  // New Delivery Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createPoNumber, setCreatePoNumber] = useState("PO-2026-");
  const [createMaterial, setCreateMaterial] = useState("Portland Cement 42.5R (400 Bags)");
  const [createCarrier, setCreateCarrier] = useState("Trans-Ethiopia Freight Logistics");
  const [createDriver, setCreateDriver] = useState("Kassahun Tadesse");
  const [createPhone, setCreatePhone] = useState("+251-911-234567");
  const [createVehicle, setCreateVehicle] = useState("ET-3-48192-AA");
  const [createOrigin, setCreateOrigin] = useState("Mugher Cement Factory Silo 4");
  const [createDestination, setCreateDestination] = useState("Addis Heights Tower - Bole Site Gate B");
  const [savingNewDelivery, setSavingNewDelivery] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const kpiStats = useMemo(() => {
    const total = deliveries.length;
    const inTransit = deliveries.filter(
      (d) => d.status === "IN_TRANSIT_CHECKPOINT" || d.status === "DISPATCHED"
    ).length;
    const delivered = deliveries.filter(
      (d) => d.status === "ARRIVED_AT_SITE" || d.status === "INSPECTED_AND_STORED"
    ).length;
    const delayed = deliveries.filter((d) => d.status === "DELAYED").length;
    const upcoming = deliveries.filter(
      (d) => d.status === "ORDER_CONFIRMED" || d.status === "AT_SUPPLIER_HUB"
    ).length;
    return { total, inTransit, delivered, delayed, upcoming };
  }, [deliveries]);

  const handleExportDeliveryPdf = async () => {
    setDownloadingPdf(true);
    await downloadReportPdf("delivery-tracking", {
      title: "Inbound Delivery Tracking & Logistics Telemetry Audit",
      filename: `Apex_Delivery_Tracking_${new Date().toISOString().split("T")[0]}.pdf`,
    });
    setDownloadingPdf(false);
  };

  const fetchDeliveries = useCallback(async () => {
    try {
      const res = await fetch("/api/procurement/deliveries", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data?.items)) {
        setDeliveries(json.data.items);
        setCached("procurement_deliveries", json.data.items, 30_000);
        setError(null);
      } else {
        throw new Error(json.error?.message || "Failed to load delivery telemetry");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error connecting to delivery tracking API");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  // Expand first shipment by default if none expanded
  useEffect(() => {
    if (deliveries.length > 0 && !expandedId) {
      setExpandedId(deliveries[0]._id);
    }
  }, [deliveries, expandedId]);

  const filtered = useMemo(() => {
    return deliveries.filter((d) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        d.trackingNumber.toLowerCase().includes(q) ||
        d.poNumber.toLowerCase().includes(q) ||
        d.carrierName.toLowerCase().includes(q) ||
        d.driverName.toLowerCase().includes(q) ||
        d.vehiclePlate.toLowerCase().includes(q) ||
        d.originLocation.toLowerCase().includes(q) ||
        d.destinationSite.toLowerCase().includes(q) ||
        d.materialSummary.toLowerCase().includes(q);

      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && d.status !== "INSPECTED_AND_STORED") ||
        d.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [deliveries, search, statusFilter]);

  const openAddCheckpointModal = (shipment: DeliveryShipment) => {
    setTargetShipment(shipment);
    setCheckStage(shipment.status === "ORDER_CONFIRMED" ? "DISPATCHED" : "IN_TRANSIT_CHECKPOINT");
    setCheckLocation(shipment.currentLocation || "Adama Expressway Checkpoint");
    setCheckCondition("INTACT");
    setCheckNote("Cleared highway weighbridge inspection. Cargo seals verified intact.");
    setCheckpointModalOpen(true);
  };

  const handleSaveCheckpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetShipment || !checkLocation.trim()) return;

    setSavingCheckpoint(true);
    try {
      const res = await fetch("/api/procurement/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_CHECKPOINT",
          trackingId: targetShipment._id,
          stage: checkStage,
          locationName: checkLocation.trim(),
          conditionOnCheck: checkCondition,
          statusNote: checkNote.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to log checkpoint");
      }

      await fetchDeliveries();
      setCheckpointModalOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error recording checkpoint");
    } finally {
      setSavingCheckpoint(false);
    }
  };

  const handleSaveNewDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNewDelivery(true);
    try {
      const res = await fetch("/api/procurement/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poNumber: createPoNumber.trim(),
          materialSummary: createMaterial.trim(),
          carrierName: createCarrier.trim(),
          driverName: createDriver.trim(),
          driverPhone: createPhone.trim(),
          vehiclePlate: createVehicle.trim(),
          originLocation: createOrigin.trim(),
          destinationSite: createDestination.trim(),
          status: "DISPATCHED",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to create shipment");
      }

      await fetchDeliveries();
      setCreateModalOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error creating shipment");
    } finally {
      setSavingNewDelivery(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-1">
            <Truck className="w-4 h-4 text-[#000000] dark:text-[#FFFFFF]" />
            Real-Time Material Route &amp; Checkpoint Telemetry
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#000000] dark:text-[#FFFFFF] tracking-tight">
            Live End-to-End Delivery Tracking
          </h2>
          <p className="text-xs text-[#666666] dark:text-[#A3A3A3] mt-0.5">
            Audit where materials have been, current transit checkpoints, driver contacts, and site gate arrivals
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            disabled={downloadingPdf}
            onClick={handleExportDeliveryPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#FFFFFF] dark:bg-[#111111] hover:bg-[#F5F5F5] dark:hover:bg-[#1F1F1F] text-[#000000] dark:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030] text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            title="Download Inbound Delivery Tracking & Telemetry PDF"
          >
            {downloadingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{downloadingPdf ? "Generating..." : "Export Delivery PDF"}</span>
          </button>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Dispatch New Shipment</span>
          </button>
        </div>
      </div>

      {/* 5-KPI Delivery Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-3xl bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] shadow-2xs">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]">
            Total Shipments
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#000000] dark:text-[#FFFFFF] mt-1">
            {kpiStats.total}
          </div>
          <div className="text-[11px] text-[#888888] dark:text-[#666666] mt-0.5">Tracked Inbound</div>
        </div>

        <div className="p-4 rounded-3xl bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] shadow-2xs">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]">
            In Transit
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#000000] dark:text-[#FFFFFF] mt-1">
            {kpiStats.inTransit}
          </div>
          <div className="text-[11px] text-[#888888] dark:text-[#666666] mt-0.5">En Route Checkpoints</div>
        </div>

        <div className="p-4 rounded-3xl bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] shadow-2xs">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]">
            Delivered &amp; Verified
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#000000] dark:text-[#FFFFFF] mt-1">
            {kpiStats.delivered}
          </div>
          <div className="text-[11px] text-[#888888] dark:text-[#666666] mt-0.5">At Site Gate / Stored</div>
        </div>

        <div className="p-4 rounded-3xl bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] shadow-2xs">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]">
            Delayed / Attention
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#000000] dark:text-[#FFFFFF] mt-1">
            {kpiStats.delayed}
          </div>
          <div className="text-[11px] text-[#888888] dark:text-[#666666] mt-0.5">Logistics Escalation</div>
        </div>

        <div className="p-4 rounded-3xl bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]">
            Upcoming Hub
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#000000] dark:text-[#FFFFFF] mt-1">
            {kpiStats.upcoming}
          </div>
          <div className="text-[11px] text-[#888888] dark:text-[#666666] mt-0.5">Ready for Dispatch</div>
        </div>
      </div>

      {/* Search & Filter Strip */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666] dark:text-[#A3A3A3]" />
          <input
            type="text"
            placeholder="Search shipments by Tracking #, PO, driver, plate, or origin location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] placeholder-[#666666] dark:placeholder-[#A3A3A3] text-xs rounded-full pl-9 pr-4 py-2.5 outline-none focus:border-[#000000] dark:focus:border-[#FFFFFF]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "All Shipments" },
            { id: "ACTIVE", label: "Active En Route" },
            { id: "IN_TRANSIT_CHECKPOINT", label: "Checkpoints" },
            { id: "ARRIVED_AT_SITE", label: "At Site Gate" },
            { id: "INSPECTED_AND_STORED", label: "Stored & Verified" },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === st.id
                  ? "bg-[#000000] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#000000] font-bold shadow-2xs"
                  : "bg-[#FFFFFF] dark:bg-[#111111] text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF] border border-[#D4D4D4] dark:border-[#303030]"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Deliveries List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#666666] dark:text-[#A3A3A3] bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-2xl">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#000000] dark:text-[#FFFFFF]" />
          <span>Synchronizing live GPS &amp; checkpoint route telemetry...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-xs text-[#666666] dark:text-[#A3A3A3] bg-[#FFFFFF] dark:bg-[#111111] border border-dashed border-[#D4D4D4] dark:border-[#303030] rounded-2xl">
          <Truck className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <span>No shipments match your criteria. Click &quot;+ Dispatch New Shipment&quot; to begin tracking.</span>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((shipment) => {
            const isExpanded = expandedId === shipment._id;
            const currentStageIndex = STAGE_ORDER[shipment.status] ?? 3;

            return (
              <div
                key={shipment._id}
                className="bg-[#FFFFFF] dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-3xl shadow-xs transition-all overflow-hidden"
              >
                {/* Shipment Summary Header Row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : shipment._id)}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer hover:bg-[#FAFAFA] dark:hover:bg-[#161616] transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#000000] text-[#FFFFFF] dark:bg-[#FFFFFF] dark:text-[#000000] flex items-center justify-center shrink-0 font-bold">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm text-[#000000] dark:text-[#FFFFFF]">
                          {shipment.trackingNumber}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAFAFA] dark:bg-[#1F1F1F] text-[#666666] dark:text-[#A3A3A3] border border-[#D4D4D4] dark:border-[#333333]">
                          PO: {shipment.poNumber}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#000000] text-[#FFFFFF] dark:bg-[#FFFFFF] dark:text-[#000000]">
                          {shipment.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-[#000000] dark:text-[#FFFFFF] mt-1">
                        {shipment.materialSummary}
                      </h3>
                      <div className="text-xs text-[#666666] dark:text-[#A3A3A3] flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{shipment.originLocation}</span>
                        <ArrowRight className="w-3 h-3 shrink-0" />
                        <strong className="text-[#000000] dark:text-[#FFFFFF] truncate">
                          {shipment.destinationSite}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Right side telemetry info */}
                  <div className="flex items-center justify-between lg:justify-end gap-6 border-t lg:border-t-0 pt-3 lg:pt-0 border-[#E5E5E5] dark:border-[#222222]">
                    <div className="text-left lg:text-right">
                      <div className="text-xs font-mono font-bold text-[#000000] dark:text-[#FFFFFF]">
                        {shipment.driverName} ({shipment.vehiclePlate})
                      </div>
                      <div className="text-[11px] text-[#666666] dark:text-[#A3A3A3] flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        <span>{shipment.driverPhone}</span>
                      </div>
                    </div>

                    <div className="w-28 text-right">
                      <div className="flex justify-between text-[11px] font-mono mb-1">
                        <span className="text-[#666666] dark:text-[#A3A3A3]">Progress</span>
                        <strong className="text-[#000000] dark:text-[#FFFFFF]">{shipment.progressPercentage}%</strong>
                      </div>
                      <div className="w-full bg-[#E5E5E5] dark:bg-[#303030] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#000000] dark:bg-[#FFFFFF] h-full rounded-full transition-all duration-500"
                          style={{ width: `${shipment.progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      className="p-1 rounded-lg text-[#666666] dark:text-[#A3A3A3] hover:text-[#000000] dark:hover:text-[#FFFFFF]"
                      aria-label="Expand route details"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details: 6-Stage Progress Stepper & Vertical Timeline */}
                {isExpanded && (
                  <div className="border-t border-[#D4D4D4] dark:border-[#303030] p-5 sm:p-6 bg-[#FAFAFA]/50 dark:bg-[#0D0D0D]/50 space-y-6 animate-fadeIn">
                    {/* Visual 6-Stage Progress Stepper */}
                    <div>
                      <div className="text-xs font-mono font-semibold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3] mb-3">
                        Delivery Phase Pipeline
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        {SIX_STAGES.map((st, sIdx) => {
                          const isPast = sIdx < currentStageIndex;
                          const isCurrent = sIdx === currentStageIndex;

                          return (
                            <div
                              key={st.id}
                              className={`p-3 rounded-xl border text-center transition-all ${
                                isCurrent
                                  ? "bg-[#000000] text-[#FFFFFF] dark:bg-[#FFFFFF] dark:text-[#000000] border-[#000000] dark:border-[#FFFFFF] shadow-sm font-bold"
                                  : isPast
                                  ? "bg-[#FFFFFF] text-[#000000] dark:bg-[#1A1A1A] dark:text-[#FFFFFF] border-[#000000] dark:border-[#FFFFFF] font-semibold"
                                  : "bg-[#FFFFFF] dark:bg-[#111111] text-[#888888] dark:text-[#666666] border-[#D4D4D4] dark:border-[#262626]"
                              }`}
                            >
                              <div className="text-[10px] font-mono uppercase tracking-wider opacity-75">
                                Stage 0{sIdx + 1}
                              </div>
                              <div className="text-xs mt-1 leading-snug">{st.label}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Timeline & Actions Area */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                      {/* Left 2 Columns: "Where It Has Been" Checkpoint Timeline */}
                      <div className="lg:col-span-2 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#000000] dark:text-[#FFFFFF] flex items-center gap-1.5">
                            <Navigation className="w-3.5 h-3.5" />
                            Route &amp; Checkpoint History (&quot;Where It Has Been&quot;)
                          </h4>
                          <span className="text-[11px] font-mono text-[#666666] dark:text-[#A3A3A3]">
                            {shipment.checkpoints?.length || 0} checkpoints logged
                          </span>
                        </div>

                        <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#D4D4D4] dark:before:bg-[#303030]">
                          {(shipment.checkpoints || []).map((cp, cIdx) => (
                            <div key={cp._id || cIdx} className="relative group">
                              {/* Circle pin indicator */}
                              <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-[#000000] dark:bg-[#FFFFFF] border-2 border-[#FFFFFF] dark:border-[#000000]" />

                              <div className="bg-[#FFFFFF] dark:bg-[#161616] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-3.5 shadow-2xs">
                                <div className="flex items-start justify-between gap-2 flex-wrap">
                                  <div>
                                    <span className="font-bold text-xs text-[#000000] dark:text-[#FFFFFF]">
                                      {cp.locationName}
                                    </span>
                                    <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAFAFA] dark:bg-[#222222] text-[#666666] dark:text-[#A3A3A3] border border-[#D4D4D4] dark:border-[#333333]">
                                      {cp.stage}
                                    </span>
                                  </div>
                                  <div className="text-[10px] font-mono text-[#666666] dark:text-[#A3A3A3]">
                                    {new Date(cp.timestamp).toLocaleString("en-ET", {
                                      dateStyle: "medium",
                                      timeStyle: "short",
                                    })}
                                  </div>
                                </div>

                                <p className="text-xs text-[#444444] dark:text-[#CCCCCC] mt-1.5 leading-relaxed">
                                  {cp.statusNote || "Waypoint cleared without exception."}
                                </p>

                                <div className="mt-2.5 pt-2 border-t border-[#E5E5E5] dark:border-[#262626] flex items-center justify-between text-[10px] text-[#666666] dark:text-[#A3A3A3]">
                                  <span>Logged by: <strong>{cp.loggedBy}</strong></span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded font-bold ${
                                      cp.conditionOnCheck === "INTACT"
                                        ? "bg-black/5 dark:bg-white/10 text-[#000000] dark:text-[#FFFFFF]"
                                        : "bg-[#000000] text-[#FFFFFF]"
                                    }`}
                                  >
                                    Condition: {cp.conditionOnCheck}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right 1 Column: Telemetry Summary Card & Action Button */}
                      <div className="bg-[#FFFFFF] dark:bg-[#161616] border border-[#D4D4D4] dark:border-[#303030] rounded-xl p-4 flex flex-col justify-between space-y-4 shadow-2xs">
                        <div className="space-y-3">
                          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#000000] dark:text-[#FFFFFF] pb-2 border-b border-[#D4D4D4] dark:border-[#303030]">
                            Logistics Manifest Details
                          </h4>
                          <div className="text-xs space-y-1.5">
                            <div className="flex justify-between">
                              <span className="text-[#666666] dark:text-[#A3A3A3]">Carrier:</span>
                              <strong className="text-[#000000] dark:text-[#FFFFFF] truncate max-w-[150px]">
                                {shipment.carrierName}
                              </strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#666666] dark:text-[#A3A3A3]">Driver &amp; Phone:</span>
                              <span className="font-mono text-[#000000] dark:text-[#FFFFFF]">
                                {shipment.driverName} ({shipment.driverPhone})
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#666666] dark:text-[#A3A3A3]">Vehicle Plate:</span>
                              <strong className="font-mono text-[#000000] dark:text-[#FFFFFF]">
                                {shipment.vehiclePlate}
                              </strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#666666] dark:text-[#A3A3A3]">Current Checkpoint:</span>
                              <strong className="text-[#000000] dark:text-[#FFFFFF] truncate max-w-[140px]">
                                {shipment.currentLocation}
                              </strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#666666] dark:text-[#A3A3A3]">Est. Gate Arrival:</span>
                              <span className="font-mono text-[#000000] dark:text-[#FFFFFF]">
                                {new Date(shipment.estimatedArrival).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[#D4D4D4] dark:border-[#303030]">
                          <button
                            type="button"
                            onClick={() => openAddCheckpointModal(shipment)}
                            className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold transition-colors shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Log New Checkpoint / Advance Stage</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: LOG NEW CHECKPOINT */}
      {checkpointModalOpen && targetShipment && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-3xl shadow-2xl flex flex-col max-h-[85dvh] overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-[#D4D4D4] dark:border-[#303030] shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] border border-[#D4D4D4] dark:border-[#303030]">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">
                    Append Route Checkpoint
                  </h3>
                  <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">
                    {targetShipment.trackingNumber} — Vehicle {targetShipment.vehiclePlate}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCheckpointModalOpen(false)}
                className="p-1.5 rounded-full text-[#888888] hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:bg-[#E5E5E5] dark:hover:bg-[#1F1F1F] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCheckpoint} className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 py-4 space-y-4 pr-2">
                <div>
                  <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">
                    Advance Delivery Stage *
                  </label>
                  <select
                    value={checkStage}
                    onChange={(e) => setCheckStage(e.target.value)}
                    className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs rounded-2xl px-3.5 py-2.5 outline-none"
                  >
                    <option value="DISPATCHED">Dispatched from Source</option>
                    <option value="IN_TRANSIT_CHECKPOINT">In-Transit Waypoint / Weighbridge</option>
                    <option value="ARRIVED_AT_SITE">Arrived at Site Gate</option>
                    <option value="INSPECTED_AND_STORED">Inspected &amp; Stored in Warehouse</option>
                    <option value="DELAYED">Delayed en Route</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">
                    Exact Location / Checkpoint Name *
                  </label>
                  <input
                    required
                    value={checkLocation}
                    onChange={(e) => setCheckLocation(e.target.value)}
                    placeholder="e.g. Modjo Dry Port Toll Gate, Adama Weighbridge, Bole Site Dock"
                    className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs rounded-2xl px-3.5 py-2.5 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">
                    Cargo Condition on Inspection
                  </label>
                  <select
                    value={checkCondition}
                    onChange={(e) =>
                      setCheckCondition(e.target.value as "INTACT" | "MINOR_VARIANCE" | "DAMAGED")
                    }
                    className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs rounded-2xl px-3.5 py-2.5 outline-none"
                  >
                    <option value="INTACT">Intact (Clean &amp; Sealed)</option>
                    <option value="MINOR_VARIANCE">Minor Variance (Quantity / Moisture Check)</option>
                    <option value="DAMAGED">Damaged in Transit (Log Incident)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">
                    Waypoint Verification Note
                  </label>
                  <textarea
                    rows={3}
                    value={checkNote}
                    onChange={(e) => setCheckNote(e.target.value)}
                    placeholder="Weighbridge reading, transport permit verified, seal serial checked..."
                    className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs rounded-2xl px-3.5 py-2.5 outline-none"
                  />
                </div>
              </div>

              <div className="sticky bottom-0 bg-white dark:bg-[#111111] border-t border-[#D4D4D4] dark:border-[#303030] p-4 sm:p-6 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] z-10 shrink-0 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCheckpointModalOpen(false)}
                  className="px-4 py-2.5 rounded-full border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs font-semibold hover:bg-[#E5E5E5] dark:hover:bg-[#1F1F1F] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCheckpoint}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {savingCheckpoint && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Checkpoint</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL: DISPATCH NEW SHIPMENT */}
      {createModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#111111] border border-[#D4D4D4] dark:border-[#303030] rounded-3xl shadow-2xl flex flex-col max-h-[85dvh] overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-[#D4D4D4] dark:border-[#303030] shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-[#FAFAFA] dark:bg-[#171717] text-[#666666] dark:text-[#A3A3A3] border border-[#D4D4D4] dark:border-[#303030]">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#000000] dark:text-[#FFFFFF]">
                    Dispatch New Inbound Shipment
                  </h3>
                  <p className="text-xs text-[#666666] dark:text-[#A3A3A3]">
                    Create tracking number &amp; register carrier vehicle manifest
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 rounded-full text-[#888888] hover:text-[#000000] dark:hover:text-[#FFFFFF] hover:bg-[#E5E5E5] dark:hover:bg-[#1F1F1F] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewDelivery} className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-6 py-4 space-y-4 pr-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">
                      Purchase Order #
                    </label>
                    <input
                      required
                      value={createPoNumber}
                      onChange={(e) => setCreatePoNumber(e.target.value)}
                      placeholder="PO-2026-0045"
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs rounded-xl px-3.5 py-2.5 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">
                      Vehicle License Plate
                    </label>
                    <input
                      required
                      value={createVehicle}
                      onChange={(e) => setCreateVehicle(e.target.value)}
                      placeholder="ET-3-48192-AA"
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs rounded-xl px-3.5 py-2.5 outline-none font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">
                    Material Payload Summary
                  </label>
                  <input
                    required
                    value={createMaterial}
                    onChange={(e) => setCreateMaterial(e.target.value)}
                    placeholder="e.g. 50 Tons High-Tensile Rebar 16mm"
                    className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs rounded-xl px-3.5 py-2.5 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">
                      Logistics Carrier Name
                    </label>
                    <input
                      value={createCarrier}
                      onChange={(e) => setCreateCarrier(e.target.value)}
                      placeholder="Trans-Ethiopia Freight"
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs rounded-xl px-3.5 py-2.5 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">
                      Driver Name &amp; Phone
                    </label>
                    <input
                      value={createDriver}
                      onChange={(e) => setCreateDriver(e.target.value)}
                      placeholder="Driver Name"
                      className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs rounded-xl px-3.5 py-2.5 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">
                    Origin Hub / Loading Depot
                  </label>
                  <input
                    required
                    value={createOrigin}
                    onChange={(e) => setCreateOrigin(e.target.value)}
                    placeholder="e.g. Mugher Cement Plant or Akaki Steel Mill"
                    className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs rounded-xl px-3.5 py-2.5 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#000000] dark:text-[#FFFFFF] block mb-1">
                    Destination Site Gate
                  </label>
                  <input
                    required
                    value={createDestination}
                    onChange={(e) => setCreateDestination(e.target.value)}
                    placeholder="e.g. Addis Heights Tower - Bole Site Gate B"
                    className="w-full bg-[#FAFAFA] dark:bg-[#171717] border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs rounded-xl px-3.5 py-2.5 outline-none"
                  />
                </div>
              </div>

              <div className="sticky bottom-0 bg-white dark:bg-[#111111] border-t border-[#D4D4D4] dark:border-[#303030] p-4 sm:p-6 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] z-10 shrink-0 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-full border border-[#D4D4D4] dark:border-[#303030] text-[#000000] dark:text-[#FFFFFF] text-xs font-semibold hover:bg-[#E5E5E5] dark:hover:bg-[#1F1F1F] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNewDelivery}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#000000] hover:bg-[#303030] dark:bg-[#FFFFFF] dark:hover:bg-[#D4D4D4] text-[#FFFFFF] dark:text-[#000000] text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {savingNewDelivery && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Register &amp; Dispatch Shipment</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
