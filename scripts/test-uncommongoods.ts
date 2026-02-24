#!/usr/bin/env node
import { chromium } from 'playwright'
import { crawlUncommonGoods } from '../lib/crawler/uncommongoods'
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

  const products = await crawlUncommonGoods(page)
  console.log(`결과: ${products.length}개`)
  products.slice(0, 3).forEach((p, i) =>
    console.log(`  [${i}] "${p.title}" | ${p.price}`)
  )

  await browser.close()
})().catch(err => { console.error(err); process.exit(1) })
