import puppeteer, { type Browser } from 'puppeteer';

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.connected) {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    });
  }
  return browser;
}

export async function captureScreenshot(viewerUrl: string, width = 800, height = 600): Promise<Buffer> {
  const b = await getBrowser();
  const page = await b.newPage();
  try {
    await page.setViewport({ width, height });
    await page.goto(viewerUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('canvas', { timeout: 10000 });
    // Let the scene render
    await new Promise(r => setTimeout(r, 2000));
    return (await page.screenshot({ type: 'jpeg', quality: 85 })) as Buffer;
  } finally {
    await page.close();
  }
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
