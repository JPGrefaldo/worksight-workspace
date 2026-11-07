// Usage: node shoot-local.js <outdir> <label>
const { chromium } = require('playwright');
const base = 'http://localhost:3000';
const out = process.argv[2], label = process.argv[3];
const pages = [
  ['1095c-main', '/clients/1/prismhr-1095c'],
  ['1095c-pilet', '/clients/1/apps/hris/1095c'],
  ['taxes-main', '/clients/1/prismhr-taxes'],
  ['taxes-pilet', '/clients/1/apps/hris/taxes'],
  ['life-events-main', '/clients/1/benefits/qualifying-life-events/new'],
  ['life-events-pilet', '/clients/1/apps/hris/life-event-benefits'],
  ['pay-history-main', '/clients/1/pay-history'],
  ['pay-history-pilet', '/clients/1/apps/hris/pay-history'],
  ['organization-main', '/clients/1/organization'],
  ['organization-pilet', '/clients/1/apps/hris/org-chart'],
  ['my-profile-main', '/clients/1/my-profile'],
];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ storageState: process.env.HOME + '/.cache/worksight-qa/localhost-3000.json', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const results = [];
  for (const [name, path] of pages) {
    const gql = new Set();
    const onReq = r => { const u = new URL(r.url()); if (/graphql/.test(u.pathname)) gql.add(u.pathname.replace(/\/\d+$/, '/:client')); };
    page.on('request', onReq);
    let status = null;
    try { const resp = await page.goto(base + path, { waitUntil: 'networkidle', timeout: 60000 }); status = resp && resp.status(); } catch (e) { status = 'timeout'; }
    await page.waitForTimeout(3000);
    page.off('request', onReq);
    const banner = (await page.locator('[role=alert], .alert-danger, .MuiAlert-message').allTextContents().catch(() => [])).map(t => t.trim()).filter(Boolean).slice(0, 2);
    const heading = ((await page.locator('h1, h2, h3, h4, h5').first().textContent().catch(() => '')) || '').trim().slice(0, 50);
    await page.screenshot({ path: `${out}/${label}-${name}.png`, fullPage: true });
    const r = { name, path, status, landed: new URL(page.url()).pathname, heading, graphql: [...gql], alerts: banner };
    results.push(r); console.log(JSON.stringify(r));
  }
  require('fs').writeFileSync(`${out}/${label}-results.json`, JSON.stringify(results, null, 2));
  await b.close();
})();
