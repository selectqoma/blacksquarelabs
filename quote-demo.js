export const catalogue = [
  { sku: "DEMO-BIN-S", name: "Small storage bin", dimensions: "300 × 200 × 150 mm", material: "Polypropylene", colour: "Grey" },
  { sku: "DEMO-BIN-M", name: "Medium storage bin", dimensions: "400 × 300 × 220 mm", material: "Polypropylene", colour: "Blue" },
  { sku: "DEMO-BIN-L", name: "Large storage bin", dimensions: "600 × 400 × 320 mm", material: "Polypropylene", colour: "Grey" },
];

export function prepareQuote(input) {
  if (!input || typeof input !== "object") throw new Error("Provide the product and your requirements.");
  const product = catalogue.find((item) => item.sku === input.sku);
  if (!product) throw new Error("Choose a product from the sample catalogue.");
  if (!["string", "number"].includes(typeof input.quantity) || !/^[0-9]+$/.test(String(input.quantity))) throw new Error("Quantity must be a whole number from 1 to 10,000.");
  const quantity = Number(input.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10000) throw new Error("Quantity must be a whole number from 1 to 10,000.");
  for (const [key, limit] of [["requirements", 500], ["region", 160]]) {
    if (typeof input[key] !== "string" || !input[key].trim() || input[key].length > limit) throw new Error(`Provide ${key} using no more than ${limit} characters.`);
  }
  return { demo: true, product: { ...product }, quantity, requirements: input.requirements.trim(), region: input.region.trim() };
}

if (typeof document !== "undefined") {
  const form = document.getElementById("quoteForm");
  const status = document.getElementById("status");
  const result = document.getElementById("result");
  const approved = document.getElementById("approved");
  let downloadUrl;
  for (const product of catalogue) {
    const card = document.createElement("article");
    card.className = "product";
    const title = document.createElement("h3");
    title.textContent = product.name;
    const details = document.createElement("p");
    details.textContent = `${product.sku} · ${product.dimensions} · ${product.material} · ${product.colour}`;
    card.append(title, details);
    document.getElementById("catalogue").append(card);
    form.elements.sku.add(new Option(product.name, product.sku));
  }
  function clearResult() {
    result.hidden = true;
    status.textContent = "";
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    downloadUrl = undefined;
  }
  form.addEventListener("input", (event) => { clearResult(); if (event.target !== approved) approved.checked = false; });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity() || !approved.checked) return;
    try {
      const quote = prepareQuote(Object.fromEntries(new FormData(form)));
      const record = { ...quote, reference: `DEMO-${crypto.randomUUID().slice(0, 8)}`, approved: true, delivery_status: "not_sent" };
      clearResult();
      const content = JSON.stringify(record, null, 2);
      document.getElementById("requestText").textContent = content;
      downloadUrl = URL.createObjectURL(new Blob([content], { type: "application/json" }));
      const link = document.getElementById("download");
      link.href = downloadUrl;
      link.download = `${record.reference}.json`;
      result.hidden = false;
      status.textContent = "Sample request created locally. Nothing has been sent.";
    } catch (error) { status.textContent = error.message; }
    status.focus();
  });
  if (document.modelContext?.registerTool) {
    const registerTools = async () => { try {
      await document.modelContext.registerTool({ name: "get_sample_catalogue", description: "Read a fictional storage-bin catalogue for the Blacksquare Labs prototype. No live prices, stock or suitability claims.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: () => ({ demo: true, products: catalogue }) });
      await document.modelContext.registerTool({
        name: "prepare_sample_quote", description: "Fill the visible prototype form from the customer's stated requirements. Does not approve, send or download anything. Ask the customer to review the form and create the local sample request.",
        inputSchema: { type: "object", properties: { sku: { type: "string", enum: catalogue.map((item) => item.sku) }, quantity: { type: "integer", minimum: 1, maximum: 10000 }, requirements: { type: "string", minLength: 1, maxLength: 500 }, region: { type: "string", minLength: 1, maxLength: 160 } }, required: ["sku", "quantity", "requirements", "region"], additionalProperties: false },
        annotations: { readOnlyHint: false },
        execute(input) {
          const quote = prepareQuote(input);
          for (const key of ["sku", "quantity", "requirements", "region"]) form.elements.namedItem(key).value = key === "sku" ? quote.product.sku : quote[key];
          approved.checked = false;
          clearResult();
          status.textContent = "Your sample enquiry is ready. Review it and confirm the details before creating a local request.";
          status.focus();
          return { status: "prepared_for_review", demo: true, sent: false };
        },
      });
      document.getElementById("assistantStatus").textContent = "This browser exposes the sample catalogue and form preparation to compatible assistants. You review and confirm the details.";
    } catch { /* The visible form remains available if browser tools are unavailable. */ } };
    void registerTools();
  }
}
