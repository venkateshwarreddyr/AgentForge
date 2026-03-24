import { chromium } from 'playwright';

function createJsonViewerPage(jsonData, prettyPrint) {
  const displayJson = prettyPrint
    ? JSON.stringify(jsonData, null, 2)
    : JSON.stringify(jsonData);
  const checked = prettyPrint ? 'checked' : '';

  return `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: monospace; font-size: 14px; background: #fff; }
    .toolbar {
      background: #f0f0f0;
      border-bottom: 1px solid #ccc;
      padding: 6px 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .toolbar label {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 13px;
      color: #333;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .toolbar input[type="checkbox"] {
      margin: 0;
      cursor: pointer;
    }
    .json-content {
      padding: 12px 16px;
      white-space: pre-wrap;
      word-wrap: break-word;
      font-family: monospace;
      font-size: 14px;
      line-height: 1.5;
      color: #000;
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <label>
      <input type="checkbox" id="prettyPrint" ${checked} />
      Pretty-print
    </label>
  </div>
  <div class="json-content" id="jsonContent">${displayJson}</div>
</body>
</html>`;
}

async function captureEndpoint(context, url, outputPath, prettyPrint) {
  const response = await fetch(url);
  const jsonData = await response.json();

  const page = await context.newPage();
  await page.setContent(createJsonViewerPage(jsonData, prettyPrint));
  await page.waitForTimeout(500);

  const jsonContent = await page.locator('#jsonContent').boundingBox();
  const clipHeight = jsonContent.y + jsonContent.height + 20;

  await page.screenshot({
    path: outputPath,
    clip: { x: 0, y: 0, width: 1400, height: Math.min(clipHeight, 400) },
  });
  console.log(`Saved: ${outputPath} (pretty: ${prettyPrint})`);
  await page.close();
}

async function takeScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    deviceScaleFactor: 2,
  });

  // Health endpoint — raw + pretty
  await captureEndpoint(context, 'http://localhost:3000/health', 'docs/screenshots/health-endpoint.png', false);
  await captureEndpoint(context, 'http://localhost:3000/health', 'docs/screenshots/health-endpoint-pretty.png', true);

  // Metrics endpoint — raw + pretty
  await captureEndpoint(context, 'http://localhost:3000/metrics', 'docs/screenshots/metrics-endpoint.png', false);
  await captureEndpoint(context, 'http://localhost:3000/metrics', 'docs/screenshots/metrics-endpoint-pretty.png', true);

  await browser.close();

  console.log('Done! All screenshots saved to docs/screenshots/');
}

takeScreenshots().catch(console.error);
