const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// Fill these before running ads; tracking stays unloaded while IDs are blank.
const trackingConfig = {
  gtmId: "",
  googleAdsConversionId: "AW-18170140878",
  googleAdsConversionLabel: ""
};
const consentKey = "bsl_cookie_consent";

window.dataLayer = window.dataLayer || [];
function gtag() {
  window.dataLayer.push(arguments);
}

gtag("consent", "default", {
  ad_storage: "denied",
  analytics_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  wait_for_update: 500
});

function initLenis() {
  if (reduceMotion || typeof Lenis === "undefined") return;

  const lenis = new Lenis({
    duration: 1.05,
    smoothWheel: true,
    wheelMultiplier: 0.85
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);
}

function initSpotlight() {
  const root = document.documentElement;
  let frame = 0;
  let x = window.innerWidth / 2;
  let y = window.innerHeight * 0.2;

  function write() {
    frame = 0;
    root.style.setProperty("--mx", `${x}px`);
    root.style.setProperty("--my", `${y}px`);
  }

  window.addEventListener("pointermove", (event) => {
    x = event.clientX;
    y = event.clientY;
    if (!frame) frame = requestAnimationFrame(write);
  }, { passive: true });
}

function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18 });

  items.forEach((item) => observer.observe(item));
}

function initTypewriter() {
  const target = document.querySelector("#typed-text");
  if (!target || reduceMotion) return;

  const phrases = [
    "Automate what's slowing your team down.",
    "Let AI handle the inbox. You close the deals.",
    "Your team thinks. AI does the grunt work.",
    "Automate the jobs that shouldn't need a human.",
  ];

  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function tick() {
    const phrase = phrases[phraseIndex];
    target.textContent = phrase.slice(0, charIndex);

    if (!deleting && charIndex < phrase.length) {
      charIndex += 1;
      window.setTimeout(tick, 38);
      return;
    }

    if (!deleting) {
      deleting = true;
      window.setTimeout(tick, 1400);
      return;
    }

    if (charIndex > 0) {
      charIndex -= 1;
      window.setTimeout(tick, 18);
      return;
    }

    deleting = false;
    phraseIndex = (phraseIndex + 1) % phrases.length;
    window.setTimeout(tick, 260);
  }

  tick();
}

function loadGtm() {
  if (!trackingConfig.gtmId || document.querySelector("[data-gtm-loader]")) return;

  const script = document.createElement("script");
  script.async = true;
  script.dataset.gtmLoader = "true";
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(trackingConfig.gtmId)}`;
  document.head.appendChild(script);

  window.dataLayer.push({
    "gtm.start": Date.now(),
    event: "gtm.js"
  });
}

function loadGoogleTag() {
  const tagAlreadyLoaded = Array.from(document.scripts).some((script) => (
    script.src.includes(`gtag/js?id=${trackingConfig.googleAdsConversionId}`)
  ));

  if (!trackingConfig.googleAdsConversionId || document.querySelector("[data-google-tag-loader]") || tagAlreadyLoaded) return;

  const script = document.createElement("script");
  script.async = true;
  script.dataset.googleTagLoader = "true";
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(trackingConfig.googleAdsConversionId)}`;
  document.head.appendChild(script);

  gtag("js", new Date());
  gtag("config", trackingConfig.googleAdsConversionId);
}

function grantTrackingConsent() {
  gtag("consent", "update", {
    ad_storage: "granted",
    analytics_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted"
  });
  loadGoogleTag();
  loadGtm();
}

function hasTrackingConsent() {
  return window.localStorage.getItem(consentKey) === "accepted";
}

function trackEvent(eventName, params = {}) {
  if (!hasTrackingConsent()) return;

  window.dataLayer.push({
    event: eventName,
    ...params
  });

  if (eventName === "thank_you_view" && trackingConfig.googleAdsConversionId && trackingConfig.googleAdsConversionLabel) {
    gtag("event", "conversion", {
      send_to: `${trackingConfig.googleAdsConversionId}/${trackingConfig.googleAdsConversionLabel}`
    });
  }
}

function initTracking() {
  if (hasTrackingConsent()) grantTrackingConsent();

  document.querySelectorAll("[data-track='booking_click']").forEach((item) => {
    item.addEventListener("click", () => {
      trackEvent("booking_click", {
        link_url: item.getAttribute("href") || "",
        page_path: window.location.pathname
      });
    });
  });

  document.querySelector("[data-contact-form]")?.addEventListener("submit", () => {
    trackEvent("form_submit", {
      page_path: window.location.pathname
    });
  });

  if (document.body.dataset.conversionPage === "thank_you") {
    trackEvent("thank_you_view", {
      page_path: window.location.pathname
    });
  }
}

function initWarpGrid() {
  const canvas = document.querySelector("#warp-grid");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  let width = 0;
  let height = 0;
  let dpr = 1;
  let scroll = window.scrollY;
  let targetScroll = window.scrollY;
  let frame = 0;
  let visible = true;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function warpedPoint(x, y, t) {
    const centerX = width * 0.68;
    const centerY = height * 0.42;
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.hypot(dx, dy);
    const pull = Math.exp(-distance / 360);
    const waveX = Math.sin(y * 0.013 + t * 0.0017) * 18;
    const waveY = Math.cos(x * 0.011 - t * 0.0013) * 16;

    return {
      x: x + waveX * pull + dx * pull * 0.05,
      y: y + waveY * pull + dy * pull * 0.035
    };
  }

  function strokeWarpedLine(points, t) {
    ctx.beginPath();
    points.forEach((point, index) => {
      const warped = warpedPoint(point.x, point.y, t);
      if (index === 0) ctx.moveTo(warped.x, warped.y);
      else ctx.lineTo(warped.x, warped.y);
    });
    ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    scroll += (targetScroll - scroll) * 0.08;

    const t = reduceMotion ? 0 : scroll;
    const spacing = width < 720 ? 56 : 64;
    const left = -spacing;
    const right = width + spacing;
    const top = -spacing;
    const bottom = height + spacing;
    const segments = 32;

    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(5, 5, 5, 0.12)";

    for (let x = left; x <= right; x += spacing) {
      const points = [];
      for (let i = 0; i <= segments; i += 1) {
        const y = top + ((bottom - top) * i) / segments;
        points.push({ x, y });
      }
      strokeWarpedLine(points, t);
    }

    for (let y = top; y <= bottom; y += spacing) {
      const points = [];
      for (let i = 0; i <= segments; i += 1) {
        const x = left + ((right - left) * i) / segments;
        points.push({ x, y });
      }
      strokeWarpedLine(points, t);
    }
  }

  function tick() {
    if (!visible) return;
    draw();
    frame = requestAnimationFrame(tick);
  }

  function start() {
    if (!frame && !reduceMotion) frame = requestAnimationFrame(tick);
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
  }

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("scroll", () => {
    targetScroll = window.scrollY;
    if (reduceMotion) draw();
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    visible = document.visibilityState === "visible";
    if (visible) start();
    else stop();
  });

  resize();
  start();
}

window.addEventListener("DOMContentLoaded", () => {
  initTracking();
  initLenis();
  initSpotlight();
  initReveal();
  initTypewriter();
  initWarpGrid();
});
