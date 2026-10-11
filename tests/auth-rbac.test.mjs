import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import {
  ROLE_PERMISSIONS,
  getRolePermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from "../lib/rbac/permissions.ts";

test("Authentication & Password Security", async () => {
  const password = "SecurePassword2026!";
  const hash = await bcrypt.hash(password, 12);

  assert.equal(typeof hash, "string");
  assert.ok(hash.startsWith("$2"), "Hash must be valid bcrypt string");

  const match = await bcrypt.compare(password, hash);
  assert.equal(match, true, "Valid password must match hash");

  const wrongMatch = await bcrypt.compare("WrongPassword", hash);
  assert.equal(wrongMatch, false, "Invalid password must not match hash");
});

test("RBAC - Role Default Permissions", () => {
  // Super Admin & Admin have wildcard
  assert.ok(hasPermission({ role: "Super Admin" }, "projects.read"));
  assert.ok(hasPermission({ role: "Admin" }, "finance.approve"));
  assert.ok(hasPermission({ role: "Company Admin" }, "users.manage"));

  // Project Manager
  assert.ok(hasPermission({ role: "Project Manager" }, "PROJECT_CREATE"));
  assert.ok(hasPermission({ role: "Project Manager" }, "TASK_UPDATE"));

  // Site Engineer should NOT have finance approval
  assert.equal(hasPermission({ role: "Site Engineer" }, "EXPENSE_APPROVE"), false);

  // Storekeeper should have goods receipt & inventory
  assert.ok(hasPermission({ role: "Storekeeper" }, "GOODS_RECEIPT_CREATE"));
  assert.ok(hasPermission({ role: "Storekeeper" }, "inventory.receive"));
  assert.equal(hasPermission({ role: "Storekeeper" }, "EXPENSE_CREATE"), false);

  // Viewer should be strictly read-only
  assert.ok(hasPermission({ role: "Viewer" }, "projects.read"));
  assert.equal(hasPermission({ role: "Viewer" }, "projects.create"), false);
  assert.equal(hasPermission({ role: "Viewer" }, "tasks.create"), false);
});

test("RBAC - Explicit User Custom Permissions Override", () => {
  // Worker normally cannot create tasks
  const normalWorker = { role: "Worker" };
  assert.equal(hasPermission(normalWorker, "tasks.create"), false);

  // Worker with custom permission override can create tasks
  const privilegedWorker = {
    role: "Worker",
    customPermissions: ["tasks.create", "finance.read"],
  };
  assert.equal(hasPermission(privilegedWorker, "tasks.create"), true);
  assert.equal(hasPermission(privilegedWorker, "finance.read"), true);
  assert.equal(hasPermission(privilegedWorker, "finance.approve"), false);
});

test("RBAC - Permission Aliasing", () => {
  const pm = { role: "Project Manager" };
  // Checking either PROJECT_VIEW or projects.read should resolve to true
  assert.ok(hasPermission(pm, "PROJECT_VIEW"));
  assert.ok(hasPermission(pm, "projects.read"));

  // Checking either FINANCE_VIEW or finance.read
  assert.ok(hasPermission(pm, "FINANCE_VIEW"));
  assert.ok(hasPermission(pm, "finance.read"));
});
