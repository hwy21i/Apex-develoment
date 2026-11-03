import { connectToDatabase } from "@/lib/db/mongodb";
import { ok, fail, handleError } from "@/lib/api";
import { requireAuth } from "@/lib/auth/guard";
import { DeliveryTracking } from "@/models/DeliveryTracking";
import { Project } from "@/models/Project";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STAGE_PROGRESS: Record<string, number> = {
  ORDER_CONFIRMED: 15,
  AT_SUPPLIER_HUB: 30,
  DISPATCHED: 50,
  IN_TRANSIT_CHECKPOINT: 70,
  ARRIVED_AT_SITE: 90,
  INSPECTED_AND_STORED: 100,
  DELAYED: 55,
};

export async function GET(request: Request) {
  const guard = await requireAuth(request);
  if (guard.error) return guard.error;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const search = searchParams.get("q");

    const query: Record<string, unknown> = {};
    if (projectId && mongoose.Types.ObjectId.isValid(projectId)) {
      query.projectId = new mongoose.Types.ObjectId(projectId);
    }
    if (status && status !== "ALL") {
      query.status = status;
    }
    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { trackingNumber: { $regex: term, $options: "i" } },
        { poNumber: { $regex: term, $options: "i" } },
        { vehiclePlate: { $regex: term, $options: "i" } },
        { driverName: { $regex: term, $options: "i" } },
        { originLocation: { $regex: term, $options: "i" } },
        { currentLocation: { $regex: term, $options: "i" } },
        { destinationSite: { $regex: term, $options: "i" } },
      ];
    }

    let items = await DeliveryTracking.find(query)
      .populate("projectId", "name projectCode location")
      .sort({ updatedAt: -1 })
      .lean();

    // Auto-seed sample Ethiopian shipments if none exist
    if (items.length === 0 && !search && !projectId) {
      const sampleProject = await Project.findOne({}).lean();
      const projId = sampleProject?._id || new mongoose.Types.ObjectId();

      const seedData = [
        {
          trackingNumber: "TRK-ET-2026-0084",
          poNumber: "PO-2026-0042",
          projectId: projId,
          purchaseType: "BULK_CONTRACT_PO",
          materialSummary: "50 Tons High-Tensile Rebar (Fe-500D)",
          carrierName: "Trans-Ethiopia Heavy Haulage",
          driverName: "Kassahun Tadesse",
          driverPhone: "+251-911-234567",
          vehiclePlate: "ET-3-48192-AA",
          originLocation: "Akaki Steel Rolling Mill",
          currentLocation: "Modjo Dry Port Checkpoint",
          destinationSite: "Addis Heights Tower - Site Gate B",
          status: "IN_TRANSIT_CHECKPOINT",
          progressPercentage: 65,
          estimatedArrival: new Date(Date.now() + 86400000),
          checkpoints: [
            {
              stage: "Order Confirmed",
              locationName: "Akaki Mill Dispatch Gate",
              timestamp: new Date(Date.now() - 86400000 * 2),
              statusNote: "50 Tons loaded & weighbridge certificate issued",
              loggedBy: "Dawit Alemu (QA Inspector)",
              conditionOnCheck: "INTACT",
            },
            {
              stage: "Dispatched",
              locationName: "Akaki Expressway Toll Hub",
              timestamp: new Date(Date.now() - 86400000 * 1.5),
              statusNote: "Cargo convoy departed via Expressway Route 1",
              loggedBy: "Kassahun Tadesse (Carrier Lead)",
              conditionOnCheck: "INTACT",
            },
            {
              stage: "In-Transit Checkpoint",
              locationName: "Modjo Dry Port Checkpoint",
              timestamp: new Date(Date.now() - 86400000 * 0.5),
              statusNote: "Federal Transport inspection cleared. Cargo straps verified intact.",
              loggedBy: "Modjo Checkpoint Officer",
              conditionOnCheck: "INTACT",
            },
          ],
        },
        {
          trackingNumber: "TRK-ET-2026-0091",
          poNumber: "PO-2026-0048",
          projectId: projId,
          purchaseType: "DIRECT_SITE_PURCHASE",
          materialSummary: "400 Bags Mugher Portland Cement 42.5R",
          carrierName: "Blue Nile Transport Cooperative",
          driverName: "Haile Gebreselassie",
          driverPhone: "+251-922-881290",
          vehiclePlate: "ET-3-90214-AA",
          originLocation: "Mugher Cement Factory Complex",
          currentLocation: "Kality Central Customs & Weighing Station",
          destinationSite: "Bole Central Mixed-Use Project",
          status: "ARRIVED_AT_SITE",
          progressPercentage: 85,
          estimatedArrival: new Date(Date.now() + 3600000 * 4),
          checkpoints: [
            {
              stage: "Supplier Hub",
              locationName: "Mugher Loading Silo 4",
              timestamp: new Date(Date.now() - 86400000),
              statusNote: "Sample tested: 28-day compressive strength meets spec.",
              loggedBy: "Mugher Lab Tech B. Girma",
              conditionOnCheck: "INTACT",
            },
            {
              stage: "Dispatched",
              locationName: "Ambo Road Junction",
              timestamp: new Date(Date.now() - 43200000),
              statusNote: "En route through western ring road",
              loggedBy: "Haile Gebreselassie (Driver)",
              conditionOnCheck: "INTACT",
            },
            {
              stage: "Arrived at Site",
              locationName: "Bole Site Main Gate",
              timestamp: new Date(Date.now() - 3600000),
              statusNote: "Truck staged at unloading dock. Awaiting site engineer visual check.",
              loggedBy: "Site Gate Logistics Guard",
              conditionOnCheck: "INTACT",
            },
          ],
        },
        {
          trackingNumber: "TRK-ET-2026-0105",
          poNumber: "PO-2026-0055",
          projectId: projId,
          purchaseType: "BULK_CONTRACT_PO",
          materialSummary: "120m3 Ready-Mix Concrete C-30/37",
          carrierName: "Apex Ready-Mix Fleet Batch 2",
          driverName: "Yonas Mekonnen",
          driverPhone: "+251-935-776102",
          vehiclePlate: "ET-3-31405-AA",
          originLocation: "Apex Central Batching Plant (Sebeta)",
          currentLocation: "Apex Central Batching Plant (Sebeta)",
          destinationSite: "Addis Heights Tower - Basement Foundation",
          status: "AT_SUPPLIER_HUB",
          progressPercentage: 30,
          estimatedArrival: new Date(Date.now() + 86400000 * 2),
          checkpoints: [
            {
              stage: "Order Confirmed",
              locationName: "Sebeta Batching Plant",
              timestamp: new Date(Date.now() - 3600000 * 12),
              statusNote: "Aggregates washed & moisture tests logged. Batch mixing scheduled.",
              loggedBy: "Plant Supervisor Tariku",
              conditionOnCheck: "INTACT",
            },
          ],
        },
      ];

      await DeliveryTracking.insertMany(seedData);
      items = await DeliveryTracking.find(query)
        .populate("projectId", "name projectCode location")
        .sort({ updatedAt: -1 })
        .lean();
    }

    return ok({ items, total: items.length });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: Request) {
  const guard = await requireAuth(request);
  if (guard.error) return guard.error;

  try {
    await connectToDatabase();
    const body = await request.json();

    // Action 1: Add new checkpoint to an existing shipment
    if (body.action === "ADD_CHECKPOINT" && body.trackingId) {
      const tracking = await DeliveryTracking.findById(body.trackingId);
      if (!tracking) {
        return fail("NOT_FOUND", "Tracking record not found", 404);
      }

      const stage = body.stage || tracking.status;
      const newCheckpoint = {
        stage,
        locationName: body.locationName,
        timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
        statusNote: body.statusNote || "",
        loggedBy: `${guard.user.fullName} (${guard.user.role})`,
        conditionOnCheck: body.conditionOnCheck || "INTACT",
      };

      tracking.checkpoints.push(newCheckpoint);
      tracking.currentLocation = body.locationName;
      if (body.stage) {
        tracking.status = body.stage;
        tracking.progressPercentage = STAGE_PROGRESS[body.stage] ?? tracking.progressPercentage;
      }
      await tracking.save();

      return ok(tracking, "Checkpoint logged successfully", 200);
    }

    // Action 2: Create new delivery record
    const trackingNumber =
      body.trackingNumber || `TRK-ET-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newDelivery = await DeliveryTracking.create({
      trackingNumber,
      poNumber: body.poNumber || "PO-DIRECT",
      purchaseOrderId: body.purchaseOrderId && mongoose.Types.ObjectId.isValid(body.purchaseOrderId) ? body.purchaseOrderId : undefined,
      projectId: body.projectId,
      supplierId: body.supplierId && mongoose.Types.ObjectId.isValid(body.supplierId) ? body.supplierId : undefined,
      purchaseType: body.purchaseType || "BULK_CONTRACT_PO",
      materialSummary: body.materialSummary || "Construction Materials",
      carrierName: body.carrierName || "National Haulage Transport",
      driverName: body.driverName || "Driver Assigner",
      driverPhone: body.driverPhone || "+251-911-000000",
      vehiclePlate: body.vehiclePlate || "ET-3-00000-AA",
      originLocation: body.originLocation || "Supplier Terminal",
      currentLocation: body.originLocation || "Supplier Terminal",
      destinationSite: body.destinationSite || "Site Gate",
      status: body.status || "ORDER_CONFIRMED",
      progressPercentage: STAGE_PROGRESS[body.status || "ORDER_CONFIRMED"] || 15,
      estimatedArrival: body.estimatedArrival ? new Date(body.estimatedArrival) : new Date(Date.now() + 86400000 * 2),
      checkpoints: [
        {
          stage: "Order Confirmed",
          locationName: body.originLocation || "Supplier Terminal",
          timestamp: new Date(),
          statusNote: "Shipment registered in ERP telemetry tracker",
          loggedBy: `${guard.user.fullName} (${guard.user.role})`,
          conditionOnCheck: "INTACT",
        },
      ],
    });

    return ok(newDelivery, "Delivery tracking created successfully", 201);
  } catch (err) {
    return handleError(err);
  }
}
