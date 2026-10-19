import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { resolveProjectCoordinates, ETHIOPIAN_CITIES, ETHIOPIA_MAP_DEFAULTS } from "../lib/geo/ethiopia.ts";

test("Ethiopian Geospatial - Authentic GeoJSON Regional Boundary Dataset", () => {
  const geojsonPath = path.resolve(process.cwd(), "public/data/ethiopia-regions.geojson");
  assert.ok(fs.existsSync(geojsonPath), "Regional GeoJSON file must exist");

  const raw = fs.readFileSync(geojsonPath, "utf8");
  const data = JSON.parse(raw);

  assert.strictEqual(data.type, "FeatureCollection", "Dataset must be a valid GeoJSON FeatureCollection");
  assert.ok(data.features.length >= 10, "Dataset must contain all Ethiopian regional boundaries");

  const regionNames = data.features.map(
    (f) => f.properties?.shapeName || f.properties?.name || ""
  );

  assert.ok(regionNames.some((n) => n.toLowerCase().includes("addis")), "Must include Addis Ababa");
  assert.ok(regionNames.some((n) => n.toLowerCase().includes("oromia")), "Must include Oromia");
  assert.ok(regionNames.some((n) => n.toLowerCase().includes("amhara")), "Must include Amhara");
  assert.ok(regionNames.some((n) => n.toLowerCase().includes("tigray")), "Must include Tigray");
});

test("Ethiopian Geospatial - Map Bounds and Defaults", () => {
  assert.strictEqual(ETHIOPIA_MAP_DEFAULTS.defaultZoom, 6);
  assert.ok(ETHIOPIA_MAP_DEFAULTS.center[0] >= 8.0 && ETHIOPIA_MAP_DEFAULTS.center[0] <= 10.0);
  assert.ok(ETHIOPIA_MAP_DEFAULTS.center[1] >= 38.0 && ETHIOPIA_MAP_DEFAULTS.center[1] <= 42.0);
  assert.ok(ETHIOPIAN_CITIES.length >= 15, "Must cover at least 15 Ethiopian cities and hubs");
});

test("Ethiopian Geospatial - Exact GPS Resolution", () => {
  const resolved = resolveProjectCoordinates({
    latitude: 9.032,
    longitude: 38.7469,
    location: "Special Survey Lot 4",
  });

  assert.ok(resolved, "Must resolve coordinates");
  assert.strictEqual(resolved.precision, "EXACT_GPS");
  assert.strictEqual(resolved.isVerified, true);
  assert.strictEqual(resolved.lat, 9.032);
  assert.strictEqual(resolved.lng, 38.7469);
});

test("Ethiopian Geospatial - Municipal Name Resolution (Addis Ababa, Hawassa, Modjo)", () => {
  const addis = resolveProjectCoordinates({
    location: "Kazanchis High-Rise, Addis Ababa",
  });
  assert.ok(addis);
  assert.strictEqual(addis.precision, "MUNICIPAL_VERIFIED");
  assert.strictEqual(addis.city, "Addis Ababa");
  assert.strictEqual(addis.isVerified, true);

  const hawassa = resolveProjectCoordinates({
    location: "Hawassa Eco-Industrial Extension Zone",
  });
  assert.ok(hawassa);
  assert.strictEqual(hawassa.city, "Hawassa");
  assert.strictEqual(hawassa.precision, "MUNICIPAL_VERIFIED");

  const modjo = resolveProjectCoordinates({
    location: "Modjo Dry Port Logistics Hub",
  });
  assert.ok(modjo);
  assert.strictEqual(modjo.city, "Modjo");
  assert.strictEqual(modjo.precision, "MUNICIPAL_VERIFIED");
});

test("Ethiopian Geospatial - Unverified Locations Handle Gracefully Without Fake Pinning", () => {
  const unmapped = resolveProjectCoordinates({
    location: "Unknown Overseas Subsidiary Location",
  });

  assert.strictEqual(unmapped, null, "Unmapped locations must not invent fake coordinates");
});

