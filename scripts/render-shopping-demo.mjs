// Usage: PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node scripts/render-shopping-demo.mjs
// Requires ffmpeg and Chrome (or Playwright's installed Chromium).
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({channel:'chrome',headless:true});
const page = await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:2});
await page.goto(pathToFileURL(resolve('assets/demo/shopping-demo.html')).href+'?render');
await page.evaluate(()=>document.fonts.ready);
await page.evaluate(()=>window.renderDemo(10));
await page.evaluate(async()=>{await Promise.all([...document.images].map(img=>img.decode()));});
await page.screenshot({path:'assets/demo/shopping-demo-poster.jpg',type:'jpeg',quality:98});
const encoder=spawn('ffmpeg',['-y','-f','image2pipe','-vcodec','png','-framerate','15','-i','pipe:0','-an','-c:v','libx264','-preset','medium','-crf','15','-pix_fmt','yuv420p','-movflags','+faststart','assets/demo/shopping-demo.mp4'],{stdio:['pipe','ignore','pipe']});
let stderr='';encoder.stderr.on('data',data=>stderr+=data);
const completed=new Promise((resolve,reject)=>{encoder.on('error',reject);encoder.on('close',code=>code===0?resolve():reject(new Error(stderr)));});
for(let i=0;i<58*15;i++){
 await page.evaluate(async t=>{window.renderDemo(t);await Promise.all([...document.images].map(img=>img.decode()));},i/15);
 const frame=await page.screenshot({type:'png'});
 if(!encoder.stdin.write(frame))await once(encoder.stdin,'drain');
 if(i%150===0)console.log(`Rendered ${i/15}s / 58s`);
}
encoder.stdin.end();await completed;await browser.close();console.log('Video and poster ready.');
