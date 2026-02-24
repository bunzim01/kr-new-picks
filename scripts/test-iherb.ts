import { chromium } from 'playwright'
import { crawlIherb } from '../lib/crawler/iherb'
import { USER_AGENT } from '../lib/crawler/utils'

;(async () => {
  const br = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'] })
  const ctx = await br.newContext({
    userAgent: USER_AGENT, locale: 'en-US', viewport: { width: 1280, height: 900 },
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
  })
  await ctx.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }) })
  const pg = await ctx.newPage()

  const products = await crawlIherb(pg)
  console.log(`수집: ${products.length}개`)
  products.slice(0, 3).forEach((p, i) => {
    console.log(`[${i+1}] ${p.title} | ${p.price} | ${p.brand} | ${p.product_url.slice(0, 60)}`)
  })
  await br.close()
  process.exit(0)
})().catch(e => { console.error(e); process.exit(1) })
