import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import {
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

  // Site Engineer permissions: must have FINANCE_VIEW, PROJECT_VIEW, PROJECT_CREATE, BUDGET_VIEW, BUDGET_CREATE, TASK_VIEW
  assert.ok(hasPermission({ role: "Site Engineer" }, "FINANCE_VIEW"));
  assert.ok(hasPermission({ role: "Site Engineer" }, "PROJECT_VIEW"));
  assert.ok(hasPermission({ role: "Site Engineer" }, "PROJECT_CREATE"));
  assert.ok(hasPermission({ role: "Site Engineer" }, "BUDGET_VIEW"));
  assert.ok(hasPermission({ role: "Site Engineer" }, "BUDGET_CREATE"));
  assert.ok(hasPermission({ role: "Site Engineer" }, "TASK_VIEW"));
  assert.ok(hasPermission({ role: "Site Engineer" }, "finance.read"));
  assert.ok(hasPermission({ role: "Site Engineer" }, "finance.create"));

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

test("RBAC - Helper Functions (hasAnyPermission, hasAllPermissions, getRolePermissions)", () => {
  const admin = { role: "Admin" };
  assert.ok(hasAnyPermission(admin, ["projects.read", "nonexistent.perm"]));
  assert.ok(hasAllPermissions(admin, ["projects.read", "finance.approve"]));

  const perms = getRolePermissions("Storekeeper");
  assert.ok(perms.includes("GOODS_RECEIPT_CREATE"));
  assert.ok(perms.includes("inventory.receive"));
});

test("Security - sanitizeMongoUrl strips sensitive database credentials", () => {
  const sanitizeMongoUrl = (text) =>
    text ? text.replace(/(mongodb(?:\+srv)?:\/\/)[^:]+:[^@]+@/gi, "$1<credentials-hidden>@") : "";

  const atlasSrv = "mongodb+srv://admin_user:SuperSecretPassword123@cluster0.zm7lnui.mongodb.net/construction_erp?retryWrites=true";
  const sanitizedSrv = sanitizeMongoUrl(atlasSrv);
  assert.ok(!sanitizedSrv.includes("SuperSecretPassword123"));
  assert.ok(!sanitizedSrv.includes("admin_user:"));
  assert.ok(sanitizedSrv.includes("<credentials-hidden>@"));

  const directReplica = "mongodb://db_user:my_secret_pass@shard1.net:27017,shard2.net:27017/db?ssl=true";
  const sanitizedDirect = sanitizeMongoUrl(directReplica);
  assert.ok(!sanitizedDirect.includes("my_secret_pass"));
  assert.ok(!sanitizedDirect.includes("db_user:"));
  assert.ok(sanitizedDirect.includes("<credentials-hidden>@"));
});

test("Authentication - Secret Resolution Supports NEXTAUTH_SECRET and AUTH_SECRET Fallbacks", () => {
  function resolveSecret(env) {
    return env.JWT_SECRET || env.NEXTAUTH_SECRET || env.AUTH_SECRET || null;
  }

  assert.equal(resolveSecret({ JWT_SECRET: "jwt_key_123" }), "jwt_key_123");
  assert.equal(resolveSecret({ NEXTAUTH_SECRET: "nextauth_key_456" }), "nextauth_key_456");
  assert.equal(resolveSecret({ AUTH_SECRET: "auth_key_789" }), "auth_key_789");
  assert.equal(resolveSecret({ JWT_SECRET: "jwt_primary", NEXTAUTH_SECRET: "nextauth_secondary" }), "jwt_primary");
  assert.equal(resolveSecret({}), null);
});

test("RBAC - Contractor and Supplier Operational Roles", () => {
  // Contractor role
  assert.ok(hasPermission({ role: "Contractor" }, "TASK_UPDATE"));
  assert.ok(hasPermission({ role: "Contractor" }, "tasks.read"));
  assert.ok(hasPermission({ role: "Contractor" }, "MATERIAL_REQUEST_VIEW"));
  assert.equal(hasPermission({ role: "Contractor" }, "EXPENSE_APPROVE"), false);

  // Supplier role
  assert.ok(hasPermission({ role: "Supplier" }, "MATERIAL_VIEW"));
  assert.ok(hasPermission({ role: "Supplier" }, "procurement.read"));
  assert.ok(hasPermission({ role: "Supplier" }, "PURCHASE_ORDER_VIEW"));
  assert.equal(hasPermission({ role: "Supplier" }, "PROJECT_DELETE"), false);
});

test("Authentication - Email Validation and First-Time Google Onboarding Logic", () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  assert.ok(emailRegex.test("engineer.marta@gmail.com"));
  assert.ok(emailRegex.test("user@apexdev.et"));
  assert.equal(emailRegex.test("invalid-email"), false);
  assert.equal(emailRegex.test("missing@domain"), false);
  assert.equal(emailRegex.test("@no-local.com"), false);

  // Simulating Google OAuth onboarding condition check
  function evaluateGoogleAuth(user, isCompleteOnboarding) {
    if (!user && !isCompleteOnboarding) {
      return { action: "PROMPT_ROLE_ONBOARDING", needsRole: true };
    }
    if (!user && isCompleteOnboarding) {
      return { action: "REGISTER_WITH_ROLE", needsRole: false };
    }
    return { action: "SIGN_IN_EXISTING", needsRole: false };
  }

  assert.deepEqual(evaluateGoogleAuth(null, false), {
    action: "PROMPT_ROLE_ONBOARDING",
    needsRole: true,
  });
  assert.deepEqual(evaluateGoogleAuth(null, true), {
    action: "REGISTER_WITH_ROLE",
    needsRole: false,
  });
  assert.deepEqual(evaluateGoogleAuth({ id: "123", role: "Site Engineer" }, false), {
    action: "SIGN_IN_EXISTING",
    needsRole: false,
  });
});

test("Ethiopian Hierarchical Location Offline Dataset Integrity", async () => {
  const { OFFLINE_ETHIOPIAN_REGIONS, DEFAULT_OFFLINE_COUNTRIES } = await import(
    "../lib/geo/ethiopia-locations.ts"
  );

  // Country check
  assert.equal(DEFAULT_OFFLINE_COUNTRIES.length, 1);
  assert.equal(DEFAULT_OFFLINE_COUNTRIES[0].name, "Ethiopia");
  assert.equal(DEFAULT_OFFLINE_COUNTRIES[0].countryCode, "ETH");

  // 7 Authentic Regions check
  assert.equal(OFFLINE_ETHIOPIAN_REGIONS.length, 7);
  const regionNames = OFFLINE_ETHIOPIAN_REGIONS.map((r) => r.name);
  assert.ok(regionNames.includes("Addis Ababa"));
  assert.ok(regionNames.includes("Oromia"));
  assert.ok(regionNames.includes("Amhara"));
  assert.ok(regionNames.includes("Tigray"));
  assert.ok(regionNames.includes("Sidama"));
  assert.ok(regionNames.includes("Dire Dawa"));
  assert.ok(regionNames.includes("Somali"));

  // Addis Ababa 11 subcities check
  const addis = OFFLINE_ETHIOPIAN_REGIONS.find((r) => r.name === "Addis Ababa");
  assert.ok(addis);
  assert.equal(addis.cities.length, 11);
  const subcityNames = addis.cities.map((c) => c.name);
  assert.ok(subcityNames.includes("Bole Sub-City"));
  assert.ok(subcityNames.includes("Kirkos Sub-City"));
  assert.ok(subcityNames.includes("Yeka Sub-City"));
  assert.ok(subcityNames.includes("Arada Sub-City"));
  assert.ok(subcityNames.includes("Lideta Sub-City"));
  assert.ok(subcityNames.includes("Addis Ketema Sub-City"));
  assert.ok(subcityNames.includes("Gullele Sub-City"));
  assert.ok(subcityNames.includes("Kolfe Keranio Sub-City"));
  assert.ok(subcityNames.includes("Akaki Kality Sub-City"));
  assert.ok(subcityNames.includes("Nifas Silk-Lafto Sub-City"));
  assert.ok(subcityNames.includes("Lemi Kura Sub-City"));
});

