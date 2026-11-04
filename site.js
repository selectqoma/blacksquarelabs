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
