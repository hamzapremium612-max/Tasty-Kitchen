import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url   = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

const dir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// Find next available N
let n = 1;
while (fs.existsSync(path.join(dir, `screenshot-${n}${label ? '-' + label : ''}.png`))) n++;
const outFile = path.join(dir, `screenshot-${n}${label ? '-' + label : ''}.png`);

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page    = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

// Scroll through the page to trigger IntersectionObserver animations, then force-show all
await page.evaluate(async () => {
  await new Promise(resolve => {
    let y = 0;
    const step = () => {
      window.scrollBy(0, 300);
      y += 300;
      if (y < document.body.scrollHeight) {
        setTimeout(step, 80);
      } else {
        // Force all fade-up elements visible regardless of observer
        document.querySelectorAll('.fade-up').forEach(el => el.classList.add('visible'));
        window.scrollTo(0, 0);
        setTimeout(resolve, 500);
      }
    };
    step();
  });
});

await page.screenshot({ path: outFile, fullPage: true });
await browser.close();

console.log(`Screenshot saved: ${outFile}`);
