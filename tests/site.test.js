import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';
import { site } from '../site.config.js';

const root = new URL('../', import.meta.url);
const routes = ['/', '/technical-review', '/projects', '/fractional-ai-engineer', '/for-agencies', '/work', '/work/demo-vs-production', '/writing', '/writing/production-readiness', '/scorecard', '/about', '/contact', '/thank-you', '/404', '/fr/', '/fr/audit-ia', '/fr/agence-automatisation-ia', '/fr/agents-ia-entreprise', '/ai-agents-for-business', '/fr/contact'];
const fileFor = path => new URL(path.endsWith('/') ? `${path.slice(1)}index.html` : `${path.slice(1)}${/\.[^/]+$/.test(path) ? '' : '.html'}`, root);
const pages = new Map(routes.map(route => [route, readFileSync(fileFor(route), 'utf8')]));

test('commercial pages have distinct metadata, valid structured data and matching sitemap entries', () => {
  const titles = new Set(), descriptions = new Set();
  const sitemap = readFileSync(new URL('sitemap.xml', root), 'utf8');
  for (const [route, html] of pages) {
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
    assert.ok(title && description, `${route}: missing metadata`);
    assert.ok(!titles.has(title) && !descriptions.has(description), `${route}: duplicated metadata`);
    titles.add(title); descriptions.add(description);
    assert.ok(html.includes(`<link rel="canonical" href="${site.url}${route}">`), `${route}: canonical`);
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1, `${route}: one main heading`);
    const graph = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)?.[1])['@graph'];
    assert.equal(graph.find(item => item['@type'] === 'Organization')?.name, 'Blacksquare Labs');
    assert.ok(!graph.some(item => item['@type'] === 'Person' || item['@type'] === 'Offer'), `${route}: no personal or pricing schema`);
    assert.equal(graph.find(item => item['@type'] === 'WebPage')?.url, site.url + route);
    if (['/technical-review', '/projects', '/fractional-ai-engineer', '/for-agencies'].includes(route)) {
      const service = graph.find(item => item['@type'] === 'Service');
      assert.equal(service?.provider['@id'], site.url + '/#organization');
      assert.equal(service.offers, undefined, `${route}: no published price offer`);
    }
    const indexed = !['/thank-you', '/404'].includes(route);
    assert.equal(sitemap.includes(`<loc>${site.url}${route}</loc>`), indexed, `${route}: sitemap indexing`);
    if (!indexed) assert.match(html, /name="robots" content="noindex, follow"/);
  }
});

test('all public pages omit personal identity, published prices and the retired shopping video', () => {
  const publicHtml = readdirSync(root, { recursive: true }).filter(file => file.endsWith('.html') && !/^(?:node_modules|assets|tmp|output|scripts|tests|submission|plugins|\.[^/]+)\//.test(file));
  assert.ok(publicHtml.includes('privacy.html') && publicHtml.includes('quote-demo.html'));
  for (const file of publicHtml) {
    const html = readFileSync(new URL(file, root), 'utf8');
    assert.doesNotMatch(html, /\bDimitri\b|\bGraur\b|selectkoma|gmail\.com|linkedin\.com\/in\/|founder-avatar|>dg</i, `${file}: personal identity`);
    assert.doesNotMatch(html, /[€£$]|&(?:euro|pound|dollar);|&#(?:8364|163|36);|\b(?:EUR|USD|GBP|priceCurrency)\b|"@type"\s*:\s*"(?:Person|Offer)"/i, `${file}: published price or personal schema`);
    assert.doesNotMatch(html, /shopping-demo|shopping agent|fictional store/i, `${file}: retired shopping video`);
  }
  for (const route of ['/', '/work/demo-vs-production']) {
    const html = pages.get(route);
    assert.equal((html.match(/<video\b/g) || []).length, 1, `${route}: one lifecycle video`);
    assert.match(html, /<source src="\/assets\/demo\/production-demo\.mp4(?:\?[^"]*)?" type="video\/mp4">/);
    assert.match(html, /<track kind="captions" src="\/assets\/demo\/production-demo\.vtt(?:\?[^"]*)?"/);
  }
});

test('generated links, media and social images resolve to files and valid anchors', () => {
  for (const [route, html] of pages) {
    const references = [...html.matchAll(/(?:href|src|poster)="([^"]+)"/g)].map(match => match[1]);
    references.push(...[...html.matchAll(/<meta property="og:image" content="([^"]+)"/g)].map(match => match[1]));
    for (const reference of references) {
      const url = new URL(reference.replaceAll('&amp;', '&'), site.url + route);
      if (url.origin !== site.url) continue;
      const target = fileFor(url.pathname);
      assert.ok(existsSync(target), `${route}: missing ${url.pathname}`);
      if (url.hash) {
        const targetHtml = readFileSync(target, 'utf8');
        assert.ok(targetHtml.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `${route}: missing anchor ${reference}`);
      }
    }
  }
});

test('homepage and contact forms retain the native and assistant submission contracts', () => {
  for (const route of ['/', '/contact']) {
    const html = pages.get(route);
    assert.match(html, /<form id="businessIntakeForm" action="\/api\/contact" method="post" data-contact-form>/);
    for (const [name, limit] of [['name', 100], ['email', 254], ['company', 240], ['message', 5000]]) {
      assert.match(html, new RegExp(`<(?:input|textarea)[^>]*name="${name}"[^>]*maxlength="${limit}"`));
    }
    for (const required of ['name', 'email', 'message']) assert.match(html, new RegExp(`<(?:input|textarea)[^>]*name="${required}"[^>]* required`));
    assert.ok(html.includes(`name="source" value="${route === '/' ? 'homepage' : 'contact'}"`));
    assert.match(html, /name="_honey" tabindex="-1"/);
    assert.match(html, /data-form-status role="status" aria-live="polite" tabindex="-1"/);
    for (const id of ['intakeReady', 'webmcpStatus']) assert.ok(html.includes(`id="${id}"`));
    for (const script of ['contact-form.js', 'contact-assistant.js']) assert.ok(html.includes(`src="/${script}"`));
  }
  assert.match(pages.get('/'), /id="call-intake"/);
});

test('old homepage bookmarks reach the new equivalent page without disturbing the call form', () => {
  const script = readFileSync(new URL('site.js', root), 'utf8');
  const redirects = { '#offering': '/projects', '#fit': '/projects', '#process': '/technical-review', '#launch': '/technical-review', '#operations': '/fractional-ai-engineer', '#agencies': '/for-agencies', '#shopping-demo': '/work/demo-vs-production', '#call-intake': undefined };
  for (const [hash, expected] of Object.entries(redirects)) {
    let redirected;
    vm.runInNewContext(script, {
      document: { querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, body: { dataset: {} } },
      navigator: {}, window: { addEventListener() {} },
      location: { pathname: '/', hash, replace(path) { redirected = path; } },
    });
    assert.equal(redirected, expected, hash);
  }
});
