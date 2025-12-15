#!/usr/bin/env node
import { chromium, devices } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const params = {};
for (let i = 0; i < args.length; i += 2) {
  const key = (args[i] || '').replace(/^--/, '');
  const value = args[i + 1];
  if (!key || !value) continue;
  params[key] = value;
}

const url = params.url;
const filePath = params.path;
if (!url || !filePath) {
  console.error('Usage: node scripts/capture-screenshot.js --url <url> --path <file.png>');
  process.exit(1);
}

const device = devices['Desktop Chrome'];
const viewport = device.viewport || { width: 1920, height: 1080 };
const scaleFactor = 2;

const targetPath = path.resolve(filePath);
await fs.mkdir(path.dirname(targetPath), { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  ...device,
  viewport,
  deviceScaleFactor: scaleFactor
});

const page = await context.newPage();
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForSelector('#app .event-card', { timeout: 15000 });
await page.screenshot({ path: targetPath, fullPage: true });
await browser.close();

console.log(`Screenshot saved to ${targetPath}`);
