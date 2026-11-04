// Usage: PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node scripts/render-production-demo.mjs [--check]
// Captures the deterministic HTML animation with Chrome, then encodes with FFmpeg.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { rename } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
let encoder;
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
  await page.goto(pathToFileURL(resolve('assets/demo/production-demo.html')).href + '?render');
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(img => img.decode())); });
  for (const [time, stage] of [[1, 'Prototype'], [3, 'Prototype'], [9, 'Evaluate'], [12, 'Evaluate'], [18, 'Integrate'], [24, 'Deploy'], [33, 'Operate'], [38, 'Production']]) {
    await page.evaluate(t => window.renderDemo(t), time);
    assert.equal(await page.locator('#film').getAttribute('data-stage'), stage);
    if (time === 1) assert.equal(await page.locator('#poc-status').textContent(), 'Use case defined');
    if (time === 3) assert.equal(await page.locator('#poc-status').textContent(), 'Prototype running');
    if (time === 9) assert.equal(await page.locator('#access-result').textContent(), 'FAIL');
    if (time === 12) assert.equal(await page.locator('#access-result').textContent(), 'PASS');
    if (time === 24) assert.equal(await page.locator('#traffic-value').textContent(), '25%');
    if (time === 33) assert.equal(await page.locator('#event-state').textContent(), 'HANDLED');
  }
  console.log('Animation checks passed: stages, failed check, fix, staged rollout and recovery.');
  if (!process.argv.includes('--check')) {
    await page.evaluate(() => window.renderDemo(3.8));
    await page.screenshot({ path: 'assets/demo/production-demo-poster.jpg', type: 'jpeg', quality: 96 });
    const temp = 'assets/demo/production-demo.rendering.mp4';
    encoder = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-vcodec', 'mjpeg', '-framerate', '24', '-i', 'pipe:0', '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', temp], { stdio: ['pipe', 'ignore', 'pipe'] });
    let stderr = '';
    encoder.stderr.on('data', data => { stderr = (stderr + data).slice(-6000); });
    const completed = once(encoder, 'close');
    // Prevent an unhandled stream error; abort rendering through the next frame write.
    let encodingError;
    encoder.on('error', error => { encodingError = error; });
    encoder.stdin.on('error', error => { encodingError = error; });
    for (let i = 0; i < 40 * 24; i++) {
      await page.evaluate(t => window.renderDemo(t), i / 24);
      const frame = await page.screenshot({ type: 'jpeg', quality: 96 });
      if (encodingError) throw encodingError;
      if (!encoder.stdin.write(frame)) await Promise.race([once(encoder.stdin, 'drain'), completed.then(() => { throw new Error(stderr || 'Encoder stopped.'); })]);
      if (i % 120 === 0) console.log(`Rendered ${i / 24}s / 40s`);
    }
    encoder.stdin.end();
    const [code] = await completed;
    assert.equal(code, 0, stderr);
    await rename(temp, 'assets/demo/production-demo.mp4');
    console.log('Video and poster ready: 2160 × 1350, 24 fps, 40 seconds.');
  }
} finally {
  if (encoder && encoder.exitCode === null) encoder.kill();
  await browser.close();
}
