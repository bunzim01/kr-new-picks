#!/usr/bin/env node
// crawlIherb 함수를 직접 호출하여 내부 동작 추적

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

  // goto
  const res = await page.goto('https://kr.iherb.com/beauty', {
    waitUntil: 'domcontentloaded', timeout: 30000,
  })
  console.log(`HTTP: ${res?.status()}  URL: ${page.url()}`)
  console.log(`타이틀: ${await page.title()}`)

  // delay 재현 (2~3.5초)
  await page.waitForTimeout(2500)
  await page.evaluate(() => window.scrollBy(0, 800))
  await page.waitForTimeout(1500)

  // 카드 확인
  const cards = await page.locator('.product-cell').all()
  console.log(`\n.product-cell 개수: ${cards.length}`)

  if (cards.length > 0) {
    const card = cards[0]
    const T = { timeout: 3000 }

    const title = await card.locator('.product-title').textContent(T).catch(() => 'NOT_FOUND')
    const brand = await card.locator('.product-brand-name').textContent(T).catch(() => 'NOT_FOUND')
    const priceContent = await card.locator('[itemprop="price"]').getAttribute('content', T).catch(() => 'NOT_FOUND')
    const imgSrc = await card.locator('img.product-image').getAttribute('src', T).catch(() =>
      card.locator('img').first().getAttribute('src', T).catch(() => 'NOT_FOUND'))
    const href = await card.locator('a[href*="/pr/"]').first().getAttribute('href', T).catch(() => 'NOT_FOUND')

    console.log(`\n첫 번째 카드:`)
    console.log(`  title:  "${title}"`)
    console.log(`  brand:  "${brand}"`)
    console.log(`  price content attr: "${priceContent}"`)
    console.log(`  img:    "${(imgSrc ?? '').slice(0, 80)}"`)
    console.log(`  href:   "${href}"`)

    // 추가로 카드 전체 텍스트 확인
    const cardText = (await card.textContent())?.trim().slice(0, 200) ?? ''
    console.log(`\n  카드 전체 텍스트: "${cardText}"`)
  }

  await browser.close()
})().catch(err => { console.error(err); process.exit(1) })
