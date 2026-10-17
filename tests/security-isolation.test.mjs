import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { checkRateLimit } from "../lib/auth/rate-limit.ts";
import { ZodError } from "zod";

// =========================================================================
// 1. Rate Limiting Tests
// =========================================================================
test("Rate Limiter - Enforces Maximum Request Limits", () => {
  const testKey = `test-ip-${Date.now()}-limit`;
  const options = { max: 3, windowMs: 60000 };

  // Attempt 1: Allowed, 2 remaining
  const r1 = checkRateLimit(testKey, options);
  assert.equal(r1.allowed, true);
  assert.equal(r1.remaining, 2);

  // Attempt 2: Allowed, 1 remaining
  const r2 = checkRateLimit(testKey, options);
  assert.equal(r2.allowed, true);
  assert.equal(r2.remaining, 1);

  // Attempt 3: Allowed, 0 remaining
  const r3 = checkRateLimit(testKey, options);
  assert.equal(r3.allowed, true);
  assert.equal(r3.remaining, 0);

  // Attempt 4: Blocked!
  const r4 = checkRateLimit(testKey, options);
  assert.equal(r4.allowed, false);
  assert.equal(r4.remaining, 0);

  // Attempt 5: Still Blocked!
  const r5 = checkRateLimit(testKey, options);
  assert.equal(r5.allowed, false);
});

test("Rate Limiter - Distinct IP / User Keys Are Isolated", () => {
  const ipA = `test-ip-A-${Date.now()}`;
  const ipB = `test-ip-B-${Date.now()}`;
  const options = { max: 2, windowMs: 60000 };

  checkRateLimit(ipA, options);
  checkRateLimit(ipA, options);
  const ipABlocked = checkRateLimit(ipA, options);
  assert.equal(ipABlocked.allowed, false, "IP A should be blocked after exceeding limit");

  // IP B should still be allowed
  const ipBAllowed = checkRateLimit(ipB, options);
  assert.equal(ipBAllowed.allowed, true, "IP B should NOT be blocked by IP A's traffic");
  assert.equal(ipBAllowed.remaining, 1);
});

// =========================================================================
// 2. Multi-Tenant Access Control & Project Isolation Logic Tests
// =========================================================================
test("Project Access Control - ObjectId Validation", () => {
  const isValid = (id) => typeof id === "string" && mongoose.Types.ObjectId.isValid(id);

  assert.equal(isValid(""), false);
  assert.equal(isValid(null), false);
  assert.equal(isValid(undefined), false);
  assert.equal(isValid("123"), false);
  assert.equal(isValid("../secrets/env"), false);
  assert.equal(isValid("64f1a2b3c4d5e6f7a8b9c0d1"), true);
});

test("Project Access Control - Cross-Organization Isolation Logic", () => {
  function evaluateAccess(user, project) {
    if (user.role === "Super Admin" || user.role === "Admin") return true;

    const projectOrgId = project.organizationId ? String(project.organizationId) : null;
    const userOrgId = user.organizationId ? String(user.organizationId) : null;

    if (projectOrgId && userOrgId && projectOrgId !== userOrgId) return false;
    if (userOrgId && projectOrgId && userOrgId !== projectOrgId) return false;

    if (user.role === "Company Admin") {
      return userOrgId ? projectOrgId === userOrgId : !projectOrgId;
    }

    if (user.assignedProjects?.includes(String(project._id))) return true;

    const isPM = project.projectManager && String(project.projectManager) === String(user.id);
    const isTeam = Array.isArray(project.teamMembers) &&
      project.teamMembers.some((m) => String(m) === String(user.id));

    return Boolean(isPM || isTeam);
  }

  const org1 = "64f1a2b3c4d5e6f7a8b9c001";
  const org2 = "64f1a2b3c4d5e6f7a8b9c002";
  const proj1Org1 = { _id: "64f1a2b3c4d5e6f7a8b9c011", organizationId: org1, projectManager: "u1" };
  const proj2Org2 = { _id: "64f1a2b3c4d5e6f7a8b9c012", organizationId: org2, projectManager: "u2" };

  // Super Admin can access both
  const superAdmin = { id: "sa1", role: "Super Admin", organizationId: org1 };
  assert.equal(evaluateAccess(superAdmin, proj1Org1), true);
  assert.equal(evaluateAccess(superAdmin, proj2Org2), true);

  // Company Admin of Org1 can access Org1 project, but NEVER Org2 project
  const adminOrg1 = { id: "ca1", role: "Company Admin", organizationId: org1 };
  assert.equal(evaluateAccess(adminOrg1, proj1Org1), true);
  assert.equal(evaluateAccess(adminOrg1, proj2Org2), false, "Org1 Admin MUST NOT access Org2 project");

  // User with explicit assignment can access
  const workerAssigned = { id: "w1", role: "Worker", organizationId: org1, assignedProjects: [proj1Org1._id] };
  assert.equal(evaluateAccess(workerAssigned, proj1Org1), true);

  // User without assignment and not on team cannot access
  const unassignedWorker = { id: "w2", role: "Worker", organizationId: org1, assignedProjects: [] };
  assert.equal(evaluateAccess(unassignedWorker, proj1Org1), false);
});

// =========================================================================
// 3. API Error Sanitization Logic Tests
// =========================================================================
function sanitizeError(error, isProd = false) {
  if (error instanceof ZodError) {
    const errorDetails = error.issues.map((i) => {
      const fieldPath = i.path.join(".");
      return fieldPath ? `${fieldPath}: ${i.message}` : i.message;
    });
    return {
      status: 422,
      code: "VALIDATION_ERROR",
      message: errorDetails.length > 0 ? `Validation failed (${errorDetails.join(", ")})` : "Invalid request data",
    };
  }

  const safeMessage = isProd
    ? "An unexpected internal server error occurred"
    : error instanceof Error
      ? error.message
      : "An unexpected server error occurred";

  return {
    status: 500,
    code: "INTERNAL_ERROR",
    message: safeMessage,
  };
}

test("Error Sanitization - Production Environment Masks Database Details", () => {
  const sensitiveDbError = new Error("MongoServerError: Authentication failed on mongodb+srv://admin:secretPass@cluster0.net");
  const result = sanitizeError(sensitiveDbError, true);

  assert.equal(result.status, 500);
  assert.equal(result.code, "INTERNAL_ERROR");
  assert.equal(result.message, "An unexpected internal server error occurred");
  assert.ok(!result.message.includes("mongodb+srv"));
  assert.ok(!result.message.includes("secretPass"));
});

test("Error Sanitization - Validation Errors Expose Field Details Cleanly", () => {
  const zodError = new ZodError([
    {
      code: "invalid_type",
      expected: "string",
      received: "undefined",
      path: ["title"],
      message: "Required",
    },
  ]);

  const result = sanitizeError(zodError, true);

  assert.equal(result.status, 422);
  assert.equal(result.code, "VALIDATION_ERROR");
  assert.ok(result.message.includes("title: Required"));
});

// =========================================================================
// 4. Cross-Organization Write & Mutation Authorization Tests
// =========================================================================
test("Cross-Organization Mutation - Unauthorized Writes Across Tenant Boundaries", () => {
  function canMutateProjectResource(user, project) {
    if (user.role === "Super Admin" || user.role === "Admin") return { allowed: true };

    const projectOrgId = project.organizationId ? String(project.organizationId) : null;
    const userOrgId = user.organizationId ? String(user.organizationId) : null;

    if (projectOrgId && userOrgId && projectOrgId !== userOrgId) {
      return { allowed: false, reason: "CROSS_ORGANIZATION_ACCESS_DENIED" };
    }

    if (user.role === "Company Admin") {
      const match = userOrgId ? projectOrgId === userOrgId : !projectOrgId;
      return match ? { allowed: true } : { allowed: false, reason: "ORGANIZATION_MISMATCH" };
    }

    const isPM = project.projectManager && String(project.projectManager) === String(user.id);
    const isAssigned = user.assignedProjects?.includes(String(project._id));

    if (isPM || isAssigned) return { allowed: true };
    return { allowed: false, reason: "UNASSIGNED_PROJECT" };
  }

  const orgA = "64f1a2b3c4d5e6f7a8b9c101";
  const orgB = "64f1a2b3c4d5e6f7a8b9c102";
  const projectB = { _id: "64f1a2b3c4d5e6f7a8b9c202", organizationId: orgB, projectManager: "user-b-pm" };

  // 1. Company Admin from Org A tries to write to Project B
  const adminA = { id: "user-a-admin", role: "Company Admin", organizationId: orgA };
  const writeAttempt1 = canMutateProjectResource(adminA, projectB);
  assert.equal(writeAttempt1.allowed, false);
  assert.equal(writeAttempt1.reason, "CROSS_ORGANIZATION_ACCESS_DENIED");

  // 2. Project Manager from Org A tries to write to Project B
  const pmA = { id: "user-a-pm", role: "Project Manager", organizationId: orgA };
  const writeAttempt2 = canMutateProjectResource(pmA, projectB);
  assert.equal(writeAttempt2.allowed, false);
  assert.equal(writeAttempt2.reason, "CROSS_ORGANIZATION_ACCESS_DENIED");
});

// =========================================================================
// 5. Goods Receipt & Inventory Idempotency Tests
// =========================================================================
test("Goods Receipt Integrity - Idempotency and Over-Receipt Protection", () => {
  function validateReceiptPosting(po, newReceipt, existingReceipts) {
    if (!po) return { valid: false, code: 404, error: "PO_NOT_FOUND" };
    if (po.status === "COMPLETED") return { valid: false, code: 400, error: "PO_ALREADY_COMPLETED" };
    if (po.status === "CANCELLED") return { valid: false, code: 400, error: "PO_CANCELLED" };

    // Duplicate check on deliveryNoteNumber
    if (newReceipt.deliveryNoteNumber) {
      const duplicate = existingReceipts.some(
        (r) => r.purchaseOrderId === newReceipt.purchaseOrderId &&
               r.deliveryNoteNumber === newReceipt.deliveryNoteNumber
      );
      if (duplicate) return { valid: false, code: 409, error: "DUPLICATE_DELIVERY_NOTE" };
    }

    // Over-receipt check
    for (const item of newReceipt.items) {
      const poItem = po.items.find((p) => p.materialId === item.materialId);
      if (!poItem) return { valid: false, code: 422, error: "ITEM_NOT_IN_PO" };
      const remaining = poItem.quantity - (poItem.receivedQuantity || 0);
      if (item.receivedQuantity > remaining) {
        return { valid: false, code: 422, error: "OVER_RECEIPT_EXCEEDS_REMAINING" };
      }
    }

    return { valid: true };
  }

  const samplePO = {
    _id: "po-1",
    status: "ISSUED",
    items: [
      { materialId: "mat-cement", quantity: 100, receivedQuantity: 30 },
      { materialId: "mat-rebar", quantity: 50, receivedQuantity: 50 },
    ],
  };

  const existingReceipts = [
    { purchaseOrderId: "po-1", deliveryNoteNumber: "DN-1001", grnNumber: "GRN-2026-001" },
  ];

  // 1. Retry with same Delivery Note -> Blocked (409 Duplicate)
  const duplicateSubmission = {
    purchaseOrderId: "po-1",
    deliveryNoteNumber: "DN-1001",
    items: [{ materialId: "mat-cement", receivedQuantity: 20 }],
  };
  const dupResult = validateReceiptPosting(samplePO, duplicateSubmission, existingReceipts);
  assert.equal(dupResult.valid, false);
  assert.equal(dupResult.code, 409);
  assert.equal(dupResult.error, "DUPLICATE_DELIVERY_NOTE");

  // 2. Attempting to receive more than remaining ordered quantity -> Blocked (422 Over-Receipt)
  const overReceiptSubmission = {
    purchaseOrderId: "po-1",
    deliveryNoteNumber: "DN-1002",
    items: [{ materialId: "mat-cement", receivedQuantity: 80 }], // Only 70 remaining
  };
  const overResult = validateReceiptPosting(samplePO, overReceiptSubmission, existingReceipts);
  assert.equal(overResult.valid, false);
  assert.equal(overResult.code, 422);
  assert.equal(overResult.error, "OVER_RECEIPT_EXCEEDS_REMAINING");

  // 3. Valid receipt within remaining threshold -> Allowed
  const validSubmission = {
    purchaseOrderId: "po-1",
    deliveryNoteNumber: "DN-1003",
    items: [{ materialId: "mat-cement", receivedQuantity: 50 }], // 50 <= 70 remaining
  };
  const validResult = validateReceiptPosting(samplePO, validSubmission, existingReceipts);
  assert.equal(validResult.valid, true);

  // 4. Receipt on Completed PO -> Blocked (400)
  const completedPO = { ...samplePO, status: "COMPLETED" };
  const completedResult = validateReceiptPosting(completedPO, validSubmission, existingReceipts);
  assert.equal(completedResult.valid, false);
  assert.equal(completedResult.code, 400);
});

