// Usage: PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node scripts/check-video-playback.mjs [url]
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  await page.goto(process.argv[2] || 'http://127.0.0.1:4173/work/demo-vs-production');
  assert.equal(await page.locator('video').count(), 1);
  for (const video of await page.locator('video').all()) {
    assert.match(await video.locator('source').getAttribute('src'), /^\/assets\/demo\/production-demo\.mp4(?:\?|$)/);
    await video.scrollIntoViewIfNeeded();
    assert.deepEqual(await video.evaluate(v => [v.controls, v.autoplay, v.paused]), [true, false, true]);
    assert.equal(await video.locator('track[kind=captions]').count(), 1);
    await video.evaluate(v => v.play());
    await page.waitForFunction(v => !v.paused && v.currentTime > 0.25, await video.elementHandle());
    await video.evaluate(v => v.pause());
    assert.equal(await video.evaluate(v => v.paused), true);
  }
  console.log('The product lifecycle video supports user-initiated playback, pause and captions.');
} finally { await browser.close(); }
