import test from "node:test";
import assert from "node:assert/strict";

test("Material Measurement Units & Quality Specs - Standard Construction Units Validation", () => {
  const validUnits = ["bags", "tonne", "tons", "kg", "m3", "m2", "m", "meters", "pcs", "pieces", "liters", "boxes", "rolls"];
  
  for (const unit of validUnits) {
    assert.ok(typeof unit === "string" && unit.length > 0, `Unit ${unit} is valid`);
  }

  // Unit conversion helper
  function convertQuantity(qty, fromUnit, toUnit) {
    if (fromUnit === toUnit) return qty;
    if (fromUnit === "tonne" && toUnit === "kg") return qty * 1000;
    if (fromUnit === "kg" && toUnit === "tonne") return qty / 1000;
    if (fromUnit === "bags" && toUnit === "kg") return qty * 50; // standard 50kg cement bag
    if (fromUnit === "kg" && toUnit === "bags") return qty / 50;
    return qty;
  }

  assert.equal(convertQuantity(2, "tonne", "kg"), 2000);
  assert.equal(convertQuantity(500, "kg", "tonne"), 0.5);
  assert.equal(convertQuantity(20, "bags", "kg"), 1000);
  assert.equal(convertQuantity(1000, "kg", "bags"), 20);
});

test("Purchase Requisition - Line Items Valuation & Multi-Unit Aggregation", () => {
  const items = [
    { materialName: "Portland Pozzolana Cement", unitOfMeasure: "bags", specifications: "Grade 42.5R", requestedQuantity: 100, estimatedUnitCost: 950 },
    { materialName: "High-Yield Deformed Rebar 16mm", unitOfMeasure: "tonne", specifications: "Grade 60 ASTM A615", requestedQuantity: 2.5, estimatedUnitCost: 140000 },
    { materialName: "C-25 Structural Concrete Sand", unitOfMeasure: "m3", specifications: "Washed River Sand", requestedQuantity: 20, estimatedUnitCost: 1800 },
  ];

  const totalEstimatedCost = items.reduce((sum, it) => sum + (it.requestedQuantity * it.estimatedUnitCost), 0);
  assert.equal(totalEstimatedCost, (100 * 950) + (2.5 * 140000) + (20 * 1800)); // 95,000 + 350,000 + 36,000 = 481,000 ETB
  assert.equal(totalEstimatedCost, 481000);
});

test("Purchase Requisition - Project Budget Check Logic", () => {
  function evaluateBudgetStatus(totalEstimatedCost, projectBudget, amountSpent, committedCost) {
    const remaining = Math.max(0, projectBudget - amountSpent - committedCost);
    if (projectBudget <= 0) return "WITHIN_BUDGET";
    if (totalEstimatedCost > remaining) return "BUDGET_EXCEEDED";
    if (totalEstimatedCost > remaining * 0.8) return "BUDGET_WARNING";
    return "WITHIN_BUDGET";
  }

  // Case 1: Healthy budget remaining (1,000,000 budget, 200,000 spent -> 800,000 remaining, req 200,000 -> 25% of remaining)
  assert.equal(evaluateBudgetStatus(200000, 1000000, 200000, 0), "WITHIN_BUDGET");

  // Case 2: Near limit warning (>80% of remaining balance: 800,000 remaining, req 700,000 -> 87.5%)
  assert.equal(evaluateBudgetStatus(700000, 1000000, 200000, 0), "BUDGET_WARNING");

  // Case 3: Over budget (req 900,000 vs 800,000 remaining)
  assert.equal(evaluateBudgetStatus(900000, 1000000, 200000, 0), "BUDGET_EXCEEDED");
});

test("Purchase Requisition - Self-Approval Protection", () => {
  function canUserApproveRequisition(requesterId, approverUser) {
    if (!approverUser) return false;
    // Super Admin / Company Admin can override
    if (approverUser.role === "Super Admin" || approverUser.role === "Company Admin") {
      return true;
    }
    // Self-approval is strictly forbidden
    if (String(requesterId) === String(approverUser.id)) {
      return false;
    }
    // Must have approval permission
    return approverUser.role === "Project Manager" || approverUser.role === "Admin";
  }

  const requester = { id: "user-123", role: "Site Engineer" };
  const approverPm = { id: "user-456", role: "Project Manager" };
  const superAdmin = { id: "user-123", role: "Super Admin" };

  // Engineer cannot approve their own request
  assert.equal(canUserApproveRequisition(requester.id, requester), false);

  // Independent PM can approve
  assert.equal(canUserApproveRequisition(requester.id, approverPm), true);

  // Super Admin can approve even if same ID in emergency override
  assert.equal(canUserApproveRequisition(requester.id, superAdmin), true);
});

test("Delivery Tracking & GRN Inspection - Partial Receipt & Discrepancy Accounting", () => {
  function evaluateReceiptItem(orderedQty, receivedQty, rejectedQty) {
    const acceptedQty = Math.max(0, receivedQty - rejectedQty);
    const remainingToDeliver = Math.max(0, orderedQty - acceptedQty);
    const hasDiscrepancy = rejectedQty > 0 || receivedQty < orderedQty;
    return {
      acceptedQty,
      remainingToDeliver,
      hasDiscrepancy,
      status: rejectedQty > 0 ? "DISCREPANCY_FLAGGED" : remainingToDeliver === 0 ? "FULLY_DELIVERED" : "PARTIAL_DELIVERY",
    };
  }

  // Case 1: Perfect full delivery (ordered 500, received 500, rejected 0)
  const full = evaluateReceiptItem(500, 500, 0);
  assert.equal(full.acceptedQty, 500);
  assert.equal(full.remainingToDeliver, 0);
  assert.equal(full.hasDiscrepancy, false);
  assert.equal(full.status, "FULLY_DELIVERED");

  // Case 2: Partial delivery (ordered 500, received 200, rejected 0)
  const partial = evaluateReceiptItem(500, 200, 0);
  assert.equal(partial.acceptedQty, 200);
  assert.equal(partial.remainingToDeliver, 300);
  assert.equal(partial.hasDiscrepancy, true);
  assert.equal(partial.status, "PARTIAL_DELIVERY");

  // Case 3: Damaged goods with rejection (ordered 500, received 500, rejected 50 damaged bags)
  const damaged = evaluateReceiptItem(500, 500, 50);
  assert.equal(damaged.acceptedQty, 450);
  assert.equal(damaged.remainingToDeliver, 50);
  assert.equal(damaged.hasDiscrepancy, true);
  assert.equal(damaged.status, "DISCREPANCY_FLAGGED");
});

