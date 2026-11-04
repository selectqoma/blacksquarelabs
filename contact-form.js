document.querySelectorAll("[data-contact-form]").forEach((form) => {
  const button = form.querySelector("button[type='submit']");
  const status = form.querySelector("[data-form-status]");
  let requestId;
  form.addEventListener("input", () => { requestId = undefined; });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (button.disabled || !form.reportValidity()) return;
    const label = button.textContent;
    const fields = Object.fromEntries(new FormData(form));
    fields.campaign = (new URLSearchParams(location.search).get("utm_campaign") || "").slice(0, 200);
    requestId ||= crypto.randomUUID();
    fields.request_id = requestId;
    const controls = Array.from(form.elements).filter((control) => !control.disabled);
    controls.forEach((control) => { control.disabled = true; });
    button.textContent = "Sending…";
    form.setAttribute("aria-busy", "true");
    status.textContent = "Sending your request…";
    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(fields),
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.status !== "accepted") throw new Error(result?.error || "I could not confirm your request was sent. Your message is still here; retry or email me using the address on this page.");
      status.textContent = "Thank you. Your request has been accepted. I’ll review it and reply by email to discuss the next step. No meeting has been booked yet.";
      form.reset();
      requestId = undefined;
      document.getElementById("intakeReady")?.setAttribute("hidden", "");
      try { globalThis.bslTrack?.("form_submitted", { source: fields.source }); } catch (_) {}
    } catch (error) {
      status.textContent = error.name === "TimeoutError" || error instanceof TypeError
        ? "I could not confirm your request was sent. Your message is still here; retry or email me using the address on this page."
        : error.message;
    } finally {
      controls.forEach((control) => { control.disabled = false; });
      button.textContent = label;
      form.removeAttribute("aria-busy");
      status.focus();
    }
  });
});
