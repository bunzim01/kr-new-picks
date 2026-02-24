#!/usr/bin/env node
// 에디토리얼 크롤러 테스트

import { chromium } from 'playwright'
import { crawlRealSimple } from '../lib/crawler/realsimple'
import { crawlInStyle } from '../lib/crawler/instyle'
import { crawlDesignMilk } from '../lib/crawler/designmilk'
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

  const crawlers = [
    { name: 'Real Simple', fn: crawlRealSimple },
    { name: 'InStyle', fn: crawlInStyle },
    { name: 'Design Milk (RSS)', fn: crawlDesignMilk },
  ]

  for (const c of crawlers) {
    console.log(`\n=== ${c.name} ===`)
    const products = await c.fn(page)
    console.log(`결과: ${products.length}개`)
    products.slice(0, 3).forEach((p, i) => {
      console.log(`  [${i}] "${p.title}"`)
      console.log(`      url: ${p.product_url.slice(0, 80)}`)
      if (p.image_url) console.log(`      img: ${p.image_url.slice(0, 60)}`)
    })
  }

  await browser.close()
  console.log('\n✅ 테스트 완료')
})().catch(err => { console.error(err); process.exit(1) })
