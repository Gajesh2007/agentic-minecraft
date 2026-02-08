import puppeteer from 'puppeteer';

export async function captureViewerScreenshot({
  url,
  width,
  height,
}: {
  url: string;
  width: number;
  height: number;
}): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height });
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('canvas', { timeout: 15000 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    const buffer = await page.screenshot({ type: 'jpeg', quality: 90 }) as Buffer;
    return buffer;
  } finally {
    await browser.close();
  }
}

