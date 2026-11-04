import assert from "node:assert/strict";
import test from "node:test";
import { prepareQuote } from "../quote-demo.js";

test("sample quotes use known products and complete valid requirements", () => {
  const sample = { sku: "DEMO-BIN-M", quantity: 25, requirements: "Parts storage", region: "Brussels" };
  assert.equal(prepareQuote(sample).product.name, "Medium storage bin");
  assert.equal(prepareQuote({ ...sample, quantity: "25" }).quantity, 25);
  assert.equal(prepareQuote(sample).demo, true);
  assert.equal(prepareQuote(sample).approved, undefined);
  for (const invalid of [{ sku: "invented" }, { quantity: true }, { quantity: 1.5 }, { quantity: 0 }, { quantity: 10001 }, { requirements: " " }, { region: "x".repeat(161) }]) assert.throws(() => prepareQuote({ ...sample, ...invalid }));
});
