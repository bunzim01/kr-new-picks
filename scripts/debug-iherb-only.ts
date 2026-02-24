#!/usr/bin/env node
// iHerb 단독 상세 디버그

import { chromium } from 'playwright'
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

  console.log('접속 중...')
  const res = await page.goto('https://kr.iherb.com/beauty', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  })
  console.log(`HTTP: ${res?.status()}  URL: ${page.url()}`)
  console.log(`타이틀: ${await page.title()}`)

  // 1초 간격으로 15번 product-cell 카운트
  for (let i = 1; i <= 15; i++) {
    await page.waitForTimeout(1000)
    const n = await page.locator('.product-cell').count()
    const body = (await page.locator('body').textContent())?.slice(0, 100) ?? ''
    console.log(`${i}s: .product-cell=${n}개  body="${body.replace(/\s+/g, ' ').trim()}"`)
    if (n > 0) break
  }

  // 최종 상태
  const n = await page.locator('.product-cell').count()
  console.log(`\n최종 .product-cell: ${n}개`)

  if (n === 0) {
    // 대안 셀렉터 시도
    const alts = [
      '[class*="product-cell"]',
      '[class*="ProductCell"]',
      '.product-item',
      '[data-product-id]',
      'a[href*="/pr/"]',
    ]
    for (const sel of alts) {
      const cnt = await page.locator(sel).count()
      if (cnt > 0) console.log(`대안 ✅ [${sel}] → ${cnt}개`)
    }

    // 페이지 내 class 힌트
    const classes = await page.evaluate(() => {
      const els = document.querySelectorAll('[class]')
      const words = new Set<string>()
      els.forEach(el => el.className.toString().split(/\s+/).forEach(c => {
        if (/product|item|cell/i.test(c)) words.add(c)
      }))
      return [...words].sort().slice(0, 20)
    })
    console.log(`관련 클래스: ${classes.join(', ')}`)
  }

  await browser.close()
})().catch(err => { console.error(err); process.exit(1) })
