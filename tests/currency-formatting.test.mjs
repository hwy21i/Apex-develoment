import test from "node:test";
import assert from "node:assert/strict";
import { formatCurrency, percentage } from "../lib/formatters/currency.ts";

test("Currency Formatting - Standard Ethiopian Birr (ETB)", () => {
  assert.equal(formatCurrency(0), "ETB 0");
  assert.equal(formatCurrency(1500), "ETB 1,500");
  assert.equal(formatCurrency(250000), "ETB 250,000");
  assert.equal(formatCurrency(10000000), "ETB 10,000,000");
});

test("Currency Formatting - Compact Millions Format", () => {
  assert.equal(formatCurrency(1000000, true), "ETB 1M");
  assert.equal(formatCurrency(2500000, true), "ETB 2.5M");
  assert.equal(formatCurrency(12000000, true), "ETB 12M");
  // Compact should not kick in below 1M
  assert.equal(formatCurrency(750000, true), "ETB 750,000");
});

test("Currency Formatting - Null / Undefined / NaN Edge Cases", () => {
  assert.equal(formatCurrency(null), "ETB 0");
  assert.equal(formatCurrency(undefined), "ETB 0");
  assert.equal(formatCurrency(NaN), "ETB 0");
});

test("Percentage Calculator Helper", () => {
  assert.equal(percentage(50, 100), 50);
  assert.equal(percentage(1, 4), 25);
  assert.equal(percentage(2, 3), 67);
  assert.equal(percentage(0, 100), 0);
  assert.equal(percentage(150, 100), 100, "Should clamp at 100");
  assert.equal(percentage(10, 0), 0, "Division by zero should be 0");
  assert.equal(percentage(10, -5), 0, "Negative total should return 0");
});

