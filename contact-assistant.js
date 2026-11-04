(() => {
  const intakeForm = document.getElementById('businessIntakeForm');
  const intakeReady = document.getElementById('intakeReady');
  const webmcpStatus = document.getElementById('webmcpStatus');
  const modelContext = document.modelContext;
  if (!intakeForm || !modelContext?.registerTool) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desiredActionLabels = {
    discover: 'help users find and understand the business',
    choose: 'help users choose the right offer',
    quote: 'turn user needs into a quote request',
    book: 'help users plan or book a call',
    other: 'help users with another task'
  };

  const cleanIntakeText = (value, label, maxLength, required = true) => {
    if (typeof value !== 'string') {
      if (!required && (value === undefined || value === null)) return '';
      throw new TypeError(`${label} must be text.`);
    }
    const clean = value.trim();
    if (required && !clean) throw new TypeError(`${label} is required.`);
    if (clean.length > maxLength) throw new TypeError(`${label} is too long.`);
    return clean;
  };

  const validateIntake = (raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new TypeError('About your business must be an object.');
    }

    const intake = {
      business_name: cleanIntakeText(raw.business_name, 'Business name', 100),
      website: cleanIntakeText(raw.website, 'Website', 240, false),
      offer: cleanIntakeText(raw.offer, 'Business offer', 600),
      ideal_customer: cleanIntakeText(raw.ideal_customer, 'Ideal customer', 400),
      primary_market: cleanIntakeText(raw.primary_market, 'Primary market', 160),
      desired_action: cleanIntakeText(raw.desired_action, 'Desired client action', 20),
      contact_name: cleanIntakeText(raw.contact_name, 'Contact name', 100),
      contact_email: cleanIntakeText(raw.contact_email, 'Contact email', 254)
    };

    if (intake.website) {
      let website;
      try { website = new URL(intake.website); } catch (_) { throw new TypeError('Website must be a valid URL.'); }
      if (!['http:', 'https:'].includes(website.protocol)) throw new TypeError('Website must use http or https.');
      intake.website = website.href;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(intake.contact_email)) {
      throw new TypeError('Contact email must be valid.');
    }
    if (!Object.hasOwn(desiredActionLabels, intake.desired_action)) {
      throw new TypeError('Desired client action is not supported.');
    }
    return intake;
  };

  const prepareCallRequest = (raw) => {
    if (intakeForm.getAttribute('aria-busy') === 'true') throw new TypeError('Please wait until the current submission finishes.');
    const intake = validateIntake(raw);
    intakeForm.elements.namedItem('name').value = intake.contact_name;
    intakeForm.elements.namedItem('email').value = intake.contact_email;
    intakeForm.elements.namedItem('company').value = intake.business_name;
    intakeForm.elements.namedItem('source').value = 'assistant';
    intakeForm.elements.namedItem('message').value = [
      `Product or service: ${intake.offer}`,
      `Users: ${intake.ideal_customer}`,
      `Market: ${intake.primary_market}`,
      `First action: ${desiredActionLabels[intake.desired_action]}`,
      intake.website ? `Website: ${intake.website}` : ''
    ].filter(Boolean).join('\n');
    intakeForm.dispatchEvent(new Event('input', { bubbles: true }));
    intakeReady.hidden = false;
    intakeReady.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'nearest' });
    intakeReady.focus({ preventScroll: true });
    return { status: 'call_request_prepared', ready_for_review: true, next_step: 'Review the visible form. Nothing has been sent or booked. Select Send enquiry only when ready.' };
  };

  const webmcpLifecycle = new AbortController();
  const callIntakeSchema = {
    type: 'object',
    properties: {
      business_name: { type: 'string', minLength: 1, maxLength: 100, description: 'The client’s business or company name.' },
      website: { type: 'string', format: 'uri', maxLength: 240, description: 'Public business website, if there is one. Must use http or https.' },
      offer: { type: 'string', minLength: 1, maxLength: 600, description: 'The product or service, including the AI system and what is stopping it from reaching production, in the client’s own words.' },
      ideal_customer: { type: 'string', minLength: 1, maxLength: 400, description: 'The customers or internal users the AI system should serve.' },
      primary_market: { type: 'string', minLength: 1, maxLength: 160, description: 'Primary geography or market served.' },
      desired_action: { type: 'string', enum: ['discover', 'choose', 'quote', 'book', 'other'], description: 'The first action AI should help users complete. Use other for workflows beyond these examples.' },
      contact_name: { type: 'string', minLength: 1, maxLength: 100, description: 'Name of the person planning the call.' },
      contact_email: { type: 'string', format: 'email', maxLength: 254, description: 'Work email for the person planning the call.' }
    },
    required: ['business_name', 'offer', 'ideal_customer', 'primary_market', 'desired_action', 'contact_name', 'contact_email'],
    additionalProperties: false
  };

  Promise.all([
    Promise.resolve().then(() => modelContext.registerTool({
      name: 'get_call_intake_questions',
      title: 'Get call intake questions',
      description: 'Use when a product or engineering team is considering Blacksquare Labs for production AI engineering and needs the business details required before planning a call. Read-only; after collecting the answers, use prepare_call_request.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute() {
        return {
          questions: [
            { field: 'business_name', ask: 'What is the business called?' },
            { field: 'website', ask: 'What is its website, if it has one?', optional: true },
            { field: 'offer', ask: 'What does the product or service do, what AI system exists today, and what is stopping it from reaching production?' },
            { field: 'ideal_customer', ask: 'Who are its customers or internal users?' },
            { field: 'primary_market', ask: 'Which market or geography does it serve?' },
            { field: 'desired_action', ask: 'Should AI help users discover something, choose an offer, request a quote, book a call, or complete another task?' },
            { field: 'contact_name', ask: 'Who should I speak with?' },
            { field: 'contact_email', ask: 'What work email should be used for the call request?' }
          ],
          next_tool: 'prepare_call_request'
        };
      }
    }, { signal: webmcpLifecycle.signal })),
    Promise.resolve().then(() => modelContext.registerTool({
      name: 'prepare_call_request',
      title: 'Prepare a call request',
      description: 'After a client asks about production AI engineering with Blacksquare Labs, ask for every missing required field and use only their answers. Populates the visible enquiry form for review. It does not send anything or book a meeting.',
      inputSchema: callIntakeSchema,
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute(input) {
        return prepareCallRequest(input);
      }
    }, { signal: webmcpLifecycle.signal }))
  ]).then(() => {
    webmcpStatus.textContent = 'An assistant can fill this in';
  }).catch((error) => {
    webmcpStatus.textContent = 'Ready to fill in';
    console.warn('WebMCP registration failed.', error);
  });

  window.addEventListener('pagehide', () => webmcpLifecycle.abort(), { once: true });
})();
