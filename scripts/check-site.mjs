import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.argv[2] || 'http://127.0.0.1:4173';
const browser = await chromium.launch({channel:'chrome', headless:true});
try {
const page = await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const routes=['/','/technical-review','/projects','/fractional-ai-engineer','/for-agencies','/work','/work/demo-vs-production','/writing','/writing/production-readiness','/scorecard','/about','/contact','/privacy','/terms','/cookies','/quote-demo','/fr/','/fr/audit-ia','/fr/agence-automatisation-ia','/fr/contact'];
for (const width of [1440,390]) {
 await page.setViewportSize({width,height:1000});
 for(const route of routes){
  const res=await page.goto(base+route);assert.equal(res.status(),200,route);
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.locator('h1').count(),1,route);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  assert.equal(overflow,false,`${route} overflows at ${width}`);

 }
}
await page.goto(base+'/');
await page.getByRole('button',{name:'Menu'}).click();assert.equal(await page.locator('#primary-navigation').isVisible(),true);
await page.keyboard.press('Escape');assert.equal(await page.locator('#primary-navigation').isVisible(),false);
await page.goto(base+'/scorecard');
for(const radio of await page.locator('input[value=yes]').all()) await radio.check();
assert.match(await page.locator('[data-scorecard-result]').innerText(),/20 of 20 answered/);
await page.locator('input[name=security_access][value=no]').check();
assert.match(await page.locator('[data-scorecard-result]').innerText(),/1 security & permissions gap/);
await page.getByRole('button',{name:'Reset answers'}).click();
assert.equal(await page.locator('input:checked').count(),0);assert.match(await page.locator('[data-scorecard-result]').innerText(),/0 of 20 answered/);
await page.goto(base+'/contact');
await page.route('**/api/contact', route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Temporary failure. Please retry.'})}));
await page.locator('input[name=name]').fill('Example Buyer');await page.locator('input[name=email]').fill('buyer@example.com');await page.locator('textarea').fill('Our retrieval fails on real questions.');
await page.getByRole('button',{name:'Send enquiry'}).click();
await page.getByRole('status').filter({hasText:'Temporary failure'}).waitFor();assert.equal(await page.locator('textarea').inputValue(),'Our retrieval fails on real questions.');
await page.route('**/api/contact', route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({status:'accepted'})}));
await page.getByRole('button',{name:'Send enquiry'}).click();await page.getByRole('status').filter({hasText:'accepted'}).waitFor();assert.equal(await page.locator('textarea').inputValue(),'');
await page.goto(base+'/#offering');await page.waitForURL('**/projects');
for (const route of ['/', '/work/demo-vs-production']) {
 await page.goto(base+route);
 assert.equal(await page.locator('video').count(),1,`${route}: one product lifecycle video`);
 const video=page.locator('video');
 assert.equal(await video.evaluate(v=>v.controls&&!v.autoplay),true);
 assert.match(await video.locator('source').getAttribute('src'),/^\/assets\/demo\/production-demo\.mp4(?:\?|$)/);
 assert.equal(await video.locator('track[kind=captions]').count(),1);
}
assert.deepEqual(errors,[]);
console.log('16 routes checked at 1440px and 390px; mobile navigation, scorecard, form retry/success, redirects and product lifecycle video passed. No page errors.');
} finally { await browser.close(); }
