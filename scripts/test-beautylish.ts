#!/usr/bin/env node
import { chromium } from 'playwright'
import { crawlBeautylish } from '../lib/crawler/beautylish'
import { USER_AGENT } from '../lib/crawler/utils'

;(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  })
  const ctx = await browser.newContext({
    userAgent: USER_AGENT,
    locale: 'en-US',
    viewport: { width: 1280, height: 900 },
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
  })
  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
  })
  const page = await ctx.newPage()

  const products = await crawlBeautylish(page)
  console.log(`결과: ${products.length}개`)
  products.slice(0, 5).forEach((p, i) => {
    console.log(`  [${i}] "${p.title}"`)
    console.log(`       가격: ${p.price} | 신상: ${p.is_new_arrival}`)
    console.log(`       url: ${p.product_url.slice(0, 80)}`)
    console.log(`       img: ${p.image_url.slice(0, 60)}`)
  })

  await browser.close()
})().catch(err => { console.error(err); process.exit(1) })
