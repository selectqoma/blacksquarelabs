const menuButton = document.querySelector('[data-menu-toggle]');
const navigation = document.querySelector('#primary-navigation');
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    menuButton.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
    menuButton.focus();
  }
});

// Only aggregate event names and scores are passed to the optional collector.
// No form content, email address, query string or persistent identifier.
globalThis.bslTrack = (event, props = {}) => {
  if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl) return;
  globalThis.plausible?.(event, { props });
  // gtag exists only after the visitor accepted the banner.
  if (event === 'form_submitted') globalThis.gtag?.('event', 'conversion', { send_to: document.body.dataset.gads });
};
document.querySelectorAll('[data-track]').forEach((link) => {
  link.addEventListener('click', () => bslTrack(link.dataset.track));
});
if (document.body.dataset.page === 'technical-review') bslTrack('technical_review_viewed');

// Fragments never reach the server, so old homepage bookmarks redirect here.
if (location.pathname === '/' || location.pathname === '/index.html') {
  const oldSections = {
    '#offering': '/projects', '#fit': '/projects', '#process': '/technical-review',
    '#launch': '/technical-review', '#operations': '/fractional-ai-engineer', '#agencies': '/for-agencies', '#shopping-demo': '/work/demo-vs-production',
  };
  const redirectOldSection = () => {
    if (oldSections[location.hash]) location.replace(oldSections[location.hash]);
  };
  redirectOldSection();
  window.addEventListener('hashchange', redirectOldSection);
}

// Google Ads tag: nothing loads and no cookie is set until the visitor clicks Accept.
const gads = document.body.dataset.gads;
const consentKey = 'bsl-ads-consent';
const readConsent = () => { try { return localStorage.getItem(consentKey); } catch { return null; } };
const saveConsent = (value) => { try { value ? localStorage.setItem(consentKey, value) : localStorage.removeItem(consentKey); } catch {} };
const loadAds = () => {
  const id = gads.split('/')[0];
  globalThis.dataLayer = globalThis.dataLayer || [];
  globalThis.gtag = function () { dataLayer.push(arguments); };
  gtag('consent', 'default', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'denied', analytics_storage: 'denied' });
  gtag('js', new Date());
  gtag('config', id);
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.append(script);
};
const showConsentBanner = () => {
  const fr = document.documentElement.lang === 'fr';
  const banner = document.createElement('div');
  banner.className = 'consent-banner';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', 'Cookies');
  banner.innerHTML = fr
    ? '<p>Nous aimerions mesurer quelles annonces Google mènent à une demande de contact. Cela utilise des cookies Google Ads. <a href="/cookies">En savoir plus</a></p><div><button type="button" class="button button-secondary" data-consent="denied">Refuser</button><button type="button" class="button button-primary" data-consent="granted">Accepter</button></div>'
    : '<p>We’d like to measure which Google ads lead to an enquiry. This uses Google Ads cookies. <a href="/cookies">Learn more</a></p><div><button type="button" class="button button-secondary" data-consent="denied">Decline</button><button type="button" class="button button-primary" data-consent="granted">Accept</button></div>';
  banner.addEventListener('click', (event) => {
    const choice = event.target.closest('[data-consent]')?.dataset.consent;
    if (!choice) return;
    saveConsent(choice);
    banner.remove();
    if (choice === 'granted') loadAds();
  });
  document.body.append(banner);
};
if (gads && navigator.doNotTrack !== '1' && !navigator.globalPrivacyControl) {
  const consent = readConsent();
  if (consent === 'granted') loadAds();
  else if (!consent) showConsentBanner();
}
// Withdrawing consent: forget the choice, delete Google Ads cookies, ask again.
document.querySelectorAll('[data-consent-reset]').forEach((button) => button.addEventListener('click', () => {
  saveConsent(null);
  for (const name of document.cookie.split(';').map((c) => c.split('=')[0].trim()).filter((n) => n.startsWith('_gcl'))) {
    document.cookie = `${name}=; Max-Age=0; path=/; domain=.${location.hostname.replace(/^www\./, '')}`;
    document.cookie = `${name}=; Max-Age=0; path=/`;
  }
  location.reload();
}));
