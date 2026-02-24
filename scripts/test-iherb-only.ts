#!/usr/bin/env node
// crawlIherb 함수를 test-fixed-crawlers.ts 와 동일한 방식으로 호출

import { chromium } from 'playwright'
import { crawlIherb } from '../lib/crawler/iherb'
import { USER_AGENT } from '../lib/crawler/utils'

;(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  })
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    locale: 'en-US',
    viewport: { width: 1280, height: 900 },
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
  })
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
  })
  const page = await context.newPage()

  console.log('crawlIherb 호출...')
  const products = await crawlIherb(page)
  console.log(`결과: ${products.length}개`)
  if (products.length > 0) {
    const p = products[0]
    console.log(`  제목: "${p.title}"`)
    console.log(`  가격: "${p.price}"`)
    console.log(`  URL: "${p.product_url}"`)
  }

  await browser.close()
})().catch(err => { console.error(err); process.exit(1) })
