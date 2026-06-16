import { chromium } from 'playwright';

const BASE      = 'http://localhost:3000';
const SETTLE_MS = 5000;

const browser = await chromium.launch();
const context = await browser.newContext();
const page    = await context.newPage();

const errors = [];

page.on('console', msg => {
  if (msg.type() === 'error') {
    errors.push(`[console.error] ${msg.text()}`);
  }
});

page.on('pageerror', err => {
  errors.push(`[uncaught exception] ${err.message}`);
});

page.on('requestfailed', req => {
  errors.push(`[request failed] ${req.url()} — ${req.failure()?.errorText ?? 'unknown'}`);
});

page.on('response', res => {
  const url    = res.url();
  const status = res.status();
  // only flag failures on same-origin assets (CDN hiccups shouldn't block deploy)
  if (status >= 400 && new URL(url).hostname === 'localhost') {
    errors.push(`[HTTP ${status}] ${url}`);
  }
});

try {
  await page.goto(`${BASE}/?hour=12`, { waitUntil: 'networkidle', timeout: 20_000 });
} catch (err) {
  errors.push(`[navigation] ${err.message}`);
}

await page.waitForTimeout(SETTLE_MS);
await page.screenshot({ path: 'screenshot.png' });
await browser.close();

if (errors.length > 0) {
  console.error('\n❌ Browser errors detected:\n');
  for (const e of errors) console.error(`   ${e}`);
  console.error('');
  process.exit(1);
}

console.log('✅ Smoke test passed — no browser errors.');
